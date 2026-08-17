import { cn } from '@/lib/cn';

export interface SkeletonProps {
  className?: string;
  rounded?: 'md' | 'lg' | 'xl' | 'full';
}

const roundedMap = {
  md: 'rounded-md',
  lg: 'rounded-lg',
  xl: 'rounded-xl',
  full: 'rounded-full',
} as const;

export function Skeleton({ className, rounded = 'md' }: SkeletonProps) {
  return (
    <div
      aria-hidden
      className={cn(
        'animate-shimmer bg-raised',
        roundedMap[rounded],
        className,
      )}
    />
  );
}
