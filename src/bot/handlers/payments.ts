import { Bot, Context } from 'grammy';
import prisma from '../../utils/prisma';
import { PREMIUM_PRICE_STARS } from '../../utils/constants';

const PREMIUM_TITLE = 'EyeGuard Premium';
const PREMIUM_DESCRIPTION = '12 упражнений, умные AI-напоминания, расширенные тесты, детальная статистика';
const PREMIUM_PAYLOAD = 'premium_monthly';

/**
 * Send a Telegram Stars invoice for Premium subscription.
 * Called when user triggers /start premium or the Premium purchase flow.
 */
export async function sendPremiumInvoice(ctx: Context) {
  const telegramId = String(ctx.from?.id || '');
  const user = await prisma.user.findUnique({ where: { telegramId } });

  if (user?.isPremium) {
    await ctx.reply('⭐ У вас уже активен Premium! Спасибо за поддержку.');
    return;
  }

  try {
    await ctx.replyWithInvoice(
      PREMIUM_PAYLOAD,
      PREMIUM_TITLE,
      PREMIUM_DESCRIPTION,
      'XTR', // Telegram Stars currency
      [{ amount: PREMIUM_PRICE_STARS, label: 'EyeGuard Premium — 1 месяц' }],
      {
        photo_url: 'https://placehold.co/600x400/1A5FFF/F5A623?text=EyeGuard+Premium',
        start_parameter: 'premium',
      }
    );
  } catch (err) {
    console.error('Failed to send invoice:', err);
    await ctx.reply('⚠️ Не удалось создать счёт. Попробуйте позже или обратитесь в поддержку.');
  }
}

/**
 * Register payment handlers on the bot.
 */
export function setupPayments(bot: Bot) {
  // Answer pre-checkout queries — always approve
  bot.on('pre_checkout_query', async (ctx) => {
    try {
      await ctx.answerPreCheckoutQuery(true);
    } catch (err) {
      console.error('Pre-checkout error:', err);
      await ctx.answerPreCheckoutQuery(false, 'Произошла ошибка. Попробуйте позже.');
    }
  });

  // Handle successful payment
  bot.on('msg:successful_payment', async (ctx) => {
    const telegramId = String(ctx.from?.id || '');
    const payment = ctx.message?.successful_payment;

    if (!payment || payment.invoice_payload !== PREMIUM_PAYLOAD) {
      return; // Not our invoice
    }

    try {
      const user = await prisma.user.findUnique({ where: { telegramId } });

      if (!user) {
        console.error(`Payment received but user not found: ${telegramId}`);
        return;
      }

      // Calculate premium expiry: extend from now or current expiry
      const now = new Date();
      const currentUntil = user.premiumUntil && user.premiumUntil > now
        ? user.premiumUntil
        : now;
      const newUntil = new Date(currentUntil.getTime() + 30 * 24 * 60 * 60 * 1000); // +30 days

      await prisma.user.update({
        where: { telegramId },
        data: {
          isPremium: true,
          premiumUntil: newUntil,
        },
      });

      await ctx.reply(
        '🎉 *Спасибо за покупку!*\n\n' +
          '⭐ Premium активирован на 30 дней.\n' +
          'Теперь вам доступны:\n' +
          '• 12 упражнений для глаз\n' +
          '• Умные AI-напоминания\n' +
          '• Расширенные тесты зрения\n' +
          '• Детальная статистика\n\n' +
          'Откройте Mini App чтобы попробовать всё:',
        {
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [[
              { text: '📱 Открыть EyeGuard', web_app: { url: process.env.MINI_APP_URL || 'https://t.me/eyeguardbot/app' } },
            ]],
          },
        }
      );

      console.log(`Premium activated for user ${telegramId}, tx: ${payment.telegram_payment_charge_id}`);
    } catch (err) {
      console.error('Payment activation error:', err);
      await ctx.reply('⚠️ Оплата прошла, но возникла ошибка при активации. Поддержка свяжется с вами.');
    }
  });

  console.log('Payment handlers registered');
}
