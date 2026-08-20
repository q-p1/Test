import type { ExerciseDefinition, WorkoutDefinition, WorkoutId } from '../types';

type ExerciseSeed = Omit<ExerciseDefinition, 'image' | 'imageStatus'>;

const seeds: ExerciseSeed[] = [
  { id: 'alternating-knee-raises', arabicName: 'رفع الركبة بالتبادل', englishName: 'Alternating Knee Raises', category: 'warmup', metric: 'seconds', sets: 1, target: '45–60 ثانية', restSeconds: 0, restLabel: 'انتقال مباشر', instruction: 'ارفع الركبة بقدر مريح وحرّك الذراعين بالتبادل.', technique: 'قف بشكل مستقيم وارفع الركبة للأعلى مع تبديل الجانبين.', commonMistake: 'ميل الجسم للخلف.', easier: 'ارفع الركبة لارتفاع أقل مع الاستناد إلى الجدار.', harder: 'زد الإيقاع قليلًا مع بقاء الجذع مستقيمًا.' },
  { id: 'shoulder-circles', arabicName: 'دوائر الكتف', englishName: 'Shoulder Circles', category: 'warmup', metric: 'reps', sets: 1, target: '10 أمام + 10 خلف', restSeconds: 0, restLabel: 'انتقال مباشر', instruction: 'حرّك الكتفين في دوائر مريحة للأمام ثم للخلف.', technique: 'اجعل الحركة خفيفة ومتحكمًا بها وأبقِ الرقبة مرتاحة.', commonMistake: 'رفع الكتفين بقوة وشد الرقبة.', easier: 'ابدأ بدوائر أصغر.', harder: 'وسّع الدوائر تدريجيًا دون شد.' },
  { id: 'light-squats', arabicName: 'سكوات خفيف', englishName: 'Light Squats', category: 'warmup', metric: 'reps', sets: 1, target: '8–10 تكرارات', restSeconds: 0, restLabel: 'انتقال مباشر', instruction: 'انزل نزولًا خفيفًا فقط للتجهيز ثم اصعد بهدوء.', technique: 'القدمان بعرض الكتفين والركبتان مع اتجاه أصابع القدم.', commonMistake: 'دخول الركبتين للداخل.', easier: 'استخدم مدى حركة أصغر.', harder: 'أبطئ النزول مع بقاء الحركة خفيفة.' },
  { id: 'wall-pushups', arabicName: 'ضغط على الجدار', englishName: 'Wall Push-ups', category: 'warmup', metric: 'reps', sets: 1, target: '8–10 تكرارات', restSeconds: 0, restLabel: 'انتقال مباشر', instruction: 'ضع يديك على الجدار، اثنِ المرفقين وانزل الصدر ثم ادفع.', technique: 'حافظ على الجسم مستقيمًا من الرأس للكعبين.', commonMistake: 'ثني الجسم بدل تحريك الصدر كوحدة واحدة.', easier: 'اقترب من الجدار.', harder: 'ابتعد قليلًا مع بقاء الجسم مستقيمًا.' },
  { id: 'pushups', arabicName: 'الضغط', englishName: 'Push-ups', category: 'main', metric: 'reps', sets: 3, target: '6–12 تكرارًا', restSeconds: 60, restLabel: '60–90 ثانية', instruction: 'انزل بالجسم كقطعة واحدة ثم ادفع الأرض حتى تعود.', technique: 'شد البطن والأرداف وأبقِ اليدين تحت الكتفين.', commonMistake: 'هبوط الحوض وفقدان خط الجسم المستقيم.', easier: 'نفّذه على سطح مرتفع.', harder: 'اجعل النزول بطيئًا لمدة 3 ثوانٍ.' },
  { id: 'bodyweight-squats', arabicName: 'السكوات بوزن الجسم', englishName: 'Bodyweight Squats', category: 'main', metric: 'reps', sets: 3, target: '10–15 تكرارًا', restSeconds: 60, instruction: 'ادفع الورك للخلف وانزل بمدى تتحكم فيه ثم اصعد.', technique: 'أبقِ القدم كاملة على الأرض والركبتين مع اتجاه الأصابع.', commonMistake: 'دخول الركبتين للداخل.', easier: 'انزل إلى كرسي ثم قف.', harder: 'توقف ثانية في الأسفل.' },
  { id: 'glute-bridge', arabicName: 'رفع الحوض', englishName: 'Glute Bridge', category: 'main', metric: 'reps', sets: 3, target: '12–15 تكرارًا', restSeconds: 45, restLabel: '45–60 ثانية', instruction: 'ارفع الحوض حتى يصبح الجذع في خط مريح ثم انزل بتحكم.', technique: 'ادفع بالكعبين واعصر عضلات الأرداف في الأعلى.', commonMistake: 'تقوس الظهر السفلي بدل رفع الحوض.', easier: 'استخدم مدى حركة أصغر.', harder: 'انتقل إلى رفع الحوض بساق واحدة.' },
  { id: 'w-back-raise', arabicName: 'رفع W للظهر', englishName: 'W Back Raise', category: 'main', metric: 'reps', sets: 3, target: '8–12 تكرارًا', restSeconds: 45, instruction: 'استلقِ على البطن وارفع الذراعين والصدر قليلًا بشكل W.', technique: 'حرّك لوحي الكتف للخلف والأسفل وأبقِ الرقبة طبيعية.', commonMistake: 'رفع الكتفين وشد الرقبة.', easier: 'ارفع الذراعين فقط.', harder: 'اثبت ثانيتين أعلى الحركة.' },
  { id: 'dead-bug', arabicName: 'ديد بغ', englishName: 'Dead Bug', category: 'main', metric: 'reps', sets: 3, target: '6–10 لكل جهة', restSeconds: 45, instruction: 'مد الذراع والرجل المتعاكسين ثم عد وبدّل.', technique: 'أبقِ أسفل الظهر ثابتًا على الأرض طوال الحركة.', commonMistake: 'مد الأطراف إلى مدى يجعل أسفل الظهر يرتفع.', easier: 'حرّك الساق فقط.', harder: 'مد الذراع والساق أبعد مع بقاء الظهر ثابتًا.' },
  { id: 'pike-pushup', arabicName: 'ضغط بايك', englishName: 'Pike Push-up', category: 'main', metric: 'reps', sets: 3, target: '5–10 تكرارات', restSeconds: 60, restLabel: '60–90 ثانية', instruction: 'ارفع الورك وانزل الرأس باتجاه المساحة بين اليدين ثم ادفع.', technique: 'أبقِ الورك مرتفعًا وادفع بقوة للأعلى.', commonMistake: 'هبوط الورك وتحويل الحركة إلى ضغط عادي.', easier: 'استخدم مدى حركة أقصر.', harder: 'اجعل النزول بطيئًا لمدة 3 ثوانٍ.' },
  { id: 'reverse-lunge', arabicName: 'اندفاع خلفي', englishName: 'Reverse Lunge', category: 'main', metric: 'reps', sets: 3, target: '8–12 لكل رجل', restSeconds: 60, instruction: 'اخطُ للخلف وانزل بهدوء ثم ادفع بالقدم الأمامية للعودة.', technique: 'اجعل الركبة الأمامية تتبع اتجاه القدم.', commonMistake: 'فقدان التوازن أو تحرك الركبة للداخل.', easier: 'أمسك جدارًا للتوازن.', harder: 'توقف ثانية في الأسفل.' },
  { id: 'single-leg-glute-bridge', arabicName: 'رفع الحوض بساق واحدة', englishName: 'Single-leg Glute Bridge', category: 'main', metric: 'reps', sets: 3, target: '8–12 لكل رجل', restSeconds: 60, instruction: 'ثبّت قدمًا وارفع الحوض مع بقاء الساق الأخرى مرفوعة.', technique: 'أبقِ الحوض مستويًا ولا تسمح له بالالتفاف.', commonMistake: 'لف الحوض أو تقوس الظهر.', easier: 'ارجع إلى رفع الحوض العادي.', harder: 'اثبت ثانيتين في الأعلى.' },
  { id: 'reverse-snow-angel', arabicName: 'ملاك ثلجي عكسي', englishName: 'Reverse Snow Angel', category: 'main', metric: 'reps', sets: 3, target: '8–12 تكرارًا', restSeconds: 45, instruction: 'على البطن، ارفع الذراعين قليلًا وحرّكهما بقوس واسع وببطء.', technique: 'أبقِ الرقبة مرتاحة وحرّك الذراعين من الكتفين.', commonMistake: 'رفع الكتفين وشد الرقبة.', easier: 'استخدم مدى أصغر.', harder: 'أبطئ الحركة.' },
  { id: 'side-plank', arabicName: 'بلانك جانبي', englishName: 'Side Plank', category: 'main', metric: 'seconds', sets: 3, target: '15–30 ثانية لكل جهة', restSeconds: 45, instruction: 'ارفع الحوض واثبت بجسم طويل على الجانب.', technique: 'ضع الكوع تحت الكتف وأبقِ الجسم بخط واحد قدر الإمكان.', commonMistake: 'هبوط الحوض.', easier: 'ضع الركبتين على الأرض.', harder: 'زد مدة الثبات تدريجيًا.' },
  { id: 'incline-pushup', arabicName: 'الضغط المائل', englishName: 'Incline Push-up', category: 'main', metric: 'reps', sets: 3, target: '10–15 تكرارًا', restSeconds: 60, instruction: 'ضع اليدين على سطح ثابت مرتفع وانزل الصدر ثم ادفع.', technique: 'أبقِ الجسم مستقيمًا واختر سطحًا لا يتحرك.', commonMistake: 'هبوط الحوض وفقدان خط الجسم.', easier: 'استخدم سطحًا أعلى مثل الجدار.', harder: 'استخدم سطحًا أخفض أو انتقل إلى الضغط الأرضي.' },
  { id: 'split-squat', arabicName: 'سكوات منقسم', englishName: 'Split Squat', category: 'main', metric: 'reps', sets: 3, target: '8–12 لكل رجل', restSeconds: 60, instruction: 'ثبّت القدمين بوضعية خطوة وانزل عموديًا ثم اصعد.', technique: 'أبقِ القدم الأمامية ثابتة والركبة في اتجاه القدم.', commonMistake: 'ميل زائد أو ركبة أمامية غير ثابتة.', easier: 'أمسك جدارًا للتوازن.', harder: 'اجعل النزول بطيئًا.' },
  { id: 'hip-hinge', arabicName: 'انحناء الورك', englishName: 'Hip Hinge', category: 'main', metric: 'reps', sets: 3, target: '12–15 تكرارًا', restSeconds: 45, restLabel: '45–60 ثانية', instruction: 'ادفع الورك للخلف مع ظهر ثابت ثم عد للوقوف.', technique: 'تخيّل أنك تغلق بابًا بالورك مع ثني بسيط للركبتين.', commonMistake: 'تقوس الظهر.', easier: 'استخدم مدى حركة أصغر.', harder: 'اثبت ثانية عند أقصى شد مريح.' },
  { id: 'bird-dog', arabicName: 'بيرد دوغ', englishName: 'Bird Dog', category: 'main', metric: 'reps', sets: 3, target: '6–10 لكل جهة', restSeconds: 45, instruction: 'من وضع الأربع، مد الذراع والرجل المتعاكسين ببطء ثم عد.', technique: 'لا تسمح للحوض بالدوران أثناء المد.', commonMistake: 'لف الحوض.', easier: 'مد ساقًا أو ذراعًا فقط.', harder: 'اثبت 2–3 ثوانٍ في الامتداد.' },
  { id: 'shoulder-taps', arabicName: 'لمس الكتف', englishName: 'Shoulder Taps', category: 'main', metric: 'reps', sets: 3, target: '6–12 لكل جهة', restSeconds: 45, restLabel: '45–60 ثانية', instruction: 'من وضع الضغط، المس الكتف المقابل بالتبادل.', technique: 'باعد القدمين قليلًا وثبّت الحوض أثناء رفع اليد.', commonMistake: 'لف الحوض.', easier: 'نفّذه من سطح مرتفع.', harder: 'قرّب القدمين قليلًا مع بقاء الثبات.' },
];

