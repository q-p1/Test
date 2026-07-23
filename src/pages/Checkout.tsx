import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useCart, FREE_SHIPPING_THRESHOLD } from '../lib/cart';
import { formatSAR, toArabicDigits, cn } from '../lib/utils';
import { Seo } from '../lib/Seo';
import { Icon } from '../components/ui/Icon';
import type { UiIcon } from '../components/ui/Icon';
import { ProductVisual } from '../components/ui/ProductVisual';
import { Breadcrumb } from '../components/ui/Breadcrumb';

const steps = ['المعلومات', 'الشحن', 'الدفع'];

const shippingMethods = [
  { id: 'express', label: 'توصيل سريع', sub: 'خلال ٢٤ ساعة', price: 25, icon: 'truck' as UiIcon },
  { id: 'standard', label: 'توصيل قياسي', sub: '٢–٤ أيام عمل', price: 0, icon: 'truck' as UiIcon },
  { id: 'pickup', label: 'استلام من الفرع', sub: 'جاهز خلال ساعتين', price: 0, icon: 'location' as UiIcon },
];

const paymentMethods = [
  { id: 'mada', label: 'مدى / بطاقة', icon: 'lock' as UiIcon },
  { id: 'apple', label: 'Apple Pay', icon: 'apple' as UiIcon },
  { id: 'tabby', label: 'تقسيط تابي', icon: 'sparkle' as UiIcon },
];

