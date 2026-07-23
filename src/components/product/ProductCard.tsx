import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import type { Product } from '../../lib/data';
import { formatSAR, discountPct, toArabicDigits, cn } from '../../lib/utils';
import { useCart } from '../../lib/cart';
import { ProductVisual } from '../ui/ProductVisual';
import { StarRating } from '../ui/StarRating';
import { Badge } from '../ui/Badge';
import { Icon } from '../ui/Icon';

export function ProductCard({ product, index = 0 }: { product: Product; index?: number }) {
  const { add } = useCart();
  const [wished, setWished] = useState(false);
  const pct = product.originalPrice ? discountPct(product.originalPrice, product.price) : 0;

  return (
    <motion.article
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.5, delay: Math.min(index * 0.05, 0.3), ease: [0.16, 1, 0.3, 1] }}
      className="group relative flex flex-col overflow-hidden rounded-3xl border border-ink-950/[0.06] bg-white p-3 shadow-soft transition-all duration-500 ease-out-expo hover:-translate-y-1.5 hover:shadow-lift hover:border-ink-950/10"
    >
      {/* Visual */}
      <Link
        to={`/product/${product.slug}`}
        className="relative block overflow-hidden rounded-2xl"
        aria-label={product.name}
      >
        <ProductVisual
          colorway={product.colorway}
          glyph={product.glyph}
          brand={product.brand}
          className="aspect-square w-full transition-transform duration-700 ease-out-expo group-hover:scale-[1.04]"
        />

        {/* top-start badges */}
        <div className="absolute start-3 top-3 flex flex-col items-start gap-2">
          {product.badge && (
            <Badge tone={product.badge.includes('خصم') ? 'gold' : 'accent'}>
              {product.badge}
            </Badge>
          )}
          {pct > 0 && (
            <Badge tone="ink" className="tnum">
              −{toArabicDigits(pct)}٪
            </Badge>
          )}
        </div>

        {/* wishlist */}
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            setWished((w) => !w);
          }}
          aria-pressed={wished}
          aria-label={wished ? 'إزالة من المفضلة' : 'إضافة إلى المفضلة'}
          className="absolute end-3 top-3 grid h-10 w-10 place-items-center rounded-full glass text-ink-700 transition-transform duration-300 hover:scale-110 active:scale-95"
        >
          <Icon
            name="heart"
            width={18}
            height={18}
            className={cn('transition-colors', wished && 'text-accent-500')}
            style={{ fill: wished ? 'currentColor' : 'none' }}
          />
        </button>

        {!product.inStock && (
          <div className="absolute inset-0 grid place-items-center bg-ink-950/45 backdrop-blur-[2px]">
            <span className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-ink-900">
              نفدت الكمية
            </span>
          </div>
        )}
      </Link>

      {/* Body */}
      <div className="flex flex-1 flex-col gap-3 p-3 pt-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-accent-600">
            {product.brand}
          </span>
          <StarRating rating={product.rating} showCount={false} size={12} />
        </div>

        <h3 className="text-[15px] font-semibold leading-snug text-ink-900 line-clamp-2">
          <Link to={`/product/${product.slug}`} className="hover:text-accent-600">
            {product.name}
          </Link>
        </h3>

        <div className="mt-auto flex items-end justify-between gap-2 pt-2">
          <div className="flex flex-col">
            {product.originalPrice && (
              <span className="tnum text-xs text-ink-400 line-through">
                {formatSAR(product.originalPrice)}
              </span>
            )}
            <span className="tnum text-lg font-bold text-ink-950">
              {formatSAR(product.price)}
            </span>
            {product.installments && (
              <span className="text-[11px] text-ink-500">أو بالتقسيط</span>
            )}
          </div>

          <button
            type="button"
            disabled={!product.inStock}
            onClick={() => add(product)}
            aria-label={`أضف ${product.name} إلى السلة`}
            className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-ink-950 text-white transition-all duration-300 ease-out-expo hover:bg-accent-500 hover:scale-105 active:scale-95 disabled:opacity-40 disabled:hover:bg-ink-950 disabled:hover:scale-100"
          >
            <Icon name="plus" width={20} height={20} />
          </button>
        </div>
      </div>
    </motion.article>
  );
}
