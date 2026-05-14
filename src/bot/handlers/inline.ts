import { Bot, InlineKeyboard } from 'grammy';
import prisma from '../../utils/prisma';
import { MINI_APP_URL } from '../../utils/constants';

export function setupInline(bot: Bot) {
  // Inline mode handler
  bot.on('inline_query', async (ctx) => {
    const query = ctx.inlineQuery.query.trim().toLowerCase();
    const telegramId = String(ctx.from?.id || '');
    const user = await prisma.user.findUnique({ where: { telegramId } });

    const results: Array<Record<string, unknown>> = [];

    // Command: test — share vision test invite
    if (!query || query === 'test') {
      results.push({
        type: 'article',
        id: 'invite_test',
        title: '👁️ Проверь зрение в EyeGuard AI',
        description: 'Бесплатный тест остроты зрения и цветовосприятия в Telegram',
        input_message_content: {
          message_text:
            '👁️ *Проверь своё зрение!*\n\n' +
            'Я только что прошёл тест зрения в EyeGuard AI. ' +
            'Проверь и ты — это бесплатно и занимает 2 минуты.\n\n' +
            '🔗 [Открыть EyeGuard AI](https://t.me/eyeguardbot/app?startapp=vision_test)',
          parse_mode: 'Markdown',
        },
        reply_markup: new InlineKeyboard().url(
          '👁️ Проверить зрение',
          'https://t.me/eyeguardbot/app?startapp=vision_test'
        ),
        thumb_url: 'https://placehold.co/100x100/2563eb/white?text=👁️',
      });
    }

    // Command: progress — share own progress
    if (!query || query === 'progress') {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);

      const exerciseCount = user
        ? await prisma.exerciseLog.count({
            where: { userId: user.id, completedAt: { gte: weekAgo } },
          })
        : 0;

      results.push({
        type: 'article',
        id: 'share_progress',
        title: '💪 Мой прогресс защиты зрения',
        description: `Выполнено ${exerciseCount} упражнений за неделю в EyeGuard AI`,
        input_message_content: {
          message_text:
            '💪 *Мой прогресс в EyeGuard AI*\n\n' +
            `🏋️ Упражнений за неделю: *${exerciseCount}*\n\n` +
            'Присоединяйся и заботься о зрении вместе со мной!\n\n' +
            '🔗 [Открыть EyeGuard AI](https://t.me/eyeguardbot/app)',
          parse_mode: 'Markdown',
        },
        reply_markup: new InlineKeyboard().url(
          '👁️ Открыть EyeGuard',
          'https://t.me/eyeguardbot/app'
        ),
        thumb_url: 'https://placehold.co/100x100/10b981/white?text=💪',
      });
    }

    // Command: exercise [type] — share specific exercise
    const exerciseMatch = query.match(/^exercise\s*(.*)$/);
    if (query.startsWith('exercise')) {
      const exerciseNames: Record<string, { name: string; emoji: string; url: string }> = {
        palming: { name: 'Пальминг', emoji: '🖐️', url: 'exercise_palming' },
        blinking: { name: 'Быстрое моргание', emoji: '👁️', url: 'exercise_blinking' },
        focus: { name: 'Смена фокуса', emoji: '🔍', url: 'exercise_focus_shift' },
        roll: { name: 'Вращение глазами', emoji: '🔄', url: 'exercise_eye_roll' },
      };

      for (const [key, ex] of Object.entries(exerciseNames)) {
        results.push({
          type: 'article',
          id: `exercise_${key}`,
          title: `${ex.emoji} ${ex.name}`,
          description: 'Упражнение для глаз в EyeGuard AI',
          input_message_content: {
            message_text: `${ex.emoji} *${ex.name}*\n\nВыполни упражнение для глаз в EyeGuard AI — это быстро и полезно!`,
            parse_mode: 'Markdown',
          },
          reply_markup: new InlineKeyboard().url(
            '▶️ Выполнить',
            `https://t.me/eyeguardbot/app?startapp=${ex.url}`
          ),
          thumb_url: `https://placehold.co/100x100/2563eb/white?text=${ex.emoji}`,
        });
      }
    }

    // Default results
    if (results.length === 0) {
      results.push({
        type: 'article',
        id: 'default',
        title: '👁️ EyeGuard AI — Защита зрения',
        description: 'Персональный офтальмолог в Telegram',
        input_message_content: {
          message_text:
            '👁️ *EyeGuard AI*\n\nПерсональный офтальмолог в Telegram. ' +
            'Упражнения, тесты зрения и умные напоминания.\n\n' +
            '[Открыть приложение](https://t.me/eyeguardbot/app)',
          parse_mode: 'Markdown',
        },
        reply_markup: new InlineKeyboard().url(
          '👁️ Открыть',
          'https://t.me/eyeguardbot/app'
        ),
      });
    }

    // grammy inline query results are dynamically built — type assertion is safe
    await ctx.answerInlineQuery(results.slice(0, 10) as never, {
      cache_time: 300,
    });
  });
}
