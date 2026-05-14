export const NODE_ENV = process.env.NODE_ENV || 'development';
export const BOT_TOKEN = process.env.BOT_TOKEN || '';
export const WEBHOOK_URL = process.env.WEBHOOK_URL || '';
export const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || '';
export const BOT_MODE = process.env.BOT_MODE || (WEBHOOK_URL ? 'webhook' : 'polling');
export const MINI_APP_URL = process.env.MINI_APP_URL || '';
export const PORT = parseInt(process.env.PORT || '3000', 10);

export const EXERCISES = {
  // ── Free exercises (4) ──
  palming: {
    id: 'palming',
    title: 'Пальминг',
    duration: 120,
    emoji: '🖐️',
    description: 'Прикрытие глаз ладонями для полного расслабления',
    steps: [
      'Сядьте удобно, локти на стол',
      'Закройте глаза ладонями (не давите!)',
      'Полная темнота, расслабьтесь',
      'Дышите глубоко 2 минуты',
    ],
    effect: 'Снятие напряжения глазных мышц',
    color: '#3b82f6',
    premium: false,
  },
  blinking: {
    id: 'blinking',
    title: 'Быстрое моргание',
    duration: 30,
    emoji: '👁️',
    description: 'Интенсивное моргание для увлажнения глаз',
    steps: [
      'Моргайте быстро 10-15 раз подряд',
      'Пауза 2 секунды, глаза закрыты',
      'Повторить 5 циклов',
    ],
    effect: 'Увлажнение роговицы, снятие сухости',
    color: '#10b981',
    premium: false,
  },
  focus_shift: {
    id: 'focus_shift',
    title: 'Смена фокуса',
    duration: 60,
    emoji: '🔍',
    description: 'Попеременная фокусировка на ближнем и дальнем объекте',
    steps: [
      'Вытяните руку, сфокусируйтесь на пальце (3 сек)',
      'Переведите взгляд на дальний объект (3 сек)',
      'Повторить 10 раз',
    ],
    effect: 'Тренировка аккомодации, профилактика близорукости',
    color: '#f59e0b',
    premium: false,
  },
  eye_roll: {
    id: 'eye_roll',
    title: 'Вращение глазами',
    duration: 30,
    emoji: '🔄',
    description: 'Круговые движения глазами для укрепления мышц',
    steps: [
      'Медленные круги по часовой стрелке (5 раз)',
      'Круги против часовой стрелки (5 раз)',
      'Горизонтальные движения влево-вправо (5 раз)',
      'Вертикальные движения вверх-вниз (5 раз)',
    ],
    effect: 'Укрепление глазных мышц',
    color: '#8b5cf6',
    premium: false,
  },

  // ── Premium exercises (8) ──
  figure_eight: {
    id: 'figure_eight',
    title: 'Восьмёрка',
    duration: 45,
    emoji: '∞',
    description: 'Плавное рисование знака бесконечности глазами',
    steps: [
      'Представьте большую восьмёрку перед собой',
      'Медленно обводите её глазами — 5 раз в одну сторону',
      '5 раз в обратную сторону',
      'Дышите ровно, голова неподвижна',
    ],
    effect: 'Гибкость глазодвигательных мышц',
    color: '#06b6d4',
    premium: true,
  },
  near_far_focus: {
    id: 'near_far_focus',
    title: 'Дальше-ближе',
    duration: 60,
    emoji: '🔭',
    description: 'Тренировка цилиарной мышцы с разными дистанциями',
    steps: [
      'Фокус на кончике носа — 3 сек',
      'Фокус на вытянутом пальце — 3 сек',
      'Фокус на дальнем объекте за окном — 3 сек',
      'Повторить цепочку 8 раз',
    ],
    effect: 'Укрепление аккомодации, профилактика спазма',
    color: '#f97316',
    premium: true,
  },
  diagonals: {
    id: 'diagonals',
    title: 'Диагонали',
    duration: 30,
    emoji: '✳️',
    description: 'Диагональные движения для проработки косых мышц',
    steps: [
      'Взгляд вверх-вправо → вниз-влево (5 раз)',
      'Взгляд вверх-влево → вниз-вправо (5 раз)',
      'Повторить оба цикла без напряжения шеи',
    ],
    effect: 'Тренировка косых мышц глаза',
    color: '#a855f7',
    premium: true,
  },
  eyelid_massage: {
    id: 'eyelid_massage',
    title: 'Массаж век',
    duration: 60,
    emoji: '💆',
    description: 'Мягкий массаж для стимуляции мейбомиевых желёз',
    steps: [
      'Чистыми пальцами легко прикасайтесь к закрытым векам',
      'Круговые движения от внутреннего уголка к внешнему',
      '10 кругов по верхнему веку',
      '10 кругов по нижнему веку',
    ],
    effect: 'Снятие сухости, профилактика блефарита',
    color: '#ec4899',
    premium: true,
  },
  eye_squeeze: {
    id: 'eye_squeeze',
    title: 'Зажмуривание',
    duration: 30,
    emoji: '😖',
    description: 'Укрепление круговой мышцы глаза через напряжение',
    steps: [
      'Сильно зажмурьтесь на 3-4 секунды',
      'Широко откройте глаза — расслабьте',
      'Повторите 8-10 раз',
      'В конце мягко поморгайте',
    ],
    effect: 'Укрепление век, улучшение кровотока',
    color: '#14b8a6',
    premium: true,
  },
  solarization: {
    id: 'solarization',
    title: 'Соляризация',
    duration: 90,
    emoji: '☀️',
    description: 'Мягкая адаптация глаз к свету через закрытые веки',
    steps: [
      'Закройте глаза, повернитесь лицом к источнику света',
      'Медленно поворачивайте голову влево-вправо',
      'Ощутите смену света и тени через веки',
      '15-20 повторов, дыхание ровное',
    ],
    effect: 'Расслабление зрительного нерва и сетчатки',
    color: '#eab308',
    premium: true,
  },
  window_mark: {
    id: 'window_mark',
    title: 'Метка на стекле',
    duration: 60,
    emoji: '🪟',
    description: 'Классическое упражнение офтальмологов для фокусировки',
    steps: [
      'Наклейте метку на окно на уровне глаз',
      'Фокус на метке — 5 сек',
      'Фокус на дальнем объекте за окном — 5 сек',
      'Повторить 10 раз, голова неподвижна',
    ],
    effect: 'Тренировка цилиарной мышцы, профилактика ПИНА',
    color: '#6366f1',
    premium: true,
  },
  nose_writing: {
    id: 'nose_writing',
    title: 'Письмо носом',
    duration: 45,
    emoji: '✍️',
    description: 'Рисование букв кончиком носа для расслабления шеи и глаз',
    steps: [
      'Закройте глаза, расслабьте плечи',
      'Представьте, что кончик носа — это ручка',
      'Напишите 5-6 букв или цифр в воздухе',
      'Двигайте всей головой плавно, не только глазами',
    ],
    effect: 'Снятие напряжения с шеи и глаз одновременно',
    color: '#84cc16',
    premium: true,
  },
} as const;

export type ExerciseType = keyof typeof EXERCISES;
export const EXERCISE_LIST = Object.values(EXERCISES);

export const MOOD_OPTIONS = [
  { value: 1, emoji: '😞', label: 'Устали' },
  { value: 3, emoji: '😐', label: 'Норма' },
  { value: 5, emoji: '😊', label: 'Отлично' },
] as const;

export const REMINDER_COUNT_OPTIONS = [1, 2, 3, 4, 5, 6] as const;

export const PREMIUM_PRICE_STARS = 299;
export const CORPORATE_PRICE_STARS = 999;

export const NIGHT_START = 22; // 10 PM
export const NIGHT_END = 8;    // 8 AM
