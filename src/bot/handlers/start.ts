import { Composer, InlineKeyboard, Context } from 'grammy';
import prisma from '../../utils/prisma';
import { MINI_APP_URL, MOOD_OPTIONS, EXERCISE_LIST } from '../../utils/constants';
import { ensureReferralCode, processReferral } from '../services/referral';
import { sendPremiumInvoice } from './payments';

export const startHandler = new Composer();

export const onboardingConversation = new Composer();

// /start command
startHandler.command('start', async (ctx) => {
  const telegramId = String(ctx.from?.id || '');

  if (!telegramId) {
    await ctx.reply('Ошибка идентификации. Пожалуйста, попробуйте снова.');
    return;
  }

  // Handle premium purchase start param
  if (ctx.match === 'premium') {
    await sendPremiumInvoice(ctx);
    return;
  }

  // Check if user exists
  let user = await prisma.user.findUnique({ where: { telegramId } });

  if (!user) {
    user = await prisma.user.create({
      data: {
        telegramId,
        firstName: ctx.from?.first_name || '',
        lastName: ctx.from?.last_name || '',
        username: ctx.from?.username || '',
      },
    });

    // Generate referral code
    await ensureReferralCode(telegramId);

    // Check deep-link for referral
    const startParam = ctx.match;
    if (typeof startParam === 'string' && startParam.startsWith('ref_')) {
      const referralCode = startParam.replace('ref_', '');
      const referred = await processReferral(telegramId, referralCode);
      if (referred) {
        await ctx.reply('🎁 Вы присоединились по приглашению! После завершения настройки вы оба получите бонусы.');
      }
    }

    // Start onboarding
    await ctx.replyWithPhoto(
      'https://placehold.co/600x400/2563eb/white?text=EyeGuard+AI',
      {
        caption:
          '👁️ *Добро пожаловать в EyeGuard AI!*\n\n' +
          'Я — ваш персональный офтальмолог в Telegram. ' +
          'Помогу защитить зрение при работе за экраном:\n\n' +
          '🔹 Научно обоснованные упражнения\n' +
          '🔹 Умные напоминания о перерывах\n' +
          '🔹 Тесты зрения и статистика\n\n' +
          'Давайте настроим ваш персональный план защиты зрения!',
        parse_mode: 'Markdown',
        reply_markup: new InlineKeyboard().text('🚀 Начать настройку', 'onboarding_start'),
      }
    );
  } else {
    // Ensure referral code exists for existing users
    if (!user.referralCode) {
      await ensureReferralCode(telegramId);
    }

    if (user.onboardingStep < 3) {
      // Resume onboarding
      await startOnboardingStep(ctx, user.onboardingStep);
    } else {
      // Welcome back
      await showMainMenu(ctx);
    }
  }
});

// Handle onboarding callbacks
startHandler.callbackQuery('onboarding_start', async (ctx) => {
  await startOnboardingStep(ctx, 0);
  await ctx.answerCallbackQuery();
});

async function startOnboardingStep(ctx: Context, step: number) {
  const telegramId = String(ctx.from?.id || '');

  switch (step) {
    case 0:
      await ctx.reply(
        '📊 *Вопрос 1/3*\n\nСколько часов в день вы проводите за экраном?',
        {
          parse_mode: 'Markdown',
          reply_markup: new InlineKeyboard()
            .text('Меньше 4 часов', 'onboard_1_4')
            .text('4-8 часов', 'onboard_1_8')
            .row()
            .text('8-12 часов', 'onboard_1_12')
            .text('Больше 12 часов', 'onboard_1_12plus'),
        }
      );
      break;
    case 1:
      await ctx.reply(
        '👁️ *Вопрос 2/3*\n\nЕсть ли у вас проблемы со зрением?',
        {
          parse_mode: 'Markdown',
          reply_markup: new InlineKeyboard()
            .text('Да, есть проблемы', 'onboard_2_yes')
            .text('Нет, всё хорошо', 'onboard_2_no')
            .row()
            .text('Не проверял(а) давно', 'onboard_2_unknown'),
        }
      );
      break;
    case 2:
      await ctx.reply(
        '⏰ *Вопрос 3/3*\n\nВ какое время вам удобнее получать напоминания?',
        {
          parse_mode: 'Markdown',
          reply_markup: new InlineKeyboard()
            .text('🌅 Утро (9:00-12:00)', 'onboard_3_morning')
            .text('☀️ День (12:00-18:00)', 'onboard_3_day')
            .row()
            .text('🌆 Весь день (9:00-21:00)', 'onboard_3_all'),
        }
      );
      break;
  }
}

