import { useEffect, useState, useCallback } from 'react';

interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
}

interface TelegramWebApp {
  ready: () => void;
  expand: () => void;
  close: () => void;
  MainButton: {
    setText: (text: string) => void;
    show: () => void;
    hide: () => void;
    onClick: (cb: () => void) => void;
    offClick: (cb: () => void) => void;
    enable: () => void;
    disable: () => void;
    showProgress: () => void;
    hideProgress: () => void;
    setParams: (params: { color?: string; text_color?: string; is_active?: boolean; is_visible?: boolean }) => void;
  };
  BackButton: {
    show: () => void;
    hide: () => void;
    onClick: (cb: () => void) => void;
    offClick: (cb: () => void) => void;
  };
  HapticFeedback: {
    impactOccurred: (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') => void;
    notificationOccurred: (type: 'error' | 'success' | 'warning') => void;
    selectionChanged: () => void;
  };
  themeParams: {
    bg_color: string;
    text_color: string;
    hint_color: string;
    link_color: string;
    button_color: string;
    button_text_color: string;
    secondary_bg_color: string;
  };
  colorScheme: 'light' | 'dark';
  initData: string;
  initDataUnsafe: {
    query_id?: string;
    user?: TelegramUser;
    auth_date: string;
    hash: string;
    start_param?: string;
  };
  version: string;
  platform: string;
  isExpanded: boolean;
}

declare global {
  interface Window {
    Telegram: {
      WebApp: TelegramWebApp;
    };
  }
}

export function useTelegram() {
  const [tg, setTg] = useState<TelegramWebApp | null>(null);
  const [user, setUser] = useState<TelegramUser | null>(null);
  const [initData, setInitData] = useState<string>('');
  const [colorScheme, setColorScheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    const webApp = window.Telegram?.WebApp;
    if (!webApp) return;

    webApp.ready();
    webApp.expand();

    setTg(webApp);
    setUser(webApp.initDataUnsafe?.user || null);
    setInitData(webApp.initData || '');
    setColorScheme(webApp.colorScheme);

    // Watch for theme changes
    document.documentElement.classList.toggle('dark', webApp.colorScheme === 'dark');
  }, []);

  const haptic = useCallback(
    (style: 'light' | 'medium' | 'heavy' = 'light') => {
      tg?.HapticFeedback?.impactOccurred(style);
    },
    [tg]
  );

  const showMainButton = useCallback(
    (text: string, onClick: () => void, color?: string) => {
      if (!tg) return;
      tg.MainButton.setText(text);
      tg.MainButton.onClick(onClick);
      if (color) tg.MainButton.setParams({ color });
      tg.MainButton.show();
    },
    [tg]
  );

  const hideMainButton = useCallback(() => {
    tg?.MainButton.hide();
  }, [tg]);

  const showBackButton = useCallback(
    (onClick: () => void) => {
      if (!tg) return;
      tg.BackButton.onClick(onClick);
      tg.BackButton.show();
    },
    [tg]
  );

  const hideBackButton = useCallback(() => {
    tg?.BackButton.hide();
  }, [tg]);

  return {
    tg,
    user,
    initData,
    colorScheme,
    haptic,
    showMainButton,
    hideMainButton,
    showBackButton,
    hideBackButton,
  };
}
