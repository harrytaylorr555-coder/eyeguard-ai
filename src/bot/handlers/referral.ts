import { Bot, InlineKeyboard } from 'grammy';
import { MINI_APP_URL } from '../../utils/constants';
import { ensureReferralCode, getReferralStats, MILESTONE_COUNTS } from '../services/referral';

export function setupReferral(bot: Bot) {
  // /referral — show referral stats and invite link
  bot.command('referral', async (ctx) => {
    const telegramId = String(ctx.from?.id || '');
    if (!telegramId) return;

    const code = await ensureReferralCode(telegramId);
    const stats = await getReferralStats(telegramId);

    if (!stats) {
      await ctx.reply('Сначала зарегистрируйтесь через /start');
      return;
    }

    const botUsername = ctx.me?.username || 'eyeguardbot';
    const inviteLink = `https://t.me/${botUsername}?start=ref_${code}`;

    const nextMilestone = MILESTONE_COUNTS.find((m) => stats.referralCount < m) || null;
    const progressText = nextMilestone
      ? `\n\n🎯 Следующая цель: ${nextMilestone} друзей (прогресс: ${stats.referralCount}/${nextMilestone})`
      : '\n\n🏆 Все цели достигнуты!';

    await ctx.reply(
      `👥 *Реферальная программа*\n\n` +
        `🔗 Твоя ссылка:\n\`${inviteLink}\`\n\n` +
        `👤 Приглашено: *${stats.referralCount}*\n` +
        `🪙 Монеты: *${stats.coins}*\n` +
        progressText +
        `\n\nНаграды за друзей:\n` +
        `• 1 друг — 7 дней Premium\n` +
        `• 3 друга — Relax theme\n` +
        `• 5 друзей — Streak protection\n` +
        `• 10 друзей — Premium тесты\n` +
        `• 20 друзей — Founder badge\n\n` +
        `Награды можно забрать в Mini App:`,
      {
        parse_mode: 'Markdown',
        reply_markup: new InlineKeyboard()
          .webApp('🎁 Забрать награды', `${MINI_APP_URL}?startapp=referral`)
          .row()
          .url('📤 Поделиться', `https://t.me/share/url?url=${encodeURIComponent(inviteLink)}&text=${encodeURIComponent('👁️ Защити своё зрение с EyeGuard AI! Присоединяйся:')}`),
      }
    );
  });

  // /invite — alias for /referral
  bot.command('invite', async (ctx) => {
    await ctx.api.sendMessage(
      ctx.chat?.id!,
      'Используйте /referral для просмотра реферальной программы.',
    );
  });

  // /referral via callback from main menu
  bot.callbackQuery('show_referral', async (ctx) => {
    const telegramId = String(ctx.from?.id || '');
    if (!telegramId) return;

    const code = await ensureReferralCode(telegramId);
    const botUsername = ctx.me?.username || 'eyeguardbot';
    const inviteLink = `https://t.me/${botUsername}?start=ref_${code}`;

    await ctx.reply(
      `👥 *Реферальная программа*\n\n` +
        `🔗 Твоя ссылка:\n\`${inviteLink}\`\n\n` +
        `Открой Mini App для просмотра наград:`,
      {
        parse_mode: 'Markdown',
        reply_markup: new InlineKeyboard().webApp(
          '🎁 Открыть рефералы',
          `${MINI_APP_URL}?startapp=referral`
        ),
      }
    );
    await ctx.answerCallbackQuery();
  });
}
