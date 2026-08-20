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

ملف خطة التمارين PDF هو المصدر الملزم للصور والأسماء والتفاصيل. ما دام الملف غير موجود في مساحة المشروع، تعرض المكتبة placeholders واضحة ولا تربط أي صورة تخمينية بتمرين. عند توفر الملف تُستخرج الرسومات، تُطابق يدويًا مع التمرين الصحيح، ثم توضع أصول محلية constrained مع `object-fit: contain`.

## النشر

لا توجد عملية deployment ضمن هذا الفرع. البناء والاختبار محليان فقط، وقرار Preview أو Production منفصل لاحقًا.
