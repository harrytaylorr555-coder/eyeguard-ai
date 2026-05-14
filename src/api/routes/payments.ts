import { Router, Request, Response } from 'express';
import prisma from '../../utils/prisma';

export const paymentsRouter = Router();

// Check premium status
paymentsRouter.get('/status', async (req: Request, res: Response) => {
  try {
    const telegramId = req.telegramId!;
    const user = await prisma.user.findUnique({
      where: { telegramId },
      select: { isPremium: true },
    });

    res.json({ isPremium: user?.isPremium ?? false });
  } catch (err) {
    res.status(500).json({ error: 'Failed to check premium status' });
  }
});

// Activate premium (called after successful Stars payment)
paymentsRouter.post('/activate', async (req: Request, res: Response) => {
  try {
    const telegramId = req.telegramId!;
    const { transactionId } = req.body;

    const user = await prisma.user.update({
      where: { telegramId },
      data: { isPremium: true },
    });

    console.log(`Premium activated for user ${telegramId}, tx: ${transactionId}`);

    res.json({ success: true, isPremium: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to activate premium' });
  }
});
