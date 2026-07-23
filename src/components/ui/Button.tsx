import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { cn } from '../../lib/utils';

type Variant = 'primary' | 'secondary' | 'ghost' | 'dark';
type Size = 'sm' | 'md' | 'lg';

const base =
  'group relative inline-flex items-center justify-center gap-2 font-medium whitespace-nowrap rounded-full transition-all duration-300 ease-out-expo disabled:opacity-50 disabled:pointer-events-none select-none';

const variants: Record<Variant, string> = {
  primary:
    'bg-accent-500 text-white shadow-glow hover:bg-accent-600 hover:-translate-y-0.5 active:translate-y-0',
  secondary:
    'bg-ink-950 text-white hover:bg-ink-800 hover:-translate-y-0.5 active:translate-y-0',
  ghost:
    'bg-white/60 text-ink-900 border border-ink-950/10 hover:bg-white hover:border-ink-950/20 hover:-translate-y-0.5',
  dark: 'bg-white/10 text-white border border-white/15 hover:bg-white/20 backdrop-blur',
};

const sizes: Record<Size, string> = {
  sm: 'h-10 px-5 text-sm',
  md: 'h-12 px-7 text-[15px]',
  lg: 'h-14 px-9 text-base',
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  to?: string;
  href?: string;
  children: ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', to, href, className, children, ...props },
  ref,
) {
  const classes = cn(base, variants[variant], sizes[size], className);

  if (to) {
    return (
      <Link to={to} className={classes}>
        {children}
      </Link>
    );
  }
  if (href) {
    return (
      <a href={href} className={classes}>
        {children}
      </a>
    );
  }
  return (
    <button ref={ref} className={classes} {...props}>
      {children}
    </button>
  );
});
