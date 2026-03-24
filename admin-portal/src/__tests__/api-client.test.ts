import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock import.meta.env before importing the module
vi.stubEnv('VITE_DEV_MODE', 'false');
vi.stubEnv('VITE_USE_MOCK_DATA', 'false');

// Mock auth-oidc
vi.mock('../auth-oidc', () => ({
  readSession: vi.fn(() => ({
    accessToken: 'test-token-123',
    refreshToken: 'refresh-123',
    expiresAt: 9999999999,
  })),
}));

const { authedFetch, isDevMode, useMockData } = await import('../services/api-client');

describe('api-client', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    globalThis.fetch = vi.fn();
  });

  describe('authedFetch', () => {
    it('adds Authorization header with Bearer token', async () => {
      const mockResponse = new Response(JSON.stringify({ ok: true }), { status: 200 });
      vi.mocked(globalThis.fetch).mockResolvedValue(mockResponse);

      await authedFetch('/api/v1/admin/test');

      expect(globalThis.fetch).toHaveBeenCalledWith('/api/v1/admin/test', expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer test-token-123',
        }),
      }));
    });

    it('throws on non-ok response', async () => {
      const mockResponse = new Response('Not found', { status: 404, statusText: 'Not Found' });
      vi.mocked(globalThis.fetch).mockResolvedValue(mockResponse);

      await expect(authedFetch('/api/v1/admin/missing')).rejects.toThrow('404');
    });

    it('merges custom headers', async () => {
      const mockResponse = new Response('{}', { status: 200 });
      vi.mocked(globalThis.fetch).mockResolvedValue(mockResponse);

      await authedFetch('/api/v1/admin/test', {
        headers: { 'Content-Type': 'application/json' },
      });

      expect(globalThis.fetch).toHaveBeenCalledWith('/api/v1/admin/test', expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer test-token-123',
          'Content-Type': 'application/json',
        }),
      }));
    });
  });

  describe('isDevMode', () => {
    it('returns false when VITE_DEV_MODE is not true', () => {
      expect(isDevMode()).toBe(false);
    });
  });

  describe('useMockData', () => {
    it('returns false when VITE_USE_MOCK_DATA is not true', () => {
      expect(useMockData()).toBe(false);
    });
  });
});
