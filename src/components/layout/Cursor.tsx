import { useEffect, useRef, useState } from 'react';
import { useIsDesktop, useReducedMotion } from '../../lib/useMediaQuery';

/**
 * Subtle desktop cursor: a lagging ring that grows over interactive elements.
 * Never rendered on touch devices or under reduced-motion.
 */
export function Cursor() {
  const isDesktop = useIsDesktop();
  const reduce = useReducedMotion();
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(false);
  const [hidden, setHidden] = useState(true);

  useEffect(() => {
    if (!isDesktop || reduce) return;
    document.documentElement.style.cursor = 'none';

    let rx = window.innerWidth / 2;
    let ry = window.innerHeight / 2;
    let x = rx;
    let y = ry;
    let raf = 0;

    const onMove = (e: MouseEvent) => {
      x = e.clientX;
      y = e.clientY;
      setHidden(false);
      if (dotRef.current) {
        dotRef.current.style.transform = `translate(${x}px, ${y}px)`;
      }
      const t = e.target as HTMLElement;
      setActive(!!t.closest('a, button, [role="button"], input, [data-cursor="hover"]'));
    };

    const loop = () => {
      rx += (x - rx) * 0.18;
      ry += (y - ry) * 0.18;
      if (ringRef.current) {
        ringRef.current.style.transform = `translate(${rx}px, ${ry}px)`;
      }
      raf = requestAnimationFrame(loop);
    };

    const onLeave = () => setHidden(true);

    window.addEventListener('mousemove', onMove);
    document.addEventListener('mouseleave', onLeave);
    raf = requestAnimationFrame(loop);

    return () => {
      document.documentElement.style.cursor = '';
      window.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseleave', onLeave);
      cancelAnimationFrame(raf);
    };
  }, [isDesktop, reduce]);

  if (!isDesktop || reduce) return null;

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-[9999]" style={{ opacity: hidden ? 0 : 1 }}>
      <div
        ref={dotRef}
        className="absolute -left-1 -top-1 h-2 w-2 rounded-full bg-accent-500"
        style={{ transition: 'width .2s, height .2s' }}
      />
      <div
        ref={ringRef}
        className="absolute rounded-full border border-ink-950/40"
        style={{
          left: active ? -24 : -16,
          top: active ? -24 : -16,
          width: active ? 48 : 32,
          height: active ? 48 : 32,
          transition: 'width .25s ease, height .25s ease, left .25s ease, top .25s ease, border-color .25s',
          borderColor: active ? 'rgba(79,70,229,0.6)' : 'rgba(11,11,15,0.35)',
        }}
      />
    </div>
  );
}
