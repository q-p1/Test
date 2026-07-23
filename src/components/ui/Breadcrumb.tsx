import { Link } from 'react-router-dom';
import { Icon } from './Icon';

export function Breadcrumb({ items }: { items: { label: string; to?: string }[] }) {
  return (
    <nav aria-label="مسار التنقّل" className="flex items-center gap-1.5 text-sm text-ink-500">
      {items.map((it, i) => (
        <span key={i} className="flex items-center gap-1.5">
          {it.to ? (
            <Link to={it.to} className="transition hover:text-ink-900">
              {it.label}
            </Link>
          ) : (
            <span className="font-medium text-ink-900">{it.label}</span>
          )}
          {i < items.length - 1 && (
            <Icon name="chevron-left" width={14} height={14} className="text-ink-300" />
          )}
        </span>
      ))}
    </nav>
  );
}
