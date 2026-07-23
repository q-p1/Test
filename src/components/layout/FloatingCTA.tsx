import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useCart } from '../../lib/cart';
import { formatSAR, toArabicDigits } from '../../lib/utils';
import { Icon } from '../ui/Icon';

/**
 * Mobile floating CTA: appears after scrolling; shows cart summary and a
 * quick path to checkout. Hidden when cart is open or on desktop.
 */
export function FloatingCTA() {
  const { count, subtotal, open, isOpen } = useCart();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 600);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const show = visible && !isOpen;

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', damping: 26, stiffness: 320 }}
          className="fixed inset-x-4 bottom-4 z-40 lg:hidden"
          style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        >
          {count > 0 ? (
            <button
              type="button"
              onClick={open}
              className="flex w-full items-center justify-between gap-3 rounded-full bg-ink-950 py-2 pe-2 ps-5 shadow-lift"
            >
              <span className="flex items-center gap-2 text-white">
                <span className="tnum grid h-6 min-w-6 place-items-center rounded-full bg-gold px-1.5 text-xs font-bold text-ink-950">
                  {toArabicDigits(count)}
                </span>
                <span className="tnum text-sm font-semibold">{formatSAR(subtotal)}</span>
              </span>
              <span className="flex items-center gap-1.5 rounded-full bg-accent-500 px-5 py-2.5 text-sm font-semibold text-white">
                السلة
                <Icon name="arrow-left" width={16} height={16} />
              </span>
            </button>
          ) : (
            <Link
              to="/shop"
              className="flex w-full items-center justify-center gap-2 rounded-full bg-accent-500 py-4 text-sm font-semibold text-white shadow-glow"
            >
              تصفّح المتجر
              <Icon name="arrow-left" width={18} height={18} />
            </Link>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
