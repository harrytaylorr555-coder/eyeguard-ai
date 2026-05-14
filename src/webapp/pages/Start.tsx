import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Eye, Bell, BarChart3, ArrowRight } from 'lucide-react';

interface TelegramUser { id: number; first_name: string; last_name?: string; username?: string; language_code?: string; }
interface Props {
  onContinue: () => void;
  user: TelegramUser | null;
}

function detectLang(): 'ru' | 'en' {
  // Try Telegram user language first
  const tgLang = window.Telegram?.WebApp?.initDataUnsafe?.user?.language_code;
  if (tgLang) return tgLang.startsWith('ru') ? 'ru' : 'en';
  // Fallback to browser locale
  const nav = navigator.language || '';
  return nav.startsWith('ru') ? 'ru' : 'en';
}

export default function Start({ onContinue, user }: Props) {
  const [lang, setLang] = useState<'ru' | 'en'>(detectLang);

  return (
    <div className="min-h-screen flex flex-col items-center justify-between px-4 py-8 max-w-md mx-auto"
      >

      {/* Language picker — premium segmented control */}
      <motion.div
        className="flex justify-center"
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.35 }}
      >
        <div
          className="flex items-center gap-1"
          style={{
            height: 48,
            padding: 4,
            borderRadius: 16,
            background: 'rgba(10,25,55,0.75)',
            border: '1px solid rgba(80,140,255,0.18)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
          }}
        >
          {[
            { code: 'ru' as const, label: 'Русский' },
            { code: 'en' as const, label: 'English' },
          ].map((l) => (
            <button
              key={l.code}
              onClick={() => setLang(l.code)}
              className="font-semibold transition-all duration-200"
              style={{
                minWidth: 120,
                height: 40,
                borderRadius: 12,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 15,
                fontWeight: 600,
                background: lang === l.code
                  ? 'linear-gradient(135deg, #1A5FFF, #2B7FFF)'
                  : 'transparent',
                color: lang === l.code ? '#ffffff' : 'rgba(255,255,255,0.35)',
                boxShadow: lang === l.code
                  ? '0 2px 12px rgba(30,100,255,0.4)'
                  : 'none',
              }}
            >
              {l.label}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Center — logo + description */}
      <div className="flex-1 flex flex-col items-center justify-center gap-6 w-full">

        {/* Eye logo */}
        <motion.div
          className="relative"
          initial={{ opacity: 0, scale: 0.6 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.5, type: 'spring', stiffness: 200, damping: 18 }}
        >
          {/* Outer glow rings */}
          <motion.div className="absolute inset-0 rounded-full"
            style={{ background: 'radial-gradient(circle, rgba(82,163,255,0.2) 0%, transparent 70%)' }}
            animate={{ scale: [1, 1.15, 1], opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            className="w-28 h-28 rounded-[32px] flex items-center justify-center relative"
            style={{
              background: 'linear-gradient(145deg, rgba(26,95,255,0.3) 0%, rgba(10,30,100,0.6) 100%)',
              border: '1.5px solid rgba(82,163,255,0.45)',
              boxShadow: '0 0 50px rgba(30,100,255,0.35), inset 0 1px 0 rgba(255,255,255,0.08)',
            }}
            animate={{ boxShadow: [
              '0 0 30px rgba(30,100,255,0.3)',
              '0 0 60px rgba(30,100,255,0.55)',
              '0 0 30px rgba(30,100,255,0.3)',
            ]}}
            transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
          >
            <svg width="56" height="56" viewBox="0 0 56 56" fill="none">
              {/* Shield outline */}
              <path d="M28 4L8 14V28C8 39.05 16.4 49.36 28 52C39.6 49.36 48 39.05 48 28V14L28 4Z"
                fill="rgba(82,163,255,0.1)" stroke="rgba(82,163,255,0.7)" strokeWidth="1.5" strokeLinejoin="round" />
              {/* Eye */}
              <path d="M14 28C14 28 19 18 28 18C37 18 42 28 42 28C42 28 37 38 28 38C19 38 14 28 14 28Z"
                fill="rgba(82,163,255,0.15)" stroke="#52A3FF" strokeWidth="1.5" />
              <circle cx="28" cy="28" r="6" fill="#52A3FF" />
              <circle cx="30" cy="26" r="2" fill="white" opacity="0.6" />
            </svg>
          </motion.div>
        </motion.div>

        {/* App name */}
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.45 }}
        >
          <h1 className="text-[32px] font-bold tracking-tight" style={{ fontFamily: 'Syne, sans-serif' }}>
            EyeGuard <span className="text-gradient">AI</span>
          </h1>
          <p className="text-text-muted text-[15px] mt-1">
            {lang === 'ru' ? 'Умный уход за глазами в Telegram' : 'Smart eye care in Telegram'}
          </p>
        </motion.div>

        {/* Feature cards */}
        <motion.div
          className="w-full space-y-2.5"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.45 }}
        >
          {[
            { Icon: Eye,               title: lang === 'ru' ? 'Упражнения для глаз' : 'Eye exercises',          sub: lang === 'ru' ? 'Научные методики офтальмологов' : 'Science-based methods', color: '#52A3FF' },
            { Icon: Bell,              title: lang === 'ru' ? 'Умные напоминания' : 'Smart reminders',            sub: lang === 'ru' ? 'По твоему расписанию'          : 'Based on your schedule',   color: '#34C759' },
            { Icon: BarChart3,         title: lang === 'ru' ? 'Прогресс и аналитика' : 'Progress & analytics',   sub: lang === 'ru' ? 'Следи за улучшениями зрения'   : 'Track your improvement',    color: '#FF9500' },
          ].map((f, i) => (
            <motion.div
              key={i}
              className="card-t2 p-3.5 flex items-center gap-3 relative overflow-hidden"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.55 + i * 0.1, duration: 0.38 }}
            >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: `${f.color}15`, border: `1px solid ${f.color}28` }}>
                <f.Icon size={20} strokeWidth={1.8} color={f.color} />
              </div>
              <div className="text-left">
                <div className="text-[14px] font-semibold text-white leading-tight">{f.title}</div>
                <div className="text-[12px] text-text-muted mt-0.5 leading-tight">{f.sub}</div>
              </div>
              {/* color accent on right */}
              <div className="absolute right-0 top-0 bottom-0 w-1 rounded-r-full"
                style={{ background: `linear-gradient(180deg, ${f.color}60, transparent)` }} />
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Bottom CTA */}
      <motion.div
        className="w-full"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.85, duration: 0.4 }}
      >
        <motion.button
          onClick={onContinue}
          className="w-full btn-primary py-4 text-[16px] flex items-center justify-center gap-2"
          whileHover={{ scale: 1.02, y: -2 }}
          whileTap={{ scale: 0.97 }}
        >
          {lang === 'ru' ? 'Продолжить' : 'Continue'}
          <ArrowRight size={20} strokeWidth={2} />
        </motion.button>
        <p className="text-center text-text-muted text-[12px] mt-3">
          {lang === 'ru' ? 'Займёт меньше минуты' : 'Takes less than a minute'}
        </p>
      </motion.div>
    </div>
  );
}
