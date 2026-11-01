import axios, { AxiosError, type AxiosInstance, type InternalAxiosRequestConfig } from 'axios';
import type { AuthResponse, ProblemDetail } from '@nexora/api-types';
import { notifySessionExpired, session } from './session';

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly fieldErrors: Record<string, string>;

  constructor(
    status: number,
    code: string,
    message: string,
    fieldErrors: Record<string, string> = {},
  ) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.fieldErrors = fieldErrors;
  }
}

function resolveBaseUrl(): string {
  const env = (import.meta as unknown as { env?: Record<string, string> }).env;
  return env?.VITE_API_BASE_URL ?? 'http://localhost:8080/api/v1';
}

export const API_BASE_URL = resolveBaseUrl();

function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error;
  const axiosError = error as AxiosError<ProblemDetail>;
  const status = axiosError.response?.status ?? 0;
  const body = axiosError.response?.data;
  const code = body?.code ?? (status === 0 ? 'NETWORK_ERROR' : 'REQUEST_FAILED');
  const message =
    body?.detail ??
    body?.title ??
    (status === 0
      ? 'Cannot reach the Nexora API. Is the backend running?'
      : axiosError.message || 'Request failed');
  return new ApiError(status, code, message, body?.errors ?? {});
}

type RetriableConfig = InternalAxiosRequestConfig & { _retried?: boolean };

let refreshPromise: Promise<string> | null = null;

async function refreshAccessToken(): Promise<string> {
  const refreshToken = session.refreshToken;
  if (!refreshToken) throw new ApiError(401, 'UNAUTHENTICATED', 'Session expired');
  if (!refreshPromise) {
    refreshPromise = axios
      .post<AuthResponse>(`${API_BASE_URL}/auth/refresh`, { refreshToken })
      .then((response) => {
        session.setTokens(response.data.accessToken, response.data.refreshToken);
        return response.data.accessToken;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  try {
    return await refreshPromise;
  } catch {
    notifySessionExpired();
    throw new ApiError(401, 'UNAUTHENTICATED', 'Your session expired. Please sign in again.');
  }
}

export function createApiClient(): AxiosInstance {
  const client = axios.create({ baseURL: API_BASE_URL, timeout: 30_000 });

  client.interceptors.request.use((config) => {
    const token = session.accessToken;
    if (token) config.headers.set('Authorization', `Bearer ${token}`);
    const organizationId = session.organizationId;
    if (organizationId) config.headers.set('X-Organization-Id', organizationId);
    const branchId = session.branchId;
    if (branchId) config.headers.set('X-Active-Branch-Id', branchId);
    return config;
  });

  client.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
      const config = error.config as RetriableConfig | undefined;
      const status = error.response?.status;
      const isAuthCall = Boolean(config?.url?.includes('/auth/'));
      if (status === 401 && config && !config._retried && !isAuthCall && session.refreshToken) {
        config._retried = true;
        const token = await refreshAccessToken();
        config.headers.set('Authorization', `Bearer ${token}`);
        return client.request(config);
      }
      throw toApiError(error);
    },
  );

  return client;
}

export const api = createApiClient();

export function getApiErrorMessage(error: unknown): string {
  return toApiError(error).message;
}
