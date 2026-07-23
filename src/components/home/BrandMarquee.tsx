import { brands } from '../../lib/data';
import { Marquee } from '../ui/Marquee';
import { Reveal } from '../ui/Reveal';

export function BrandMarquee() {
  return (
    <section aria-label="العلامات التجارية" className="border-y hairline bg-white/50 py-12">
      <div className="container-content">
        <Reveal fade className="mb-8 text-center">
          <p className="text-sm font-medium text-ink-400">
            علامات عالمية موثوقة نفخر بتقديمها
          </p>
        </Reveal>
      </div>
      <Marquee>
        {brands.map((b) => (
          <span
            key={b}
            className="select-none font-display text-3xl font-bold text-ink-300 transition-colors duration-300 hover:text-ink-900 sm:text-4xl"
          >
            {b}
          </span>
        ))}
      </Marquee>
    </section>
  );
}
