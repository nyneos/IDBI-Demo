import { useCallback, useEffect, useMemo, useRef, useState, type PointerEvent } from 'react';
import { formatPercent } from '@/lib/format';
import { MOTION } from '@/motion/tokens';
import { cn } from '@/lib/cn';
import type { HierarchyNode } from '@/data/types';
import { SunburstArc } from './SunburstArc';
import { SunburstCenter } from './SunburstCenter';
import { SunburstControls } from './SunburstControls';
import { SunburstTooltip } from './SunburstTooltip';
import { useSunburstLayout, type SunburstArcDatum } from './useSunburstLayout';
import { useSunburstKeyboard } from './useSunburstKeyboard';

const BASE_RADIUS = 300;
const MIN_RADIUS = 220;
const MAX_RADIUS = 460;
const ZOOM_STEP = 20;

function isLinkedToHover(
  arc: SunburstArcDatum,
  hoverId: string,
  byId: Map<string, SunburstArcDatum>,
): boolean {
  if (arc.id === hoverId) return true;
  let id: string | null = arc.id;
  const seen = new Set<string>();
  while (id && !seen.has(id)) {
    seen.add(id);
    if (id === hoverId) return true;
    id = byId.get(id)?.parentId ?? null;
  }
  id = hoverId;
  seen.clear();
  while (id && !seen.has(id)) {
    seen.add(id);
    if (id === arc.id) return true;
    id = byId.get(id)?.parentId ?? null;
  }
  return false;
}

export interface SunburstChartProps {
  data: HierarchyNode;
  focusId: string;
  focusLabel: string;
  selectedId?: string | null;
  onFocusChange: (id: string) => void;
  onArcActivate: (arc: SunburstArcDatum) => void;
  className?: string;
}

