# حالة QA — روتيني

التاريخ: 2026-08-20  
الحالة: **مكتمل على الفرع `feat/routine-pwa`، دون Preview أو Production deployment.**

- آخر commit برمجي تم اختباره: `630bd98474af01eb0758ad9a940e3c9da259d3ac`
- الجولة النهائية: [Heavy QA #9](https://github.com/q-p1/Test/actions/runs/32404202502)
- النتيجة: **ناجحة بالكامل**
- مستوى الثقة: **95%**

## نتائج الجولة النهائية

| المسار | النتيجة |
|---|---|
| ESLint | ناجح بلا أخطاء |
| TypeScript | ناجح بلا أخطاء |
| Vitest + Testing Library + axe-core | 35/35 ناجحة |
| Production build | ناجح |
| أصول HTML/CSS/JS/icons | كل المراجع موجودة ومحلية |
| PDF exercise assets | 16 صورة WebP فريدة، و17 تمرينًا مرتبطًا بصورة موثوقة |
| Service worker static verification | ناجح |
| Service worker runtime simulation | install/activate/update/cache cleanup/subpath/atomic shell ناجحة |
| Playwright WebKit | 20 ناجحة، و4 visual cases متخطاة عمدًا على المقاسين المكررين |
| مقاسات WebKit | iPhone SE، iPhone 13، iPhone 14 Pro Max |
| Visual QA | 10/10 شاشات التقطت وروجعت يدويًا |
| Deployment | لم يُنفذ |

تعريف Playwright يحتوي 24 حالة: الاختبارات الوظيفية تعمل على المقاسات الثلاثة، بينما اللقطات المرئية تُلتقط مرة واحدة على iPhone 13 لتفادي تكرار artifact مطابق؛ لذلك كانت حالات التخطي الأربع مقصودة وليست failures.

## التغطية الوظيفية المنفذة

- تثبيت جديد ومستخدم ببيانات موجودة وترحيل legacy schema.
- فساد JSON، timestamps غير صالحة، وقيم logs غير متوقعة مع استعادة آمنة.
- تسجيل وإلغاء تسجيل الصلوات الخمس مع persistence.
- مؤقت التحفيظ بعد 40 دقيقة ومؤقت القدرات بعد ساعة و45 دقيقة عبر reload/reopen.
- pause/resume وعدم مضاعفة الزمن أو إنتاج زمن سالب.
- جميع day overrides: إجازة مدرسة، إجازة تحفيظ، رحلة تحفيظ، إجازة رسمية، حدث خاص، تعديل وقت، إلغاء، تأجيل، إضافة مهمة، multi-day، وrestore.
- حدود الشهر والسنة، واستعادة يوم واحد من مدى متعدد الأيام دون حذف الأيام المجاورة.
- رحلة التحفيظ تستبدل الفترة ولا تُحسب فشلًا.
- تسجيل جولات الحصة، reload، الإكمال idempotent، والتاريخ المستمر.
- بقاء الحصة الفائتة كـnext unfinished workout، مع تجاوز الإلغاء أو التخطي المقصود فقط.
- انتقال دورة 24 أسبوعًا إلى الدورة التالية دون حذف التاريخ.
- حذف بيانات يوم واحد مع بقاء الإعدادات والأيام السابقة وسجل الأيام الأخرى.
- missing-image state يعرض placeholder ولا يربط صورة حركة خاطئة.
- عدم وجود horizontal overflow غير مقصود على المقاسات الثلاثة.
- axe-core على Today وFitness وExercise Library وSettings دون مخالفات DOM مكتشفة.
- تحديث PWA من cache قديم إلى app shell جديد مع versioning وتنظيف آمن.

## Visual QA المنفذ

تمت مراجعة اللقطات التالية يدويًا بعد الجولة النهائية:

- Today
- Fitness
- Exercise Library
- Exercise Detail Sheet
- Day Override Sheet
- Settings
- Empty state
- Completed day
- Holiday day
- Tahfiz trip day

شملت المراجعة RTL، hierarchy، safe-area spacing، أحجام الصور، cropping، النص العربي الطويل، البطاقات، الـbottom sheets، الـsticky navigation، الـempty states، والـoverflow. تم إصلاح إعادة رسم شريط التنقل الثابت في WebKit حتى تتطابق الطبقة المرئية مع `aria-current` بعد التنقل المتكرر.

## أخطاء اكتُشفت وأُصلحت أثناء Heavy QA

- فقدان تحديث الصلاة أو سجلات الحصة عند reload فوري بسبب حفظ React المتأخر؛ أصبح الحفظ متزامنًا مع كل mutation.
- reload غير مقصود في أول تشغيل PWA بسبب `controllerchange` بعد `clients.claim()`؛ أصبح reload خاصًا بتبديل controller موجود فقط.
- تنظيف `localStorage` من test fixture عند كل reload كان يخفي persistence الحقيقي؛ عُزلت contexts دون مسح أثناء السيناريو.
- fixture بصري كان يعيد الحالة الأساسية عند reload، فأصبحت لقطات completed/holiday/trip متطابقة؛ أُصلح وأعيدت مراجعتها.
- selectors غير محددة في RTL UI كانت تصطدم بعناصر متشابهة؛ أصبحت assertions مقيدة دلاليًا.
- لقطة WebKit full-page احتفظت بطبقة قديمة من شريط التنقل؛ أزيل blur غير الضروري ويُعاد تركيب طبقة التنقل عند تغيير الصفحة.
- assertions رحلة التحفيظ وصور المكتبة lazy-loaded أصبحت حتمية وغير هشة.

## حدود معروفة

- **ديد بغ:** موضع الرسم في صفحة 6 من ملف المصدر يكرر رسم تمرين آخر؛ استُخدم placeholder بدل التخمين.
- **الاندفاع الخلفي:** موضعه في صفحة 7 بلا رسم؛ استُخدم placeholder محترم.
- شُغلت اختبارات Safari عبر WebKit ومحاكاة مقاسات iPhone، لكن لم يتوفر من هذه البيئة جهاز iPhone فعلي لاختبار خطوة Add to Home Screen يدويًا.
- البيانات محلية على الجهاز حسب تصميم التطبيق ولا توجد مزامنة سحابية.

## قرار الإصدار

الفرع جاهز لمراجعة المستخدم أو Preview واحد لاحقًا عند الطلب. لم يتم إنشاء PR أو merge أو deployment ضمن هذه العملية.
