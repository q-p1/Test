import { motion } from 'framer-motion';
import { testimonials } from '../../lib/data';
import { SectionHeading } from '../ui/SectionHeading';
import { StarRating } from '../ui/StarRating';
import { Icon } from '../ui/Icon';
import { toArabicDigits } from '../../lib/utils';

export function Testimonials() {
  return (
    <section className="relative overflow-hidden bg-white/50 py-20 sm:py-28">
      <div className="container-content">
        <SectionHeading
          eyebrow="آراء عملائنا"
          title="ثقة يعبّر عنها أكثر من ٥٠ ألف عميل"
          description="تقييمات حقيقية من عملاء اختبروا تجربة هوب — الأصالة، السرعة، والدعم."
          align="center"
          className="mb-14"
        />

        {/* Rating summary */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mx-auto mb-12 flex max-w-md items-center justify-center gap-6 rounded-3xl border border-ink-950/[0.06] bg-white p-5 shadow-soft"
        >
          <div className="text-center">
            <p className="tnum text-4xl font-extrabold text-ink-950">٤٫٩</p>
            <StarRating rating={4.9} showCount={false} size={16} className="mt-1 justify-center" />
          </div>
          <div className="h-12 w-px bg-ink-950/10" />
          <div>
            <p className="tnum text-2xl font-bold text-ink-950">{toArabicDigits(12480)}+</p>
            <p className="text-sm text-ink-500">تقييم موثّق</p>
          </div>
        </motion.div>

        {/* Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {testimonials.slice(0, 6).map((t, i) => (
            <motion.figure
              key={t.id}
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.6, delay: Math.min(i * 0.08, 0.4), ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-col rounded-3xl border border-ink-950/[0.06] bg-white p-6 shadow-soft"
            >
              <div className="mb-4 flex items-center justify-between">
                <StarRating rating={t.rating} showCount={false} size={15} />
                <span className="flex items-center gap-1 rounded-full bg-success/10 px-2.5 py-1 text-[11px] font-semibold text-success">
                  <Icon name="check" width={12} height={12} />
                  مشترٍ موثّق
                </span>
              </div>
              <blockquote className="flex-1 text-[15px] leading-relaxed text-ink-700">
                «{t.text}»
              </blockquote>
              <figcaption className="mt-5 flex items-center gap-3 border-t hairline pt-5">
                <span className="grid h-11 w-11 place-items-center rounded-full bg-accent-gradient text-sm font-bold text-white">
                  {t.initials}
                </span>
                <div>
                  <p className="text-sm font-bold text-ink-950">{t.name}</p>
                  <p className="text-xs text-ink-500">
                    {t.city} · {t.product}
                  </p>
                </div>
              </figcaption>
            </motion.figure>
          ))}
        </div>
      </div>
    </section>
  );
}
