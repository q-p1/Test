import type { SVGProps } from 'react';
import type { IconName } from '../../lib/data';

type IconProps = SVGProps<SVGSVGElement> & { name: IconName | UiIcon };

export type UiIcon =
  | 'search'
  | 'cart'
  | 'menu'
  | 'close'
  | 'arrow-left'
  | 'arrow-up'
  | 'chevron-left'
  | 'chevron-down'
  | 'heart'
  | 'star'
  | 'check'
  | 'plus'
  | 'minus'
  | 'truck'
  | 'shield-check'
  | 'lock'
  | 'sparkle'
  | 'user'
  | 'phone'
  | 'mail'
  | 'location'
  | 'instagram'
  | 'x'
  | 'tiktok'
  | 'snapchat';

/**
 * Single clean, consistent line-icon set (1.6 stroke, round caps).
 * Kept inline for zero network cost and crisp RTL rendering.
 */
const paths: Record<string, JSX.Element> = {
  // category glyphs
  camera: (
    <>
      <path d="M3 8.5A2.5 2.5 0 0 1 5.5 6h1.2a2 2 0 0 0 1.7-.9l.6-.9A2 2 0 0 1 10.7 3h2.6a2 2 0 0 1 1.7.9l.6.9a2 2 0 0 0 1.7.9h1.2A2.5 2.5 0 0 1 21 8.5v8A2.5 2.5 0 0 1 18.5 19h-13A2.5 2.5 0 0 1 3 16.5z" />
      <circle cx="12" cy="12.5" r="3.5" />
    </>
  ),
  apple: (
    <>
      <path d="M16 3.5c0 1.4-1.2 3-2.7 2.9-.2-1.4 1.3-3 2.7-2.9Z" />
      <path d="M18.8 16.7c-.5 1.2-1.2 2.5-2.3 3.6-.8.8-1.5 1.3-2.4 1.3-1 0-1.3-.6-2.6-.6s-1.6.6-2.6.6c-.9 0-1.6-.6-2.4-1.4C3.2 17.7 2.4 13.4 4.6 11c1-1.2 2.2-1.8 3.4-1.8 1.2 0 1.9.7 2.9.7s1.7-.7 3-.7c.9 0 2.4.3 3.4 1.7-3 1.7-2.5 5.5 1.5 5.8Z" />
    </>
  ),
  shield: (
    <path d="M12 3 5 5.7v5.1c0 4.1 2.9 7.9 7 9.2 4.1-1.3 7-5.1 7-9.2V5.7L12 3Z" />
  ),
  'shield-check': (
    <>
      <path d="M12 3 5 5.7v5.1c0 4.1 2.9 7.9 7 9.2 4.1-1.3 7-5.1 7-9.2V5.7L12 3Z" />
      <path d="m9 11.5 2 2 4-4" />
    </>
  ),
  battery: (
    <>
      <rect x="3" y="7" width="15" height="10" rx="2.5" />
      <path d="M21 10.5v3" />
      <path d="m11 9-2 3.2h2.6L9.5 15" />
    </>
  ),
  cable: (
    <>
      <path d="M7 3v3a2 2 0 0 0 2 2h0a2 2 0 0 0 2-2V3" />
      <path d="M9 8v4a3 3 0 0 0 3 3h0a3 3 0 0 1 3 3v3" />
      <rect x="6" y="1.5" width="6" height="2" rx="1" />
    </>
  ),
  headphones: (
    <>
      <path d="M4 13v-1a8 8 0 0 1 16 0v1" />
      <rect x="3" y="13" width="4" height="7" rx="2" />
      <rect x="17" y="13" width="4" height="7" rx="2" />
    </>
  ),
  tag: (
    <>
      <path d="M3.5 12.5 12 4h6.5a1.5 1.5 0 0 1 1.5 1.5V12l-8.5 8.5a1.5 1.5 0 0 1-2.1 0l-5.9-5.9a1.5 1.5 0 0 1 0-2.1Z" />
      <circle cx="16" cy="8" r="1.3" />
    </>
  ),
  // UI icons
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.2-3.2" />
    </>
  ),
  cart: (
    <>
      <path d="M3 4h2l2.2 12.2a1.5 1.5 0 0 0 1.5 1.3h8.4a1.5 1.5 0 0 0 1.5-1.2L20.5 8H6" />
      <circle cx="9.5" cy="20" r="1.2" />
      <circle cx="17.5" cy="20" r="1.2" />
    </>
  ),
  menu: (
    <>
      <path d="M4 7h16" />
      <path d="M4 12h16" />
      <path d="M4 17h10" />
    </>
  ),
  close: (
    <>
      <path d="m6 6 12 12" />
      <path d="m18 6-12 12" />
    </>
  ),
  'arrow-left': (
    <>
      <path d="M19 12H5" />
      <path d="m12 5-7 7 7 7" />
    </>
  ),
  'arrow-up': (
    <>
      <path d="M12 19V5" />
      <path d="m5 12 7-7 7 7" />
    </>
  ),
  'chevron-left': <path d="m15 6-6 6 6 6" />,
  'chevron-down': <path d="m6 9 6 6 6-6" />,
  heart: (
    <path d="M12 20s-7-4.35-9.2-8.3C1.1 8.9 2.5 5.5 5.8 5.5c1.9 0 3.2 1.1 4.2 2.3 1-1.2 2.3-2.3 4.2-2.3 3.3 0 4.7 3.4 3 6.2C19 15.65 12 20 12 20Z" />
  ),
  star: (
    <path d="m12 3.5 2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 17l-5.2 2.6 1-5.8-4.3-4.1 5.9-.9L12 3.5Z" />
  ),
  check: <path d="m5 12.5 4.5 4.5L19 7" />,
  plus: (
    <>
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </>
  ),
  minus: <path d="M5 12h14" />,
  truck: (
    <>
      <path d="M3 6h11v9H3z" />
      <path d="M14 9h4l3 3v3h-7" />
      <circle cx="7" cy="18" r="1.6" />
      <circle cx="17.5" cy="18" r="1.6" />
    </>
  ),
  lock: (
    <>
      <rect x="5" y="10" width="14" height="10" rx="2.5" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
    </>
  ),
  sparkle: (
    <path d="M12 3c.4 3.6 1.4 4.6 5 5-3.6.4-4.6 1.4-5 5-.4-3.6-1.4-4.6-5-5 3.6-.4 4.6-1.4 5-5Z" />
  ),
  user: (
    <>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 20a7 7 0 0 1 14 0" />
    </>
  ),
  phone: (
    <path d="M6 3h3l1.5 5-2 1.2a12 12 0 0 0 5.3 5.3l1.2-2 5 1.5v3a2 2 0 0 1-2.2 2A17 17 0 0 1 4 6.2 2 2 0 0 1 6 4Z" />
  ),
  mail: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="2.5" />
      <path d="m4 7 8 6 8-6" />
    </>
  ),
  location: (
    <>
      <path d="M12 21c4-4.5 7-7.6 7-11a7 7 0 1 0-14 0c0 3.4 3 6.5 7 11Z" />
      <circle cx="12" cy="10" r="2.4" />
    </>
  ),
  instagram: (
    <>
      <rect x="4" y="4" width="16" height="16" rx="5" />
      <circle cx="12" cy="12" r="3.5" />
      <circle cx="17" cy="7" r="0.6" fill="currentColor" stroke="none" />
    </>
  ),
  x: <path d="M4 4l16 16M20 4 4 20" />,
  tiktok: (
    <path d="M14 4v9.5a3.5 3.5 0 1 1-3-3.46V13a1.2 1.2 0 1 0 1.2 1.2V4H14a4.2 4.2 0 0 0 4 3.2v2.2A6.3 6.3 0 0 1 14 8Z" />
  ),
  snapchat: (
    <path d="M12 3.5c2.4 0 3.8 1.8 3.8 4.1 0 1 .1 1.6.1 1.6.4.3 1.2 0 1.5.5.2.4-.3.9-1.2 1.3-.3.1-.4.3-.3.6.4 1.2 1.6 2.4 2.9 2.7.4.1.5.5.2.8-.6.5-1.7.5-2.1 1-.2.3 0 .9-.5 1-.6.1-1.3-.4-2.4-.1-1 .3-1.6 1.4-3.3 1.4s-2.3-1.1-3.3-1.4c-1.1-.3-1.8.2-2.4.1-.5-.1-.3-.7-.5-1-.4-.5-1.5-.5-2.1-1-.3-.3-.2-.7.2-.8 1.3-.3 2.5-1.5 2.9-2.7.1-.3 0-.5-.3-.6-.9-.4-1.4-.9-1.2-1.3.3-.5 1.1-.2 1.5-.5 0 0 .1-.6.1-1.6C8.2 5.3 9.6 3.5 12 3.5Z" />
  ),
};

export function Icon({ name, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      width={20}
      height={20}
      {...props}
    >
      {paths[name] ?? null}
    </svg>
  );
}
