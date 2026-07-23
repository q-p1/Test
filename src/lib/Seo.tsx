import { useEffect } from 'react';

interface SeoProps {
  title: string;
  description?: string;
  /** JSON-LD structured data object */
  jsonLd?: Record<string, unknown>;
}

function setMeta(name: string, content: string, attr: 'name' | 'property' = 'name') {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${name}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, name);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

/** Declarative document-head manager (title, description, OG, JSON-LD). */
export function Seo({ title, description, jsonLd }: SeoProps) {
  useEffect(() => {
    document.title = title;
    if (description) {
      setMeta('description', description);
      setMeta('og:description', description, 'property');
    }
    setMeta('og:title', title, 'property');

    let script: HTMLScriptElement | null = null;
    if (jsonLd) {
      script = document.createElement('script');
      script.type = 'application/ld+json';
      script.setAttribute('data-seo', 'route');
      script.textContent = JSON.stringify(jsonLd);
      document.head.appendChild(script);
    }
    return () => {
      script?.remove();
    };
  }, [title, description, jsonLd]);

  return null;
}
