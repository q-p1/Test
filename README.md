# هوب — Hope Store

A ground‑up redesign and rebuild of **[hope.sa/ar](https://hope.sa/ar)** — an
Arabic‑first, Awwwards‑grade premium e‑commerce experience for Hope Trade Store,
a Saudi retailer of authentic tech products & accessories.

The brand, catalog, partner brands, and business goals are preserved; the
experience is rebuilt to feel as polished as Apple, Linear, Stripe and Nothing.

> See [`docs/UX-AUDIT.md`](docs/UX-AUDIT.md) for the full UX audit of the live site
> and the rationale behind every change.

---

## ✨ Highlights

- **Minimal‑luxury design system** — warm paper + near‑black ink, a single
  signature accent, smooth gradients, soft shadows, glassmorphism on floating
  layers, consistent radius, and an **8px spacing system**.
- **Arabic‑first & fully RTL** — logical properties, mirrored motion, Arabic type
  (IBM Plex Sans Arabic + Tajawal), tabular numerals for prices.
- **Premium interactions** — GSAP + ScrollTrigger reveals & hero parallax, Lenis
  smooth scroll, Framer Motion page transitions / overlays / hover, magnetic
  buttons, a subtle desktop cursor, floating mobile CTA, loading skeletons —
  **all gated behind `prefers-reduced-motion`**.
- **Complete commerce flow** — home, shop (filter + sort + skeletons), product
  detail, slide‑in cart with free‑shipping progress, and a **premium multi‑step
  checkout** with a persistent order summary.
- **Accessible (WCAG AA)** — semantic landmarks, skip link, visible focus rings,
  labelled controls, keyboard‑navigable overlays, reduced‑motion support.
- **Fast & SEO‑friendly** — route‑level code splitting, lazy routes, self‑hosted
  fonts, JSON‑LD structured data, Open Graph, and semantic markup.

## 🧱 Stack

| Concern            | Choice                                   |
| ------------------ | ---------------------------------------- |
| Framework          | React 18 + TypeScript + Vite             |
| Styling            | Tailwind CSS (RTL, tokenized design system) |
| Scroll animation   | GSAP + ScrollTrigger                     |
| UI animation       | Framer Motion                            |
| Smooth scroll      | Lenis                                    |
| Routing            | React Router (lazy, code‑split)          |
| Fonts              | `@fontsource` (self‑hosted, no external requests) |

## 🚀 Getting started

```bash
npm install       # install dependencies
npm run dev       # start the dev server
npm run build     # type-check + production build → dist/
npm run preview   # preview the production build
```

## 🗂️ Structure

```
src/
├─ lib/            # data, cart state, smooth scroll, SEO, utils, hooks
├─ components/
│  ├─ ui/          # design-system primitives (Button, Reveal, Icon, cards…)
│  ├─ layout/      # header, footer, cart drawer, search, cursor, transitions
│  ├─ home/        # homepage sections (hero, categories, offers, testimonials…)
│  └─ product/     # product card
└─ pages/          # Home, Shop, Product, Checkout, NotFound (all lazy-loaded)
```

## 🎨 Design tokens

- **Spacing** — Tailwind's 4px‑based scale (contains every 8px step) + one `13`
  step for controls.
- **Color** — `paper`, `ink` (9 steps), a single `accent` (indigo→violet), and a
  `gold` champagne micro‑accent.
- **Type** — fluid `display-*` scale; `IBM Plex Sans Arabic` for text, `Tajawal`
  for display.
- **Motion** — `out-expo` / `in-out-soft` easings, tokenized shadows and gradients.

## 🖼️ Product imagery

Product photos are represented by a self‑contained, on‑brand `ProductVisual`
studio render (gradient field + glyph) so the build ships with **zero external or
copyrighted assets**. Swap `src/components/ui/ProductVisual.tsx` for real
photography to go live.

## ♿ Accessibility & motion

Every animated affordance checks `prefers-reduced-motion`. Parallax, smooth
scroll, the custom cursor, and magnetic effects are disabled for users who opt
out, and scroll reveals fall back to fully visible content.
