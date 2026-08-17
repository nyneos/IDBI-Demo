import { ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import { IconButton } from '@/components/ui/IconButton';

export interface MapZoomControlsProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
}

export function MapZoomControls({ onZoomIn, onZoomOut, onReset }: MapZoomControlsProps) {
  return (
    <div className="glass absolute bottom-3 left-3 z-10 flex flex-col gap-1 p-1">
      <IconButton aria-label="Zoom in" className="h-8 w-8" onClick={onZoomIn}>
        <ZoomIn size={14} strokeWidth={1.75} />
      </IconButton>
      <IconButton aria-label="Zoom out" className="h-8 w-8" onClick={onZoomOut}>
        <ZoomOut size={14} strokeWidth={1.75} />
      </IconButton>
      <IconButton aria-label="Reset map" className="h-8 w-8" onClick={onReset}>
        <RotateCcw size={14} strokeWidth={1.75} />
      </IconButton>
    </div>
  );
}
