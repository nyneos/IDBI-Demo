import { useEffect, useRef, useState, type RefObject } from 'react';
import { select } from 'd3-selection';
import { zoom, zoomIdentity, type ZoomBehavior, type ZoomTransform } from 'd3-zoom';

export interface GraphViewport {
  transform: ZoomTransform;
  k: number;
  setTransform: (t: ZoomTransform) => void;
  zoomTo: (x: number, y: number, k?: number) => void;
  reset: () => void;
  containerRef: RefObject<SVGSVGElement>;
}

export function useGraphViewport(width: number, height: number): GraphViewport {
  const containerRef = useRef<SVGSVGElement>(null!);
  const zoomRef = useRef<ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  const [transform, setTransform] = useState<ZoomTransform>(zoomIdentity);

  useEffect(() => {
    const svg = containerRef.current;
    if (!svg) return;

    const behavior = zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.4, 3])
      .on('zoom', (event) => {
        setTransform(event.transform);
      });

    zoomRef.current = behavior;
    select(svg).call(behavior);

    return () => {
      select(svg).on('.zoom', null);
    };
  }, []);

  const zoomTo = (x: number, y: number, k = transform.k) => {
    const svg = containerRef.current;
    const behavior = zoomRef.current;
    if (!svg || !behavior) return;
    const next = zoomIdentity
      .translate(width / 2, height / 2)
      .scale(k)
      .translate(-x, -y);
    select(svg).call(behavior.transform, next);
  };

  const reset = () => {
    const svg = containerRef.current;
    const behavior = zoomRef.current;
    if (!svg || !behavior) return;
    select(svg).call(behavior.transform, zoomIdentity);
  };

  return {
    transform,
    k: transform.k,
    setTransform,
    zoomTo,
    reset,
    containerRef,
  };
}
