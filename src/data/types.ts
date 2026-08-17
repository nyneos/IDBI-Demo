export interface NamedCount {
  id: string;
  name: string;
  value: number;
}

export interface HierarchyNode {
  id: string;
  name: string;
  level: 'root' | 'l1' | 'l2' | 'l3' | 'l4' | 'l5';
  value: number;
  color?: string;
  children?: HierarchyNode[];
}

export interface PathSegment {
  id: string;
  label: string;
  route?: string;
  active?: boolean;
  placeholder?: boolean;
}

export type EntityType = 'zone' | 'branch' | 'category' | 'segment' | 'mode' | 'status' | 'account';

export interface GraphNode {
  id: string;
  label: string;
  type: EntityType;
  value: number;
  sublabel?: string;
}

export interface GraphEdge {
  source: string;
  target: string;
  value: number;
  kind: 'related' | 'status';
}
