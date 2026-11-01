import { useEffect, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Mail, UserRound } from 'lucide-react';
import { authApi, getApiErrorMessage } from '@nexora/api-client';
import { useAuth } from '@nexora/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FormField } from '@/components/form-field';
import { ImageUploadField } from '@/components/image-upload-field';
import { Input } from '@/components/ui/input';
import { PageHeader } from '@/components/page-header';
import { StatusBadge } from '@/components/status-badge';
import { initials } from '@/lib/format';
import { mediaUrl } from '@/lib/media';
import { useToast } from '@/components/toast';

export function PosProfilePage() {
  const auth = useAuth();
  const { toast } = useToast();
  const [fullName, setFullName] = useState(auth.user?.fullName ?? '');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(auth.user?.avatarUrl ?? null);

  useEffect(() => {
    setFullName(auth.user?.fullName ?? '');
    setAvatarUrl(auth.user?.avatarUrl ?? null);
  }, [auth.user]);

  const updateProfile = useMutation({
    mutationFn: () =>
      authApi.updateProfile({
        fullName: fullName.trim() || undefined,
        avatarUrl: avatarUrl ?? '',
      }),
    onSuccess: async () => {
      await auth.refresh();
      toast({ title: 'Profile updated', variant: 'success' });
    },
    onError: (error) => {
      toast({
        title: 'Could not update profile',
        description: getApiErrorMessage(error),
        variant: 'error',
      });
    },
  });

  const user = auth.user;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader
        eyebrow="Account"
        title="Profile"
        description="The name and photo shown on your register and receipts."
      />

      <Card>
        <CardContent className="flex items-start gap-4">
          {mediaUrl(user?.avatarUrl) ? (
            <img
              src={mediaUrl(user?.avatarUrl) ?? undefined}
              alt=""
              className="h-14 w-14 shrink-0 rounded-full border border-slate-200 object-cover"
            />
          ) : (
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-lg font-semibold text-emerald-600">
              {initials(user?.fullName || user?.email)}
            </span>
          )}
          <div className="min-w-0">
            <p className="truncate text-base font-semibold text-slate-900">
              {user?.fullName || 'Cashier'}
            </p>
            <p className="flex items-center gap-1.5 truncate text-xs text-slate-500">
              <Mail className="h-3.5 w-3.5" />
              {user?.email ?? '—'}
            </p>
            <div className="mt-2 flex items-center gap-2">
              <StatusBadge status={user?.status} />
              {auth.organization && (
                <span className="text-[11px] text-slate-500">{auth.organization.name}</span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Identity</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <ImageUploadField
            label="Avatar"
            shape="circle"
            value={avatarUrl}
            onChange={setAvatarUrl}
            hint="Shown beside your name in the register. JPEG, PNG, or WebP up to 5 MB."
          />
          <FormField label="Display name" htmlFor="pos-profile-name">
            <Input
              id="pos-profile-name"
              value={fullName}
              maxLength={150}
              onChange={(event) => setFullName(event.target.value)}
            />
          </FormField>
          <div className="flex justify-end">
            <Button
              type="button"
              loading={updateProfile.isPending}
              disabled={
                !fullName.trim() ||
                (fullName.trim() === (auth.user?.fullName ?? '') &&
                  (avatarUrl ?? null) === (auth.user?.avatarUrl ?? null))
              }
              onClick={() => updateProfile.mutate()}
            >
              <UserRound className="h-4 w-4" />
              Save profile
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
