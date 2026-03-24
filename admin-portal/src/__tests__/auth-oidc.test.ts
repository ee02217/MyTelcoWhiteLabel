// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock localStorage since jsdom in Node may not provide a full implementation
const store: Record<string, string> = {};
const mockLocalStorage = {
  getItem: vi.fn((key: string) => store[key] ?? null),
  setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
  removeItem: vi.fn((key: string) => { delete store[key]; }),
  clear: vi.fn(() => { Object.keys(store).forEach((k) => delete store[k]); }),
  get length() { return Object.keys(store).length; },
  key: vi.fn((i: number) => Object.keys(store)[i] ?? null),
};

Object.defineProperty(globalThis, 'localStorage', { value: mockLocalStorage, writable: true });

// Import after mocking
const { readSession, saveSession } = await import('../auth-oidc');

describe('auth-oidc', () => {
  beforeEach(() => {
    mockLocalStorage.clear();
    vi.clearAllMocks();
  });

  describe('saveSession / readSession', () => {
    it('saves and reads a session from localStorage', () => {
      const session = {
        accessToken: 'abc123',
        refreshToken: 'refresh456',
        idToken: 'id789',
        expiresAt: 1700000000,
        scope: 'openid roles',
      };

      saveSession(session);
      const read = readSession();

      expect(read).toEqual(session);
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'admin_oidc_session',
        expect.any(String)
      );
    });

    it('returns null when no session is stored', () => {
      expect(readSession()).toBeNull();
    });

    it('clears session when null is passed to saveSession', () => {
      saveSession({ accessToken: 'x', expiresAt: 9999999999 });
      expect(readSession()).not.toBeNull();

      saveSession(null);
      expect(readSession()).toBeNull();
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('admin_oidc_session');
    });

    it('returns null for corrupted JSON in localStorage', () => {
      mockLocalStorage.setItem('admin_oidc_session', 'not-json');
      expect(readSession()).toBeNull();
    });
  });
});
