import prisma from './prisma';

// Clean up old data periodically to keep SQLite lean
export function startCleanupScheduler() {
  // Run once per day
  setInterval(
    async () => {
      try {
        const threeMonthsAgo = new Date();
        threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

        const deleted = await prisma.exerciseLog.deleteMany({
          where: { completedAt: { lt: threeMonthsAgo } },
        });

        if (deleted.count > 0) {
          console.log(`Cleaned up ${deleted.count} old exercise logs`);
        }
      } catch (err) {
        console.error('Cleanup error:', err);
      }
    },
    24 * 60 * 60 * 1000
  );

  console.log('Cleanup scheduler started');
}
