import { useMemo, useState } from 'react';
import { ChevronDown, ChevronRight, Sparkles } from 'lucide-react';
import { factsOf } from '@/components/dashboard-builder/blockData';
import type { DashboardDataSource } from '@/components/dashboard-builder/types';
import { formatINR } from '@/lib/format';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import type { GovernedMeasure } from '../semantic-layer/types';
import {
  candidateDimensions,
  indicesForPath,
  rootIndices,
  splitByDimension,
  suggestNextDimension,
  totalMeasureValue,
  type DecompositionNode,
} from './computeDecomposition';

interface TreePathSegment {
  field: string;
  value: string;
}

function formatMeasure(value: number, measure: GovernedMeasure): string {
  if (measure.format === 'currency-inr') return formatINR(value);
  if (measure.format === 'percent') return `${value.toFixed(1)}%`;
  return value.toLocaleString('en-IN');
}

export function DecompositionTreeView({
  source,
  measure,
  compact = false,
}: {
  source: DashboardDataSource;
  measure: GovernedMeasure;
  compact?: boolean;
}) {
  const [path, setPath] = useState<TreePathSegment[]>([]);
  const [usedDims, setUsedDims] = useState<string[]>([]);
  const [nodes, setNodes] = useState<DecompositionNode[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [manualDim, setManualDim] = useState('');

  const activeIndices = useMemo(
    () => (path.length ? indicesForPath(source, path) : rootIndices(source)),
    [source, path],
  );

  const rootValue = useMemo(
    () => totalMeasureValue(source, measure, activeIndices),
    [source, measure, activeIndices],
  );

  const dims = useMemo(() => candidateDimensions(source, usedDims), [source, usedDims]);
  const suggestion = useMemo(
    () =>
      suggestNextDimension(source, measure, usedDims, dims, activeIndices),
    [source, measure, usedDims, dims, activeIndices],
  );

  const expandWith = (field: string, parentPath: TreePathSegment[]) => {
    const indices = parentPath.length ? indicesForPath(source, parentPath) : rootIndices(source);
    const children = splitByDimension(source, measure, field, indices, parentPath.length + 1, field);
    setUsedDims((prev) => [...prev, field]);
    setNodes(children);
    setExpandedId(null);
    setPath(parentPath);
    setManualDim('');
  };

  const onExpandNode = (node: DecompositionNode) => {
    const segField = node.id.split('/')[1];
    const segValue = node.label;
    if (!segField) return;
    const newPath = [...path, { field: segField, value: segValue }];
    setPath(newPath);
    setExpandedId(node.id);
    const nextDims = candidateDimensions(source, usedDims);
    const next = suggestNextDimension(source, measure, usedDims, nextDims, indicesForPath(source, newPath));
    if (next) expandWith(next.field, newPath);
  };

  const records = factsOf(source);
  if (records.length === 0) {
    return <p className="text-sm text-content-secondary">Upload data to build a decomposition tree.</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="rounded-xl border border-hairline bg-paper px-5 py-4 shadow-sm">
        <p className="text-xs text-content-tertiary">{measure.name}</p>
        <p className="text-xl font-bold text-content-primary">{formatMeasure(rootValue, measure)}</p>
      </div>

      {nodes.length === 0 ? (
        <div className="flex flex-col gap-2">
          {suggestion ? (
            <Button
              variant="secondary"
              className="h-auto w-full justify-start gap-2 border-brand/30 bg-brand-tint/40 px-3 py-2 text-left text-sm font-normal hover:border-brand"
              onClick={() => expandWith(suggestion.field, path)}
            >
              <Sparkles size={14} className="shrink-0 text-brand-text" />
              <span>
                AI suggests: split by <strong>{suggestion.label}</strong> (
                {(suggestion.varianceExplained * 100).toFixed(0)}% variance explained)
              </span>
            </Button>
          ) : null}
          {!compact ? (
            <div className="flex flex-wrap items-end gap-2">
              <div className="min-w-[180px] flex-1">
                <Select
                  label="Or choose dimension"
                  value={manualDim}
                  options={[
                    { value: '', label: 'Select dimension' },
                    ...dims.map((d) => ({ value: d, label: d.replace(/_/g, ' ') })),
                  ]}
                  onChange={(e) => setManualDim(e.target.value)}
                />
              </div>
              <Button variant="secondary" disabled={!manualDim} onClick={() => manualDim && expandWith(manualDim, path)}>
                Expand
              </Button>
            </div>
          ) : null}
        </div>
      ) : (
        <ul className="flex flex-col gap-1 pl-2">
          {nodes.map((node) => (
            <li key={node.id}>
              <button
                type="button"
                onClick={() => onExpandNode(node)}
                className="flex h-11 w-full items-center gap-2 rounded-md px-2 text-left text-sm hover:bg-sunken"
              >
                {expandedId === node.id ? (
                  <ChevronDown size={14} className="shrink-0 text-content-tertiary" />
                ) : (
                  <ChevronRight size={14} className="shrink-0 text-content-tertiary" />
                )}
                <span className="flex-1 truncate text-content-primary">{node.label}</span>
                <span className="shrink-0 font-medium text-content-secondary">
                  {formatMeasure(node.value, measure)}
                </span>
              </button>
              {expandedId === node.id && suggestion ? (
                <p className="ml-6 mt-1 flex items-center gap-1 text-xs text-brand-text">
                  <Sparkles size={12} />
                  + expand: {suggestion.label} (AI suggestion)
                </p>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function DecompositionTreeBlock({
  source,
  measure,
}: {
  source: DashboardDataSource;
  measure: GovernedMeasure;
}) {
  return <DecompositionTreeView source={source} measure={measure} compact />;
}
