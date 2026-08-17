import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import {
  SESSION_KEY,
  SEEDED_USERS,
  type EnterpriseSession,
} from './types';

function readSession(): EnterpriseSession | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<EnterpriseSession>;
    if (!parsed.email || !parsed.name || !parsed.role || !parsed.loginTime) return null;
    return parsed as EnterpriseSession;
  } catch {
    return null;
  }
}

interface SessionApi {
  user: EnterpriseSession | null;
  login: (email: string, password: string) => boolean;
  logout: () => void;
}

const SessionContext = createContext<SessionApi | null>(null);

export function EnterpriseSessionProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<EnterpriseSession | null>(readSession);

  const login = useCallback((email: string, password: string) => {
    const record = SEEDED_USERS[email.trim().toLowerCase()];
    if (!record || record.password !== password) return false;
    const next: EnterpriseSession = { ...record.user, loginTime: Date.now() };
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(next));
    setUser(next);
    return true;
  }, []);

  const logout = useCallback(() => {
    sessionStorage.removeItem(SESSION_KEY);
    setUser(null);
  }, []);

  const value = useMemo(() => ({ user, login, logout }), [user, login, logout]);
  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useEnterpriseSession(): SessionApi {
  const ctx = useContext(SessionContext);
  if (!ctx) {
    throw new Error('useEnterpriseSession must be used inside EnterpriseSessionProvider');
  }
  return ctx;
}
