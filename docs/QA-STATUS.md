# حالة QA — روتيني

التاريخ: 2026-08-20  
الحالة: **المنطق والبناء وصور المصدر ناجحة محليًا؛ تشغيل WebKit المرئي على GitHub Actions قيد التنفيذ.**

## نتائج منفذة

| المسار | النتيجة |
|---|---|
| TypeScript | ناجح بلا أخطاء |
| ESLint | ناجح بلا أخطاء |
| Vitest + Testing Library + axe-core | 32/32 ناجحة |
| Production build | ناجح |
| أصول HTML/CSS/JS/icons | المراجع موجودة ومحلية |
| Service worker static verification | ناجح |
| Service worker runtime simulation | install/activate/update/cache cleanup/subpath/atomic shell ناجحة |
| Playwright local server startup | ناجح |
| Playwright WebKit execution | جاهز للتشغيل عبر Heavy QA على GitHub Actions |
| PDF exercise extraction | ناجح: 16 أصلًا فريدًا، 17 تمرينًا مرتبطًا، وتمرينان بلا صورة موثوقة |
| Deployment | لم يُنفذ |

## التغطية الوظيفية الآلية

- تثبيت جديد ومستخدم ببيانات موجودة وترحيل legacy schema.
- فساد JSON، timestamps غير صالحة، وقيم logs غير متوقعة.
- تسجيل وإلغاء تسجيل الصلاة مع persistence.
- مؤقت التحفيظ بعد 40 دقيقة ومؤقت القدرات بعد ساعة و45 دقيقة عبر unmount/reopen.
- pause/resume وعدم مضاعفة الزمن أو إنتاج زمن سالب.
- كل أنواع day override، multi-day عبر نهاية شهر/سنة، وإرجاع يوم واحد من مدى دون حذف الأيام المجاورة.
- رحلة التحفيظ تستبدل الفترة وتعطّل مؤقت التحفيظ لذلك اليوم دون اعتبارها فشلًا.
- تسجيل جولات الحصة، reload، الإكمال idempotent، وسجل history المستمر.
- الحصة الفائتة تبقى التالية، بينما الإلغاء/التخطي المقصود يتجاوز الواقعة فقط.
- انتقال الدورة من الأسبوع 24 إلى الدورة التالية دون حذف التاريخ.
- حذف بيانات تاريخ واحد مع بقاء الإعدادات والأيام السابقة وسجل الأيام الأخرى.
- axe-core على Today وFitness وExercise Library وSettings دون مخالفات DOM مكتشفة.
- missing-image state يعرض placeholder ولا يعرض صورة حركة خاطئة.
- جرد صور الـPDF، سلامة WebP، حدود الحجم، المسارات المحلية، ودخول كل صورة في precache.
- تطابق sets/reps/holds/rest لكل تمرين مع تفاصيل الخطة المرفقة.

## اختبارات WebKit الجاهزة

المجموعة موجودة في `e2e/` وتشمل المقاسات الثلاثة، RTL، overflow، navigation، timers، overrides، workout logging، delete-day، البيانات التالفة، ولقطات:

- Today
- Fitness
- Exercise Library
- Exercise Detail
- Day Override Sheet
- Settings
- Empty state
- Completed day
- Holiday day
- Tahfiz trip day

لتنفيذها على runner طبيعي:

```bash
npx playwright install --with-deps webkit
npm run test:e2e
```

## المتبقي للإغلاق

1. تشغيل Heavy QA workflow على GitHub Actions ومراجعة screenshots بصريًا وإصلاح أي عيب يظهر.
2. توثيق النتيجة النهائية هنا. لا يتم Preview أو Production ضمن هذه العملية.

## حدود صور المصدر

- **ديد بغ:** موضعه في صفحة 6 يحتوي رسمًا مكررًا لتمرين آخر، لذلك لم يُربط بصورة خاطئة.
- **الاندفاع الخلفي:** موضعه في صفحة 7 بلا رسم، لذلك بقي placeholder محترمًا.
