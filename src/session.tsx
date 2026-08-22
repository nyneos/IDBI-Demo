import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

export type EnterpriseRole = 'admin' | 'branch-manager' | 'zonal-head' | 'viewer';

export interface EnterpriseSession {
  name: string;
  role: EnterpriseRole;
  loginTime: number;
}

const SESSION_KEY = 'enterprise.session';

function readSession(): EnterpriseSession | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<EnterpriseSession>;
    if (!parsed.name || !parsed.role || !parsed.loginTime) return null;
    return parsed as EnterpriseSession;
  } catch {
    return null;
  }
}

interface SessionApi {
  user: EnterpriseSession | null;
  login: (name: string) => void;
  logout: () => void;
}

const SessionContext = createContext<SessionApi | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<EnterpriseSession | null>(readSession);

  const login = useCallback((name: string) => {
    const next: EnterpriseSession = {
      name,
      role: 'admin',
      loginTime: Date.now(),
    };
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(next));
    setUser(next);
  }, []);

  const logout = useCallback(() => {
    sessionStorage.removeItem(SESSION_KEY);
    setUser(null);
  }, []);

  const value = useMemo(() => ({ user, login, logout }), [user, login, logout]);
  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionApi {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession must be used inside SessionProvider');
  return ctx;
}
