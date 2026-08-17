export type ScheduleRecurrence = 'daily' | 'weekly' | 'monthly';
export type ScheduleFormat = 'pdf' | 'excel' | 'pptx';

export interface ScheduleRecipient {
  name: string;
  email: string;
  burstValue?: string;
}

export interface ReportSchedule {
  id: string;
  dashboardId: string;
  dashboardName: string;
  name: string;
  recurrence: ScheduleRecurrence;
  time: string;
  format: ScheduleFormat;
  burstBy?: string;
  recipients: ScheduleRecipient[];
  createdBy: string;
  createdAt: number;
  lastRunAt?: number;
}

export interface DeliverySimulationResult {
  recipientName: string;
  recipientEmail: string;
  burstValue?: string;
  fileName: string;
  fileSizeKB: number;
  blobUrl: string;
  recordCount: number;
}
