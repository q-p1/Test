import { Icon } from './Icon';
import { cn } from '../../lib/utils';
import { toArabicDigits } from '../../lib/utils';

export function StarRating({
  rating,
  reviews,
  size = 14,
  showCount = true,
  className,
}: {
  rating: number;
  reviews?: number;
  size?: number;
  showCount?: boolean;
  className?: string;
}) {
  const full = Math.round(rating);
  return (
    <div
      className={cn('flex items-center gap-1.5', className)}
      aria-label={`التقييم ${rating} من ٥`}
    >
      <div className="flex items-center gap-0.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Icon
            key={i}
            name="star"
            width={size}
            height={size}
            className={i < full ? 'text-gold fill-gold' : 'text-ink-200 fill-ink-200'}
            style={{ fill: 'currentColor' }}
          />
        ))}
      </div>
      <span className="tnum text-xs font-medium text-ink-600">
        {toArabicDigits(rating.toFixed(1))}
        {showCount && reviews != null && (
          <span className="text-ink-400"> ({toArabicDigits(reviews)})</span>
        )}
      </span>
    </div>
  );
}
