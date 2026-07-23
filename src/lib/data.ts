/**
 * Catalog data modeled on Hope's real assortment: authentic tech products &
 * accessories from Awei, DDPAI, Zendure, Goui, Apple, ESPES, Maestro, Asir.
 * Prices are illustrative SAR values (VAT-inclusive).
 */

export type CategoryId =
  | 'dashcams'
  | 'apple'
  | 'protection'
  | 'power'
  | 'cables'
  | 'audio'
  | 'deals';

export interface Category {
  id: CategoryId;
  name: string;
  tagline: string;
  count: number;
  /** Tailwind gradient classes for the tile visual */
  gradient: string;
  icon: IconName;
  featured?: boolean;
}

export type IconName =
  | 'camera'
  | 'apple'
  | 'shield'
  | 'battery'
  | 'cable'
  | 'headphones'
  | 'tag';

export interface Product {
  id: string;
  slug: string;
  name: string;
  brand: string;
  category: CategoryId;
  categoryName: string;
  price: number;
  originalPrice?: number;
  rating: number;
  reviews: number;
  badge?: string;
  colorway: [string, string];
  glyph: IconName;
  installments?: boolean;
  inStock: boolean;
  highlight: string;
  features: string[];
}

export const categories: Category[] = [
  {
    id: 'apple',
    name: 'أجهزة أبل',
    tagline: 'بالتقسيط المريح',
    count: 48,
    gradient: 'from-[#1F1F27] to-[#0B0B0F]',
    icon: 'apple',
    featured: true,
  },
  {
    id: 'dashcams',
    name: 'كاميرات السيارة',
    tagline: 'تسجيل بدقة عالية',
    count: 32,
    gradient: 'from-[#3F38C4] to-[#1B1856]',
    icon: 'camera',
    featured: true,
  },
  {
    id: 'audio',
    name: 'سماعات وصوتيات',
    tagline: 'صوت نقي غامر',
    count: 64,
    gradient: 'from-[#7C3AED] to-[#4F46E5]',
    icon: 'headphones',
  },
  {
    id: 'power',
    name: 'بطاريات محمولة',
    tagline: 'طاقة لا تتوقف',
    count: 41,
    gradient: 'from-[#A8894C] to-[#6b5528]',
    icon: 'battery',
  },
  {
    id: 'protection',
    name: 'حمايات وأغطية',
    tagline: 'أناقة تحمي جهازك',
    count: 87,
    gradient: 'from-[#2C2C36] to-[#141419]',
    icon: 'shield',
  },
  {
    id: 'cables',
    name: 'كوابل وحوامل',
    tagline: 'توصيل موثوق',
    count: 56,
    gradient: 'from-[#4F46E5] to-[#322CA0]',
    icon: 'cable',
  },
];

