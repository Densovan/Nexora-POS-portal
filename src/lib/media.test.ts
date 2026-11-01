import { describe, expect, it } from 'vitest';
import { API_BASE_URL } from '@nexora/api-client';
import { mediaUrl } from './media';

const API_ORIGIN = API_BASE_URL.replace(/\/api\/v1\/?$/, '');

describe('mediaUrl', () => {
  it('returns null for empty values', () => {
    expect(mediaUrl(null)).toBeNull();
    expect(mediaUrl(undefined)).toBeNull();
    expect(mediaUrl('')).toBeNull();
  });

  it('prefixes stored API paths with the API origin', () => {
    expect(mediaUrl('/api/v1/public/images/a.png')).toBe(
      `${API_ORIGIN}/api/v1/public/images/a.png`,
    );
    expect(mediaUrl('api/v1/public/images/a.png')).toBe(`${API_ORIGIN}/api/v1/public/images/a.png`);
  });

  it('leaves absolute URLs untouched', () => {
    expect(mediaUrl('https://cdn.example.com/a.png')).toBe('https://cdn.example.com/a.png');
  });
});
