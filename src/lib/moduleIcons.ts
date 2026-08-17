import {
  AlertTriangle,
  Building2,
  CreditCard,
  FileText,
  Home,
  Landmark,
  ShieldCheck,
  TrendingUp,
  Users,
  Wallet,
  type LucideIcon,
} from 'lucide-react';

export const MODULE_ICON_IDS = [
  'Home',
  'Building2',
  'ShieldCheck',
  'TrendingUp',
  'Landmark',
  'Users',
  'FileText',
  'AlertTriangle',
  'Wallet',
  'CreditCard',
] as const;

export type ModuleIconId = (typeof MODULE_ICON_IDS)[number];

export const MODULE_ICONS: Record<ModuleIconId, LucideIcon> = {
  Home,
  Building2,
  ShieldCheck,
  TrendingUp,
  Landmark,
  Users,
  FileText,
  AlertTriangle,
  Wallet,
  CreditCard,
};

export function moduleIcon(id?: string): LucideIcon {
  if (id && id in MODULE_ICONS) return MODULE_ICONS[id as ModuleIconId];
  return Home;
}

export function isModuleIconId(id: string): id is ModuleIconId {
  return (MODULE_ICON_IDS as readonly string[]).includes(id);
}