// Handle onboarding answers
startHandler.callbackQuery(/^onboard_(\d)_(.+)$/, async (ctx) => {
  const telegramId = String(ctx.from?.id || '');
  const [, question, answer] = ctx.match;

  try {
    switch (question) {
      case '1': {
        const hoursMap: Record<string, number> = { '4': 3, '8': 6, '12': 10, '12plus': 14 };
        await prisma.user.update({
          where: { telegramId },
          data: { screenHours: hoursMap[answer] || 8, onboardingStep: 1 },
        });
        break;
      }
      case '2': {
        const problemsMap: Record<string, boolean> = { yes: true, no: false, unknown: false };
        await prisma.user.update({
          where: { telegramId },
          data: { hasProblems: problemsMap[answer] ?? false, onboardingStep: 2 },
        });
        break;
      }
      case '3': {
        await prisma.user.update({
          where: { telegramId },
          data: { reminderTime: answer, onboardingStep: 3 },
        });
        break;
      }
    }

    const user = await prisma.user.findUnique({ where: { telegramId } });
    if (!user) return;

    if (user.onboardingStep < 3) {
      await startOnboardingStep(ctx, user.onboardingStep);
    } else {
      // Onboarding complete
      await ctx.reply(
        '✅ *Отлично! Ваш персональный план готов!*\n\n' +
          '🎯 Я буду присылать вам напоминания о перерывах и упражнения для глаз.\n\n' +
          '📱 *Рекомендую открыть Mini App* — там больше упражнений, тесты зрения и детальная статистика.\n\n' +
          'Начните прямо сейчас:',
        {
          parse_mode: 'Markdown',
          reply_markup: new InlineKeyboard()
            .webApp('📱 Открыть EyeGuard', MINI_APP_URL || 'https://t.me/eyeguardbot/app')
            .row()
            .text('🏃 Быстрое упражнение', 'quick_exercise')
            .text('ℹ️ Помощь', 'show_help'),
        }
      );
    }
  } catch (err) {
    console.error('Onboarding error:', err);
    await ctx.reply('Произошла ошибка. Попробуйте /start ещё раз.');
  }

  await ctx.answerCallbackQuery();
});

async function showMainMenu(ctx: Context) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const telegramId = String(ctx.from?.id || '');
  const user = await prisma.user.findUnique({
    where: { telegramId },
    include: {
      dailyLogs: { where: { date: today }, take: 1 },
    },
  });

  const todayLog = user?.dailyLogs[0];
  const exerciseCount = todayLog?.exerciseCount || 0;
  const target = user?.reminderCount || 3;

  await ctx.reply(
    `👁️ *EyeGuard AI*\n\n` +
      `📊 Упражнений сегодня: *${exerciseCount}/${target}*\n` +
      `💪 Продолжайте заботиться о зрении!\n\n` +
      `Выберите действие:`,
    {
      parse_mode: 'Markdown',
      reply_markup: new InlineKeyboard()
        .webApp('📱 Открыть Mini App', MINI_APP_URL || 'https://t.me/eyeguardbot/app')
        .row()
        .text('🏃 Быстрое упражнение', 'quick_exercise')
        .text('📊 Статистика', 'show_stats')
        .row()
        .text('⚙️ Настройки', 'show_settings')
        .text('👥 Рефералы', 'show_referral')
        .row()
        .text('ℹ️ Помощь', 'show_help'),
    }
  );
}
