import { Icon, type IconName } from './Icon';

export type AppPage = 'today' | 'school' | 'fitness' | 'library' | 'settings';

const items: Array<{ id: AppPage; label: string; icon: IconName }> = [
  { id: 'today', label: 'اليوم', icon: 'today' },
  { id: 'school', label: 'المدرسة', icon: 'school' },
  { id: 'fitness', label: 'الرياضة', icon: 'fitness' },
  { id: 'library', label: 'التمارين', icon: 'library' },
  { id: 'settings', label: 'الإعدادات', icon: 'settings' },
];

export function BottomNavigation({ page, onChange }: { page: AppPage; onChange(page: AppPage): void }) {
  return (
    <nav className="bottom-nav" aria-label="التنقل الرئيسي">
      <div className="bottom-nav__inner">
        {items.map((item) => (
          <button
            type="button"
            key={item.id}
            className={page === item.id ? 'bottom-nav__item is-active' : 'bottom-nav__item'}
            aria-current={page === item.id ? 'page' : undefined}
            onClick={() => onChange(item.id)}
          >
            <Icon name={item.icon} />
            <span>{item.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}
