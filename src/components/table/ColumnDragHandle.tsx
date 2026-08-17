import { useDraggable, useDroppable } from '@dnd-kit/core';
import { type ReactNode } from 'react';
import { cn } from '@/lib/cn';

export function ColumnDragHandle({
  id,
  disabled,
  children,
}: {
  id: string;
  disabled?: boolean;
  children: ReactNode;
}) {
  const { attributes, listeners, setNodeRef: setDragRef, isDragging } = useDraggable({
    id,
    disabled,
  });
  const { setNodeRef: setDropRef, isOver } = useDroppable({ id, disabled });

  return (
    <div
      ref={(node) => {
        setDragRef(node);
        setDropRef(node);
      }}
      className={cn(
        'rounded px-1',
        !disabled && 'cursor-move',
        isOver && 'bg-raised',
        isDragging && 'opacity-60',
      )}
      {...(disabled ? {} : { ...listeners, ...attributes })}
    >
      {children}
    </div>
  );
}
