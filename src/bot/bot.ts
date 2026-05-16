import 'dotenv/config';
import { Bot, webhookCallback } from 'grammy';
import express from 'express';
import { BOT_TOKEN, WEBHOOK_URL, WEBHOOK_SECRET, BOT_MODE, PORT } from '../utils/constants';
import { startHandler, onboardingConversation } from './handlers/start';
import { setupCommands } from './handlers/commands';
import { setupCallbacks } from './handlers/callbacks';
import { setupInline } from './handlers/inline';
import { setupReferral } from './handlers/referral';
import { startReminderScheduler } from './services/reminder';
import { setupPayments } from './handlers/payments';
import { ensureUser } from './middleware/auth';
import { logActivity } from './middleware/logging';

if (!BOT_TOKEN) {
  throw new Error('BOT_TOKEN is required');
}

export const bot = new Bot(BOT_TOKEN);

bot.command('appss_verify', async (ctx) => {
  await ctx.reply('appss_ad940f');
});

// Middleware
bot.use(ensureUser);
bot.use(logActivity);

// Register handlers
bot.use(startHandler);
bot.use(onboardingConversation);
setupCommands(bot);
setupCallbacks(bot);
setupInline(bot);
setupReferral(bot);
setupPayments(bot);

// Start reminder scheduler
startReminderScheduler(bot);

// Error handling
bot.catch((err) => {
  console.error('Bot error:', err.message);
});

// Start server
async function main() {
  if (BOT_MODE === 'webhook') {
    // Webhook mode (production)
    const app = express();
    app.use(express.json());

    // Webhook secret verification middleware
    app.use('/webhook', (req, res, next) => {
      if (WEBHOOK_SECRET) {
        const token = req.headers['x-telegram-bot-api-secret-token'];
        if (token !== WEBHOOK_SECRET) {
          res.status(403).json({ error: 'Forbidden' });
          return;
        }
      }
      next();
    });

    const webhookOptions = WEBHOOK_SECRET
      ? { secret_token: WEBHOOK_SECRET }
      : undefined;
    app.post('/webhook', webhookCallback(bot, 'express'));

    await bot.api.setWebhook(
      `${WEBHOOK_URL}/webhook`,
      webhookOptions as Record<string, unknown>,
    );
    console.log(`Bot webhook set to ${WEBHOOK_URL}/webhook`);

    app.listen(PORT, () => {
      console.log(`Webhook server listening on port ${PORT}`);
    });
  } else {
    // Polling mode (development)
    console.log('Starting bot in polling mode...');
    await bot.api.deleteWebhook();
    bot.start({
      onStart: () => console.log('Bot started in polling mode'),
    });
  }
}

main().catch(console.error);
