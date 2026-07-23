import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { products, type CategoryId } from '../../lib/data';
import { cn } from '../../lib/utils';
import { SectionHeading } from '../ui/SectionHeading';
import { ProductCard } from '../product/ProductCard';
import { Button } from '../ui/Button';
import { Icon } from '../ui/Icon';

const filters: { id: CategoryId | 'all'; label: string }[] = [
  { id: 'all', label: 'الكل' },
  { id: 'apple', label: 'أجهزة أبل' },
  { id: 'audio', label: 'صوتيات' },
  { id: 'dashcams', label: 'كاميرات' },
  { id: 'power', label: 'بطاريات' },
  { id: 'protection', label: 'حمايات' },
];

export function FeaturedProducts() {
  const [active, setActive] = useState<CategoryId | 'all'>('all');

  const list = useMemo(() => {
    const filtered = active === 'all' ? products : products.filter((p) => p.category === active);
    return filtered.slice(0, 8);
  }, [active]);

  return (
    <section className="container-content py-20 sm:py-28">
      <SectionHeading
        eyebrow="اكتشف منتجاتنا"
        title="مختارات تستحق التجربة"
        description="أحدث وأفضل ما لدينا من منتجات تقنية أصلية، منتقاة بعناية لك."
        action={
          <Button to="/shop" variant="ghost" size="md" className="hidden sm:inline-flex">
            عرض الكل
            <Icon name="arrow-left" width={18} height={18} />
          </Button>
        }
        className="mb-8"
      />

      {/* Filter pills */}
      <div className="no-scrollbar -mx-5 mb-10 flex gap-2 overflow-x-auto px-5 pb-1 sm:mx-0 sm:px-0">
        {filters.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setActive(f.id)}
            aria-pressed={active === f.id}
            className={cn(
              'relative shrink-0 rounded-full px-5 py-2.5 text-sm font-medium transition-colors',
              active === f.id ? 'text-white' : 'text-ink-600 hover:text-ink-950',
            )}
          >
            {active === f.id && (
              <motion.span
                layoutId="filter-pill"
                className="absolute inset-0 rounded-full bg-ink-950"
                transition={{ type: 'spring', damping: 30, stiffness: 350 }}
              />
            )}
            <span className="relative z-10">{f.label}</span>
          </button>
        ))}
      </div>

      {/* Grid */}
      <motion.div
        layout
        className="grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-4"
      >
        {list.map((p, i) => (
          <ProductCard key={p.id} product={p} index={i} />
        ))}
      </motion.div>

      <div className="mt-10 flex justify-center sm:hidden">
        <Button to="/shop" variant="secondary" size="md">
          عرض كل المنتجات
          <Icon name="arrow-left" width={18} height={18} />
        </Button>
      </div>
    </section>
  );
}
