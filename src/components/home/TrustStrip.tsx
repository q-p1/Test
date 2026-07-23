import type { UiIcon } from '../ui/Icon';
import { Icon } from '../ui/Icon';

const items: { icon: UiIcon; title: string; sub: string }[] = [
  { icon: 'shield-check', title: 'منتجات أصلية ١٠٠٪', sub: 'ضمان معتمد على كل قطعة' },
  { icon: 'truck', title: 'شحن سريع', sub: 'توصيل خلال ٢٤ ساعة' },
  { icon: 'lock', title: 'دفع آمن', sub: 'مدى، أبل باي، تابي وتمارا' },
  { icon: 'phone', title: 'دعم فني مباشر', sub: 'خبراء جاهزون لمساعدتك' },
];

export function TrustStrip() {
  return (
    <section aria-label="مزايا المتجر" className="relative z-10 -mt-2">
      <div className="container-content">
        <div className="grid grid-cols-2 gap-3 rounded-3xl border border-ink-950/[0.06] bg-white/70 p-3 shadow-soft backdrop-blur lg:grid-cols-4">
          {items.map((it) => (
            <div
              key={it.title}
              className="flex items-center gap-3 rounded-2xl p-3 transition-colors hover:bg-paper-100"
            >
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-accent-500/10 text-accent-600">
                <Icon name={it.icon} width={22} height={22} />
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-ink-950">{it.title}</p>
                <p className="truncate text-xs text-ink-500">{it.sub}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
