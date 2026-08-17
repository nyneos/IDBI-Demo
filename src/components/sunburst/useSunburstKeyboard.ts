import { useCallback, useEffect, useState, type KeyboardEvent, type RefObject } from 'react';
import type { SunburstArcDatum } from './useSunburstLayout';

export interface UseSunburstKeyboardArgs {
  arcs: SunburstArcDatum[];
  focusId: string;
  rootId: string;
  containerRef: RefObject<HTMLElement | null>;
  onFocusChange: (id: string) => void;
  onActivate: (arc: SunburstArcDatum) => void;
  onEscape: () => void;
  onHome: () => void;
}

export function useSunburstKeyboard({
  arcs,
  focusId,
  rootId,
  containerRef,
  onFocusChange,
  onActivate,
  onEscape,
  onHome,
}: UseSunburstKeyboardArgs) {
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    if (activeId && !arcs.some((a) => a.id === activeId)) {
      setActiveId(arcs[0]?.id ?? null);
    }
  }, [arcs, activeId]);

  const siblingsOf = useCallback(
    (id: string | null): SunburstArcDatum[] => {
      if (!id) {
        return arcs.filter((a) => a.depth === 1);
      }
      const arc = arcs.find((a) => a.id === id);
      if (!arc) return arcs.filter((a) => a.depth === 1);
      return arcs.filter((a) => a.parentId === arc.parentId && a.depth === arc.depth);
    },
    [arcs],
  );

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      const current = activeId ?? arcs.find((a) => a.depth === 1)?.id ?? null;
      const siblings = siblingsOf(current);
      const idx = current ? siblings.findIndex((s) => s.id === current) : -1;

      switch (e.key) {
        case 'ArrowRight':
        case 'ArrowDown': {
          e.preventDefault();
          if (siblings.length === 0) return;
          const next = siblings[(idx + 1 + siblings.length) % siblings.length];
          if (next) {
            setActiveId(next.id);
          }
          break;
        }
        case 'ArrowLeft': {
          e.preventDefault();
          if (siblings.length === 0) return;
          const prev = siblings[(idx - 1 + siblings.length) % siblings.length];
          if (prev) {
            setActiveId(prev.id);
          }
          break;
        }
        case 'ArrowUp': {
          e.preventDefault();
          const arc = arcs.find((a) => a.id === current);
          if (arc?.parentId && arc.parentId !== focusId) {
            setActiveId(arc.parentId);
          } else if (focusId !== rootId) {
            onEscape();
          }
          break;
        }
        case 'Enter': {
          e.preventDefault();
          const arc = arcs.find((a) => a.id === current);
          if (arc) onActivate(arc);
          break;
        }
        case ' ': {
          e.preventDefault();
          const arc = arcs.find((a) => a.id === current);
          if (arc?.childrenIds.length) {
            onFocusChange(arc.id);
            setActiveId(arc.childrenIds[0] ?? arc.id);
          } else if (arc) {
            onActivate(arc);
          }
          break;
        }
        case 'Escape':
        case 'Backspace': {
          e.preventDefault();
          onEscape();
          break;
        }
        case 'Home': {
          e.preventDefault();
          onHome();
          setActiveId(null);
          break;
        }
        default:
          break;
      }
    },
    [
      activeId,
      arcs,
      focusId,
      onActivate,
      onEscape,
      onFocusChange,
      onHome,
      rootId,
      siblingsOf,
    ],
  );

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onFocus = () => {
      if (!activeId) {
        setActiveId(arcs.find((a) => a.depth === 1)?.id ?? null);
      }
    };
    el.addEventListener('focus', onFocus);
    return () => el.removeEventListener('focus', onFocus);
  }, [activeId, arcs, containerRef]);

  return { activeId, setActiveId, handleKeyDown };
}
