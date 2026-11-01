import { API_BASE_URL } from '@nexora/api-client';

const API_ORIGIN = API_BASE_URL.replace(/\/api\/v1\/?$/, '');

/** Turns a stored image path (for example /api/v1/public/images/x.jpg) into an absolute URL. */
export function mediaUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path;
  return `${API_ORIGIN}${path.startsWith('/') ? '' : '/'}${path}`;
}
