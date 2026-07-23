import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useCart, FREE_SHIPPING_THRESHOLD } from '../../lib/cart';
import { formatSAR, toArabicDigits, cn } from '../../lib/utils';
import { Icon } from '../ui/Icon';
import { ProductVisual } from '../ui/ProductVisual';

export function CartDrawer() {
  const { items, isOpen, close, subtotal, setQty, remove, count } = useCart();

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close();
    if (isOpen) window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
  }, [isOpen, close]);

  const remaining = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);
  const progress = Math.min(100, (subtotal / FREE_SHIPPING_THRESHOLD) * 100);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={close}
            className="fixed inset-0 z-[90] bg-ink-950/50 backdrop-blur-sm"
          />
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 32, stiffness: 320 }}
            className="fixed inset-y-0 end-0 z-[95] flex w-full max-w-md flex-col bg-paper-50 shadow-lift"
            role="dialog"
            aria-label="سلة التسوّق"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b hairline p-5">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-ink-950">سلة التسوّق</h2>
                {count > 0 && (
                  <span className="tnum rounded-full bg-ink-950 px-2 py-0.5 text-xs font-semibold text-white">
                    {toArabicDigits(count)}
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={close}
                aria-label="إغلاق السلة"
                className="grid h-10 w-10 place-items-center rounded-full bg-ink-950/[0.05] transition hover:bg-ink-950/10"
              >
                <Icon name="close" width={20} height={20} />
              </button>
            </div>

            {/* Free shipping progress */}
            {count > 0 && (
              <div className="border-b hairline bg-white/60 px-5 py-4">
                <p className="mb-2 text-sm text-ink-700">
                  {remaining > 0 ? (
                    <>
                      أضف <span className="font-bold text-accent-600">{formatSAR(remaining)}</span> للحصول على
                      شحن مجاني 🚚
                    </>
                  ) : (
                    <span className="font-semibold text-success">تأهلت للشحن المجاني! 🎉</span>
                  )}
                </p>
                <div className="h-2 overflow-hidden rounded-full bg-ink-950/[0.06]">
                  <motion.div
                    className="h-full rounded-full bg-accent-gradient"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                  />
                </div>
              </div>
            )}

            {/* Items */}
            {count === 0 ? (
              <EmptyCart onClose={close} />
            ) : (
              <div className="flex-1 overflow-y-auto px-5 py-4">
                <ul className="flex flex-col gap-3">
                  <AnimatePresence initial={false}>
                    {items.map(({ product, qty }) => (
                      <motion.li
                        key={product.id}
                        layout
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                        className="flex gap-3 rounded-2xl border hairline bg-white p-3"
                      >
                        <ProductVisual
                          colorway={product.colorway}
                          glyph={product.glyph}
                          className="h-20 w-20 shrink-0 rounded-xl"
                        />
                        <div className="flex flex-1 flex-col">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="text-xs font-semibold uppercase tracking-wide text-accent-600">
                                {product.brand}
                              </p>
                              <p className="mt-0.5 text-sm font-medium leading-snug text-ink-900 line-clamp-2">
                                {product.name}
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => remove(product.id)}
                              aria-label="إزالة المنتج"
                              className="shrink-0 text-ink-300 transition hover:text-accent-500"
                            >
                              <Icon name="close" width={18} height={18} />
                            </button>
                          </div>
                          <div className="mt-auto flex items-center justify-between pt-2">
                            <div className="flex items-center rounded-full border hairline">
                              <button
                                type="button"
                                onClick={() => setQty(product.id, qty - 1)}
                                aria-label="إنقاص الكمية"
                                className="grid h-8 w-8 place-items-center rounded-full text-ink-600 transition hover:text-ink-950"
                              >
                                <Icon name="minus" width={16} height={16} />
                              </button>
                              <span className="tnum w-7 text-center text-sm font-semibold">
                                {toArabicDigits(qty)}
                              </span>
                              <button
                                type="button"
                                onClick={() => setQty(product.id, qty + 1)}
                                aria-label="زيادة الكمية"
                                className="grid h-8 w-8 place-items-center rounded-full text-ink-600 transition hover:text-ink-950"
                              >
                                <Icon name="plus" width={16} height={16} />
                              </button>
                            </div>
                            <span className="tnum text-sm font-bold text-ink-950">
                              {formatSAR(product.price * qty)}
                            </span>
                          </div>
                        </div>
                      </motion.li>
                    ))}
                  </AnimatePresence>
                </ul>
              </div>
            )}

            {/* Footer */}
            {count > 0 && (
              <div className="border-t hairline bg-white/70 p-5">
                <div className="mb-4 flex items-center justify-between">
                  <span className="text-sm text-ink-600">الإجمالي الفرعي</span>
                  <span className="tnum text-xl font-bold text-ink-950">{formatSAR(subtotal)}</span>
                </div>
                <Link
                  to="/checkout"
                  onClick={close}
                  className="flex h-14 w-full items-center justify-center gap-2 rounded-full bg-ink-950 text-base font-semibold text-white shadow-lift transition hover:bg-accent-500"
                >
                  إتمام الشراء
                  <Icon name="arrow-left" width={20} height={20} />
                </Link>
                <button
                  type="button"
                  onClick={close}
                  className="mt-3 w-full text-center text-sm font-medium text-ink-500 transition hover:text-ink-900"
                >
                  متابعة التسوّق
                </button>
                <div className="mt-4 flex items-center justify-center gap-4 text-xs text-ink-400">
                  <span className="flex items-center gap-1">
                    <Icon name="lock" width={14} height={14} /> دفع آمن
                  </span>
                  <span className="flex items-center gap-1">
                    <Icon name="shield-check" width={14} height={14} /> ضمان أصلي
                  </span>
                </div>
              </div>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

function EmptyCart({ onClose }: { onClose: () => void }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 px-8 text-center">
      <div className="grid h-20 w-20 place-items-center rounded-full bg-ink-950/[0.04] text-ink-300">
        <Icon name="cart" width={36} height={36} />
      </div>
      <div>
        <p className="text-lg font-semibold text-ink-900">سلتك فارغة</p>
        <p className="mt-1 text-sm text-ink-500">اكتشف أحدث المنتجات التقنية الأصلية</p>
      </div>
      <Link
        to="/shop"
        onClick={onClose}
        className="mt-2 flex h-12 items-center gap-2 rounded-full bg-accent-500 px-7 text-sm font-semibold text-white shadow-glow transition hover:bg-accent-600"
      >
        تصفّح المتجر
        <Icon name="arrow-left" width={18} height={18} />
      </Link>
    </div>
  );
}
