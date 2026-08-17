import type { DashboardBlock, DashboardState } from '@/components/dashboard-builder/types';
import { pickerByType } from '@/components/dashboard-builder/chartRegistry';
import type { PromotionStatus } from './types';

export interface DashboardVersion {
  version: number;
  snapshot: DashboardState;
  status: PromotionStatus;
  changedBy: string;
  changedAt: number;
  changeSummary: string;
}

export interface DashboardGovernance {
  status: PromotionStatus;
  versions: DashboardVersion[];
}

const keyFor = (dashboardId: string) => `enterprise.dashboard-gov.${dashboardId}`;

export function loadGovernance(dashboardId: string): DashboardGovernance {
  try {
    const raw = localStorage.getItem(keyFor(dashboardId));
    if (!raw) return { status: 'draft', versions: [] };
    const parsed = JSON.parse(raw) as DashboardGovernance;
    return {
      status: parsed.status ?? 'draft',
      versions: Array.isArray(parsed.versions) ? parsed.versions : [],
    };
  } catch {
    return { status: 'draft', versions: [] };
  }
}

export function saveGovernance(dashboardId: string, gov: DashboardGovernance) {
  localStorage.setItem(keyFor(dashboardId), JSON.stringify(gov));
}

export function cloneDashboard(state: DashboardState): DashboardState {
  return JSON.parse(JSON.stringify(state)) as DashboardState;
}

function countTypes(blocks: DashboardBlock[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const b of blocks) {
    map.set(b.type, (map.get(b.type) ?? 0) + 1);
  }
  return map;
}

export function summarizeBlockDiff(prev: DashboardState | null, next: DashboardState): string {
  if (!prev) return 'Initial snapshot';
  const a = countTypes(prev.blocks);
  const b = countTypes(next.blocks);
  const types = new Set([...a.keys(), ...b.keys()]);
  const added: string[] = [];
  const removed: string[] = [];
  for (const type of types) {
    const delta = (b.get(type) ?? 0) - (a.get(type) ?? 0);
    const label = pickerByType(type as DashboardBlock['type']).label;
    if (delta > 0) added.push(delta === 1 ? label : `${delta} ${label}s`);
    if (delta < 0) removed.push(delta === -1 ? label : `${-delta} ${label}s`);
  }
  const parts: string[] = [];
  if (added.length) parts.push(`Added ${added.join(', ')}`);
  if (removed.length) parts.push(`Removed ${removed.join(', ')}`);
  if (prev.name !== next.name) parts.push(`Renamed to “${next.name}”`);
  return parts.join(', ') || 'Layout or titles updated';
}
