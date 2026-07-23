import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import gsap from 'gsap';
import { products } from '../../lib/data';
import { formatSAR, toArabicDigits } from '../../lib/utils';
import { Button } from '../ui/Button';
import { Icon } from '../ui/Icon';
import { ProductVisual } from '../ui/ProductVisual';
import { Magnetic } from '../ui/Magnetic';
import { useReducedMotion } from '../../lib/useMediaQuery';

const stats = [
  { value: '٥٠ ألف+', label: 'عميل سعيد' },
  { value: '١٠٠٪', label: 'منتجات أصلية' },
  { value: '٤.٩', label: 'تقييم المتجر' },
];

const heroProduct = products.find((p) => p.slug === 'apple-iphone-16-pro')!;
const heroProduct2 = products.find((p) => p.slug === 'awei-t85-anc')!;

export function Hero() {
  const rootRef = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();

  // Parallax on the floating layers
  useEffect(() => {
    if (reduce) return;
    const root = rootRef.current;
    if (!root) return;

    const ctx = gsap.context(() => {
      const onMove = (e: MouseEvent) => {
        const cx = (e.clientX / window.innerWidth - 0.5) * 2;
        const cy = (e.clientY / window.innerHeight - 0.5) * 2;
        gsap.to('[data-parallax="1"]', { x: cx * 18, y: cy * 18, duration: 0.8, ease: 'power2.out' });
        gsap.to('[data-parallax="2"]', { x: cx * -26, y: cy * -20, duration: 0.9, ease: 'power2.out' });
        gsap.to('[data-parallax="glow"]', { x: cx * 40, y: cy * 30, duration: 1, ease: 'power2.out' });
      };
      window.addEventListener('mousemove', onMove);
      return () => window.removeEventListener('mousemove', onMove);
    }, root);

    return () => ctx.revert();
  }, [reduce]);

  const container = {
    hidden: {},
    show: { transition: { staggerChildren: 0.09, delayChildren: 0.1 } },
  };
  const item = {
    hidden: { opacity: 0, y: 24 },
    show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] } },
  };

  return (
    <section
      ref={rootRef}
      className="relative overflow-hidden bg-paper-glow pb-16 pt-8 sm:pb-24"
      aria-label="البطل"
    >
      {/* Background mesh + glow */}
      <div className="pointer-events-none absolute inset-0 bg-mesh opacity-70" />
      <div
        data-parallax="glow"
        className="pointer-events-none absolute -top-32 start-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full opacity-50 blur-3xl"
        style={{ background: 'radial-gradient(circle, rgba(124,58,237,0.35), transparent 65%)' }}
      />

      <div className="container-content relative">
        <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-8">
          {/* Copy */}
          <motion.div variants={container} initial="hidden" animate="show" className="relative z-10">
            <motion.div variants={item}>
              <span className="inline-flex items-center gap-2 rounded-full border border-accent-200 bg-white/70 px-4 py-2 text-sm font-medium text-accent-700 backdrop-blur">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-accent-500" />
                </span>
                علامة سعودية للتقنية الأصلية
              </span>
            </motion.div>

            <motion.h1
              variants={item}
              className="mt-6 text-display-xl md:text-display-2xl text-balance text-ink-950"
            >
              كل ما هو <span className="text-gradient">أصلي</span>
              <br />
              في عالم التقنية
            </motion.h1>

            <motion.p
              variants={item}
              className="mt-6 max-w-lg text-lg leading-relaxed text-ink-500"
            >
              اكتشف أحدث الأجهزة والملحقات من أفضل العلامات العالمية، بجودة مضمونة وشحن سريع
              ودعم فني مباشر — تجربة تسوّق تليق بك.
            </motion.p>

            <motion.div variants={item} className="mt-8 flex flex-wrap items-center gap-3">
              <Magnetic>
                <Button to="/shop" size="lg">
                  تسوّق الآن
                  <Icon name="arrow-left" width={20} height={20} />
                </Button>
              </Magnetic>
              <Button to="/shop?filter=deals" size="lg" variant="ghost">
                استكشف العروض
              </Button>
            </motion.div>

            {/* Stats */}
            <motion.dl
              variants={item}
              className="mt-12 flex gap-8 border-t hairline pt-8"
            >
              {stats.map((s) => (
                <div key={s.label}>
                  <dt className="tnum text-2xl font-extrabold text-ink-950 sm:text-3xl">{s.value}</dt>
                  <dd className="mt-1 text-xs text-ink-500 sm:text-sm">{s.label}</dd>
                </div>
              ))}
            </motion.dl>
          </motion.div>

          {/* Visual composition */}
          <div className="relative z-0 h-[420px] sm:h-[520px] lg:h-[600px]">
            {/* Main product card */}
            <motion.div
              data-parallax="1"
              initial={{ opacity: 0, scale: 0.94, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.9, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="absolute end-0 top-6 w-[68%] max-w-sm"
            >
              <Link to={`/product/${heroProduct.slug}`} className="block">
                <div className="overflow-hidden rounded-4xl bg-white p-3 shadow-lift ring-1 ring-ink-950/5">
                  <ProductVisual
                    colorway={heroProduct.colorway}
                    glyph={heroProduct.glyph}
                    brand={heroProduct.brand}
                    className="aspect-[4/5] w-full rounded-3xl"
                  />
                  <div className="flex items-center justify-between px-3 py-3">
                    <div>
                      <p className="text-sm font-semibold text-ink-950">آيفون 16 برو</p>
                      <p className="tnum text-xs text-ink-500">{formatSAR(heroProduct.price)}</p>
                    </div>
                    <span className="rounded-full bg-ink-950 px-3 py-1.5 text-[11px] font-semibold text-white">
                      تقسيط
                    </span>
                  </div>
                </div>
              </Link>
            </motion.div>

            {/* Secondary floating card */}
            <motion.div
              data-parallax="2"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, delay: 0.45, ease: [0.16, 1, 0.3, 1] }}
              className="absolute bottom-4 start-0 w-[52%] max-w-[220px]"
            >
              <Link to={`/product/${heroProduct2.slug}`} className="block">
                <div className="overflow-hidden rounded-3xl bg-white p-2.5 shadow-lift ring-1 ring-ink-950/5">
                  <ProductVisual
                    colorway={heroProduct2.colorway}
                    glyph={heroProduct2.glyph}
                    className="aspect-square w-full rounded-2xl"
                  />
                  <div className="px-2 py-2">
                    <p className="text-xs font-semibold text-ink-950">سماعة Awei T85</p>
                    <p className="tnum text-[11px] text-accent-600">{formatSAR(heroProduct2.price)}</p>
                  </div>
                </div>
              </Link>
            </motion.div>

            {/* Floating glass badges */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.7 }}
              className="absolute end-4 bottom-16 flex items-center gap-2 rounded-2xl glass px-4 py-3 shadow-card"
            >
              <span className="grid h-9 w-9 place-items-center rounded-full bg-success/12 text-success">
                <Icon name="truck" width={18} height={18} />
              </span>
              <div>
                <p className="text-xs font-bold text-ink-950">شحن سريع</p>
                <p className="text-[10px] text-ink-500">خلال ٢٤ ساعة</p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.85 }}
              className="absolute start-6 top-2 flex items-center gap-2 rounded-2xl glass px-4 py-3 shadow-card"
            >
              <span className="grid h-9 w-9 place-items-center rounded-full bg-accent-500/12 text-accent-600">
                <Icon name="shield-check" width={18} height={18} />
              </span>
              <div>
                <p className="text-xs font-bold text-ink-950">ضمان أصلي</p>
                <p className="tnum text-[10px] text-ink-500">{toArabicDigits(50)}+ ألف عميل</p>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* scroll hint */}
      {!reduce && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="absolute inset-x-0 bottom-4 mx-auto hidden w-max flex-col items-center gap-1.5 text-ink-400 lg:flex"
        >
          <span className="text-[11px] tracking-widest">مرّر للأسفل</span>
          <span className="h-8 w-5 rounded-full border border-ink-300 p-1">
            <motion.span
              animate={{ y: [0, 10, 0] }}
              transition={{ duration: 1.6, repeat: Infinity }}
              className="block h-1.5 w-full rounded-full bg-ink-400"
            />
          </span>
        </motion.div>
      )}
    </section>
  );
}
