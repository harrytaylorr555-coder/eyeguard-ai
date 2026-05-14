import { Bot, InlineKeyboard } from 'grammy';
import prisma from '../../utils/prisma';
import { User } from '@prisma/client';
import { NIGHT_START, NIGHT_END, MINI_APP_URL } from '../../utils/constants';

// ── Message pools ──

const REMINDERS_BY_TIME: Record<'morning' | 'afternoon' | 'evening', string[]> = {
  morning: [
    '🌅 Доброе утро! Начнём день с заботы о глазах?',
    '☀️ Утренняя разминка для глаз — 30 секунд!',
    '👁️ Пока глаза свежие — лёгкое упражнение для профилактики.',
  ],
  afternoon: [
    '💻 Перерыв! Глаза работают без отдыха уже несколько часов.',
    '🔄 Самое время для смены фокуса. 60 секунд — и глаза скажут спасибо.',
    '⚠️ Разгар дня — дай глазам минутную передышку.',
  ],
  evening: [
    '🌆 Глаза устали за день. Пальминг снимет напряжение за 2 минуты.',
    '😌 Вечерняя забота: расслабь глаза перед отдыхом.',
    '🌙 День позади — помоги глазам восстановиться.',
  ],
};

const EYE_FACTS = [
  '💡 Человек моргает в среднем 15-20 раз в минуту. Но при работе за экраном — всего 5-7 раз!',
  '💡 Правило 20-20-20: каждые 20 минут смотрите на объект в 6 метрах в течение 20 секунд.',
  '💡 Мышцы глаз — самые активные в теле: более 100,000 сокращений в день.',
  '💡 Глаза способны различать около 10 миллионов оттенков цветов.',
  '💡 Упражнения для глаз снижают усталость на 30% при регулярном выполнении.',
  '💡 При моргании слёзная плёнка обновляется, защищая роговицу от пересыхания.',
  '💡 Цилиарная мышца фокусирует хрусталик — её спазм вызывает ложную близорукость.',
];

// ── Scheduler ──

export function startReminderScheduler(bot: Bot) {
  setInterval(async () => {
    try {
      await processReminders(bot);
    } catch (err) {
      console.error('Reminder error:', err);
    }
  }, 5 * 60 * 1000);

  console.log('Reminder scheduler started (checking every 5 min)');
}

// ── Main processing ──

async function processReminders(bot: Bot) {
  const now = new Date();

  const users = await prisma.user.findMany({
    where: { onboardingStep: 3 },
    include: {
      dailyLogs: {
        where: {
          date: {
            gte: (() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; })(),
          },
        },
      },
    },
  });

  for (const user of users) {
    // ── Timezone check ──
    const tz = user.timezone || 'Europe/Moscow';
    const localHour = getLocalHour(now, tz);
    if (localHour >= NIGHT_START || localHour < NIGHT_END) continue;

    const todayLog = user.dailyLogs[0];
    const currentReminders = todayLog?.exerciseCount || 0;
    const target = user.reminderCount || 3;

    // Already hit target × 2 (each reminder can result in multiple exercises)
    if (currentReminders >= target * 2) continue;

    // ── Engagement analysis ──
    const engagement = await computeEngagement(user);
    const optimalInterval = calculateOptimalInterval(user, engagement, localHour);

    // Check if enough time passed since last exercise
    const lastExercise = await prisma.exerciseLog.findFirst({
      where: { userId: user.id },
      orderBy: { completedAt: 'desc' },
    });

    if (lastExercise) {
      const timeSince = now.getTime() - new Date(lastExercise.completedAt).getTime();
      if (timeSince < optimalInterval * 0.75) continue;
    }

    // ── Send reminder ──
    const timeOfDay = localHour < 11 ? 'morning' : localHour < 17 ? 'afternoon' : 'evening';
    const pool = REMINDERS_BY_TIME[timeOfDay];
    const msg = pool[Math.floor(Math.random() * pool.length)];

    try {
      await bot.api.sendMessage(
        parseInt(user.telegramId),
        msg,
        {
          reply_markup: new InlineKeyboard()
            .text('😊 Отлично', `mood_5`)
            .text('😐 Норма', `mood_3`)
            .text('😞 Устали', `mood_1`)
            .row()
            .webApp('👁️ Упражнения', `${MINI_APP_URL}?startapp=exercises`),
        }
      );

      // Occasionally send an eye fact
      if (Math.random() < 0.25) {
        const fact = EYE_FACTS[Math.floor(Math.random() * EYE_FACTS.length)];
        await bot.api.sendMessage(
          parseInt(user.telegramId),
          fact,
          {
            reply_markup: new InlineKeyboard().webApp(
              '📱 Открыть тренажёр',
              MINI_APP_URL || 'https://t.me/eyeguardbot/app'
            ),
          }
        );
      }
    } catch (err: unknown) {
      const botError = err as { error_code?: number };
      if (botError.error_code === 403) {
        console.log(`User ${user.telegramId} blocked the bot`);
      }
    }
  }
}

// ── Engagement scoring ──

