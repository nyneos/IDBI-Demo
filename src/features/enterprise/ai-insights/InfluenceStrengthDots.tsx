export function InfluenceStrengthDots({ influence, max = 5 }: { influence: number; max?: number }) {
  const filled = Math.max(1, Math.min(max, Math.round(influence * 20)));
  return (
    <span className="inline-flex gap-0.5" aria-label={`Strength ${filled} of ${max}`}>
      {Array.from({ length: max }, (_, i) => (
        <span
          key={i}
          className={`inline-block h-2 w-2 rounded-full ${i < filled ? 'bg-brand' : 'bg-hairline'}`}
        />
      ))}
    </span>
  );
}