export const products: Product[] = [
  {
    id: 'p1',
    slug: 'ddpai-mola-z60',
    name: 'كاميرا DDPAI مولا Z60 للسيارة',
    brand: 'DDPAI',
    category: 'dashcams',
    categoryName: 'كاميرات السيارة',
    price: 649,
    originalPrice: 799,
    rating: 4.8,
    reviews: 214,
    badge: 'الأكثر مبيعاً',
    colorway: ['#3F38C4', '#141419'],
    glyph: 'camera',
    inStock: true,
    highlight: 'تصوير 4K فائق الوضوح مع رؤية ليلية ونظام مراقبة أثناء الركن.',
    features: ['دقة 4K UHD', 'رؤية ليلية Sony', 'واي فاي 5G', 'مراقبة عند الركن'],
  },
  {
    id: 'p2',
    slug: 'zendure-supertank-pro',
    name: 'بطارية Zendure سوبرتانك برو 26800',
    brand: 'Zendure',
    category: 'power',
    categoryName: 'بطاريات محمولة',
    price: 549,
    originalPrice: 649,
    rating: 4.9,
    reviews: 176,
    badge: 'خصم حصري',
    colorway: ['#A8894C', '#2C2C36'],
    glyph: 'battery',
    inStock: true,
    highlight: 'شحن 100 واط لأربعة أجهزة في آن واحد بجسم من الألمنيوم المطروق.',
    features: ['سعة 26800mAh', 'قدرة 100W', '4 منافذ', 'شاشة ذكية'],
  },
  {
    id: 'p3',
    slug: 'awei-t85-anc',
    name: 'سماعة Awei T85 لاسلكية بعزل الضجيج',
    brand: 'Awei',
    category: 'audio',
    categoryName: 'سماعات وصوتيات',
    price: 229,
    originalPrice: 329,
    rating: 4.6,
    reviews: 312,
    badge: 'جديد',
    colorway: ['#7C3AED', '#4F46E5'],
    glyph: 'headphones',
    inStock: true,
    highlight: 'عزل نشط للضجيج ANC وبطارية تدوم حتى 32 ساعة مع علبة الشحن.',
    features: ['عزل ضجيج ANC', 'بلوتوث 5.3', '32 ساعة تشغيل', 'مقاومة للماء IPX5'],
  },
  {
    id: 'p4',
    slug: 'apple-iphone-16-pro',
    name: 'آيفون 16 برو 256 جيجابايت',
    brand: 'Apple',
    category: 'apple',
    categoryName: 'أجهزة أبل',
    price: 4699,
    rating: 4.9,
    reviews: 528,
    badge: 'تقسيط بدون فوائد',
    colorway: ['#2C2C36', '#0B0B0F'],
    glyph: 'apple',
    installments: true,
    inStock: true,
    highlight: 'شريحة A18 Pro، تصميم تيتانيوم، ونظام كاميرات احترافي.',
    features: ['تيتانيوم', 'شريحة A18 Pro', 'كاميرا 48MP', 'زر التحكم بالكاميرا'],
  },
  {
    id: 'p5',
    slug: 'goui-magsafe-stand',
    name: 'حامل Goui مغناطيسي 3 في 1 للشحن',
    brand: 'Goui',
    category: 'cables',
    categoryName: 'كوابل وحوامل',
    price: 279,
    originalPrice: 349,
    rating: 4.7,
    reviews: 143,
    colorway: ['#4F46E5', '#322CA0'],
    glyph: 'cable',
    inStock: true,
    highlight: 'محطة شحن مغناطيسية للآيفون والساعة والسماعة بتصميم أنيق.',
    features: ['شحن 3 أجهزة', 'MagSafe 15W', 'قابل للطي', 'خامة ألمنيوم'],
  },
  {
    id: 'p6',
    slug: 'espes-clearguard-16',
    name: 'غطاء ESPES شفاف مضاد للصدمات — آيفون 16',
    brand: 'ESPES',
    category: 'protection',
    categoryName: 'حمايات وأغطية',
    price: 89,
    originalPrice: 129,
    rating: 4.5,
    reviews: 268,
    colorway: ['#2C2C36', '#141419'],
    glyph: 'shield',
    inStock: true,
    highlight: 'حماية عسكرية بزوايا معززة وشفافية تدوم بلا اصفرار.',
    features: ['معيار عسكري', 'زوايا معززة', 'ضد الاصفرار', 'دعم MagSafe'],
  },
  {
    id: 'p7',
    slug: 'apple-watch-s10',
    name: 'ساعة أبل Series 10 — 46 مم',
    brand: 'Apple',
    category: 'apple',
    categoryName: 'أجهزة أبل',
    price: 1899,
    originalPrice: 2099,
    rating: 4.8,
    reviews: 197,
    badge: 'تقسيط بدون فوائد',
    colorway: ['#1F1F27', '#0B0B0F'],
    glyph: 'apple',
    installments: true,
    inStock: true,
    highlight: 'أنحف ساعة أبل مع شاشة أوسع وشحن أسرع ومستشعرات صحية متقدمة.',
    features: ['شاشة أكبر', 'شحن سريع', 'مقاومة الماء', 'مستشعر العمق'],
  },
  {
    id: 'p8',
    slug: 'maestro-power-strip',
    name: 'مشترك Maestro ذكي بمنافذ USB-C',
    brand: 'Maestro',
    category: 'power',
    categoryName: 'بطاريات محمولة',
    price: 159,
    rating: 4.4,
    reviews: 96,
    colorway: ['#6b5528', '#2C2C36'],
    glyph: 'battery',
    inStock: true,
    highlight: 'أربعة مقابس و3 منافذ USB مع حماية من الفولت الزائد.',
    features: ['3 منافذ USB', 'حماية ذكية', 'كابل 2 متر', 'مفتاح لكل مقبس'],
  },
  {
    id: 'p9',
    slug: 'awei-sk5-speaker',
    name: 'مكبر صوت Awei SK5 محمول ومقاوم للماء',
    brand: 'Awei',
    category: 'audio',
    categoryName: 'سماعات وصوتيات',
    price: 199,
    originalPrice: 259,
    rating: 4.6,
    reviews: 154,
    colorway: ['#7C3AED', '#4F46E5'],
    glyph: 'headphones',
    inStock: true,
    highlight: 'صوت محيطي 360 درجة مع إضاءة RGB وبطارية ليوم كامل.',
    features: ['صوت 360°', 'مقاوم IPX7', 'إضاءة RGB', '24 ساعة تشغيل'],
  },
  {
    id: 'p10',
    slug: 'ddpai-n5-dual',
    name: 'كاميرا DDPAI N5 مزدوجة أمامية وخلفية',
    brand: 'DDPAI',
    category: 'dashcams',
    categoryName: 'كاميرات السيارة',
    price: 459,
    originalPrice: 559,
    rating: 4.7,
    reviews: 121,
    colorway: ['#3F38C4', '#1B1856'],
    glyph: 'camera',
    inStock: true,
    highlight: 'تسجيل أمامي وخلفي متزامن مع نظام تحديد المواقع المدمج.',
    features: ['كاميرا مزدوجة', 'GPS مدمج', 'تطبيق ذكي', 'تسجيل حلقي'],
  },
  {
    id: 'p11',
    slug: 'goui-braided-cable',
    name: 'كابل Goui مجدول USB-C سريع 240 واط',
    brand: 'Goui',
    category: 'cables',
    categoryName: 'كوابل وحوامل',
    price: 79,
    originalPrice: 99,
    rating: 4.8,
    reviews: 402,
    badge: 'الأكثر مبيعاً',
    colorway: ['#4F46E5', '#322CA0'],
    glyph: 'cable',
    inStock: true,
    highlight: 'نقل بيانات فائق وشحن 240 واط بكابل مجدول يدوم طويلاً.',
    features: ['قدرة 240W', 'مجدول متين', 'نقل بيانات سريع', 'طول 2 متر'],
  },
  {
    id: 'p12',
    slug: 'asir-leather-wallet',
    name: 'محفظة Asir جلدية مغناطيسية للآيفون',
    brand: 'Asir',
    category: 'protection',
    categoryName: 'حمايات وأغطية',
    price: 149,
    rating: 4.5,
    reviews: 88,
    badge: 'جديد',
    colorway: ['#A8894C', '#2C2C36'],
    glyph: 'shield',
    inStock: false,
    highlight: 'جلد طبيعي فاخر يحمل حتى ثلاث بطاقات بتثبيت مغناطيسي قوي.',
    features: ['جلد طبيعي', 'MagSafe', 'تحمل 3 بطاقات', 'خياطة يدوية'],
  },
];

