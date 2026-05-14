import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { NODE_ENV, PORT } from '../utils/constants';
import { usersRouter } from './routes/users';
import { exercisesRouter } from './routes/exercises';
import { paymentsRouter } from './routes/payments';
import { referralRouter } from './routes/referral';
import { telegramAuth } from './middleware/telegramAuth';
import { startCleanupScheduler } from '../utils/scheduler';

const app = express();

startCleanupScheduler();

app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes вЂ” all protected by Telegram auth
app.use('/api/users', telegramAuth, usersRouter);
app.use('/api/exercises', telegramAuth, exercisesRouter);
app.use('/api/payments', telegramAuth, paymentsRouter);
app.use('/api/referral', telegramAuth, referralRouter);
const webappPath = path.resolve(process.cwd(), 'dist', 'webapp');
app.use(express.static(webappPath));
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/')) {
    next();
    return;
  }
  res.sendFile(path.join(webappPath, 'index.html'));
});

// Global error handler
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled error:', err.message);
  const message = NODE_ENV === 'production' ? 'Internal server error' : err.message;
  res.status(500).json({ error: message });
});

app.listen(PORT, () => {
  console.log(`EyeGuard API running on port ${PORT} (${NODE_ENV})`);
});

export default app;

