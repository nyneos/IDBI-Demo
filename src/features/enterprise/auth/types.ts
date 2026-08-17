export type EnterpriseRole = 'admin' | 'branch-manager' | 'zonal-head' | 'viewer';

export interface EnterpriseUser {
  email: string;
  name: string;
  role: EnterpriseRole;
}

export interface EnterpriseSession extends EnterpriseUser {
  loginTime: number;
}

export const SEEDED_USERS: Record<string, { password: string; user: EnterpriseUser }> = {
  'admin@example.com': {
    password: 'Admin@123',
    user: { email: 'admin@example.com', name: 'Admin', role: 'admin' },
  },
  'viewer@example.com': {
    password: 'Viewer@123',
    user: { email: 'viewer@example.com', name: 'Analyst', role: 'viewer' },
  },
};

export const ROLE_LABEL: Record<EnterpriseRole, string> = {
  admin: 'Admin',
  'branch-manager': 'Branch manager',
  'zonal-head': 'Zonal head',
  viewer: 'Viewer',
};

export const SESSION_KEY = 'enterprise.session';
