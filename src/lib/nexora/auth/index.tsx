import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { Navigate } from 'react-router-dom';
import type {
  AuthResponse,
  MeResponse,
  Membership,
  Organization,
  RegisterRequest,
  UserView,
} from '@nexora/api-types';
import { ApiError, authApi, platformApi, session, SESSION_EXPIRED_EVENT } from '@nexora/api-client';

export type AuthStatus =
  | 'loading'
  | 'authenticated'
  | 'anonymous'
  | 'no-organization'
  | 'pending'
  | 'suspended'
  | 'closed'
  | 'forbidden';

interface AuthState {
  status: AuthStatus;
  user: UserView | null;
  organization: Organization | null;
  memberships: Membership[];
  membership: Membership | null;
  permissions: Set<string>;
  isPlatformAdmin: boolean;
  message: string | null;
}

export interface LoginInput {
  email: string;
  password: string;
}

interface AuthContextValue extends AuthState {
  login: (input: LoginInput) => Promise<void>;
  register: (input: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
  switchOrganization: (organizationId: string) => Promise<void>;
  setActiveBranch: (branchId: string | null) => void;
  activeBranchId: string | null;
}

const ANONYMOUS: AuthState = {
  status: 'anonymous',
  user: null,
  organization: null,
  memberships: [],
  membership: null,
  permissions: new Set(),
  isPlatformAdmin: false,
  message: null,
};

const LOADING: AuthState = { ...ANONYMOUS, status: 'loading' };

const AuthContext = createContext<AuthContextValue | null>(null);

interface AuthProviderProps {
  children: ReactNode;
  /** Platform portal: require platform authority, never send tenant headers. */
  requirePlatformAdmin?: boolean;
}

function blockedStatus(error: unknown): AuthStatus | null {
  if (!(error instanceof ApiError)) return null;
  switch (error.code) {
    case 'ORGANIZATION_PENDING':
      return 'pending';
    case 'ORGANIZATION_SUSPENDED':
      return 'suspended';
    case 'ORGANIZATION_CLOSED':
      return 'closed';
    case 'ACCESS_DENIED':
      return 'forbidden';
    default:
      return null;
  }
}

async function loadEffectivePermissions(hasOrganization: boolean): Promise<Set<string>> {
  if (!hasOrganization) return new Set();
  try {
    const codes = await authApi.permissions();
    return new Set(codes);
  } catch {
    // Older backend builds may not expose /auth/me/permissions yet.
    return new Set();
  }
}

function membershipFor(me: MeResponse): Membership | null {
  if (!me.organization) return null;
  return me.memberships.find((m) => m.organizationId === me.organization?.id) ?? null;
}

export function AuthProvider({ children, requirePlatformAdmin = false }: AuthProviderProps) {
  const [state, setState] = useState<AuthState>(LOADING);
  const [activeBranchId, setActiveBranchIdState] = useState<string | null>(() => session.branchId);

  const applySession = useCallback(
    async (me: MeResponse, options: { platformVerified: boolean }): Promise<AuthState> => {
      const permissions = await loadEffectivePermissions(Boolean(me.organization));
      return {
        status: 'authenticated',
        user: me.user,
        organization: me.organization,
        memberships: me.memberships,
        membership: membershipFor(me),
        permissions,
        isPlatformAdmin: options.platformVerified,
        message: null,
      };
    },
    [],
  );

  const boot = useCallback(
    async (options?: {
      authResponse?: AuthResponse | null;
      verifyPlatform?: boolean;
      throwOnFailure?: boolean;
    }): Promise<void> => {
      const verifyPlatform = options?.verifyPlatform ?? requirePlatformAdmin;
      try {
        let me = await authApi.me();

        if (!me.organization && !session.organizationId) {
          const active = me.memberships.filter((m) => m.status === 'ACTIVE');
          if (active.length === 1) {
            session.setOrganizationId(active[0].organizationId);
            try {
              me = await authApi.me();
            } catch (error) {
              const blocked = blockedStatus(error);
              if (blocked) {
                session.setOrganizationId(null);
                setState({
                  ...ANONYMOUS,
                  user: me.user,
                  memberships: me.memberships,
                  status: blocked,
                });
                return;
              }
              throw error;
            }
          }
        }

        const authOrg = options?.authResponse?.organization ?? null;
        if (!me.organization && authOrg && authOrg.status !== 'ACTIVE' && !session.organizationId) {
          const status: AuthStatus =
            authOrg.status === 'SUSPENDED'
              ? 'suspended'
              : authOrg.status === 'CLOSED'
                ? 'closed'
                : 'pending';
          setState({
            ...ANONYMOUS,
            user: me.user,
            memberships: me.memberships,
            status,
          });
          return;
        }

        let platformVerified = false;
        if (verifyPlatform) {
          try {
            await platformApi.organizations({ page: 0, size: 1 });
            platformVerified = true;
          } catch (error) {
            if (error instanceof ApiError && (error.status === 403 || error.status === 401)) {
              session.clear();
              setState({
                ...ANONYMOUS,
                status: 'forbidden',
                message: 'This account does not have access to the Nexora platform console.',
              });
              if (options?.throwOnFailure) {
                throw new Error(
                  'This account does not have access to the Nexora platform console.',
                );
              }
              return;
            }
            throw error;
          }
        }

        if (!me.organization && me.memberships.length === 0 && !platformVerified) {
          setState({
            ...ANONYMOUS,
            user: me.user,
            status: 'no-organization',
            message: 'You are not a member of any organization yet.',
          });
          return;
        }

        if (!me.organization && me.memberships.length > 0 && !platformVerified) {
          setState({
            ...ANONYMOUS,
            user: me.user,
            memberships: me.memberships,
            status: 'no-organization',
            message: 'Select an organization to continue.',
          });
          return;
        }

        setState(await applySession(me, { platformVerified }));
      } catch (error) {
        const blocked = blockedStatus(error);
        if (blocked) {
          setState({ ...ANONYMOUS, status: blocked });
          return;
        }
        session.clear();
        setState({ ...ANONYMOUS });
        if (options?.throwOnFailure) throw error;
      }
    },
    [applySession, requirePlatformAdmin],
  );

  useEffect(() => {
    if (!session.hasSession()) {
      setState(ANONYMOUS);
      return;
    }
    void boot();
  }, [boot]);

  useEffect(() => {
    const handleExpired = () => setState(ANONYMOUS);
    window.addEventListener(SESSION_EXPIRED_EVENT, handleExpired);
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, handleExpired);
  }, []);

