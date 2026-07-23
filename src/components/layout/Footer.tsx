import { Link } from 'react-router-dom';
import { categories } from '../../lib/data';
import { Icon } from '../ui/Icon';
import type { UiIcon } from '../ui/Icon';
import { Logo } from './Logo';
import { useSmoothScroll } from '../../lib/smoothScroll';

const columns = [
  {
    title: 'التسوّق',
    links: [
      { label: 'كل المنتجات', to: '/shop' },
      { label: 'العروض والخصومات', to: '/shop?filter=deals' },
      { label: 'أجهزة أبل بالتقسيط', to: '/shop?cat=apple' },
      { label: 'الأكثر مبيعاً', to: '/shop' },
    ],
  },
  {
    title: 'خدمة العملاء',
    links: [
      { label: 'تتبّع طلبك', to: '/shop' },
      { label: 'الشحن والتوصيل', to: '/shop' },
      { label: 'الإرجاع والاستبدال', to: '/shop' },
      { label: 'الأسئلة الشائعة', to: '/shop' },
    ],
  },
  {
    title: 'عن هوب',
    links: [
      { label: 'قصتنا', to: '/shop' },
      { label: 'الفروع', to: '/shop' },
      { label: 'الوظائف', to: '/shop' },
      { label: 'تواصل معنا', to: '/shop' },
    ],
  },
];

const socials: { icon: UiIcon; label: string; href: string }[] = [
  { icon: 'instagram', label: 'انستغرام', href: '#' },
  { icon: 'x', label: 'إكس', href: '#' },
  { icon: 'tiktok', label: 'تيك توك', href: '#' },
  { icon: 'snapchat', label: 'سناب شات', href: '#' },
];

const payments = ['mada', 'Visa', 'Mastercard', 'Apple Pay', 'tabby', 'Tamara'];

export function Footer() {
  const { scrollTo } = useSmoothScroll();

  return (
    <footer className="relative mt-24 overflow-hidden bg-ink-gradient text-white">
      {/* glow */}
      <div className="pointer-events-none absolute inset-0 bg-mesh opacity-40" />

      <div className="container-content relative">
        {/* CTA row */}
        <div className="flex flex-col items-center gap-6 border-b border-white/10 py-16 text-center">
          <h2 className="max-w-2xl text-display-md font-extrabold text-white">
            تقنية أصلية، تجربة استثنائية
          </h2>
          <p className="max-w-md text-white/60">
            انضم إلى آلاف العملاء الذين يثقون بـ«هوب» لكل ما هو أصلي في عالم التقنية.
          </p>
          <Link
            to="/shop"
            className="flex h-14 items-center gap-2 rounded-full bg-white px-9 text-base font-semibold text-ink-950 transition hover:bg-gold"
          >
            ابدأ التسوّق
            <Icon name="arrow-left" width={20} height={20} />
          </Link>
        </div>

        {/* Main */}
        <div className="grid gap-10 py-16 md:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <Logo tone="light" />
            <p className="mt-5 max-w-xs text-sm leading-relaxed text-white/55">
              علامة سعودية متخصّصة في بيع المنتجات التقنية الأصلية وملحقاتها، بجودة عالية وشحن سريع
              ودعم فني مباشر.
            </p>
            <div className="mt-6 flex flex-col gap-3 text-sm text-white/70">
              <a href="tel:+966920000000" className="flex items-center gap-2.5 transition hover:text-white">
                <Icon name="phone" width={18} height={18} className="text-gold" />
                ٩٢٠ ٠٠٠ ٠٠٠
              </a>
              <a href="mailto:care@hope.sa" className="flex items-center gap-2.5 transition hover:text-white">
                <Icon name="mail" width={18} height={18} className="text-gold" />
                care@hope.sa
              </a>
              <span className="flex items-center gap-2.5">
                <Icon name="location" width={18} height={18} className="text-gold" />
                الرياض، المملكة العربية السعودية
              </span>
            </div>
          </div>

          {columns.map((col) => (
            <nav key={col.title} aria-label={col.title}>
              <h3 className="mb-4 text-sm font-bold text-white">{col.title}</h3>
              <ul className="flex flex-col gap-3">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <Link to={l.to} className="text-sm text-white/55 transition hover:text-white">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        {/* Category chips */}
        <div className="flex flex-wrap gap-2 border-t border-white/10 py-8">
          {categories.map((c) => (
            <Link
              key={c.id}
              to={`/shop?cat=${c.id}`}
              className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs text-white/70 transition hover:border-white/25 hover:text-white"
            >
              {c.name}
            </Link>
          ))}
        </div>

        {/* Bottom */}
        <div className="flex flex-col gap-6 border-t border-white/10 py-8 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            {socials.map((s) => (
              <a
                key={s.label}
                href={s.href}
                aria-label={s.label}
                className="grid h-10 w-10 place-items-center rounded-full border border-white/10 bg-white/5 text-white/70 transition hover:bg-white hover:text-ink-950"
              >
                <Icon name={s.icon} width={18} height={18} />
              </a>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {payments.map((p) => (
              <span
                key={p}
                className="rounded-lg bg-white/90 px-2.5 py-1.5 text-[11px] font-bold text-ink-800"
              >
                {p}
              </span>
            ))}
          </div>
        </div>

        <div className="flex flex-col items-center justify-between gap-4 border-t border-white/10 py-6 text-xs text-white/40 sm:flex-row">
          <p>© ٢٠٢٦ هوب. جميع الحقوق محفوظة.</p>
          <div className="flex items-center gap-5">
            <Link to="/shop" className="transition hover:text-white">
              سياسة الخصوصية
            </Link>
            <Link to="/shop" className="transition hover:text-white">
              الشروط والأحكام
            </Link>
            <button
              type="button"
              onClick={() => scrollTo(0)}
              className="flex items-center gap-1.5 transition hover:text-white"
            >
              للأعلى
              <Icon name="arrow-up" width={14} height={14} />
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