interface Engagement {
  score: number;         // 0-100
  daysWithActivity: number; // of last 7 days
  avgResponseMin: number | null; // average minutes to respond (click mood)
  totalRecentExercises: number; // exercises in last 3 days
}

async function computeEngagement(user: User): Promise<Engagement> {
  const now = new Date();

  // Last 7 days of daily logs
  const weekAgo = new Date(now);
  weekAgo.setDate(weekAgo.getDate() - 7);
  weekAgo.setHours(0, 0, 0, 0);

  const dailyLogs = await prisma.dailyLog.findMany({
    where: { userId: user.id, date: { gte: weekAgo } },
  });

  const daysWithActivity = dailyLogs.filter(l => l.exerciseCount > 0).length;

  // Last 3 days of exercise logs for recency
  const threeDaysAgo = new Date(now);
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
  threeDaysAgo.setHours(0, 0, 0, 0);

  const recentExercises = await prisma.exerciseLog.count({
    where: { userId: user.id, completedAt: { gte: threeDaysAgo } },
  });

  // Engagement score: weighted combination
  // - Days with activity (max 70 points: 7 days × 10)
  // - Recent volume (max 30 points: 9+ exercises in 3 days)
  const consistencyScore = Math.min(daysWithActivity * 10, 70);
  const volumeScore = Math.min(recentExercises * 3.3, 30);
  const score = Math.round(consistencyScore + volumeScore);

  return {
    score,
    daysWithActivity,
    avgResponseMin: null, // Could be computed from exercise timestamps vs reminder timestamps
    totalRecentExercises: recentExercises,
  };
}

// ── Optimal interval calculation ──

/**
 * Calculates the optimal reminder interval based on:
 * - Engagement score (0-100): engaged users get shorter intervals
 * - Time of day: morning/evening boost, midday standard
 * - Screen hours: heavy users need more frequent breaks
 * - Streak: protect long streaks with slightly more reminders
 *
 * Output: interval in milliseconds, clamped to [45min, 180min]
 */
function calculateOptimalInterval(
  user: User,
  engagement: Engagement,
  localHour: number,
): number {
  const isPremium = user.isPremium;

  // ── Base interval ──
  const baseMs = isPremium ? 75 * 60 * 1000 : 105 * 60 * 1000; // 75min vs 105min

  // ── Engagement factor (0.7x – 1.5x) ──
  // High engagement → shorter (they want more)
  // Low engagement → longer (don't spam)
  // engagement.score: 0 → 1.5x, 100 → 0.7x
  const engagementFactor = 1.5 - (engagement.score / 100) * 0.8;

  // ── Time of day factor (0.7x – 1.2x) ──
  // Morning (8-10): boost (eyes fresh, good for habit building)       → 0.8x
  // Late morning (10-12): standard                                     → 1.0x
  // Afternoon (12-16): standard                                        → 1.0x
  // Late afternoon (16-19): mild boost (tired eyes after work)         → 0.85x
  // Evening (19-22): strong boost (peak eye fatigue)                   → 0.75x
  let timeFactor = 1.0;
  if (localHour >= 8 && localHour < 10) timeFactor = 0.8;
  else if (localHour >= 10 && localHour < 16) timeFactor = 1.0;
  else if (localHour >= 16 && localHour < 19) timeFactor = 0.85;
  else if (localHour >= 19 && localHour < 22) timeFactor = 0.75;

  // ── Screen hours factor (0.8x – 1.3x) ──
  const screenHours = user.screenHours || 6;
  let screenFactor = 1.0;
  if (screenHours <= 3) screenFactor = 1.3;       // light user, less need
  else if (screenHours <= 6) screenFactor = 1.0;  // standard
  else if (screenHours <= 10) screenFactor = 0.85; // heavy user
  else screenFactor = 0.75;                        // very heavy user

  // ── Streak protection factor (0.9x – 1.0x) ──
  // Longer streaks → slightly more frequent to help maintain
  let streakFactor = 1.0;
  if (engagement.daysWithActivity >= 7) streakFactor = 0.92;
  if (engagement.daysWithActivity >= 14) streakFactor = 0.87;
  if (engagement.daysWithActivity >= 30) streakFactor = 0.82;

  // ── Response rate factor (0.9x – 1.4x) ──
  // Days with 0 activity → user is ignoring → back off
  const inactiveDays = 7 - engagement.daysWithActivity;
  let responseFactor = 1.0;
  if (inactiveDays >= 5) responseFactor = 1.4;  // mostly ignoring
  else if (inactiveDays >= 3) responseFactor = 1.2;
  else if (inactiveDays === 0) responseFactor = 0.9; // always responds

  // ── Combine ──
  const interval = baseMs
    * engagementFactor
    * timeFactor
    * screenFactor
    * streakFactor
    * responseFactor;

  // Clamp: 45 min to 180 min
  const clamped = Math.max(45 * 60 * 1000, Math.min(180 * 60 * 1000, Math.round(interval)));

  return clamped;
}

// ── Helpers ──

function getLocalHour(date: Date, timezone: string): number {
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      hour12: false,
      timeZone: timezone,
    });
    return parseInt(formatter.format(date));
  } catch {
    return 12;
  }
}