  const login = useCallback(
    async (input: LoginInput) => {
      const auth = await authApi.login(input);
      session.saveAuth(auth);
      if (!requirePlatformAdmin) {
        if (auth.organization?.status === 'ACTIVE') {
          session.setOrganizationId(auth.organization.id);
        } else {
          session.setOrganizationId(null);
        }
      } else {
        session.setOrganizationId(null);
      }
      session.setBranchId(null);
      setActiveBranchIdState(null);
      setState(LOADING);
      await boot({
        authResponse: auth,
        verifyPlatform: requirePlatformAdmin,
        throwOnFailure: true,
      });
    },
    [boot, requirePlatformAdmin],
  );

  const register = useCallback(
    async (input: RegisterRequest) => {
      const auth = await authApi.register(input);
      session.saveAuth(auth);
      if (auth.organization?.status === 'ACTIVE') {
        session.setOrganizationId(auth.organization.id);
      } else {
        session.setOrganizationId(null);
      }
      session.setBranchId(null);
      setActiveBranchIdState(null);
      setState(LOADING);
      await boot({ authResponse: auth, verifyPlatform: false });
    },
    [boot],
  );

  const logout = useCallback(async () => {
    try {
      if (session.hasSession()) await authApi.logout();
    } catch {
      // Session is cleared locally even if the API call fails.
    } finally {
      session.clear();
      setActiveBranchIdState(null);
      setState(ANONYMOUS);
    }
  }, []);

  const refresh = useCallback(async () => {
    if (!session.hasSession()) {
      setState(ANONYMOUS);
      return;
    }
    setState(LOADING);
    await boot();
  }, [boot]);

