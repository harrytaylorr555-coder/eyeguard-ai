import prisma from '../../utils/prisma';

export async function getUserByTelegramId(telegramId: string) {
  return prisma.user.findUnique({ where: { telegramId } });
}

export async function getOrCreateUser(data: {
  telegramId: string;
  firstName?: string;
  lastName?: string;
  username?: string;
}) {
  const existing = await prisma.user.findUnique({
    where: { telegramId: data.telegramId },
  });

  if (existing) {
    return prisma.user.update({
      where: { telegramId: data.telegramId },
      data: {
        firstName: data.firstName || existing.firstName,
        lastName: data.lastName || existing.lastName,
        username: data.username || existing.username,
      },
    });
  }

  return prisma.user.create({
    data: {
      telegramId: data.telegramId,
      firstName: data.firstName || '',
      lastName: data.lastName || '',
      username: data.username || '',
    },
  });
}

export async function getUserStreak(userId: string): Promise<number> {
  const dailyLogs = await prisma.dailyLog.findMany({
    where: { userId },
    orderBy: { date: 'desc' },
    take: 30,
  });

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

  return streak;
}

export async function getUserStats(telegramId: string) {
  const user = await prisma.user.findUnique({ where: { telegramId } });
  if (!user) return null;

  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);

  const monthAgo = new Date();
  monthAgo.setMonth(monthAgo.getMonth() - 1);

  const [weekExercises, monthExercises, totalExercises, streak, dailyLogs] = await Promise.all([
    prisma.exerciseLog.count({
      where: { userId: user.id, completedAt: { gte: weekAgo } },
    }),
    prisma.exerciseLog.count({
      where: { userId: user.id, completedAt: { gte: monthAgo } },
    }),
    prisma.exerciseLog.count({ where: { userId: user.id } }),
    getUserStreak(user.id),
    prisma.dailyLog.findMany({
      where: { userId: user.id },
      orderBy: { date: 'desc' },
      take: 30,
    }),
  ]);

  return {
    weekExercises,
    monthExercises,
    totalExercises,
    streak,
    dailyLogs,
    reminderCount: user.reminderCount,
    isPremium: user.isPremium,
  };
}
