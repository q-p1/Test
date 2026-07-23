import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  products,
  categories,
  brands,
  type CategoryId,
} from '../lib/data';
import { cn, toArabicDigits } from '../lib/utils';
import { Seo } from '../lib/Seo';
import { Breadcrumb } from '../components/ui/Breadcrumb';
import { ProductCard } from '../components/product/ProductCard';
import { ProductCardSkeleton } from '../components/ui/Skeleton';
import { Icon } from '../components/ui/Icon';

type Sort = 'featured' | 'price-asc' | 'price-desc' | 'rating';

const sortOptions: { id: Sort; label: string }[] = [
  { id: 'featured', label: 'المميّزة' },
  { id: 'price-asc', label: 'الأقل سعراً' },
  { id: 'price-desc', label: 'الأعلى سعراً' },
  { id: 'rating', label: 'الأعلى تقييماً' },
];

export default function Shop() {
  const [params, setParams] = useSearchParams();
  const catParam = (params.get('cat') as CategoryId | null) ?? null;
  const filterParam = params.get('filter');
  const query = params.get('q')?.toLowerCase() ?? '';

  const [selectedCats, setSelectedCats] = useState<CategoryId[]>(catParam ? [catParam] : []);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [dealsOnly, setDealsOnly] = useState(filterParam === 'deals');
  const [sort, setSort] = useState<Sort>('featured');
  const [loading, setLoading] = useState(true);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  // Sync when navbar/category links change the URL
  useEffect(() => {
    setSelectedCats(catParam ? [catParam] : []);
    setDealsOnly(filterParam === 'deals');
  }, [catParam, filterParam]);

  // Simulate content load for skeleton demonstration
  useEffect(() => {
    setLoading(true);
    const t = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(t);
  }, [selectedCats, selectedBrands, dealsOnly, sort, query]);

  const results = useMemo(() => {
    let list = products.slice();
    if (query) {
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.brand.toLowerCase().includes(query) ||
          p.categoryName.includes(query),
      );
    }
    if (selectedCats.length) list = list.filter((p) => selectedCats.includes(p.category));
    if (selectedBrands.length) list = list.filter((p) => selectedBrands.includes(p.brand));
    if (dealsOnly) list = list.filter((p) => p.originalPrice && p.originalPrice > p.price);

    switch (sort) {
      case 'price-asc':
        list.sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        list.sort((a, b) => b.price - a.price);
        break;
      case 'rating':
        list.sort((a, b) => b.rating - a.rating);
        break;
    }
    return list;
  }, [query, selectedCats, selectedBrands, dealsOnly, sort]);

  const toggleCat = (id: CategoryId) => {
    setParams({}, { replace: true });
    setSelectedCats((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id],
    );
  };
  const toggleBrand = (b: string) =>
    setSelectedBrands((prev) => (prev.includes(b) ? prev.filter((x) => x !== b) : [...prev, b]));

  const clearAll = () => {
    setSelectedCats([]);
    setSelectedBrands([]);
    setDealsOnly(false);
    setParams({}, { replace: true });
  };

  const activeCount = selectedCats.length + selectedBrands.length + (dealsOnly ? 1 : 0);
  const heading = query
    ? `نتائج البحث عن «${query}»`
    : selectedCats.length === 1
      ? categories.find((c) => c.id === selectedCats[0])?.name ?? 'المتجر'
      : dealsOnly
        ? 'العروض والخصومات'
        : 'كل المنتجات';

  const Filters = (
    <div className="space-y-8">
      {/* Categories */}
      <fieldset>
        <legend className="mb-3 text-sm font-bold text-ink-950">الأقسام</legend>
        <div className="space-y-1">
          {categories.map((c) => (
            <label
              key={c.id}
              className="flex cursor-pointer items-center justify-between rounded-xl px-3 py-2 transition hover:bg-paper-100"
            >
              <span className="flex items-center gap-2.5 text-sm text-ink-700">
                <Checkbox checked={selectedCats.includes(c.id)} onChange={() => toggleCat(c.id)} />
                {c.name}
              </span>
              <span className="tnum text-xs text-ink-400">{toArabicDigits(c.count)}</span>
            </label>
          ))}
        </div>
      </fieldset>

      {/* Brands */}
      <fieldset>
        <legend className="mb-3 text-sm font-bold text-ink-950">العلامة التجارية</legend>
        <div className="flex flex-wrap gap-2">
          {brands.map((b) => (
            <button
              key={b}
              type="button"
              onClick={() => toggleBrand(b)}
              aria-pressed={selectedBrands.includes(b)}
              className={cn(
                'rounded-full border px-3.5 py-1.5 text-xs font-medium transition',
                selectedBrands.includes(b)
                  ? 'border-ink-950 bg-ink-950 text-white'
                  : 'border-ink-950/10 bg-white text-ink-600 hover:border-ink-950/25',
              )}
            >
              {b}
            </button>
          ))}
        </div>
      </fieldset>

      {/* Deals */}
      <label className="flex cursor-pointer items-center justify-between rounded-xl border hairline bg-white px-4 py-3">
        <span className="flex items-center gap-2 text-sm font-medium text-ink-800">
          <Icon name="tag" width={18} height={18} className="text-accent-600" />
          العروض فقط
        </span>
        <Switch checked={dealsOnly} onChange={() => setDealsOnly((d) => !d)} />
      </label>
    </div>
  );

  return (
    <div className="bg-paper-glow pb-24 pt-6">
      <Seo
        title={`${heading} | هوب`}
        description="تصفّح تشكيلة هوب من المنتجات التقنية الأصلية مع فلترة ذكية وفرز مرن وعروض حصرية."
      />
      <div className="container-content">
        <Breadcrumb items={[{ label: 'الرئيسية', to: '/' }, { label: heading }]} />

        {/* Head */}
        <div className="mt-6 flex flex-col gap-4 border-b hairline pb-8 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-display-md font-extrabold text-ink-950">{heading}</h1>
            <p className="mt-2 text-ink-500">
              <span className="tnum">{toArabicDigits(results.length)}</span> منتج متاح
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileFiltersOpen(true)}
              className="flex items-center gap-2 rounded-full border hairline bg-white px-4 py-2.5 text-sm font-medium lg:hidden"
            >
              <Icon name="menu" width={18} height={18} />
              تصفية
              {activeCount > 0 && (
                <span className="tnum grid h-5 w-5 place-items-center rounded-full bg-accent-500 text-[11px] text-white">
                  {toArabicDigits(activeCount)}
                </span>
              )}
            </button>

            <div className="relative">
              <label htmlFor="sort" className="sr-only">
                ترتيب حسب
              </label>
              <select
                id="sort"
                value={sort}
                onChange={(e) => setSort(e.target.value as Sort)}
                className="appearance-none rounded-full border hairline bg-white py-2.5 pe-10 ps-4 text-sm font-medium text-ink-800 outline-none transition focus:border-accent-400"
              >
                {sortOptions.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.label}
                  </option>
                ))}
              </select>
              <Icon
                name="chevron-down"
                width={16}
                height={16}
                className="pointer-events-none absolute end-3 top-1/2 -translate-y-1/2 text-ink-400"
              />
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="mt-8 grid gap-8 lg:grid-cols-[260px_1fr]">
          {/* Sidebar (desktop) */}
          <aside className="hidden lg:block">
            <div className="sticky top-24">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-sm font-bold text-ink-950">التصفية</h2>
                {activeCount > 0 && (
                  <button
                    type="button"
                    onClick={clearAll}
                    className="text-xs font-medium text-accent-600 hover:underline"
                  >
                    مسح ({toArabicDigits(activeCount)})
                  </button>
                )}
              </div>
              {Filters}
            </div>
          </aside>

          {/* Grid */}
          <div>
            {loading ? (
              <div className="grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <ProductCardSkeleton key={i} />
                ))}
              </div>
            ) : results.length > 0 ? (
              <div className="grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-3">
                {results.map((p, i) => (
                  <ProductCard key={p.id} product={p} index={i} />
                ))}
              </div>
            ) : (
              <div className="grid place-items-center rounded-3xl border border-dashed hairline bg-white py-24 text-center">
                <div className="grid h-16 w-16 place-items-center rounded-full bg-ink-950/[0.04] text-ink-300">
                  <Icon name="search" width={30} height={30} />
                </div>
                <p className="mt-4 text-lg font-semibold text-ink-900">لا توجد نتائج مطابقة</p>
                <p className="mt-1 text-sm text-ink-500">جرّب تعديل الفلاتر أو مسحها</p>
                <button
                  type="button"
                  onClick={clearAll}
                  className="mt-5 rounded-full bg-ink-950 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-accent-500"
                >
                  مسح الفلاتر
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile filters sheet */}
      <AnimatePresence>
        {mobileFiltersOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileFiltersOpen(false)}
              className="fixed inset-0 z-[90] bg-ink-950/40 backdrop-blur-sm lg:hidden"
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 32, stiffness: 320 }}
              className="fixed inset-x-0 bottom-0 z-[95] max-h-[85vh] overflow-y-auto rounded-t-4xl bg-paper-50 p-6 shadow-lift lg:hidden"
              role="dialog"
              aria-label="تصفية المنتجات"
            >
              <div className="mx-auto mb-5 h-1.5 w-12 rounded-full bg-ink-200" />
              <div className="mb-6 flex items-center justify-between">
                <h2 className="text-lg font-bold text-ink-950">التصفية</h2>
                <button
                  type="button"
                  onClick={() => setMobileFiltersOpen(false)}
                  className="grid h-9 w-9 place-items-center rounded-full bg-ink-950/[0.05]"
                  aria-label="إغلاق"
                >
                  <Icon name="close" width={18} height={18} />
                </button>
              </div>
              {Filters}
              <div className="mt-8 flex gap-3">
                <button
                  type="button"
                  onClick={clearAll}
                  className="flex-1 rounded-full border hairline bg-white py-3.5 text-sm font-semibold text-ink-700"
                >
                  مسح
                </button>
                <button
                  type="button"
                  onClick={() => setMobileFiltersOpen(false)}
                  className="flex-[2] rounded-full bg-ink-950 py-3.5 text-sm font-semibold text-white"
                >
                  عرض {toArabicDigits(results.length)} منتج
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

function Checkbox({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <span className="relative inline-flex">
      <input type="checkbox" checked={checked} onChange={onChange} className="peer sr-only" />
      <span
        className={cn(
          'grid h-5 w-5 place-items-center rounded-md border transition',
          checked ? 'border-accent-500 bg-accent-500 text-white' : 'border-ink-300 bg-white',
        )}
      >
        {checked && <Icon name="check" width={13} height={13} strokeWidth={2.5} />}
      </span>
    </span>
  );
}

function Switch({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      className={cn(
        'relative h-6 w-11 rounded-full transition-colors',
        checked ? 'bg-accent-500' : 'bg-ink-200',
      )}
    >
      <span
        className={cn(
          'absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all',
          checked ? 'start-0.5' : 'start-5',
        )}
      />
    </button>
  );
}
