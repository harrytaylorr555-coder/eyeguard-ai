import prisma from '../../utils/prisma';
import { EXERCISES, ExerciseType } from '../../utils/constants';

export async function logExerciseCompletion(
  userId: string,
  type: ExerciseType,
  duration?: number
) {
  const exercise = EXERCISES[type];
  if (!exercise) throw new Error(`Unknown exercise type: ${type}`);

  const [log] = await Promise.all([
    prisma.exerciseLog.create({
      data: {
        userId,
        type,
        duration: duration || exercise.duration,
      },
    }),
    // Update daily log
    (async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      await prisma.dailyLog.upsert({
        where: { userId_date: { userId, date: today } },
        update: { exerciseCount: { increment: 1 } },
        create: {
          userId,
          date: today,
          feeling: 3,
          exerciseCount: 1,
        },
      });
    })(),
  ]);

  return log;
}

export async function getExerciseHistory(userId: string, days: number = 7) {
  const since = new Date();
  since.setDate(since.getDate() - days);

  return prisma.exerciseLog.findMany({
    where: { userId, completedAt: { gte: since } },
    orderBy: { completedAt: 'desc' },
  });
}

export function getExerciseByType(type: string) {
  return EXERCISES[type as ExerciseType] || null;
}

export function getAllExercises() {
  return Object.entries(EXERCISES).map(([key, ex]) => ({
    type: key,
    ...ex,
  }));
}
