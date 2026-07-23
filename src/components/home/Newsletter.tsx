import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon } from '../ui/Icon';
import { Reveal } from '../ui/Reveal';

export function Newsletter() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes('@')) return;
    setSent(true);
    setEmail('');
    setTimeout(() => setSent(false), 4000);
  };

  return (
    <section className="container-content py-20 sm:py-28">
      <Reveal>
        <div className="relative overflow-hidden rounded-4xl border border-ink-950/[0.06] bg-white p-8 shadow-card sm:p-14">
          <div className="pointer-events-none absolute -end-16 -top-16 h-64 w-64 rounded-full bg-accent-500/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-16 -start-16 h-64 w-64 rounded-full bg-gold/10 blur-3xl" />

          <div className="relative mx-auto max-w-xl text-center">
            <span className="mx-auto mb-5 grid h-14 w-14 place-items-center rounded-2xl bg-accent-gradient text-white shadow-glow">
              <Icon name="mail" width={26} height={26} />
            </span>
            <h2 className="text-display-sm font-extrabold text-ink-950 sm:text-display-md">
              كن أول من يعرف
            </h2>
            <p className="mt-3 text-ink-500">
              اشترك في نشرتنا واحصل على <span className="font-semibold text-accent-600">خصم ١٠٪</span> على
              طلبك الأول، مع أحدث العروض والمنتجات.
            </p>

            <form onSubmit={submit} className="mx-auto mt-8 flex max-w-md flex-col gap-3 sm:flex-row">
              <div className="relative flex-1">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="بريدك الإلكتروني"
                  aria-label="البريد الإلكتروني"
                  className="h-14 w-full rounded-full border border-ink-950/10 bg-paper-50 px-6 text-ink-950 outline-none transition focus:border-accent-400 focus:ring-2 focus:ring-accent-200"
                />
              </div>
              <button
                type="submit"
                className="h-14 shrink-0 rounded-full bg-ink-950 px-8 font-semibold text-white transition hover:bg-accent-500"
              >
                اشترك الآن
              </button>
            </form>

            <AnimatePresence>
              {sent && (
                <motion.p
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="mt-4 flex items-center justify-center gap-2 text-sm font-medium text-success"
                >
                  <Icon name="check" width={16} height={16} />
                  تم الاشتراك بنجاح! تحقّق من بريدك للحصول على الخصم.
                </motion.p>
              )}
            </AnimatePresence>

            <p className="mt-4 text-xs text-ink-400">
              نحترم خصوصيتك — يمكنك إلغاء الاشتراك في أي وقت.
            </p>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