  const switchOrganization = useCallback(
    async (organizationId: string) => {
      session.setOrganizationId(organizationId);
      session.setBranchId(null);
      setActiveBranchIdState(null);
      setState(LOADING);
      await boot({ verifyPlatform: false });
    },
    [boot],
  );

  const setActiveBranch = useCallback((branchId: string | null) => {
    session.setBranchId(branchId);
    setActiveBranchIdState(branchId);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      ...state,
      login,
      register,
      logout,
      refresh,
      switchOrganization,
      setActiveBranch,
      activeBranchId,
    }),
    [state, login, register, logout, refresh, switchOrganization, setActiveBranch, activeBranchId],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside <AuthProvider>');
  return context;
}

function Screen({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-indigo-50 text-xl font-bold text-indigo-600">
          N
        </div>
        <h1 className="text-lg font-semibold text-slate-900">{title}</h1>
        <div className="mt-2 text-sm text-slate-600">{children}</div>
      </div>
    </div>
  );
}

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const auth = useAuth();

  if (auth.status === 'loading') {
    return (
      <Screen title="Loading workspace">
        <div className="mx-auto mt-3 h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-indigo-600" />
      </Screen>
    );
  }

  if (auth.status === 'anonymous') {
    return <Navigate to="/login" replace />;
  }

  if (auth.status === 'forbidden') {
    return (
      <Screen title="Access denied">
        <p>{auth.message ?? 'You do not have access to this area.'}</p>
        <button
          className="mt-6 w-full rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
          onClick={() => void auth.logout()}
        >
          Sign out
        </button>
      </Screen>
    );
  }

  if (auth.status === 'pending' || auth.status === 'suspended' || auth.status === 'closed') {
    const copy: Record<string, string> = {
      pending:
        'Your organization is waiting for platform approval. You can sign in again once it is approved.',
      suspended: 'Your organization is suspended. Contact Nexora support to restore access.',
      closed: 'Your organization is closed and can no longer access Nexora.',
    };
    return (
      <Screen title="Organization unavailable">
        <p>{copy[auth.status]}</p>
        <button
          className="mt-6 w-full rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
          onClick={() => void auth.logout()}
        >
          Sign out
        </button>
      </Screen>
    );
  }

  if (auth.status === 'no-organization') {
    return <OrganizationGate />;
  }

  return <>{children}</>;
}

function OrganizationGate() {
  const auth = useAuth();
  const [busy, setBusy] = useState<string | null>(null);

  const choose = async (organizationId: string) => {
    setBusy(organizationId);
    try {
      await auth.switchOrganization(organizationId);
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
      <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-lg font-semibold text-slate-900">Choose an organization</h1>
        <p className="mt-1 text-sm text-slate-600">
          {auth.message ?? 'Select the workspace you want to open.'}
        </p>
        <div className="mt-6 space-y-2">
          {auth.memberships.map((membership) => (
            <button
              key={membership.id}
              disabled={busy !== null}
              onClick={() => void choose(membership.organizationId)}
              className="flex w-full items-center justify-between rounded-xl border border-slate-200 px-4 py-3 text-left transition hover:border-indigo-300 hover:bg-indigo-50/50 disabled:opacity-60"
            >
              <span>
                <span className="block text-sm font-medium text-slate-900">
                  {membership.organizationName ?? membership.organizationId}
                </span>
                <span className="block text-xs text-slate-500">
                  {membership.role ?? 'Member'} · {membership.status}
                </span>
              </span>
              <span className="text-xs text-indigo-600">
                {busy === membership.organizationId ? 'Opening…' : 'Open'}
              </span>
            </button>
          ))}
          {auth.memberships.length === 0 && (
            <p className="rounded-lg bg-slate-50 p-4 text-sm text-slate-500">
              Ask an organization owner to invite you, or create a new organization from the
              registration page.
            </p>
          )}
        </div>
        <button
          className="mt-6 text-sm text-slate-500 hover:text-slate-900"
          onClick={() => void auth.logout()}
        >
          Sign out
        </button>
      </div>
    </div>
  );
}
