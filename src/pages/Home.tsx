import { Seo } from '../lib/Seo';
import { Hero } from '../components/home/Hero';
import { TrustStrip } from '../components/home/TrustStrip';
import { Categories } from '../components/home/Categories';
import { FeaturedProducts } from '../components/home/FeaturedProducts';
import { Offers } from '../components/home/Offers';
import { BrandMarquee } from '../components/home/BrandMarquee';
import { WhyHope } from '../components/home/WhyHope';
import { Testimonials } from '../components/home/Testimonials';
import { Newsletter } from '../components/home/Newsletter';

export default function Home() {
  return (
    <>
      <Seo
        title="هوب | متجر التقنية الأصلية في السعودية"
        description="اكتشف أحدث المنتجات التقنية الأصلية وملحقاتها من هوب — أجهزة أبل بالتقسيط، كاميرات، سماعات، بطاريات، وأكثر. شحن سريع وضمان معتمد."
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'WebSite',
          name: 'هوب',
          url: 'https://hope.sa/ar',
          potentialAction: {
            '@type': 'SearchAction',
            target: 'https://hope.sa/ar/shop?q={search_term_string}',
            'query-input': 'required name=search_term_string',
          },
        }}
      />
      <Hero />
      <TrustStrip />
      <Categories />
      <FeaturedProducts />
      <Offers />
      <BrandMarquee />
      <WhyHope />
      <Testimonials />
      <Newsletter />
    </>
  );
}