const verifiedPdfImages: Record<string, string> = {
  'alternating-knee-raises': './exercises/alternating-knee-raises.webp',
  'shoulder-circles': './exercises/shoulder-circles.webp',
  'light-squats': './exercises/squats.webp',
  'wall-pushups': './exercises/wall-pushups.webp',
  pushups: './exercises/pushups.webp',
  'bodyweight-squats': './exercises/squats.webp',
  'glute-bridge': './exercises/glute-bridge.webp',
  'w-back-raise': './exercises/w-back-raise.webp',
  'pike-pushup': './exercises/pike-pushup.webp',
  'single-leg-glute-bridge': './exercises/single-leg-glute-bridge.webp',
  'reverse-snow-angel': './exercises/reverse-snow-angel.webp',
  'side-plank': './exercises/side-plank.webp',
  'incline-pushup': './exercises/incline-pushup.webp',
  'split-squat': './exercises/split-squat.webp',
  'hip-hinge': './exercises/hip-hinge.webp',
  'bird-dog': './exercises/bird-dog.webp',
  'shoulder-taps': './exercises/shoulder-taps.webp',
};

export const EXERCISES: ExerciseDefinition[] = seeds.map((exercise) => ({
  ...exercise,
  image: verifiedPdfImages[exercise.id],
  imageStatus: verifiedPdfImages[exercise.id] ? 'verified-pdf' : 'missing-source-pdf',
}));

