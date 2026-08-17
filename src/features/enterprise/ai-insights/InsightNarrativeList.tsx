import { Sparkles } from 'lucide-react';
import { insightKindLabel, type Insight } from './insightProvenance';

export function InsightNarrativeList({ insights }: { insights: Insight[] }) {
  if (insights.length === 0) return null;
  return (
    <div className="mt-3 border-t border-hairline pt-3">
      <div className="flex items-start gap-2">
        <Sparkles size={14} className="mt-0.5 shrink-0 text-brand-text" aria-hidden />
        <ul className="flex flex-col gap-1.5 text-sm text-content-secondary">
          {insights.map((insight, i) => (
            <li key={i} className="leading-snug">
              <span className="sr-only">{insightKindLabel(insight.kind)}: </span>
              {insight.text}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
