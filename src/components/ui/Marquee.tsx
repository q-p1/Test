import type { ReactNode } from 'react';
import { cn } from '../../lib/utils';

/**
 * Seamless infinite marquee. Duplicates content for a continuous loop.
 * Pauses on hover; frozen under reduced motion via CSS.
 */
export function Marquee({
  children,
  className,
  reverse = false,
}: {
  children: ReactNode;
  className?: string;
  reverse?: boolean;
}) {
  return (
    <div className={cn('group flex overflow-hidden mask-fade-x', className)}>
      {[0, 1].map((i) => (
        <div
          key={i}
          aria-hidden={i === 1}
          className={cn(
            'flex shrink-0 items-center gap-12 pe-12 group-hover:[animation-play-state:paused]',
            reverse ? 'animate-marquee-rtl' : 'animate-marquee',
          )}
        >
          {children}
        </div>
      ))}
    </div>
  );
}