export default function Checkout() {
  const { items, subtotal, count, clear } = useCart();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [shipping, setShipping] = useState('express');
  const [payment, setPayment] = useState('mada');
  const [placed, setPlaced] = useState(false);

  const shippingCost =
    subtotal >= FREE_SHIPPING_THRESHOLD
      ? 0
      : shippingMethods.find((m) => m.id === shipping)?.price ?? 0;
  const vat = Math.round(subtotal * 0.15);
  const total = subtotal + shippingCost;

  if (placed) return <OrderConfirmation onContinue={() => navigate('/shop')} />;

  if (count === 0) {
    return (
      <div className="grid min-h-[60vh] place-items-center bg-paper-glow px-5">
        <Seo title="السلة فارغة | هوب" />
        <div className="text-center">
          <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-ink-950/[0.04] text-ink-300">
            <Icon name="cart" width={36} height={36} />
          </div>
          <h1 className="mt-5 text-display-sm font-extrabold text-ink-950">سلتك فارغة</h1>
          <p className="mt-2 text-ink-500">أضف منتجات لإتمام الشراء</p>
          <Link
            to="/shop"
            className="mt-6 inline-flex h-13 items-center gap-2 rounded-full bg-ink-950 px-7 py-3.5 font-semibold text-white transition hover:bg-accent-500"
          >
            تصفّح المتجر
            <Icon name="arrow-left" width={18} height={18} />
          </Link>
        </div>
      </div>
    );
  }

  const next = () => setStep((s) => Math.min(steps.length - 1, s + 1));
  const back = () => setStep((s) => Math.max(0, s - 1));

  const placeOrder = (e: React.FormEvent) => {
    e.preventDefault();
    setPlaced(true);
    setTimeout(() => clear(), 400);
  };

  return (
    <div className="bg-paper-glow pb-24 pt-6">
      <Seo title="إتمام الشراء | هوب" description="أكمل طلبك بأمان عبر تجربة دفع سلسة." />
      <div className="container-content">
        <Breadcrumb items={[{ label: 'الرئيسية', to: '/' }, { label: 'السلة', to: '/shop' }, { label: 'الدفع' }]} />
        <h1 className="sr-only">إتمام الشراء</h1>

        <div className="mt-6 grid gap-10 lg:grid-cols-[1fr_400px]">
          {/* Left: steps */}
          <div>
            {/* Stepper */}
            <ol className="mb-10 flex items-center gap-2">
              {steps.map((s, i) => (
                <li key={s} className="flex flex-1 items-center gap-2">
                  <span
                    className={cn(
                      'grid h-9 w-9 shrink-0 place-items-center rounded-full text-sm font-bold transition-colors',
                      i < step && 'bg-success text-white',
                      i === step && 'bg-ink-950 text-white',
                      i > step && 'bg-ink-950/[0.06] text-ink-400',
                    )}
                  >
                    {i < step ? <Icon name="check" width={16} height={16} strokeWidth={2.5} /> : toArabicDigits(i + 1)}
                  </span>
                  <span
                    className={cn(
                      'text-sm font-medium',
                      i <= step ? 'text-ink-950' : 'text-ink-400',
                    )}
                  >
                    {s}
                  </span>
                  {i < steps.length - 1 && (
                    <span className={cn('h-px flex-1', i < step ? 'bg-success' : 'bg-ink-950/10')} />
                  )}
                </li>
              ))}
            </ol>

            <form onSubmit={placeOrder}>
              <AnimatePresence mode="wait">
                <motion.div
                  key={step}
                  initial={{ opacity: 0, x: 16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -16 }}
                  transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                >
                  {step === 0 && <InfoStep />}
                  {step === 1 && (
                    <ShippingStep methods={shippingMethods} value={shipping} onChange={setShipping} freeAll={subtotal >= FREE_SHIPPING_THRESHOLD} />
                  )}
                  {step === 2 && (
                    <PaymentStep methods={paymentMethods} value={payment} onChange={setPayment} />
                  )}
                </motion.div>
              </AnimatePresence>

              {/* Nav */}
              <div className="mt-8 flex items-center justify-between gap-3">
                {step > 0 ? (
                  <button
                    type="button"
                    onClick={back}
                    className="flex items-center gap-1.5 rounded-full px-5 py-3 text-sm font-medium text-ink-600 transition hover:text-ink-950"
                  >
                    <Icon name="chevron-left" width={18} height={18} className="rotate-180" />
                    السابق
                  </button>
                ) : (
                  <Link
                    to="/shop"
                    className="flex items-center gap-1.5 rounded-full px-5 py-3 text-sm font-medium text-ink-600 transition hover:text-ink-950"
                  >
                    متابعة التسوّق
                  </Link>
                )}

                {step < steps.length - 1 ? (
                  <button
                    type="button"
                    onClick={next}
                    className="flex h-13 items-center gap-2 rounded-full bg-ink-950 px-8 py-3.5 font-semibold text-white transition hover:bg-accent-500"
                  >
                    متابعة
                    <Icon name="arrow-left" width={18} height={18} />
                  </button>
                ) : (
                  <button
                    type="submit"
                    className="flex h-13 items-center gap-2 rounded-full bg-accent-500 px-8 py-3.5 font-semibold text-white shadow-glow transition hover:bg-accent-600"
                  >
                    <Icon name="lock" width={18} height={18} />
                    ادفع {formatSAR(total)}
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* Right: summary */}
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-3xl border border-ink-950/[0.06] bg-white p-6 shadow-soft">
              <h2 className="mb-4 text-lg font-bold text-ink-950">ملخّص الطلب</h2>

              <ul className="mb-5 flex max-h-64 flex-col gap-3 overflow-y-auto">
                {items.map(({ product, qty }) => (
                  <li key={product.id} className="flex items-center gap-3">
                    <div className="relative">
                      <ProductVisual
                        colorway={product.colorway}
                        glyph={product.glyph}
                        className="h-14 w-14 shrink-0 rounded-xl"
                      />
                      <span className="tnum absolute -end-1.5 -top-1.5 grid h-5 min-w-5 place-items-center rounded-full bg-ink-950 px-1 text-[11px] font-bold text-white">
                        {toArabicDigits(qty)}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-ink-900">{product.name}</p>
                      <p className="text-xs text-ink-500">{product.brand}</p>
                    </div>
                    <span className="tnum shrink-0 text-sm font-bold text-ink-950">
                      {formatSAR(product.price * qty)}
                    </span>
                  </li>
                ))}
              </ul>

              {/* Promo */}
              <div className="mb-5 flex gap-2">
                <input
                  placeholder="كود الخصم"
                  aria-label="كود الخصم"
                  className="h-11 flex-1 rounded-full border hairline bg-paper-50 px-4 text-sm outline-none focus:border-accent-400"
                />
                <button
                  type="button"
                  className="rounded-full bg-ink-950/[0.05] px-4 text-sm font-medium text-ink-700 transition hover:bg-ink-950/10"
                >
                  تطبيق
                </button>
              </div>

              <dl className="space-y-2.5 border-t hairline pt-5 text-sm">
                <Row label={`الإجمالي الفرعي (${toArabicDigits(count)} منتج)`} value={formatSAR(subtotal)} />
                <Row
                  label="الشحن"
                  value={shippingCost === 0 ? 'مجاني' : formatSAR(shippingCost)}
                  valueClass={shippingCost === 0 ? 'text-success' : ''}
                />
                <Row label="شامل ضريبة القيمة المضافة" value={formatSAR(vat)} muted />
              </dl>

              <div className="mt-4 flex items-center justify-between border-t hairline pt-4">
                <span className="font-bold text-ink-950">الإجمالي</span>
                <span className="tnum text-2xl font-extrabold text-ink-950">{formatSAR(total)}</span>
              </div>

              <div className="mt-5 flex items-center justify-center gap-4 rounded-2xl bg-paper-100 py-3 text-xs text-ink-500">
                <span className="flex items-center gap-1">
                  <Icon name="lock" width={14} height={14} /> دفع مشفّر
                </span>
                <span className="flex items-center gap-1">
                  <Icon name="shield-check" width={14} height={14} /> ضمان أصلي
                </span>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  muted,
  valueClass,
}: {
  label: string;
  value: string;
  muted?: boolean;
  valueClass?: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <dt className={cn(muted ? 'text-ink-400' : 'text-ink-600')}>{label}</dt>
      <dd className={cn('tnum font-medium text-ink-900', valueClass)}>{value}</dd>
    </div>
  );
}

function Field({
  label,
  type = 'text',
  placeholder,
  required = true,
  full,
  autoComplete,
}: {
  label: string;
  type?: string;
  placeholder?: string;
  required?: boolean;
  full?: boolean;
  autoComplete?: string;
}) {
  return (
    <label className={cn('flex flex-col gap-1.5', full && 'sm:col-span-2')}>
      <span className="text-sm font-medium text-ink-700">{label}</span>
      <input
        type={type}
        required={required}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className="h-13 rounded-2xl border border-ink-950/10 bg-white px-4 py-3.5 text-ink-950 outline-none transition focus:border-accent-400 focus:ring-2 focus:ring-accent-200"
      />
    </label>
  );
}

function InfoStep() {
  return (
    <fieldset>
      <legend className="mb-5 text-xl font-bold text-ink-950">معلومات التواصل والتوصيل</legend>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="الاسم الكامل" placeholder="محمد العبدالله" autoComplete="name" full />
        <Field label="رقم الجوال" type="tel" placeholder="٥٠ ٠٠٠ ٠٠٠٠" autoComplete="tel" />
        <Field label="البريد الإلكتروني" type="email" placeholder="you@email.com" autoComplete="email" />
        <Field label="المدينة" placeholder="الرياض" autoComplete="address-level2" />
        <Field label="الحي" placeholder="النخيل" required={false} />
        <Field label="العنوان التفصيلي" placeholder="الشارع، رقم المبنى" autoComplete="street-address" full />
      </div>
    </fieldset>
  );
}

function ShippingStep({
  methods,
  value,
  onChange,
  freeAll,
}: {
  methods: typeof shippingMethods;
  value: string;
  onChange: (v: string) => void;
  freeAll: boolean;
}) {
  return (
    <fieldset>
      <legend className="mb-5 text-xl font-bold text-ink-950">طريقة الشحن</legend>
      <div className="flex flex-col gap-3">
        {methods.map((m) => {
          const price = freeAll ? 0 : m.price;
          return (
            <label
              key={m.id}
              className={cn(
                'flex cursor-pointer items-center gap-4 rounded-2xl border-2 bg-white p-4 transition',
                value === m.id ? 'border-accent-500 shadow-soft' : 'border-ink-950/[0.08] hover:border-ink-950/20',
              )}
            >
              <input
                type="radio"
                name="shipping"
                value={m.id}
                checked={value === m.id}
                onChange={() => onChange(m.id)}
                className="sr-only"
              />
              <span
                className={cn(
                  'grid h-11 w-11 place-items-center rounded-xl transition',
                  value === m.id ? 'bg-accent-500 text-white' : 'bg-ink-950/[0.05] text-ink-600',
                )}
              >
                <Icon name={m.icon} width={22} height={22} />
              </span>
              <span className="flex-1">
                <span className="block text-sm font-bold text-ink-950">{m.label}</span>
                <span className="block text-xs text-ink-500">{m.sub}</span>
              </span>
              <span className="tnum text-sm font-bold text-ink-950">
                {price === 0 ? <span className="text-success">مجاني</span> : formatSAR(price)}
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

function PaymentStep({
  methods,
  value,
  onChange,
}: {
  methods: typeof paymentMethods;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <fieldset>
      <legend className="mb-5 text-xl font-bold text-ink-950">طريقة الدفع</legend>
      <div className="mb-6 grid grid-cols-3 gap-3">
        {methods.map((m) => (
          <label
            key={m.id}
            className={cn(
              'flex cursor-pointer flex-col items-center gap-2 rounded-2xl border-2 bg-white p-4 transition',
              value === m.id ? 'border-accent-500 shadow-soft' : 'border-ink-950/[0.08] hover:border-ink-950/20',
            )}
          >
            <input
              type="radio"
              name="payment"
              value={m.id}
              checked={value === m.id}
              onChange={() => onChange(m.id)}
              className="sr-only"
            />
            <Icon name={m.icon} width={24} height={24} className={value === m.id ? 'text-accent-600' : 'text-ink-600'} />
            <span className="text-center text-xs font-semibold text-ink-800">{m.label}</span>
          </label>
        ))}
      </div>

      {value === 'mada' && (
        <div className="grid gap-4 rounded-3xl border hairline bg-white p-5 sm:grid-cols-2">
          <Field label="رقم البطاقة" placeholder="٠٠٠٠ ٠٠٠٠ ٠٠٠٠ ٠٠٠٠" autoComplete="cc-number" full />
          <Field label="تاريخ الانتهاء" placeholder="MM / YY" autoComplete="cc-exp" />
          <Field label="رمز الأمان CVV" placeholder="٠٠٠" autoComplete="cc-csc" />
        </div>
      )}
      {value === 'apple' && (
        <div className="rounded-3xl border hairline bg-white p-8 text-center text-ink-600">
          <Icon name="apple" width={40} height={40} className="mx-auto mb-3 text-ink-900" />
          سيتم تأكيد الدفع عبر Apple Pay عند إتمام الطلب.
        </div>
      )}
      {value === 'tabby' && (
        <div className="rounded-3xl border hairline bg-white p-8 text-center text-ink-600">
          <Icon name="sparkle" width={40} height={40} className="mx-auto mb-3 text-gold" />
          قسّم مشترياتك على ٤ دفعات بدون فوائد. تُدار عبر تابي.
        </div>
      )}

      <p className="mt-5 flex items-center justify-center gap-2 text-xs text-ink-500">
        <Icon name="lock" width={14} height={14} />
        جميع المعاملات مشفّرة ومحمية بمعايير الأمان العالمية.
      </p>
    </fieldset>
  );
}

function OrderConfirmation({ onContinue }: { onContinue: () => void }) {
  const orderNo = toArabicDigits(Math.floor(100000 + Math.random() * 899999));
  return (
    <div className="grid min-h-[70vh] place-items-center bg-paper-glow px-5">
      <Seo title="تم تأكيد الطلب | هوب" />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md rounded-4xl border border-ink-950/[0.06] bg-white p-8 text-center shadow-card sm:p-10"
      >
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.15, type: 'spring', damping: 14 }}
          className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-success text-white"
        >
          <Icon name="check" width={40} height={40} strokeWidth={2.5} />
        </motion.span>
        <h1 className="mt-6 text-display-sm font-extrabold text-ink-950">تم تأكيد طلبك!</h1>
        <p className="mt-2 text-ink-500">
          شكراً لثقتك بـ«هوب». سنرسل تفاصيل الشحن إلى بريدك قريباً.
        </p>
        <div className="mt-6 rounded-2xl bg-paper-100 p-4">
          <p className="text-xs text-ink-500">رقم الطلب</p>
          <p className="tnum mt-1 text-xl font-bold text-ink-950">#{orderNo}</p>
        </div>
        <button
          type="button"
          onClick={onContinue}
          className="mt-6 inline-flex h-13 w-full items-center justify-center gap-2 rounded-full bg-ink-950 py-3.5 font-semibold text-white transition hover:bg-accent-500"
        >
          متابعة التسوّق
          <Icon name="arrow-left" width={18} height={18} />
        </button>
      </motion.div>
    </div>
  );
}
