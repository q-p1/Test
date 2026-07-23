import { Icon } from './Icon';
import type { IconName } from '../../lib/data';
import { cn } from '../../lib/utils';

/**
 * Premium, self-contained product "render". Instead of hotlinking copyrighted
 * product photos, we compose a refined studio-style visual: a soft gradient
 * field, radial glow, fine grid, and the product's category glyph — consistent,
 * on-brand, and fast. Swap for real photography by replacing this component.
 */
export function ProductVisual({
  colorway,
  glyph,
  brand,
  className,
  glyphClassName,
}: {
  colorway: [string, string];
  glyph: IconName;
  brand?: string;
  className?: string;
  glyphClassName?: string;
}) {
  const [c1, c2] = colorway;
  return (
    <div
      className={cn(
        'relative flex items-center justify-center overflow-hidden',
        className,
      )}
      style={{ background: `linear-gradient(150deg, ${c1} 0%, ${c2} 100%)` }}
    >
      {/* radial glow */}
      <div
        className="absolute -top-1/4 start-1/2 h-3/4 w-3/4 -translate-x-1/2 rounded-full opacity-60 blur-2xl"
        style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.5), transparent 70%)' }}
      />
      {/* fine grid */}
      <div
        className="absolute inset-0 opacity-[0.08]"
        style={{
          backgroundImage:
            'linear-gradient(to right, #fff 1px, transparent 1px), linear-gradient(to bottom, #fff 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }}
      />
      {/* device glyph */}
      <div className="relative flex h-[46%] w-[46%] items-center justify-center rounded-[28px] bg-white/10 backdrop-blur-sm ring-1 ring-white/20">
        <Icon
          name={glyph}
          className={cn('h-1/2 w-1/2 text-white/95', glyphClassName)}
          strokeWidth={1.2}
        />
      </div>
      {brand && (
        <span className="absolute bottom-4 start-5 text-xs font-semibold uppercase tracking-[0.2em] text-white/70">
          {brand}
        </span>
      )}
      {/* sheen */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-white/5" />
    </div>
  );
}
