import { ClipboardCheck, UserCog } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { EnterpriseRole } from './types';

export interface LoginPath {
  id: string;
  role: EnterpriseRole;
  title: string;
  description: string;
  hint: string;
  email: string;
  icon: LucideIcon;
}

export const LOGIN_PATHS: LoginPath[] = [
  {
    id: 'admin',
    role: 'admin',
    title: 'Sign in as Admin',
    description: 'Full Enterprise Suite — semantic layer, governance, reports, and audit.',
    hint: 'Use admin@example.com / Admin@123',
    email: 'admin@example.com',
    icon: UserCog,
  },
  {
    id: 'viewer',
    role: 'viewer',
    title: 'Sign in as Analyst',
    description: 'Read-only access — dashboards, insights, and published reports.',
    hint: 'Use viewer@example.com / Viewer@123',
    email: 'viewer@example.com',
    icon: ClipboardCheck,
  },
];
