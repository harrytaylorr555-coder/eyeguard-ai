import { Bot, InlineKeyboard } from 'grammy';
import prisma from '../../utils/prisma';
import { MINI_APP_URL, EXERCISE_LIST, MOOD_OPTIONS, PREMIUM_PRICE_STARS } from '../../utils/constants';

export function setupCommands(bot: Bot) {
  // /break — immediate random exercise (free only for non-premium)
  bot.command('break', async (ctx) => {
    const telegramId = String(ctx.from?.id || '');
    const user = await prisma.user.findUnique({ where: { telegramId } });
    const available = EXERCISE_LIST.filter(ex => !ex.premium || user?.isPremium);
    if (available.length === 0) {
      await ctx.reply('Нет доступных упражнений. Попробуйте /start');
      return;
    }
    const exercise = available[Math.floor(Math.random() * available.length)];

    await ctx.reply(
      `🏃 *${exercise.title}* (${exercise.duration} сек)\n\n${exercise.description}\n\n💡 *Эффект:* ${exercise.effect}`,
      {
        parse_mode: 'Markdown',
        reply_markup: new InlineKeyboard()
          .webApp('▶️ Выполнить упражнение', `${MINI_APP_URL}?startapp=exercise_${exercise.id}`)
          .row()
          .text('🔄 Другое упражнение', 'quick_exercise'),
      }
    );
  });

  // /stats — weekly statistics
  bot.command('stats', async (ctx) => {
    const telegramId = String(ctx.from?.id || '');
    const user = await prisma.user.findUnique({ where: { telegramId } });
    if (!user) {
      await ctx.reply('Сначала зарегистрируйтесь через /start');
      return;
    }

    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const recentExercises = await prisma.exerciseLog.count({
      where: { userId: user.id, completedAt: { gte: weekAgo } },
    });

    const dailyLogs = await prisma.dailyLog.findMany({
      where: { userId: user.id },
      orderBy: { date: 'desc' },
      take: 30,
    });

    // Calculate streak
    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (const log of dailyLogs) {
      const logDate = new Date(log.date);
      logDate.setHours(0, 0, 0, 0);
      const expected = new Date(today);
      expected.setDate(expected.getDate() - streak);

      if (logDate.getTime() === expected.getTime() && log.exerciseCount > 0) {
        streak++;
      } else if (logDate.getTime() < expected.getTime()) {
        break;
      }
    }

    const avgFeeling =
      dailyLogs.length > 0
        ? Math.round(dailyLogs.reduce((s, l) => s + l.feeling, 0) / dailyLogs.length)
        : 0;

    const feelingEmoji = MOOD_OPTIONS.find((m) => m.value === avgFeeling)?.emoji || '😐';

    await ctx.reply(
      `📊 *Ваша статистика за неделю*\n\n` +
        `🏋️ Упражнений: *${recentExercises}*\n` +
        `🔥 Дней подряд: *${streak}*\n` +
        `😊 Среднее самочувствие: ${feelingEmoji}\n\n` +
        `Откройте Mini App для детальной статистики:`,
      {
        parse_mode: 'Markdown',
        reply_markup: new InlineKeyboard().webApp(
          '📱 Открыть статистику',
          `${MINI_APP_URL}?startapp=stats`
        ),
      }
    );
  });

  // /settings — reminder settings
  bot.command('settings', async (ctx) => {
    const telegramId = String(ctx.from?.id || '');
    const user = await prisma.user.findUnique({ where: { telegramId } });
    if (!user) {
      await ctx.reply('Сначала зарегистрируйтесь через /start');
      return;
    }

    const count = user.reminderCount || 3;

    await ctx.reply(
      `⚙️ *Настройки*\n\n` +
        `🔔 Напоминаний в день: *${count}*\n` +
        `⭐ Premium: *${user.isPremium ? 'Активен ✅' : 'Не активен'}*\n\n` +
        `Выберите количество напоминаний:`,
      {
        parse_mode: 'Markdown',
        reply_markup: new InlineKeyboard()
          .text('1 раз', 'set_reminders_1')
          .text('2 раза', 'set_reminders_2')
          .text('3 раза', 'set_reminders_3')
          .row()
          .text('4 раза', 'set_reminders_4')
          .text('5 раз', 'set_reminders_5')
          .text('6 раз', 'set_reminders_6')
          .row()
          .webApp('🔔 Умные настройки', `${MINI_APP_URL}?startapp=settings`),
      }
    );
  });

  // /help
  bot.command('help', async (ctx) => {
    await ctx.reply(
      'ℹ️ *EyeGuard AI — Помощь*\n\n' +
        '👁️ Я помогаю защитить зрение при работе за экраном.\n\n' +
        '*Команды:*\n' +
        '/start — Главное меню\n' +
        '/break — Быстрое упражнение\n' +
        '/stats — Статистика\n' +
        '/settings — Настройки\n' +
        '/help — Помощь\n\n' +
        '*Как это работает:*\n' +
        '1️⃣ Я присылаю напоминания о перерывах\n' +
        '2️⃣ Вы выполняете короткие упражнения\n' +
        '3️⃣ Отслеживаете прогресс в Mini App\n\n' +
        'По вопросам: @eyeguard_support',
      {
        parse_mode: 'Markdown',
        reply_markup: new InlineKeyboard().webApp(
          '📱 Открыть EyeGuard',
          MINI_APP_URL || 'https://t.me/eyeguardbot/app'
        ),
      }
    );
  });
}
