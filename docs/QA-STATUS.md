# حالة QA — روتيني

التاريخ: 2026-08-20  
الحالة: **المنطق والبناء ناجحان؛ التسليم الكامل متوقف على ملف PDF وتشغيل WebKit المرئي.**

## نتائج منفذة

| المسار | النتيجة |
|---|---|
| TypeScript | ناجح بلا أخطاء |
| ESLint | ناجح بلا أخطاء |
| Vitest + Testing Library + axe-core | 29/29 ناجحة |
| Production build | ناجح |
| أصول HTML/CSS/JS/icons | المراجع موجودة ومحلية |
| Service worker static verification | ناجح |
| Service worker runtime simulation | install/activate/update/cache cleanup/subpath/atomic shell ناجحة |
| Playwright local server startup | ناجح |
| Playwright WebKit execution | متوقف قبل فتح الصفحة: WebKit غير مثبت في runner الحالي |
| PDF exercise extraction | متوقف: الملف غير موجود في مساحة العمل |
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

## موانع الإغلاق

1. إعادة إرفاق ملف PDF الأصلي، ثم استخراج الصور ومطابقتها ومراجعة الأسماء والجرعات التدريبية ضده.
2. تشغيل Heavy QA workflow أو Playwright على جهاز/runner يدعم WebKit، ثم مراجعة screenshots بصريًا وإصلاح أي عيب يظهر.
3. لا يتم Preview أو Production قبل إغلاق النقطتين أعلاه.
