import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Panel } from '@/components/ui/Panel';
import { PanelHeader } from '@/components/ui/PanelHeader';
import {
  ActionableSuggestionCard,
  type ActionableSuggestionCardProps,
} from './ActionableSuggestionCard';

export interface InsightItem
  extends Omit<ActionableSuggestionCardProps, 'icon' | 'index'> {
  id: string | number;
  icon: LucideIcon;
}

export interface InsightStripProps {
  title?: string;
  items: InsightItem[];
  onCreateTask?: (item: InsightItem) => void;
  className?: string;
}

export function InsightStrip({
  title = 'AI Actionable Suggestions',
  items,
  onCreateTask,
  className,
}: InsightStripProps) {
  return (
    <Panel className={cn('flex flex-col', className)}>
      <PanelHeader title={title} />
      <ul className="grid grid-cols-1 gap-x-8 gap-y-4 md:grid-cols-2">
        {items.map((item) => (
          <ActionableSuggestionCard
            key={item.id}
            {...item}
            onCreateTask={onCreateTask ? () => onCreateTask(item) : item.onCreateTask}
          />
        ))}
      </ul>
    </Panel>
  );
}
