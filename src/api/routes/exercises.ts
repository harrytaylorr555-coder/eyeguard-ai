import { Router, Request, Response } from 'express';
import prisma from '../../utils/prisma';
import { EXERCISES, ExerciseType } from '../../utils/constants';

export const exercisesRouter = Router();

// Get exercise list
exercisesRouter.get('/', (_req: Request, res: Response) => {
  const exercises = Object.entries(EXERCISES).map(([key, ex]) => ({
    type: key,
    title: ex.title,
    duration: ex.duration,
    emoji: ex.emoji,
    description: ex.description,
    steps: ex.steps,
    effect: ex.effect,
    color: ex.color,
    premium: ex.premium || false,
  }));
  res.json(exercises);
});

// Get single exercise details
exercisesRouter.get('/:type', (req: Request, res: Response) => {
  const { type } = req.params;
  const exercise = EXERCISES[type as ExerciseType];
  if (!exercise) {
    res.status(404).json({ error: 'Exercise not found' });
    return;
  }
  res.json(exercise);
});

// Log exercise completion
exercisesRouter.post('/complete', async (req: Request, res: Response) => {
  try {
    const telegramId = req.telegramId!;
    const { type, duration } = req.body;

    const user = await prisma.user.findUnique({ where: { telegramId } });
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const log = await prisma.exerciseLog.create({
      data: {
        userId: user.id,
        type,
        duration: duration || EXERCISES[type as ExerciseType]?.duration || 60,
      },
    });

    // Update daily exercise count
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const dailyLog = await prisma.dailyLog.upsert({
      where: {
        userId_date: { userId: user.id, date: today },
      },
      update: { exerciseCount: { increment: 1 } },
      create: {
        userId: user.id,
        date: today,
        feeling: 3,
        exerciseCount: 1,
      },
    });

    res.json({ log, dailyLog });
  } catch (err) {
    res.status(500).json({ error: 'Failed to log exercise' });
  }
});

// Log vision test result
exercisesRouter.post('/vision-test', async (req: Request, res: Response) => {
  try {
    const telegramId = req.telegramId!;
    const { result } = req.body;

    const user = await prisma.user.findUnique({ where: { telegramId } });
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const test = await prisma.visionTest.create({
      data: {
        userId: user.id,
        type: 'vision_test',
        result: typeof result === 'string' ? result : JSON.stringify(result),
      },
    });

    res.json(test);
  } catch (err) {
    res.status(500).json({ error: 'Failed to log vision test' });
  }
});

// Get exercise stats
exercisesRouter.get('/stats/summary', async (req: Request, res: Response) => {
  try {
    const telegramId = req.telegramId!;
    const user = await prisma.user.findUnique({ where: { telegramId } });
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const recentLogs = await prisma.exerciseLog.findMany({
      where: {
        userId: user.id,
        completedAt: { gte: weekAgo },
      },
      orderBy: { completedAt: 'desc' },
    });

    // Calculate streak
    const dailyLogs = await prisma.dailyLog.findMany({
      where: { userId: user.id },
      orderBy: { date: 'desc' },
      take: 30,
    });

    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (const log of dailyLogs) {
      const logDate = new Date(log.date);
      logDate.setHours(0, 0, 0, 0);
      const expectedDate = new Date(today);
      expectedDate.setDate(expectedDate.getDate() - streak);

      if (logDate.getTime() === expectedDate.getTime() && log.exerciseCount > 0) {
        streak++;
      } else if (logDate.getTime() < expectedDate.getTime()) {
        break;
      }
    }

    const totalExercises = await prisma.exerciseLog.count({
      where: { userId: user.id },
    });

    res.json({
      weekExercises: recentLogs.length,
      streak,
      totalExercises,
      recentLogs,
      dailyLogs,
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to get stats' });
  }
});