export function SunburstChart({
  data,
  focusId,
  focusLabel,
  selectedId = null,
  onFocusChange,
  onArcActivate,
  className,
}: SunburstChartProps) {
  const [radius, setRadius] = useState(BASE_RADIUS);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [tip, setTip] = useState<{
    arc: SunburstArcDatum;
    x: number;
    y: number;
  } | null>(null);
  const [tipVisible, setTipVisible] = useState(false);
  const tipTimer = useRef<number | null>(null);

  const plotRef = useRef<SVGSVGElement | null>(null);
  const treeRef = useRef<HTMLDivElement | null>(null);
  const hostRef = useRef<HTMLDivElement | null>(null);

  const drilled = focusId !== data.id;

  useEffect(() => {
    const el = hostRef.current;
    if (!el) return;
    const fit = () => {
      const pad = 48;
      const grow = drilled ? 1.14 : 1;
      const fitR = (el.clientWidth / 2 - pad) * grow;
      const cap = drilled ? MAX_RADIUS : 420;
      setRadius(Math.max(MIN_RADIUS, Math.min(cap, fitR)));
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, [drilled]);

  const { arcs, focusValue, byId, centerR } = useSunburstLayout(data, focusId, radius);

  const visibleHighlight = hoveredId;
  const centerArc = hoveredId ? byId.get(hoveredId) : null;
  const centerLabel = centerArc?.name ?? focusLabel;
  const centerValue = centerArc?.value ?? focusValue;

  const size = radius * 2 + 8;
  const focusStack = useMemo(() => {
    const path: string[] = [];
    let id: string | null = focusId;
    const index = new Map<string, HierarchyNode>();
    const walk = (n: HierarchyNode) => {
      index.set(n.id, n);
      n.children?.forEach(walk);
    };
    walk(data);
    while (id && id !== data.id) {
      path.unshift(id);
      const node = index.get(id);
      if (!node) break;
      const parent = [...index.values()].find((p) =>
        p.children?.some((c) => c.id === id),
      );
      id = parent?.id ?? null;
    }
    return path;
  }, [data, focusId]);

  const clearTipTimer = () => {
    if (tipTimer.current !== null) {
      window.clearTimeout(tipTimer.current);
      tipTimer.current = null;
    }
  };

  const handlePointerEnter = useCallback(
    (arc: SunburstArcDatum, e: PointerEvent<SVGPathElement>) => {
      setHoveredId(arc.id);
      const svg = plotRef.current;
      if (!svg) return;
      const rect = svg.getBoundingClientRect();
      const next = {
        arc,
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
      setTip(next);
      clearTipTimer();
      setTipVisible(false);
      tipTimer.current = window.setTimeout(() => {
        setTipVisible(true);
        tipTimer.current = null;
      }, MOTION.fast);
    },
    [],
  );

  const handlePointerMove = useCallback(
    (arc: SunburstArcDatum, e: PointerEvent<SVGPathElement>) => {
      const svg = plotRef.current;
      if (!svg) return;
      const rect = svg.getBoundingClientRect();
      setTip({
        arc,
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    },
    [],
  );

  const handlePointerLeave = useCallback(() => {
    setHoveredId(null);
    clearTipTimer();
    setTipVisible(false);
    setTip(null);
  }, []);

  useEffect(() => () => clearTipTimer(), []);

  const handleActivate = useCallback(
    (arc: SunburstArcDatum) => {
      if (arc.childrenIds.length > 0) onFocusChange(arc.id);
      onArcActivate(arc);
    },
    [onArcActivate, onFocusChange],
  );

  const handleArcClick = useCallback(
    (arc: SunburstArcDatum) => {
      if (arc.childrenIds.length > 0) {
        onFocusChange(arc.id);
      }
      onArcActivate(arc);
    },
    [onArcActivate, onFocusChange],
  );

  const goHome = useCallback(() => onFocusChange(data.id), [data.id, onFocusChange]);
  const goBack = useCallback(() => {
    if (focusStack.length <= 1) {
      goHome();
      return;
    }
    onFocusChange(focusStack[focusStack.length - 2]!);
  }, [focusStack, goHome, onFocusChange]);

  const { activeId, setActiveId, handleKeyDown } = useSunburstKeyboard({
    arcs,
    focusId,
    rootId: data.id,
    containerRef: treeRef,
    onFocusChange,
    onActivate: handleActivate,
    onEscape: goBack,
    onHome: goHome,
  });

  return (
    <div className={cn('relative flex w-full flex-col', className)}>
      <div
        ref={treeRef}
        role="tree"
        aria-label="Transaction hierarchy sunburst"
        tabIndex={0}
        className="relative w-full outline-none"
        onKeyDown={handleKeyDown}
      >
        <div
          ref={hostRef}
          className="relative mx-auto flex min-h-[480px] w-full items-center justify-center py-2"
        >
          <div className="relative" style={{ width: size, height: size }}>
            <svg
              ref={plotRef}
              width={size}
              height={size}
              viewBox={`${-size / 2} ${-size / 2} ${size} ${size}`}
              className="overflow-visible"
              onPointerLeave={handlePointerLeave}
            >
              <g>
                {arcs.map((arc) => {
                  const isHover = hoveredId === arc.id;
                  const isSelected = selectedId === arc.id && byId.has(selectedId);
                  const isActive = activeId === arc.id;
                  const dimmed = Boolean(
                    hoveredId && !isLinkedToHover(arc, hoveredId, byId),
                  );
                  return (
                    <SunburstArc
                      key={arc.id}
                      arc={arc}
                      emphasized={isHover || isSelected || isActive}
                      dimmed={dimmed}
                      active={isActive}
                      onPointerEnter={(a, e) => {
                        setActiveId(a.id);
                        handlePointerEnter(a, e);
                      }}
                      onPointerMove={handlePointerMove}
                      onPointerLeave={handlePointerLeave}
                      onClick={handleArcClick}
                    />
                  );
                })}
              </g>

              <g pointerEvents="none">
                {arcs.map((arc) => {
                  if (!arc.showLabel) return null;
                  const x = Math.cos(arc.midAngle) * arc.midRadius;
                  const y = Math.sin(arc.midAngle) * arc.midRadius;
                  const dimmed = Boolean(
                    hoveredId && !isLinkedToHover(arc, hoveredId, byId),
                  );
                  return (
                    <text
                      key={`label-${arc.id}`}
                      x={x}
                      y={y}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fill="#0f172a"
                      fontSize={drilled ? 13 : 11}
                      fontWeight={700}
                      className={cn(dimmed ? 'opacity-40' : 'opacity-100')}
                    >
                      <tspan x={x} dy="-0.35em">
                        {arc.name.length > 16 ? `${arc.name.slice(0, 15)}…` : arc.name}
                      </tspan>
                      <tspan x={x} dy="1.2em" fontSize={10} fontWeight={700}>
                        {formatPercent(arc.shareOfFocus)}
                      </tspan>
                    </text>
                  );
                })}
                <circle
                  r={centerR - 2}
                  fill="var(--bg-surface)"
                  stroke="var(--border-hairline)"
                  strokeWidth={1}
                />
              </g>
            </svg>

            <SunburstCenter label={centerLabel} value={centerValue} hole={centerR} />
            <SunburstTooltip
              arc={tip?.arc ?? null}
              x={tip?.x ?? 0}
              y={tip?.y ?? 0}
              visible={tipVisible}
            />
          </div>

          <SunburstControls
            className="absolute right-2 top-1/2 -translate-y-1/2"
            onHome={goHome}
            onBack={goBack}
            onReset={() => {
              goHome();
              setRadius(BASE_RADIUS);
            }}
            onZoomIn={() => setRadius((r) => Math.min(MAX_RADIUS, r + ZOOM_STEP))}
            onZoomOut={() => setRadius((r) => Math.max(MIN_RADIUS, r - ZOOM_STEP))}
            canGoBack={drilled}
          />
        </div>
      </div>
    </div>
  );
}