export interface Testimonial {
  id: string;
  name: string;
  city: string;
  rating: number;
  text: string;
  product: string;
  initials: string;
}

export const testimonials: Testimonial[] = [
  {
    id: 't1',
    name: 'نورة العتيبي',
    city: 'الرياض',
    rating: 5,
    text: 'تجربة تسوّق مريحة والتوصيل وصل في نفس اليوم. المنتج أصلي ومطابق للوصف تماماً. سأعود بالتأكيد.',
    product: 'سماعة Awei T85',
    initials: 'ن.ع',
  },
  {
    id: 't2',
    name: 'عبدالله القحطاني',
    city: 'جدة',
    rating: 5,
    text: 'اشتريت الآيفون بالتقسيط بدون أي تعقيد، والدعم الفني رد عليّ خلال دقائق. متجر يستحق الثقة.',
    product: 'آيفون 16 برو',
    initials: 'ع.ق',
  },
  {
    id: 't3',
    name: 'ريم الشهري',
    city: 'الدمام',
    rating: 5,
    text: 'الكاميرا ركّبتها بسهولة وجودة التصوير ممتازة ليلاً. التغليف كان فاخراً والضمان واضح.',
    product: 'كاميرا DDPAI Z60',
    initials: 'ر.ش',
  },
  {
    id: 't4',
    name: 'فيصل الدوسري',
    city: 'الرياض',
    rating: 4,
    text: 'أسعار منافسة ومنتجات أصلية. البطارية تشحن جوالي أكثر من مرة وبسرعة. تعاملهم راقٍ.',
    product: 'بطارية Zendure',
    initials: 'ف.د',
  },
  {
    id: 't5',
    name: 'سارة المطيري',
    city: 'مكة',
    rating: 5,
    text: 'أفضل متجر تقنية تعاملت معه في السعودية. الموقع سهل والدفع آمن والتوصيل سريع جداً.',
    product: 'حامل Goui 3×1',
    initials: 'س.م',
  },
];

export const brands = [
  'Apple',
  'Awei',
  'DDPAI',
  'Zendure',
  'Goui',
  'ESPES',
  'Maestro',
  'Asir',
];

export function getProductBySlug(slug: string): Product | undefined {
  return products.find((p) => p.slug === slug);
}

export function getProductsByCategory(cat: CategoryId | 'all'): Product[] {
  if (cat === 'all') return products;
  return products.filter((p) => p.category === cat);
}
