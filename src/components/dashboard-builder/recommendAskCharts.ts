import type { DashboardDataSource, WorkingBlockType } from './types';
import type { DrillChartRec } from './recommendDrillCharts';

const STOP = new Set([
  'the',
  'and',
  'for',
  'how',
  'what',
  'which',
  'show',
  'me',
  'of',
  'by',
  'a',
  'an',
  'is',
  'are',
  'do',
  'does',
  'we',
  'our',
  'this',
  'that',
  'with',
  'from',
  'over',
  'into',
  'to',
  'in',
  'on',
  'or',
  'can',
  'you',
  'please',
  'give',
  'tell',
  'about',
  'data',
  'chart',
  'graph',
  'transactions',
  'transaction',
]);

function norm(s: string) {
  return s.toLowerCase().replace(/[_-]+/g, ' ').replace(/[^\w\s]/g, ' ').replace(/\s+/g, ' ').trim();
}

function tokens(query: string) {
  return norm(query)
    .split(' ')
    .filter((t) => t.length > 1 && !STOP.has(t));
}

function dimHaystack(label: string, key: string) {
  return norm(`${label} ${key} ${key.replace(/_/g, ' ')}`);
}

function scoreDim(queryTokens: string[], label: string, key: string) {
  const hay = dimHaystack(label, key);
  let score = 0;
  for (const t of queryTokens) {
    if (hay.includes(t)) score += t.length > 4 ? 3 : 2;
  }
  const full = norm(label);
  if (full && norm(queryTokens.join(' ')).includes(full)) score += 8;
  return score;
}

function pickDims(query: string, source: DashboardDataSource) {
  const qTokens = tokens(query);
  const scored = source.dimensions
    .map((d) => ({ dim: d, score: scoreDim(qTokens, d.label, d.key) }))
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score);
  if (scored.length) return scored.map((r) => r.dim);
  return [...source.dimensions].sort((a, b) => (b.cardinality ?? 0) - (a.cardinality ?? 0));
}

function inferTypes(query: string, source: DashboardDataSource): WorkingBlockType[] {
  const q = norm(query);
  const types: WorkingBlockType[] = [];
  const add = (t: WorkingBlockType) => {
    if (!types.includes(t)) types.push(t);
  };

  if (/pie|share|mix|split|proportion|percent|breakdown/.test(q)) add('pie');
  if (/trend|over time|daily|monthly|timeline|over days/.test(q)) add('line');
  if (/rank|top|highest|most|compare|bar|volume/.test(q)) add('bar');
  if (/stack/.test(q)) add('stacked-bar');
  if (/heat/.test(q)) add('heatmap');
  if (/sunburst|hierarch/.test(q)) add('sunburst');
  if (/kpi|total|count|how many|headline/.test(q)) add('kpi');
  if (/group table|grouped|report/.test(q)) add('reporting-table');
  if (/\btable\b|list|rows/.test(q)) add('table');
  if (/sankey|flow/.test(q)) add('sankey');

  if (types.length === 0) {
    add('bar');
    add('pie');
    add('kpi');
    if ((source.dates ?? []).length) add('line');
    add('reporting-table');
  }
  return types;
}

function human(key: string) {
  return key.replace(/_/g, ' ');
}

export function askExamples(source: DashboardDataSource): string[] {
  const dims = source.dimensions;
  const dates = source.dates ?? [];
  const find = (...re: RegExp[]) =>
    dims.find((d) => re.some((r) => r.test(d.key) || r.test(d.label)));
  const zone = find(/zone/i);
  const status = find(/status/i);
  const channel = find(/channel/i);
  const cat = find(/categor/i, /type/i);
  const out: string[] = [];
  if (zone) out.push(`How do transactions split by ${zone.label}?`);
  if (status) out.push(`What's the ${status.label.toLowerCase()} mix?`);
  if (dates[0]) out.push(`Show the trend over ${dates[0].label}`);
  if (channel) out.push(`Which ${channel.label.toLowerCase()} has the most volume?`);
  if (zone && channel) out.push(`Break ${zone.label} down by ${channel.label}`);
  if (cat) out.push(`Rank ${cat.label.toLowerCase()} by count`);
  if (out.length < 6) out.push('Show a grouped table of this data');
  if (out.length < 6 && dims[0]) out.push(`Compare values across ${dims[0].label}`);
  return out.slice(0, 6);
}

export function recommendAskCharts(query: string, source: DashboardDataSource): DrillChartRec[] {
  const q = query.trim();
  if (!q) return [];

  const types = inferTypes(q, source);
  const dims = pickDims(q, source);
  const primary = dims[0]?.key ?? source.dimensions[0]?.key ?? '';
  const secondary = dims.find((d) => d.key !== primary)?.key ?? source.dimensions.find((d) => d.key !== primary)?.key;
  const dateKey = source.dates?.[0]?.key;

  const recs: DrillChartRec[] = [];
  const add = (type: WorkingBlockType, reason: string, keys: string[]) => {
    if (recs.some((r) => r.type === type)) return;
    recs.push({ type, reason, dimensionKeys: keys.filter(Boolean) });
  };

  for (const type of types) {
    if (type === 'line') {
      add('line', dateKey ? `Trend over ${human(dateKey)}` : 'Trend over time', [dateKey ?? primary]);
    } else if (type === 'stacked-bar') {
      add(
        'stacked-bar',
        secondary
          ? `How ${human(secondary)} splits inside ${human(primary)}`
          : `Stacked view of ${human(primary)}`,
        secondary ? [primary, secondary] : [primary],
      );
    } else if (type === 'heatmap') {
      add(
        'heatmap',
        secondary ? `${human(primary)} by ${human(secondary)}` : `Heatmap of ${human(primary)}`,
        secondary ? [primary, secondary] : [primary],
      );
    } else if (type === 'sunburst') {
      add('sunburst', 'Hierarchy across the fields in your question', [primary, secondary].filter(Boolean) as string[]);
    } else if (type === 'sankey') {
      add(
        'sankey',
        secondary ? `Flow from ${human(primary)} to ${human(secondary)}` : `Flow across ${human(primary)}`,
        secondary ? [primary, secondary] : [primary],
      );
    } else if (type === 'kpi') {
      add('kpi', `Headline count for ${human(primary) || 'this question'}`, [primary]);
    } else if (type === 'pie') {
      add('pie', `Share breakdown of ${human(primary)}`, [primary]);
    } else if (type === 'bar') {
      add('bar', `Ranked values for ${human(primary)}`, [primary]);
    } else if (type === 'table') {
      add('table', 'Row-level list matching this question', [primary]);
    } else if (type === 'reporting-table') {
      add('reporting-table', 'Grouped report you can keep filtering on the canvas', primary ? [primary] : []);
    }
  }

  if (recs.length < 4 && primary) {
    add('pie', `Share breakdown of ${human(primary)}`, [primary]);
    add('bar', `Ranked values for ${human(primary)}`, [primary]);
    add('kpi', `Headline count for ${human(primary)}`, [primary]);
  }

  return recs.slice(0, 4);
}
