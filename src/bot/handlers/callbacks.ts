import { Bot, InlineKeyboard } from 'grammy';
import prisma from '../../utils/prisma';
import { MINI_APP_URL, EXERCISE_LIST, MOOD_OPTIONS, PREMIUM_PRICE_STARS } from '../../utils/constants';

export function setupCallbacks(bot: Bot) {
  // Quick exercise — random exercise (free only for non-premium)
  bot.callbackQuery('quick_exercise', async (ctx) => {
    const telegramId = String(ctx.from?.id || '');
    const user = await prisma.user.findUnique({ where: { telegramId } });

    const available = EXERCISE_LIST.filter(ex => !ex.premium || user?.isPremium);
    if (available.length === 0) {
      await ctx.reply('Нет доступных упражнений. Попробуйте /start');
      await ctx.answerCallbackQuery();
      return;
    }

    const exercise = available[Math.floor(Math.random() * available.length)];

    await ctx.reply(
      `🏃 *${exercise.title}* (${exercise.duration} сек)\n\n${exercise.description}\n\n💡 *Эффект:* ${exercise.effect}`,
      {
        parse_mode: 'Markdown',
        reply_markup: new InlineKeyboard()
          .webApp('▶️ Выполнить', `${MINI_APP_URL}?startapp=exercise_${exercise.id}`)
          .row()
          .text('🔄 Другое', 'quick_exercise'),
      }
    );
    await ctx.answerCallbackQuery();
  });

  // Show stats via bot
  bot.callbackQuery('show_stats', async (ctx) => {
    const telegramId = String(ctx.from?.id || '');
    const user = await prisma.user.findUnique({ where: { telegramId } });
    if (!user) return;

    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const count = await prisma.exerciseLog.count({
      where: { userId: user.id, completedAt: { gte: weekAgo } },
    });

    await ctx.reply(
      `📊 Упражнений за неделю: *${count}*\nОткройте Mini App для полной статистики.`,
      {
        parse_mode: 'Markdown',
        reply_markup: new InlineKeyboard().webApp(
          '📱 Статистика',
          `${MINI_APP_URL}?startapp=stats`
        ),
      }
    );
    await ctx.answerCallbackQuery();
  });

  // Show settings
  bot.callbackQuery('show_settings', async (ctx) => {
    const telegramId = String(ctx.from?.id || '');
    const user = await prisma.user.findUnique({ where: { telegramId } });
    if (!user) return;

    await ctx.reply(
      `⚙️ *Настройки*\n\n` +
        `🔔 Напоминаний: *${user.reminderCount || 3}* в день\n` +
        `⭐ Premium: *${user.isPremium ? 'Активен ✅' : 'Не активен'}*\n\n` +
        `Настройте в Mini App:`,
      {
        parse_mode: 'Markdown',
        reply_markup: new InlineKeyboard().webApp(
          '⚙️ Открыть настройки',
          `${MINI_APP_URL}?startapp=settings`
        ),
      }
    );
    await ctx.answerCallbackQuery();
  });

  // Show help
  bot.callbackQuery('show_help', async (ctx) => {
    await ctx.reply(
      'ℹ️ *EyeGuard AI*\n\n' +
        'Я помогаю защитить зрение с помощью:\n' +
        '• Научных упражнений для глаз\n' +
        '• Умных напоминаний о перерывах\n' +
        '• Тестов зрения и статистики\n\n' +
        'Команды: /start /break /stats /settings /help',
      { parse_mode: 'Markdown' }
    );
    await ctx.answerCallbackQuery();
  });

  // Set reminder count from inline buttons
  bot.callbackQuery(/^set_reminders_(\d)$/, async (ctx) => {
    const count = parseInt(ctx.match[1]);
    const telegramId = String(ctx.from?.id || '');

    try {
      await prisma.user.update({
        where: { telegramId },
        data: { reminderCount: count },
      });

      await ctx.reply(`✅ Напоминания установлены: *${count} раз в день*`, {
        parse_mode: 'Markdown',
      });
    } catch (err) {
      await ctx.reply('❌ Ошибка обновления настроек. Попробуйте /settings');
    }

    await ctx.answerCallbackQuery({ text: `Установлено ${count} раз в день` });
  });

  // Mood logging from reminder messages
  bot.callbackQuery(/^mood_(\d)$/, async (ctx) => {
    const feeling = parseInt(ctx.match[1]);
    const telegramId = String(ctx.from?.id || '');
    const user = await prisma.user.findUnique({ where: { telegramId } });

    if (!user) {
      await ctx.answerCallbackQuery({ text: 'Сначала /start' });
      return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    await prisma.dailyLog.upsert({
      where: { userId_date: { userId: user.id, date: today } },
      update: { feeling },
      create: { userId: user.id, date: today, feeling },
    });

    const emoji = MOOD_OPTIONS.find((m) => m.value === feeling)?.emoji || '😐';
    await ctx.answerCallbackQuery({ text: `Записано: ${emoji}` });
  });
}
