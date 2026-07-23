import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { categories } from '../../lib/data';
import { useCart } from '../../lib/cart';
import { cn, toArabicDigits } from '../../lib/utils';
import { Icon } from '../ui/Icon';
import { Logo } from './Logo';
import { Magnetic } from '../ui/Magnetic';

const navLinks = [
  { label: 'المتجر', to: '/shop' },
  { label: 'العروض', to: '/shop?filter=deals' },
  { label: 'أجهزة أبل', to: '/shop?cat=apple' },
];

export function Header({ onSearch }: { onSearch: () => void }) {
  const [scrolled, setScrolled] = useState(false);
  const [megaOpen, setMegaOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { count, toggle } = useCart();
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setMegaOpen(false);
  }, [location]);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMobileOpen(false);
        setMegaOpen(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
  }, [mobileOpen]);

  return (
    <>
      <header
        className={cn(
          'sticky top-0 z-50 transition-all duration-500 ease-out-expo',
          scrolled ? 'py-2' : 'py-3',
        )}
      >
        <div className="container-content">
          <div
            className={cn(
              'flex items-center justify-between gap-4 rounded-full px-3 pe-3 ps-4 transition-all duration-500 ease-out-expo sm:px-4',
              scrolled
                ? 'glass shadow-soft h-14'
                : 'bg-transparent h-16',
            )}
          >
            <div className="flex items-center gap-1">
              <Logo />
            </div>

            {/* Desktop nav */}
            <nav className="hidden items-center gap-1 lg:flex" aria-label="التنقّل الرئيسي">
              <button
                type="button"
                onClick={() => setMegaOpen((o) => !o)}
                onMouseEnter={() => setMegaOpen(true)}
                aria-expanded={megaOpen}
                className="group flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium text-ink-700 transition hover:bg-ink-950/[0.04] hover:text-ink-950"
              >
                الأقسام
                <Icon
                  name="chevron-down"
                  width={16}
                  height={16}
                  className={cn('transition-transform duration-300', megaOpen && 'rotate-180')}
                />
              </button>
              {navLinks.map((l) => (
                <Link
                  key={l.to}
                  to={l.to}
                  className="rounded-full px-4 py-2 text-sm font-medium text-ink-700 transition hover:bg-ink-950/[0.04] hover:text-ink-950"
                >
                  {l.label}
                </Link>
              ))}
            </nav>

            {/* Actions */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={onSearch}
                aria-label="البحث"
                className="grid h-10 w-10 place-items-center rounded-full text-ink-700 transition hover:bg-ink-950/[0.05] hover:text-ink-950"
              >
                <Icon name="search" width={20} height={20} />
              </button>
              <button
                type="button"
                aria-label="حسابي"
                className="hidden h-10 w-10 place-items-center rounded-full text-ink-700 transition hover:bg-ink-950/[0.05] hover:text-ink-950 sm:grid"
              >
                <Icon name="user" width={20} height={20} />
              </button>

              <Magnetic strength={0.2}>
                <button
                  type="button"
                  onClick={toggle}
                  aria-label={`السلة، ${count} منتجات`}
                  className="relative grid h-11 w-11 place-items-center rounded-full bg-ink-950 text-white transition hover:bg-accent-500"
                >
                  <Icon name="cart" width={20} height={20} />
                  <AnimatePresence>
                    {count > 0 && (
                      <motion.span
                        key={count}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                        className="tnum absolute -end-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-gold px-1 text-[11px] font-bold text-ink-950 ring-2 ring-paper"
                      >
                        {toArabicDigits(count)}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </button>
              </Magnetic>

              <button
                type="button"
                onClick={() => setMobileOpen(true)}
                aria-label="القائمة"
                className="grid h-10 w-10 place-items-center rounded-full text-ink-800 transition hover:bg-ink-950/[0.05] lg:hidden"
              >
                <Icon name="menu" width={22} height={22} />
              </button>
            </div>
          </div>

          {/* Mega menu */}
          <AnimatePresence>
            {megaOpen && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                onMouseLeave={() => setMegaOpen(false)}
                className="absolute inset-x-0 top-full mt-2 hidden px-5 lg:block"
              >
                <div className="mx-auto max-w-content">
                  <div className="glass rounded-3xl p-3 shadow-lift">
                    <div className="grid grid-cols-3 gap-2">
                      {categories.map((c) => (
                        <Link
                          key={c.id}
                          to={`/shop?cat=${c.id}`}
                          className="group flex items-center gap-4 rounded-2xl p-4 transition hover:bg-white"
                        >
                          <span
                            className={cn(
                              'grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br text-white shadow-soft',
                              c.gradient,
                            )}
                          >
                            <Icon name={c.icon} width={22} height={22} />
                          </span>
                          <span className="flex flex-col">
                            <span className="text-sm font-semibold text-ink-950">{c.name}</span>
                            <span className="text-xs text-ink-500">
                              {c.tagline} · {toArabicDigits(c.count)} منتج
                            </span>
                          </span>
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </header>

      {/* Mobile drawer */}
      <MobileNav open={mobileOpen} onClose={() => setMobileOpen(false)} onSearch={onSearch} />
    </>
  );
}

function MobileNav({
  open,
  onClose,
  onSearch,
}: {
  open: boolean;
  onClose: () => void;
  onSearch: () => void;
}) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[70] bg-ink-950/40 backdrop-blur-sm lg:hidden"
          />
          <motion.aside
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed inset-y-0 start-0 z-[80] flex w-[86%] max-w-sm flex-col bg-paper-50 shadow-lift lg:hidden"
            role="dialog"
            aria-label="القائمة"
          >
            <div className="flex items-center justify-between border-b hairline p-5">
              <Logo />
              <button
                type="button"
                onClick={onClose}
                aria-label="إغلاق"
                className="grid h-10 w-10 place-items-center rounded-full bg-ink-950/[0.05]"
              >
                <Icon name="close" width={20} height={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onSearch();
                }}
                className="mb-6 flex w-full items-center gap-3 rounded-2xl border hairline bg-white px-4 py-3.5 text-ink-500"
              >
                <Icon name="search" width={20} height={20} />
                <span className="text-sm">ابحث عن منتج أو علامة تجارية…</span>
              </button>

              <p className="mb-3 px-1 text-xs font-semibold uppercase tracking-wider text-ink-400">
                الأقسام
              </p>
              <nav className="flex flex-col gap-1">
                {categories.map((c) => (
                  <Link
                    key={c.id}
                    to={`/shop?cat=${c.id}`}
                    onClick={onClose}
                    className="flex items-center gap-3 rounded-2xl p-3 transition hover:bg-white"
                  >
                    <span
                      className={cn(
                        'grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br text-white',
                        c.gradient,
                      )}
                    >
                      <Icon name={c.icon} width={20} height={20} />
                    </span>
                    <span className="text-[15px] font-medium text-ink-900">{c.name}</span>
                    <Icon name="chevron-left" width={18} height={18} className="ms-auto text-ink-300" />
                  </Link>
                ))}
              </nav>

              <p className="mb-3 mt-8 px-1 text-xs font-semibold uppercase tracking-wider text-ink-400">
                روابط
              </p>
              <nav className="flex flex-col gap-1">
                {navLinks.map((l) => (
                  <Link
                    key={l.to}
                    to={l.to}
                    onClick={onClose}
                    className="rounded-2xl p-3 text-[15px] font-medium text-ink-900 transition hover:bg-white"
                  >
                    {l.label}
                  </Link>
                ))}
              </nav>
            </div>

            <div className="border-t hairline p-5">
              <a
                href="tel:+966920000000"
                className="flex items-center justify-center gap-2 rounded-full bg-ink-950 py-3.5 text-sm font-medium text-white"
              >
                <Icon name="phone" width={18} height={18} />
                تواصل مع الدعم الفني
              </a>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
