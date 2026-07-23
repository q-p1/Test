import { useMemo, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getProductBySlug, products } from '../lib/data';
import { formatSAR, toArabicDigits, discountPct, cn } from '../lib/utils';
import { useCart } from '../lib/cart';
import { Seo } from '../lib/Seo';
import { Breadcrumb } from '../components/ui/Breadcrumb';
import { ProductVisual } from '../components/ui/ProductVisual';
import { StarRating } from '../components/ui/StarRating';
import { Badge } from '../components/ui/Badge';
import { Icon } from '../components/ui/Icon';
import type { UiIcon } from '../components/ui/Icon';
import { ProductCard } from '../components/product/ProductCard';
import NotFound from './NotFound';

const guarantees: { icon: UiIcon; label: string }[] = [
  { icon: 'shield-check', label: 'منتج أصلي بضمان' },
  { icon: 'truck', label: 'شحن خلال ٢٤ ساعة' },
  { icon: 'lock', label: 'دفع آمن ومشفّر' },
];

export default function Product() {
  const { slug } = useParams();
  const product = slug ? getProductBySlug(slug) : undefined;
  const { add, open } = useCart();
  const navigate = useNavigate();
  const [qty, setQty] = useState(1);
  const [activeShade, setActiveShade] = useState(0);

  const related = useMemo(
    () =>
      product
        ? products.filter((p) => p.category === product.category && p.id !== product.id).slice(0, 4)
        : [],
    [product],
  );

  if (!product) return <NotFound />;

  const pct = product.originalPrice ? discountPct(product.originalPrice, product.price) : 0;
  const shades: [string, string][] = [
    product.colorway,
    [product.colorway[1], product.colorway[0]],
    ['#2C2C36', '#0B0B0F'],
  ];

  const handleAdd = () => add(product, qty);
  const handleBuyNow = () => {
    add(product, qty);
    navigate('/checkout');
  };

  return (
    <div className="pb-24 pt-6">
      <Seo
        title={`${product.name} | هوب`}
        description={product.highlight}
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'Product',
          name: product.name,
          brand: { '@type': 'Brand', name: product.brand },
          description: product.highlight,
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: product.rating,
            reviewCount: product.reviews,
          },
          offers: {
            '@type': 'Offer',
            price: product.price,
            priceCurrency: 'SAR',
            availability: product.inStock
              ? 'https://schema.org/InStock'
              : 'https://schema.org/OutOfStock',
          },
        }}
      />
      <div className="container-content">
        <Breadcrumb
          items={[
            { label: 'الرئيسية', to: '/' },
            { label: product.categoryName, to: `/shop?cat=${product.category}` },
            { label: product.name },
          ]}
        />

        <div className="mt-8 grid gap-10 lg:grid-cols-2 lg:gap-14">
          {/* Gallery */}
          <div className="lg:sticky lg:top-24 lg:self-start">
            <motion.div
              key={activeShade}
              initial={{ opacity: 0.5, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="relative"
            >
              <ProductVisual
                colorway={shades[activeShade]}
                glyph={product.glyph}
                brand={product.brand}
                className="aspect-square w-full rounded-4xl shadow-card"
                glyphClassName="h-2/5 w-2/5"
              />
              {pct > 0 && (
                <Badge tone="gold" className="tnum absolute start-5 top-5 text-sm">
                  خصم {toArabicDigits(pct)}٪
                </Badge>
              )}
            </motion.div>

            {/* Thumbnails */}
            <div className="mt-4 flex gap-3">
              {shades.map((s, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setActiveShade(i)}
                  aria-label={`عرض ${i + 1}`}
                  className={cn(
                    'overflow-hidden rounded-2xl ring-2 transition',
                    activeShade === i ? 'ring-accent-500' : 'ring-transparent hover:ring-ink-200',
                  )}
                >
                  <ProductVisual colorway={s} glyph={product.glyph} className="h-20 w-20" />
                </button>
              ))}
            </div>
          </div>

          {/* Info */}
          <div>
            <div className="flex items-center gap-3">
              <span className="text-sm font-bold uppercase tracking-wider text-accent-600">
                {product.brand}
              </span>
              {product.badge && <Badge tone="accent">{product.badge}</Badge>}
            </div>

            <h1 className="mt-3 text-display-sm font-extrabold text-ink-950 sm:text-display-md">
              {product.name}
            </h1>

            <div className="mt-4 flex items-center gap-4">
              <StarRating rating={product.rating} reviews={product.reviews} size={17} />
              <span
                className={cn(
                  'flex items-center gap-1.5 text-sm font-medium',
                  product.inStock ? 'text-success' : 'text-ink-400',
                )}
              >
                <span className={cn('h-2 w-2 rounded-full', product.inStock ? 'bg-success' : 'bg-ink-300')} />
                {product.inStock ? 'متوفّر' : 'نفدت الكمية'}
              </span>
            </div>

            <p className="mt-6 text-lg leading-relaxed text-ink-600">{product.highlight}</p>

            {/* Price */}
            <div className="mt-8 flex items-end gap-3">
              <span className="tnum text-4xl font-extrabold text-ink-950">
                {formatSAR(product.price)}
              </span>
              {product.originalPrice && (
                <span className="tnum mb-1.5 text-xl text-ink-400 line-through">
                  {formatSAR(product.originalPrice)}
                </span>
              )}
            </div>
            {product.installments && (
              <p className="mt-2 flex items-center gap-1.5 text-sm text-ink-500">
                <Icon name="sparkle" width={15} height={15} className="text-gold" />
                أو قسّطها على ٤ دفعات بدون فوائد عبر تابي وتمارا
              </p>
            )}

            {/* Features */}
            <div className="mt-8 grid grid-cols-2 gap-3">
              {product.features.map((f) => (
                <div
                  key={f}
                  className="flex items-center gap-2.5 rounded-2xl border hairline bg-white px-4 py-3"
                >
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-accent-500/10 text-accent-600">
                    <Icon name="check" width={16} height={16} strokeWidth={2.5} />
                  </span>
                  <span className="text-sm font-medium text-ink-800">{f}</span>
                </div>
              ))}
            </div>

            {/* Actions */}
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="flex h-14 items-center justify-between rounded-full border hairline bg-white px-2 sm:w-36">
                <button
                  type="button"
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  aria-label="إنقاص"
                  className="grid h-10 w-10 place-items-center rounded-full text-ink-600 transition hover:bg-paper-100"
                >
                  <Icon name="minus" width={18} height={18} />
                </button>
                <span className="tnum text-lg font-bold">{toArabicDigits(qty)}</span>
                <button
                  type="button"
                  onClick={() => setQty((q) => q + 1)}
                  aria-label="زيادة"
                  className="grid h-10 w-10 place-items-center rounded-full text-ink-600 transition hover:bg-paper-100"
                >
                  <Icon name="plus" width={18} height={18} />
                </button>
              </div>

              <button
                type="button"
                onClick={handleAdd}
                disabled={!product.inStock}
                className="flex h-14 flex-1 items-center justify-center gap-2 rounded-full border-2 border-ink-950 bg-white font-semibold text-ink-950 transition hover:bg-ink-950 hover:text-white disabled:opacity-40"
              >
                <Icon name="cart" width={20} height={20} />
                أضف للسلة
              </button>
            </div>

            <button
              type="button"
              onClick={handleBuyNow}
              disabled={!product.inStock}
              className="mt-3 flex h-14 w-full items-center justify-center gap-2 rounded-full bg-accent-500 font-semibold text-white shadow-glow transition hover:bg-accent-600 disabled:opacity-40"
            >
              اشترِ الآن
              <Icon name="arrow-left" width={20} height={20} />
            </button>

            {/* Guarantees */}
            <div className="mt-8 grid grid-cols-3 gap-3 border-t hairline pt-8">
              {guarantees.map((g) => (
                <div key={g.label} className="flex flex-col items-center gap-2 text-center">
                  <span className="grid h-11 w-11 place-items-center rounded-full bg-ink-950/[0.04] text-ink-700">
                    <Icon name={g.icon} width={20} height={20} />
                  </span>
                  <span className="text-xs font-medium text-ink-600">{g.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Related */}
        {related.length > 0 && (
          <section className="mt-24">
            <div className="mb-8 flex items-end justify-between">
              <h2 className="text-display-sm font-extrabold text-ink-950">منتجات ذات صلة</h2>
              <Link
                to={`/shop?cat=${product.category}`}
                className="flex items-center gap-1.5 text-sm font-medium text-accent-600 hover:underline"
              >
                عرض المزيد
                <Icon name="arrow-left" width={16} height={16} />
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-4">
              {related.map((p, i) => (
                <ProductCard key={p.id} product={p} index={i} />
              ))}
            </div>
          </section>
        )}
      </div>

      {/* Sticky mobile add bar */}
      <div
        className="fixed inset-x-0 bottom-0 z-30 border-t hairline bg-white/90 p-3 backdrop-blur lg:hidden"
        style={{ paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom))' }}
      >
        <div className="flex items-center gap-3">
          <div className="flex flex-col">
            <span className="tnum text-lg font-extrabold text-ink-950">{formatSAR(product.price)}</span>
            {product.installments && <span className="text-[11px] text-ink-500">أو بالتقسيط</span>}
          </div>
          <button
            type="button"
            onClick={() => {
              handleAdd();
              open();
            }}
            disabled={!product.inStock}
            className="flex h-12 flex-1 items-center justify-center gap-2 rounded-full bg-ink-950 font-semibold text-white transition hover:bg-accent-500 disabled:opacity-40"
          >
            <Icon name="cart" width={18} height={18} />
            أضف للسلة
          </button>
        </div>
      </div>
    </div>
  );
}
