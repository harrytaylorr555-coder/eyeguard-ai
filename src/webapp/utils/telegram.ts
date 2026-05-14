const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const tg = window.Telegram?.WebApp;
  const initData = tg?.initData || '';

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (initData) {
    headers['X-Telegram-Init-Data'] = initData;
  }

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }

  return res.json();
}

export function getStartParam(): string | null {
  return window.Telegram?.WebApp?.initDataUnsafe?.start_param || null;
}

export function openTelegramLink(url: string) {
  window.Telegram?.WebApp?.openTelegramLink?.(url);
}

export function shareToStory(text: string, widgetUrl?: string) {
  const url = widgetUrl
    ? `https://t.me/share/url?url=${encodeURIComponent(widgetUrl)}&text=${encodeURIComponent(text)}`
    : `https://t.me/share/url?text=${encodeURIComponent(text)}`;
  openTelegramLink(url);
}
