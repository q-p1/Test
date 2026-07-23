import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { categories } from '../../lib/data';
import { toArabicDigits, cn } from '../../lib/utils';
import { Icon } from '../ui/Icon';
import { SectionHeading } from '../ui/SectionHeading';
import { Button } from '../ui/Button';

/**
 * Engaging, asymmetric category showcase. The two featured categories take
 * larger tiles; the rest sit in a refined grid. Each tile has a premium hover.
 */
export function Categories() {
  return (
    <section id="categories" className="container-content py-20 sm:py-28">
      <SectionHeading
        eyebrow="تسوّق حسب القسم"
        title="اكتشف ما تبحث عنه بسهولة"
        description="مجموعات مختارة بعناية من أفضل العلامات التقنية، منظّمة لتصل لما تريد في ثوانٍ."
        action={
          <Button to="/shop" variant="ghost" size="md" className="hidden sm:inline-flex">
            كل الأقسام
            <Icon name="arrow-left" width={18} height={18} />
          </Button>
        }
        className="mb-12"
      />

      <div className="grid auto-rows-[180px] grid-cols-2 gap-4 sm:auto-rows-[220px] lg:grid-cols-4">
        {categories.map((c, i) => {
          const big = c.featured;
          return (
            <motion.div
              key={c.id}
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.6, delay: Math.min(i * 0.06, 0.4), ease: [0.16, 1, 0.3, 1] }}
              className={cn(big && 'col-span-2 row-span-1 lg:row-span-2')}
            >
              <Link
                to={`/shop?cat=${c.id}`}
                className={cn(
                  'group relative flex h-full flex-col justify-between overflow-hidden rounded-3xl bg-gradient-to-br p-5 text-white shadow-card transition-all duration-500 ease-out-expo hover:shadow-lift sm:p-6',
                  c.gradient,
                )}
              >
                {/* decorative glyph */}
                <Icon
                  name={c.icon}
                  className="absolute -bottom-6 -start-6 h-40 w-40 text-white/[0.08] transition-transform duration-700 ease-out-expo group-hover:scale-110 group-hover:rotate-6"
                  strokeWidth={1}
                />
                {/* grid overlay */}
                <div
                  className="absolute inset-0 opacity-[0.06]"
                  style={{
                    backgroundImage:
                      'linear-gradient(to right,#fff 1px,transparent 1px),linear-gradient(to bottom,#fff 1px,transparent 1px)',
                    backgroundSize: '32px 32px',
                  }}
                />

                <div className="relative flex items-start justify-between">
                  <span className="grid h-11 w-11 place-items-center rounded-xl bg-white/15 backdrop-blur-sm ring-1 ring-white/20">
                    <Icon name={c.icon} width={22} height={22} />
                  </span>
                  <span className="tnum rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white/80 backdrop-blur-sm">
                    {toArabicDigits(c.count)} منتج
                  </span>
                </div>

                <div className="relative">
                  <h3 className={cn('font-display font-bold', big ? 'text-2xl sm:text-3xl' : 'text-lg')}>
                    {c.name}
                  </h3>
                  <p className="mt-1 text-sm text-white/70">{c.tagline}</p>
                  <span className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-white opacity-0 transition-all duration-300 group-hover:opacity-100">
                    تصفّح القسم
                    <Icon name="arrow-left" width={16} height={16} />
                  </span>
                </div>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
