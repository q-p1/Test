import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Icon } from '../ui/Icon';
import { Marquee } from '../ui/Marquee';

const messages = [
  'شحن مجاني للطلبات فوق ٢٠٠ ريال',
  'منتجات أصلية ١٠٠٪ مع ضمان معتمد',
  'أجهزة أبل بالتقسيط بدون فوائد',
  'إرجاع مجاني خلال ١٤ يوماً',
];

export function AnnouncementBar() {
  const [open, setOpen] = useState(true);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ height: 0 }}
          animate={{ height: 'auto' }}
          exit={{ height: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="relative overflow-hidden bg-ink-gradient text-white"
        >
          <div className="relative flex items-center">
            <Marquee className="flex-1 py-2.5 text-[13px] font-medium text-white/85">
              {messages.map((m, i) => (
                <span key={i} className="flex items-center gap-3">
                  <Icon name="sparkle" width={13} height={13} className="text-gold" />
                  {m}
                </span>
              ))}
            </Marquee>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="إغلاق الشريط"
              className="absolute end-2 grid h-7 w-7 place-items-center rounded-full text-white/60 transition hover:bg-white/10 hover:text-white"
            >
              <Icon name="close" width={15} height={15} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
