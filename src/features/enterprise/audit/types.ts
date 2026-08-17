export type AuditAction =
  | 'dashboard.created'
  | 'dashboard.edited'
  | 'dashboard.published'
  | 'dashboard.deleted'
  | 'dashboard.submitted'
  | 'dashboard.restored'
  | 'measure.created'
  | 'measure.approved'
  | 'dimension.created'
  | 'dimension.approved'
  | 'schedule.created'
  | 'schedule.run'
  | 'schedule.deleted'
  | 'report.generated';

export type AuditTargetType = 'dashboard' | 'measure' | 'dimension' | 'schedule' | 'report';

export interface AuditEntry {
  id: string;
  timestamp: number;
  actor: string;
  action: AuditAction;
  targetType: AuditTargetType;
  targetId: string;
  targetName: string;
  details?: string;
}

export const AUDIT_ACTION_LABEL: Record<AuditAction, string> = {
  'dashboard.created': 'created dashboard',
  'dashboard.edited': 'edited dashboard',
  'dashboard.published': 'published dashboard',
  'dashboard.deleted': 'deleted dashboard',
  'dashboard.submitted': 'submitted dashboard for review',
  'dashboard.restored': 'restored dashboard version',
  'measure.created': 'created measure',
  'measure.approved': 'approved measure',
  'dimension.created': 'created dimension',
  'dimension.approved': 'approved dimension',
  'schedule.created': 'created schedule',
  'schedule.run': 'ran schedule',
  'schedule.deleted': 'deleted schedule',
  'report.generated': 'generated report',
};

export type PromotionStatus = 'draft' | 'in-review' | 'approved' | 'published';

export const PROMOTION_LABEL: Record<PromotionStatus, string> = {
  draft: 'Draft',
  'in-review': 'In Review',
  approved: 'Approved',
  published: 'Published',
};
