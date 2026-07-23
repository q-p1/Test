import { Link } from 'react-router-dom';
import { Seo } from '../lib/Seo';
import { Icon } from '../components/ui/Icon';

export default function NotFound() {
  return (
    <div className="grid min-h-[70vh] place-items-center bg-paper-glow px-5">
      <Seo title="الصفحة غير موجودة | هوب" />
      <div className="text-center">
        <p className="text-gradient font-display text-[120px] font-black leading-none sm:text-[180px]">
          ٤٠٤
        </p>
        <h1 className="mt-2 text-display-sm font-extrabold text-ink-950">هذه الصفحة غير موجودة</h1>
        <p className="mx-auto mt-3 max-w-sm text-ink-500">
          ربما تم نقل الصفحة أو حذفها. دعنا نعيدك إلى المسار الصحيح.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            to="/"
            className="flex h-13 items-center gap-2 rounded-full bg-ink-950 px-7 py-3.5 font-semibold text-white transition hover:bg-accent-500"
          >
            <Icon name="arrow-left" width={18} height={18} />
            العودة للرئيسية
          </Link>
          <Link
            to="/shop"
            className="flex items-center gap-2 rounded-full border hairline bg-white px-7 py-3.5 font-semibold text-ink-900 transition hover:border-ink-950/25"
          >
            تصفّح المتجر
          </Link>
        </div>
      </div>
    </div>
  );
}
