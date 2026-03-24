import { useMemo } from 'react';
import { useSession } from '../layout/AdminLayout';
import { isDevMode } from '../services/api-client';

type RealmAccess = {
  roles?: string[];
};

type JwtPayload = {
  realm_access?: RealmAccess;
  resource_access?: Record<string, RealmAccess>;
  preferred_username?: string;
  email?: string;
  sub?: string;
  [key: string]: unknown;
};

function decodeJwtPayload(token: string): JwtPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = parts[1];
    const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(decoded) as JwtPayload;
  } catch {
    return null;
  }
}

export function useAuth() {
  const { session } = useSession();

  const claims = useMemo(() => {
    if (!session?.accessToken) return null;
    if (isDevMode()) {
      // In dev mode, return mock claims with ADMIN role
      return {
        realm_access: { roles: ['ADMIN', 'CUSTOMER', 'SUPPORT'] },
        preferred_username: 'dev-admin',
        email: 'admin@dev.local',
      } as JwtPayload;
    }
    return decodeJwtPayload(session.accessToken);
  }, [session?.accessToken]);

  const roles = useMemo(() => {
    const realmRoles = claims?.realm_access?.roles ?? [];
    return new Set(realmRoles.map((r) => r.toUpperCase()));
  }, [claims]);

  const hasRole = (role: string) => roles.has(role.toUpperCase());

  const hasAnyRole = (...requiredRoles: string[]) =>
    requiredRoles.some((r) => roles.has(r.toUpperCase()));

  return {
    isAuthenticated: !!session,
    claims,
    roles,
    hasRole,
    hasAnyRole,
    username: claims?.preferred_username ?? null,
    email: claims?.email ?? null,
  };
}
