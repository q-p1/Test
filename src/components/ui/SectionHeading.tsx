import type { ReactNode } from 'react';
import { Icon } from './Icon';
import { Reveal } from './Reveal';
import { cn } from '../../lib/utils';

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = 'start',
  action,
  className,
}: {
  eyebrow?: string;
  title: ReactNode;
  description?: string;
  align?: 'start' | 'center';
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex flex-col gap-6 md:flex-row md:items-end md:justify-between',
        align === 'center' && 'md:flex-col md:items-center text-center',
        className,
      )}
    >
      <Reveal className="max-w-2xl">
        {eyebrow && (
          <span className="eyebrow mb-4">
            <Icon name="sparkle" width={16} height={16} />
            {eyebrow}
          </span>
        )}
        <h2 className="text-display-md md:text-display-lg text-balance">{title}</h2>
        {description && (
          <p className="mt-4 text-lg leading-relaxed text-ink-500">{description}</p>
        )}
      </Reveal>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
