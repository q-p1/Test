import { useEffect, useRef, type ElementType, type ReactNode } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

interface RevealProps {
  children: ReactNode;
  as?: ElementType;
  className?: string;
  /** Stagger children instead of animating the container */
  stagger?: boolean;
  delay?: number;
  y?: number;
  /** disable movement, fade only */
  fade?: boolean;
}

/**
 * Scroll-triggered reveal built on GSAP ScrollTrigger.
 * Fully bypassed when the user prefers reduced motion.
 */
export function Reveal({
  children,
  as: Tag = 'div',
  className,
  stagger = false,
  delay = 0,
  y = 28,
  fade = false,
}: RevealProps) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) {
      gsap.set(stagger ? el.children : el, { opacity: 1, y: 0 });
      return;
    }

    const ctx = gsap.context(() => {
      const targets = stagger ? Array.from(el.children) : el;
      gsap.set(targets, { opacity: 0, y: fade ? 0 : y });
      gsap.to(targets, {
        opacity: 1,
        y: 0,
        duration: 0.9,
        delay,
        ease: 'power3.out',
        stagger: stagger ? 0.08 : 0,
        scrollTrigger: {
          trigger: el,
          start: 'top 85%',
          toggleActions: 'play none none none',
        },
      });
    }, el);

    return () => ctx.revert();
  }, [stagger, delay, y, fade]);

  return (
    <Tag ref={ref as never} className={className}>
      {children}
    </Tag>
  );
}
