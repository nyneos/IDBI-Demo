import { Home, Minus, Plus, RotateCcw, Undo2 } from 'lucide-react';
import { IconButton } from '@/components/ui/IconButton';
import { cn } from '@/lib/cn';

export interface SunburstControlsProps {
  onHome: () => void;
  onBack: () => void;
  onReset: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  canGoBack: boolean;
  className?: string;
}

export function SunburstControls({
  onHome,
  onBack,
  onReset,
  onZoomIn,
  onZoomOut,
  canGoBack,
  className,
}: SunburstControlsProps) {
  return (
    <div
      className={cn(
        'flex flex-col gap-1 rounded-lg border border-hairline bg-surface p-1 shadow-sm',
        className,
      )}
    >
      <IconButton aria-label="Show all IDBI transactions" onClick={onHome}>
        <Home size={16} strokeWidth={1.75} aria-hidden />
      </IconButton>
      <IconButton aria-label="Go back one level" onClick={onBack} disabled={!canGoBack}>
        <Undo2 size={16} strokeWidth={1.75} aria-hidden />
      </IconButton>
      <IconButton aria-label="Reset view" onClick={onReset}>
        <RotateCcw size={16} strokeWidth={1.75} aria-hidden />
      </IconButton>
      <div className="my-1 h-px bg-hairline" aria-hidden />
      <IconButton aria-label="Zoom in" onClick={onZoomIn}>
        <Plus size={16} strokeWidth={1.75} aria-hidden />
      </IconButton>
      <IconButton aria-label="Zoom out" onClick={onZoomOut}>
        <Minus size={16} strokeWidth={1.75} aria-hidden />
      </IconButton>
    </div>
  );
}
