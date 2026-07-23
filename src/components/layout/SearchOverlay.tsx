import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { products, categories } from '../../lib/data';
import { formatSAR, cn } from '../../lib/utils';
import { Icon } from '../ui/Icon';
import { ProductVisual } from '../ui/ProductVisual';

const trending = ['آيفون 16', 'كاميرا سيارة', 'باور بانك', 'سماعات', 'شاحن MagSafe'];

export function SearchOverlay({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (open) {
      setQuery('');
      setTimeout(() => inputRef.current?.focus(), 120);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return products
      .filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.brand.toLowerCase().includes(q) ||
          p.categoryName.includes(q),
      )
      .slice(0, 5);
  }, [query]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/shop?q=${encodeURIComponent(query.trim())}`);
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex flex-col bg-ink-950/60 backdrop-blur-md"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: -24, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -24, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="mx-auto mt-[10vh] w-full max-w-2xl px-4"
          >
            <div className="overflow-hidden rounded-3xl bg-paper-50 shadow-lift">
              {/* Input */}
              <form onSubmit={submit} className="flex items-center gap-3 border-b hairline px-5">
                <Icon name="search" width={22} height={22} className="text-ink-400" />
                <input
                  ref={inputRef}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="ابحث عن منتج، علامة تجارية، أو قسم…"
                  className="h-16 flex-1 bg-transparent text-lg text-ink-950 outline-none placeholder:text-ink-400"
                  aria-label="بحث"
                />
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-full bg-ink-950/[0.05] px-3 py-1.5 text-xs font-medium text-ink-500"
                >
                  ESC
                </button>
              </form>

              <div className="max-h-[52vh] overflow-y-auto p-3">
                {query.trim() === '' ? (
                  <div className="p-3">
                    <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-ink-400">
                      الأكثر بحثاً
                    </p>
                    <div className="mb-6 flex flex-wrap gap-2">
                      {trending.map((t) => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => setQuery(t)}
                          className="rounded-full border hairline bg-white px-4 py-2 text-sm text-ink-700 transition hover:border-accent-300 hover:text-accent-600"
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                    <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-ink-400">
                      تصفّح الأقسام
                    </p>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                      {categories.map((c) => (
                        <Link
                          key={c.id}
                          to={`/shop?cat=${c.id}`}
                          onClick={onClose}
                          className="flex items-center gap-2 rounded-2xl border hairline bg-white p-3 transition hover:bg-paper-100"
                        >
                          <span className={cn('grid h-9 w-9 place-items-center rounded-lg bg-gradient-to-br text-white', c.gradient)}>
                            <Icon name={c.icon} width={18} height={18} />
                          </span>
                          <span className="text-sm font-medium text-ink-800">{c.name}</span>
                        </Link>
                      ))}
                    </div>
                  </div>
                ) : results.length > 0 ? (
                  <ul className="flex flex-col gap-1">
                    {results.map((p) => (
                      <li key={p.id}>
                        <Link
                          to={`/product/${p.slug}`}
                          onClick={onClose}
                          className="flex items-center gap-3 rounded-2xl p-2.5 transition hover:bg-white"
                        >
                          <ProductVisual
                            colorway={p.colorway}
                            glyph={p.glyph}
                            className="h-14 w-14 shrink-0 rounded-xl"
                          />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-ink-900">{p.name}</p>
                            <p className="text-xs text-ink-500">{p.brand}</p>
                          </div>
                          <span className="tnum shrink-0 text-sm font-bold text-ink-950">
                            {formatSAR(p.price)}
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="p-10 text-center">
                    <p className="text-ink-500">لا توجد نتائج لـ «{query}»</p>
                    <p className="mt-1 text-sm text-ink-400">جرّب كلمة أخرى أو تصفّح الأقسام</p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
