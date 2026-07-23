import { motion } from 'framer-motion';
import type { UiIcon } from '../ui/Icon';
import { Icon } from '../ui/Icon';
import { SectionHeading } from '../ui/SectionHeading';

const values: { icon: UiIcon; title: string; text: string }[] = [
  {
    icon: 'shield-check',
    title: 'أصالة مضمونة',
    text: 'كل منتج أصلي ١٠٠٪ ويأتي بضمان معتمد من الوكيل الرسمي، لتشتري باطمئنان.',
  },
  {
    icon: 'truck',
    title: 'شحن سريع وموثوق',
    text: 'نوصل طلبك خلال ٢٤ ساعة داخل المدن الرئيسية مع تتبّع مباشر لكل خطوة.',
  },
  {
    icon: 'phone',
    title: 'دعم فني حقيقي',
    text: 'فريق من الخبراء جاهز لمساعدتك قبل وبعد الشراء عبر قنواتنا المختلفة.',
  },
  {
    icon: 'lock',
    title: 'دفع مرن وآمن',
    text: 'ادفع بمدى أو أبل باي أو قسّط عبر تابي وتمارا بدون فوائد وبكل خصوصية.',
  },
];

export function WhyHope() {
  return (
    <section className="container-content py-20 sm:py-28">
      <SectionHeading
        eyebrow="لماذا هوب"
        title="تجربة تسوّق تليق بثقتك"
        description="نبني علاقتنا معك على الأصالة والسرعة والدعم — لأن رضاك هو معيار نجاحنا."
        align="center"
        className="mb-14"
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {values.map((v, i) => (
          <motion.div
            key={v.title}
            initial={{ opacity: 0, y: 28 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.6, delay: Math.min(i * 0.08, 0.4), ease: [0.16, 1, 0.3, 1] }}
            className="group relative overflow-hidden rounded-3xl border border-ink-950/[0.06] bg-white p-7 shadow-soft transition-all duration-500 hover:-translate-y-1 hover:shadow-card"
          >
            <div className="mb-5 grid h-14 w-14 place-items-center rounded-2xl bg-accent-gradient text-white shadow-glow transition-transform duration-500 group-hover:scale-110">
              <Icon name={v.icon} width={26} height={26} />
            </div>
            <h3 className="text-lg font-bold text-ink-950">{v.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-ink-500">{v.text}</p>
            <span className="tnum absolute end-6 top-6 font-display text-4xl font-black text-ink-950/[0.04]">
              0{i + 1}
            </span>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
