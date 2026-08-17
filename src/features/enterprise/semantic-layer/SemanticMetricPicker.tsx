import { EnterpriseBadge } from '../shared/EnterpriseBadge';
import type { GovernedMeasure } from './types';

export function SemanticMetricPicker({ measures }: { measures: GovernedMeasure[] }) {
  if (measures.length === 0) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-content-tertiary">
        <EnterpriseBadge label="Governed" />
        No approved measures yet
      </span>
    );
  }
  return (
    <span className="inline-flex flex-wrap items-center gap-1.5 text-xs text-content-secondary">
      <EnterpriseBadge label="Governed" />
      {measures.map((m) => m.name).join(' · ')}
    </span>
  );
}
