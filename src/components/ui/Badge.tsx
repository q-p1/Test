import type { ReactNode } from 'react';
import { cn } from '../../lib/utils';

type Tone = 'accent' | 'gold' | 'ink' | 'success' | 'glass';

const tones: Record<Tone, string> = {
  accent: 'bg-accent-500 text-white',
  gold: 'bg-gold text-ink-950',
  ink: 'bg-ink-950 text-white',
  success: 'bg-success text-white',
  glass: 'glass text-ink-900',
};

export function Badge({
  children,
  tone = 'accent',
  className,
}: {
  children: ReactNode;
  tone?: Tone;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold leading-none',
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
