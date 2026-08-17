import { MessageSquare, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/cn';
import { IconButton } from '@/components/ui/IconButton';
import { SectionSubhead } from '@/components/ui/SectionSubhead';
import { StatusPill, type StatusTone } from '@/components/ui/StatusPill';
import { StarRating } from './StarRating';

export interface EntityHeaderProps {
  name: string;
  icon?: LucideIcon;
  tint: string;
  status: string;
  statusTone?: StatusTone;
  meta: Array<{ label: string; value: string }>;
  rating: number;
  ratingCaption?: string;
  onContact?: () => void;
  className?: string;
}

export function EntityHeader({
  name,
  icon: Icon,
  tint,
  status,
  statusTone = 'success',
  meta,
  rating,
  ratingCaption = 'Based on past 90 days performance',
  onContact,
  className,
}: EntityHeaderProps) {
  const tileColor = tint;

  return (
    <header
      className={cn(
        'glass flex flex-wrap items-center gap-4 rounded-2xl p-5',
        className,
      )}
    >
      <div className="flex min-w-0 flex-1 items-start gap-3">
        <div
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
          style={{
            backgroundColor: `color-mix(in srgb, ${tileColor} 18%, transparent)`,
            color: tileColor,
            boxShadow: undefined,
          }}
          aria-hidden
        >
          {Icon ? <Icon size={22} strokeWidth={1.75} /> : null}
        </div>

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="truncate text-2xl font-semibold text-content-primary">
              {name}
            </h2>
            <StatusPill label={status} tone={statusTone} />
          </div>
          <p className="mt-1 truncate text-xs text-content-tertiary">
            {meta.map((item, i) => (
              <span key={item.label}>
                {i > 0 ? <span className="mx-1.5" aria-hidden>·</span> : null}
                <span>
                  {item.label}: {item.value}
                </span>
              </span>
            ))}
          </p>
        </div>
      </div>

      <div className="flex shrink-0 flex-col items-end gap-1">
        <SectionSubhead className="pt-0">Overall Rating</SectionSubhead>
        <div className="flex items-center gap-2">
          <StarRating value={rating} />
          <span className="text-base font-bold tabular text-content-primary">
            {rating.toFixed(1)} / 5
          </span>
        </div>
        <span className="text-xs text-content-tertiary">{ratingCaption}</span>
      </div>

      {onContact ? (
        <IconButton aria-label="Contact" onClick={onContact}>
          <MessageSquare size={18} strokeWidth={1.75} aria-hidden />
        </IconButton>
      ) : null}
    </header>
  );
}