export function exerciseRestLabel(exercise: ExerciseDefinition): string {
  return exercise.restLabel ?? `${exercise.restSeconds} ثانية`;
}

export const EXERCISE_MAP = Object.fromEntries(EXERCISES.map((exercise) => [exercise.id, exercise])) as Record<string, ExerciseDefinition>;

export const WARMUP_IDS = ['alternating-knee-raises', 'shoulder-circles', 'light-squats', 'wall-pushups'];

export const WORKOUTS: Record<WorkoutId, WorkoutDefinition> = {
  A: { id: 'A', arabicName: 'دفع + كور', focus: 'دفع ثابت وجذع متحكم', exerciseIds: ['pushups', 'pike-pushup', 'dead-bug', 'shoulder-taps'] },
  B: { id: 'B', arabicName: 'رجل + خلفية الجسم', focus: 'قوة الرجلين وسلسلة خلفية آمنة', exerciseIds: ['bodyweight-squats', 'reverse-lunge', 'glute-bridge', 'hip-hinge'] },
  C: { id: 'C', arabicName: 'ظهر + ثبات علوي', focus: 'تحكم لوحي الكتف وثبات الجذع', exerciseIds: ['w-back-raise', 'reverse-snow-angel', 'bird-dog', 'side-plank'] },
  D: { id: 'D', arabicName: 'رجل + تحكم', focus: 'توازن أحادي وتحكم هادئ', exerciseIds: ['split-squat', 'single-leg-glute-bridge', 'hip-hinge', 'shoulder-taps'] },
};

export const WORKOUT_ORDER: WorkoutId[] = ['A', 'B', 'C', 'D'];
