/**
 * Canonical write-up: /LIMITATIONS.md
 *
 * PDF/PPTX: html2canvas raster, not native chart objects.
 * Excel: real SheetJS rows.
 *
 * Needs a backend: scheduled refresh, sharing/permissions/RLS,
 * true NLQ (LLM via proxy), real-time collaborative editing.
 */
export const BACKEND_DEPENDENT_FEATURES = [
  'Scheduled data refresh',
  'Sharing / permissions / row-level security',
  'True natural-language Q&A',
  'Real-time collaborative editing',
] as const;
