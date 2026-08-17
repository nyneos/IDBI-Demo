import { useMemo } from 'react';
import {
  hierarchy,
  pack,
  partition,
  tree,
  treemap,
  type HierarchyCircularNode,
  type HierarchyNode as D3Node,
  type HierarchyPointNode,
  type HierarchyRectangularNode,
} from 'd3-hierarchy';
import type { HierarchyNode } from '@/data/types';

export type HierarchyKind = 'treemap' | 'icicle' | 'pack' | 'radialTree';

export type HierarchyLayoutNode =
  | HierarchyRectangularNode<HierarchyNode>
  | HierarchyCircularNode<HierarchyNode>
  | HierarchyPointNode<HierarchyNode>;

export function useHierarchyLayout(
  root: HierarchyNode,
  kind: HierarchyKind,
  width: number,
  height: number,
) {
  return useMemo(() => {
    const h = hierarchy(root, (n) => n.children)
      .sum((n) => (n.children?.length ? 0 : n.value))
      .sort((a, b) => (b.value ?? 0) - (a.value ?? 0));

    switch (kind) {
      case 'treemap':
        return treemap<HierarchyNode>().size([width, height]).padding(2)(h);
      case 'icicle':
        return partition<HierarchyNode>().size([width, height]).padding(1)(h);
      case 'pack':
        return pack<HierarchyNode>().size([width, height]).padding(3)(h);
      case 'radialTree': {
        const radius = Math.min(width, height) / 2 - 16;
        return tree<HierarchyNode>().size([2 * Math.PI, radius])(h);
      }
    }
  }, [root, kind, width, height]);
}

export function isRect(
  node: D3Node<HierarchyNode>,
): node is HierarchyRectangularNode<HierarchyNode> {
  return 'x0' in node && 'x1' in node;
}

export function isCircle(
  node: D3Node<HierarchyNode>,
): node is HierarchyCircularNode<HierarchyNode> {
  return 'r' in node && 'x' in node && !('x0' in node);
}
