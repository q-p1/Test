import { Link } from 'react-router-dom';
import { cn } from '../../lib/utils';

/** Hope wordmark: Arabic "هوب" with a subtle accent dot, plus Latin "HOPE". */
export function Logo({ className, tone = 'ink' }: { className?: string; tone?: 'ink' | 'light' }) {
  return (
    <Link
      to="/"
      aria-label="هوب — الصفحة الرئيسية"
      className={cn('group inline-flex items-center gap-2.5', className)}
    >
      <span className="relative grid h-9 w-9 place-items-center rounded-xl bg-accent-gradient shadow-glow">
        <span className="font-display text-lg font-black leading-none text-white">ه</span>
        <span className="absolute -end-0.5 -top-0.5 h-2 w-2 rounded-full bg-gold ring-2 ring-paper" />
      </span>
      <span className="flex flex-col leading-none">
        <span
          className={cn(
            'font-display text-xl font-extrabold tracking-tight',
            tone === 'light' ? 'text-white' : 'text-ink-950',
          )}
        >
          هوب
        </span>
        <span
          className={cn(
            'text-[9px] font-semibold uppercase tracking-[0.35em]',
            tone === 'light' ? 'text-white/50' : 'text-ink-400',
          )}
        >
          HOPE
        </span>
      </span>
    </Link>
  );
}
