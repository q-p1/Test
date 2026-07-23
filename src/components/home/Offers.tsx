import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { products } from '../../lib/data';
import { formatSAR, toArabicDigits, discountPct } from '../../lib/utils';
import { Icon } from '../ui/Icon';
import { ProductVisual } from '../ui/ProductVisual';
import { Reveal } from '../ui/Reveal';

const offer = products.find((p) => p.slug === 'zendure-supertank-pro')!;

function useCountdown(hoursFromNow: number) {
  const [target] = useState(() => Date.now() + hoursFromNow * 3600 * 1000);
  const [left, setLeft] = useState(target - Date.now());
  useEffect(() => {
    const t = setInterval(() => setLeft(Math.max(0, target - Date.now())), 1000);
    return () => clearInterval(t);
  }, [target]);
  const totalSec = Math.floor(left / 1000);
  return {
    hours: Math.floor(totalSec / 3600),
    minutes: Math.floor((totalSec % 3600) / 60),
    seconds: totalSec % 60,
  };
}

function TimeBox({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <span className="tnum grid h-14 w-14 place-items-center rounded-2xl bg-white/10 text-2xl font-bold text-white ring-1 ring-white/15 backdrop-blur sm:h-16 sm:w-16">
        {toArabicDigits(String(value).padStart(2, '0'))}
      </span>
      <span className="mt-2 text-[11px] text-white/60">{label}</span>
    </div>
  );
}

export function Offers() {
  const { hours, minutes, seconds } = useCountdown(8);
  const pct = discountPct(offer.originalPrice!, offer.price);

  return (
    <section className="container-content py-20 sm:py-28">
      <Reveal>
        <div className="relative overflow-hidden rounded-4xl bg-ink-gradient p-6 sm:p-10 lg:p-14">
          {/* glow */}
          <div className="pointer-events-none absolute inset-0 bg-mesh opacity-60" />
          <div
            className="pointer-events-none absolute -end-20 -top-20 h-80 w-80 rounded-full opacity-40 blur-3xl"
            style={{ background: 'radial-gradient(circle, rgba(201,169,106,0.5), transparent 65%)' }}
          />

          <div className="relative grid items-center gap-10 lg:grid-cols-2">
            {/* Copy */}
            <div>
              <span className="inline-flex items-center gap-2 rounded-full bg-gold/15 px-4 py-2 text-sm font-semibold text-gold-soft">
                <Icon name="sparkle" width={16} height={16} />
                عرض اليوم
              </span>
              <h2 className="mt-5 text-display-md font-extrabold text-white sm:text-display-lg">
                وفّر <span className="text-gold">{toArabicDigits(pct)}٪</span>
                <br />
                على {offer.brand} سوبرتانك
              </h2>
              <p className="mt-4 max-w-md text-white/60">{offer.highlight}</p>

              <div className="mt-6 flex items-end gap-3">
                <span className="tnum text-3xl font-extrabold text-white">{formatSAR(offer.price)}</span>
                <span className="tnum mb-1 text-lg text-white/40 line-through">
                  {formatSAR(offer.originalPrice!)}
                </span>
              </div>

              {/* Countdown */}
              <div className="mt-8">
                <p className="mb-3 text-xs font-medium text-white/50">ينتهي العرض خلال</p>
                <div className="flex items-center gap-3">
                  <TimeBox value={hours} label="ساعة" />
                  <span className="pb-6 text-2xl font-bold text-white/40">:</span>
                  <TimeBox value={minutes} label="دقيقة" />
                  <span className="pb-6 text-2xl font-bold text-white/40">:</span>
                  <TimeBox value={seconds} label="ثانية" />
                </div>
              </div>

              <Link
                to={`/product/${offer.slug}`}
                className="mt-8 inline-flex h-14 items-center gap-2 rounded-full bg-white px-8 text-base font-semibold text-ink-950 shadow-lift transition hover:bg-gold"
              >
                اطلبه الآن
                <Icon name="arrow-left" width={20} height={20} />
              </Link>
            </div>

            {/* Visual */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="relative mx-auto w-full max-w-sm"
            >
              <span className="absolute -end-3 -top-3 z-10 grid h-20 w-20 place-items-center rounded-full bg-gold text-center text-ink-950 shadow-lift">
                <span className="flex flex-col leading-none">
                  <span className="tnum text-xl font-black">−{toArabicDigits(pct)}٪</span>
                  <span className="text-[10px] font-bold">خصم</span>
                </span>
              </span>
              <ProductVisual
                colorway={offer.colorway}
                glyph={offer.glyph}
                brand={offer.brand}
                className="aspect-square w-full rounded-4xl shadow-lift ring-1 ring-white/10"
              />
            </motion.div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
