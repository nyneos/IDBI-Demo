import type { LucideIcon } from 'lucide-react';
import { Construction } from 'lucide-react';
import { EmptyState } from '@/components/ui/EmptyState';

export function ComingSoon({ title, icon: Icon = Construction }: { title: string; icon?: LucideIcon }) {
  return (
    <div data-density="dense" className="flex min-h-[28rem] flex-col justify-center">
      <EmptyState
        icon={Icon}
        message={`${title} is coming soon. This nav item is real; the screen has not been specced yet, so nothing here is fabricated.`}
      />
    </div>
  );
}
