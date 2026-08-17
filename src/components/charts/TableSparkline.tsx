import { Sparkline } from '@/components/data/Sparkline';
import { cn } from '@/lib/cn';

export interface TableSparklineProps {
  data: number[];
  color: string;
  className?: string;
}

/** Dense 72×24 inline sparkline for table cells — never liquid-filtered. */
export function TableSparkline({ data, color, className }: TableSparklineProps) {
  return (
    <Sparkline
      data={data}
      color={color}
      width={72}
      height={24}
      className={cn('pointer-events-none', className)}
    />
  );
}
