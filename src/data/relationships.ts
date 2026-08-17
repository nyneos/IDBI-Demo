export interface Relationship {
  id: string;
  fromSource: string;
  fromField: string;
  toSource: string;
  toField: string;
  cardinality: 'one-to-one' | 'one-to-many' | 'many-to-one';
}

export type SourceRecord = Record<string, string | number | null>;

export function joinSources(a: SourceRecord[], b: SourceRecord[], rel: Relationship): SourceRecord[] {
  const index = new Map<string, SourceRecord>();
  for (const row of b) {
    index.set(String(row[rel.toField] ?? ''), row);
  }
  return a
    .map((row) => {
      const match = index.get(String(row[rel.fromField] ?? ''));
      if (!match) return { ...row };
      return { ...row, ...match };
    })
    .filter(Boolean);
}

const REL_KEY = 'datacanvas.relationships';

export function loadRelationships(): Relationship[] {
  try {
    const raw = localStorage.getItem(REL_KEY);
    return raw ? (JSON.parse(raw) as Relationship[]) : [];
  } catch {
    return [];
  }
}

export function saveRelationships(rels: Relationship[]): void {
  localStorage.setItem(REL_KEY, JSON.stringify(rels));
}

export function findRelationship(rels: Relationship[], a: string, b: string): Relationship | undefined {
  return rels.find(
    (r) => (r.fromSource === a && r.toSource === b) || (r.fromSource === b && r.toSource === a),
  );
}
