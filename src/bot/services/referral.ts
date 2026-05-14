import prisma from '../../utils/prisma';
import crypto from 'crypto';

const REFERRAL_MILESTONES = [
  { count: 1, rewardType: 'premium_days', label: '7 дней Premium' },
  { count: 3, rewardType: 'theme', label: 'Relax theme' },
  { count: 5, rewardType: 'streak_protect', label: 'Streak protection' },
  { count: 10, rewardType: 'premium_tests', label: 'Premium тесты' },
  { count: 20, rewardType: 'badge', label: 'Founder badge' },
] as const;

export const MILESTONE_COUNTS = REFERRAL_MILESTONES.map((m) => m.count);

export function generateReferralCode(telegramId: string): string {
  // 6-char code: first 4 chars from hash + 2 random alphanumeric
  const hash = crypto.createHash('sha256').update(telegramId).digest('base64url');
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let code = '';
  // Take deterministic chars from hash
  for (let i = 0; i < 4; i++) {
    code += chars[hash.charCodeAt(i) % chars.length];
  }
  // Add 2 random chars for uniqueness
  code += chars[Math.floor(Math.random() * chars.length)];
  code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

export async function ensureReferralCode(telegramId: string): Promise<string> {
  const user = await prisma.user.findUnique({ where: { telegramId } });
  if (!user) throw new Error('User not found');

  if (user.referralCode) return user.referralCode;

  let code = generateReferralCode(telegramId);
  // Retry if collision
  let attempts = 0;
  while (attempts < 5) {
    const existing = await prisma.user.findUnique({ where: { referralCode: code } });
    if (!existing) break;
    code = generateReferralCode(telegramId + String(attempts));
    attempts++;
  }

  await prisma.user.update({
    where: { telegramId },
    data: { referralCode: code },
  });

  return code;
}

export async function processReferral(newUserTelegramId: string, referralCode: string): Promise<boolean> {
  // Find referrer by code
  const referrer = await prisma.user.findUnique({ where: { referralCode } });
  if (!referrer) return false;

  // Don't allow self-referral
  if (referrer.telegramId === newUserTelegramId) return false;

  // Check if already referred (via same code or any other)
  const existingUser = await prisma.user.findUnique({ where: { telegramId: newUserTelegramId } });
  if (existingUser?.referredBy) return false;

  // Set the referral
  await prisma.user.update({
    where: { telegramId: newUserTelegramId },
    data: { referredBy: referrer.telegramId },
  });

  // Count referrals and check milestones
  const referralCount = await prisma.user.count({
    where: { referredBy: referrer.telegramId },
  });

  // Create milestone rewards if not already created
  for (const milestone of REFERRAL_MILESTONES) {
    if (referralCount >= milestone.count) {
      await prisma.referralReward.upsert({
        where: {
          userId_milestone: {
            userId: referrer.id,
            milestone: milestone.count,
          },
        },
        create: {
          userId: referrer.id,
          milestone: milestone.count,
          rewardType: milestone.rewardType,
        },
        update: {},
      });
    }
  }

  return true;
}

export async function getReferralStats(telegramId: string) {
  const user = await prisma.user.findUnique({
    where: { telegramId },
    include: {
      referrals: { select: { id: true, firstName: true, username: true, createdAt: true } },
      referralRewards: true,
      _count: { select: { referrals: true } },
    },
  });

  if (!user) return null;

  return {
    referralCode: user.referralCode,
    referralCount: user._count.referrals,
    coins: user.coins,
    referrals: user.referrals,
    rewards: user.referralRewards,
    milestones: REFERRAL_MILESTONES.map((m) => ({
      ...m,
      reached: user._count.referrals >= m.count,
      claimed: user.referralRewards.some((r) => r.milestone === m.count && r.claimed),
      reward: user.referralRewards.find((r) => r.milestone === m.count),
    })),
  };
}

export async function claimReferralReward(telegramId: string, milestone: number): Promise<{
  success: boolean;
  rewardType?: string;
  message?: string;
}> {
  const user = await prisma.user.findUnique({
    where: { telegramId },
    include: { referralRewards: true },
  });

  if (!user) return { success: false, message: 'User not found' };

  const reward = user.referralRewards.find((r) => r.milestone === milestone);
  if (!reward) return { success: false, message: 'Milestone not reached' };
  if (reward.claimed) return { success: false, message: 'Already claimed' };

  // Apply the reward
  switch (reward.rewardType) {
    case 'premium_days': {
      const now = new Date();
      const currentUntil = user.premiumUntil && user.premiumUntil > now ? user.premiumUntil : now;
      const newUntil = new Date(currentUntil.getTime() + 7 * 24 * 60 * 60 * 1000);

      await prisma.user.update({
        where: { telegramId },
        data: {
          isPremium: true,
          premiumUntil: newUntil,
        },
      });
      break;
    }
    case 'theme':
      // Theme is a UI preference stored locally — mark as claimed
      break;
    case 'streak_protect':
    case 'premium_tests':
    case 'badge':
      // These are status rewards — mark as claimed
      break;
  }

  await prisma.referralReward.update({
    where: { id: reward.id },
    data: { claimed: true, claimedAt: new Date() },
  });

  // Add coins for each claim
  const coinRewards: Record<string, number> = {
    premium_days: 50,
    theme: 100,
    streak_protect: 200,
    premium_tests: 500,
    badge: 1000,
  };

  await prisma.user.update({
    where: { telegramId },
    data: { coins: { increment: coinRewards[reward.rewardType] || 0 } },
  });

  return { success: true, rewardType: reward.rewardType };
}
