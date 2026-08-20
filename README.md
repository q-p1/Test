# روتيني

تطبيق PWA عربي، RTL، ومصمم أساسًا لـiPhone وSafari لإدارة اليوم من الصلاة والدراسة إلى التحفيظ والرياضة.

## المعمارية

- React + TypeScript + Vite، بلا CSS أو خطوط أو صور runtime خارجية.
- `baseSchedule` ثابت أسبوعيًا، و`dateOverrides` منفصلة ومؤرخة بصيغة `YYYY-MM-DD`.
- بيانات كل يوم مستقلة في `days`، وسجل الرياضة مستقل ومستمر عبر دورات 24 أسبوعًا.
- مؤقتات التحفيظ والقدرات والرياضة timestamp-based باستخدام `startedAt + accumulatedMs`.
- التخزين محلي في `localStorage` بالمفتاح `routine.app.state`، مع schema version وترحيل واسترداد آمن من القيم التالفة.
- Service worker يولّد cache version من محتوى app shell، ويثبت النسخة الجديدة كاملة قبل تفعيلها، ثم يحذف caches القديمة الخاصة بروتيني فقط.

## التشغيل محليًا

```bash
npm ci
npm run dev
```

## الفحوصات

```bash
npm run lint
npm run typecheck
npm run test:unit
npm run build
npx playwright install --with-deps webkit
npm run test:e2e
```

اختبارات Playwright تشغّل WebKit على مقاسات iPhone SE وiPhone 13 وiPhone 14 Pro Max، وتكتب لقطات المراجعة في `visual-qa/`. كما يوجد workflow باسم **Heavy QA** يعمل يدويًا أو على Pull Request، ولا ينشر التطبيق.

## صور التمارين

ملف خطة التمارين PDF هو المصدر الملزم للصور والأسماء والتفاصيل. استُخرجت الرسومات الأصلية وطوبقت يدويًا ثم حُفظت محليًا بصيغة WebP؛ لا تعتمد المكتبة على استضافة خارجية. تعرض البطاقات crop محافظًا يبيّن وضعَي الحركة، بينما تعرض نافذة التفاصيل الرسم كاملًا عبر `object-fit: contain`.

يوجد 17 تمرينًا مرتبطًا بصورة أصلية مؤكدة (16 ملفًا فريدًا لأن صورة السكوات مشتركة)، وتمرينان فقط بلا صورة موثوقة: **ديد بغ** لأن موضعه في PDF يحتوي رسمًا مكررًا لحركة أخرى، و**الاندفاع الخلفي** لأن موضعه بلا رسم. يعرض التطبيق placeholder واضحًا لهما ولا يخمّن. خريطة المطابقة الكاملة في [`docs/EXERCISE-SOURCE-MAP.md`](docs/EXERCISE-SOURCE-MAP.md).

## النشر

لا توجد عملية deployment ضمن هذا الفرع. البناء والاختبار محليان فقط، وقرار Preview أو Production منفصل لاحقًا.
