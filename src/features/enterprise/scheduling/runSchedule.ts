import type { DashboardDataSource } from '@/components/dashboard-builder/types';
import { logAuditEntry } from '../audit/useAuditLog';
import type { GovernedDimension } from '../semantic-layer/types';
import { filterByGovernedDimension } from './filterBurst';
import { generateBurstFile } from './generateBurstFile';
import type { DeliverySimulationResult, ReportSchedule } from './types';

export async function runSchedule(opts: {
  schedule: ReportSchedule;
  source: DashboardDataSource;
  burstDimension?: GovernedDimension;
  actor: string;
}): Promise<DeliverySimulationResult[]> {
  const results: DeliverySimulationResult[] = [];

  for (const recipient of opts.schedule.recipients) {
    const burstValue = recipient.burstValue;
    const sliced =
      opts.schedule.burstBy && opts.burstDimension && burstValue
        ? filterByGovernedDimension(opts.source, opts.burstDimension, burstValue)
        : opts.source;

    const file = await generateBurstFile({
      title: opts.schedule.name,
      recipientName: recipient.name,
      recipientEmail: recipient.email,
      burstLabel: burstValue,
      format: opts.schedule.format,
      source: sliced,
    });

    results.push({
      recipientName: recipient.name,
      recipientEmail: recipient.email,
      burstValue,
      fileName: file.name,
      fileSizeKB: file.sizeKB,
      blobUrl: file.url,
      recordCount: file.recordCount,
    });
  }

  logAuditEntry({
    actor: opts.actor,
    action: 'schedule.run',
    targetType: 'schedule',
    targetId: opts.schedule.id,
    targetName: opts.schedule.name,
    details: `${results.length} recipient${results.length === 1 ? '' : 's'} — delivery simulated`,
  });
  logAuditEntry({
    actor: opts.actor,
    action: 'report.generated',
    targetType: 'report',
    targetId: opts.schedule.id,
    targetName: opts.schedule.name,
    details: `${results.length} file(s) generated, not emailed`,
  });

  return results;
}

export function nextRunAt(recurrence: ReportSchedule['recurrence'], time: string): Date {
  const parts = time.split(':');
  const hh = Number(parts[0]) || 0;
  const mm = Number(parts[1]) || 0;
  const next = new Date();
  next.setSeconds(0, 0);
  next.setHours(hh, mm, 0, 0);
  if (next.getTime() <= Date.now()) {
    if (recurrence === 'weekly') next.setDate(next.getDate() + 7);
    else if (recurrence === 'monthly') next.setMonth(next.getMonth() + 1);
    else next.setDate(next.getDate() + 1);
  }
  return next;
}
