import { Request, Response, NextFunction } from 'express';
import { createHmac } from 'crypto';
import { BOT_TOKEN } from '../../utils/constants';

// Extend Express Request to include telegram user
declare global {
  namespace Express {
    interface Request {
      telegramId?: string;
      telegramUser?: {
        id: string;
        first_name: string;
        last_name?: string;
        username?: string;
      };
    }
  }
}

interface TelegramInitData {
  query_id?: string;
  user?: string;
  auth_date: string;
  hash: string;
}

export function telegramAuth(req: Request, res: Response, next: NextFunction): void {
  const initData = req.headers['x-telegram-init-data'] as string;

  if (!initData) {
    res.status(401).json({ error: 'No Telegram init data' });
    return;
  }

  try {
    const params = new URLSearchParams(initData);
    const hash = params.get('hash');
    if (!hash) {
      res.status(401).json({ error: 'Missing hash' });
      return;
    }

    params.delete('hash');

    // Sort keys alphabetically
    const dataCheckString = Array.from(params.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}=${v}`)
      .join('\n');

    // HMAC-SHA256 validation
    const secretKey = createHmac('sha256', 'WebAppData')
      .update(BOT_TOKEN)
      .digest();

    const computedHash = createHmac('sha256', secretKey)
      .update(dataCheckString)
      .digest('hex');

    if (computedHash !== hash) {
      res.status(401).json({ error: 'Invalid hash' });
      return;
    }

    // Parse user data
    const userStr = params.get('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      req.telegramId = String(user.id);
      req.telegramUser = user;
    }

    next();
  } catch (err) {
    res.status(401).json({ error: 'Auth validation failed' });
  }
}
