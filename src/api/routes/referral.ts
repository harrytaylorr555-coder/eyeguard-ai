import { Router, Request, Response } from 'express';
import prisma from '../../utils/prisma';
import { ensureReferralCode, getReferralStats, claimReferralReward } from '../../bot/services/referral';

export const referralRouter = Router();

// Get referral stats
referralRouter.get('/stats', async (req: Request, res: Response) => {
  try {
    const telegramId = req.telegramId!;

    // Ensure referral code exists
    await ensureReferralCode(telegramId);

    const stats = await getReferralStats(telegramId);
    if (!stats) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const botUsername = 'eyeguardbot';
    const inviteLink = `https://t.me/${botUsername}?start=ref_${stats.referralCode}`;

    res.json({ ...stats, inviteLink });
  } catch (err) {
    res.status(500).json({ error: 'Failed to get referral stats' });
  }
});

// Claim milestone reward
referralRouter.post('/claim/:milestone', async (req: Request, res: Response) => {
  try {
    const telegramId = req.telegramId!;
    const milestone = parseInt(req.params.milestone, 10);

    if (isNaN(milestone)) {
      res.status(400).json({ error: 'Invalid milestone' });
      return;
    }

    const result = await claimReferralReward(telegramId, milestone);
    if (!result.success) {
      res.status(400).json({ error: result.message });
      return;
    }

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Failed to claim reward' });
  }
});

// Leaderboard
referralRouter.get('/leaderboard', async (_req: Request, res: Response) => {
  try {
    const topReferrers = await prisma.user.findMany({
      where: {
        referralCode: { not: null },
      },
      select: {
        firstName: true,
        username: true,
        referralCode: true,
        _count: { select: { referrals: true } },
      },
      orderBy: { referrals: { _count: 'desc' } },
      take: 20,
    });

    const leaderboard = topReferrers
      .filter((u) => u._count.referrals > 0)
      .map((u, i) => ({
        rank: i + 1,
        name: u.firstName || u.username || 'Anonymous',
        referrals: u._count.referrals,
      }));

    res.json(leaderboard);
  } catch (err) {
    res.status(500).json({ error: 'Failed to get leaderboard' });
  }
});
