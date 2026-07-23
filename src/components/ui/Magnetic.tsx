import { useRef, type ReactNode } from 'react';
import { useIsDesktop, useReducedMotion } from '../../lib/useMediaQuery';

/** Subtle magnetic pull toward the cursor (desktop, motion-safe). */
export function Magnetic({
  children,
  strength = 0.35,
  className,
}: {
  children: ReactNode;
  strength?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isDesktop = useIsDesktop();
  const reduce = useReducedMotion();
  const enabled = isDesktop && !reduce;

  const handleMove = (e: React.MouseEvent) => {
    if (!enabled || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const x = e.clientX - (rect.left + rect.width / 2);
    const y = e.clientY - (rect.top + rect.height / 2);
    ref.current.style.transform = `translate(${x * strength}px, ${y * strength}px)`;
  };

  const reset = () => {
    if (ref.current) ref.current.style.transform = 'translate(0,0)';
  };

  return (
    <div
      onMouseMove={handleMove}
      onMouseLeave={reset}
      className={className}
      style={{ display: 'inline-flex' }}
    >
      <div
        ref={ref}
        style={{ transition: 'transform 0.4s cubic-bezier(0.16,1,0.3,1)' }}
      >
        {children}
      </div>
    </div>
  );
}
