import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Monitor, Bell, Timer, Eye, BarChart3, X } from 'lucide-react';
import StorySlide from './StorySlide';
import StoryProgress from './StoryProgress';
import { apiRequest } from '../../utils/telegram';

interface Props {
  onFinish: () => void;
}

const SLIDES = [
  {
    icon: (size: number) => (
      <div
        className="relative flex items-center justify-center"
        style={{
          width: size * 4,
          height: size * 4,
          borderRadius: 40,
          background: 'linear-gradient(145deg, rgba(26,95,255,0.25) 0%, rgba(10,30,100,0.5) 100%)',
          border: '1px solid rgba(82,163,255,0.35)',
          boxShadow: '0 0 60px rgba(30,100,255,0.25), 0 0 120px rgba(30,100,255,0.1)',
        }}
      >
        {/* Glow rings */}
        <div
          className="absolute inset-0 rounded-[40px]"
          style={{
            background: 'radial-gradient(circle at 50% 50%, rgba(82,163,255,0.15), transparent 70%)',
          }}
        />
        <Monitor size={size * 1.8} strokeWidth={1.2} color="#52A3FF" />
        {/* Eye icon overlay */}
        <div className="absolute bottom-1/4">
          <Eye size={size * 0.7} strokeWidth={1.5} color="rgba(255,255,255,0.6)" />
        </div>
      </div>
    ),
    title: 'Глаза устают\nот экрана?',
    subtitle:
      'Сухость, напряжение, размытость и усталость после часов перед экраном.',
    cta: 'Понятно',
  },
  {
    icon: (size: number) => (
      <div
        className="relative flex items-center justify-center"
        style={{
          width: size * 4,
          height: size * 4,
          borderRadius: 40,
          background: 'linear-gradient(145deg, rgba(52,199,89,0.18) 0%, rgba(10,40,20,0.5) 100%)',
          border: '1px solid rgba(52,199,89,0.3)',
          boxShadow: '0 0 60px rgba(52,199,89,0.2), 0 0 120px rgba(52,199,89,0.08)',
        }}
      >
        <Bell size={size * 1.6} strokeWidth={1.2} color="#34C759" />
        {/* Pulse ring */}
        <motion.div
          className="absolute inset-0 rounded-[40px] border-2"
          style={{ borderColor: 'rgba(52,199,89,0.3)' }}
          animate={{ scale: [1, 1.08, 1], opacity: [0.5, 0, 0.5] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>
    ),
    title: 'Умные\nнапоминания',
    subtitle:
      'EyeGuard вовремя подскажет сделать паузу и позаботиться о зрении.',
    cta: 'Дальше',
  },
  {
    icon: (size: number) => (
      <div
        className="relative flex items-center justify-center"
        style={{
          width: size * 4,
          height: size * 4,
          borderRadius: 40,
          background: 'linear-gradient(145deg, rgba(245,166,35,0.2) 0%, rgba(40,25,10,0.5) 100%)',
          border: '1px solid rgba(245,166,35,0.3)',
          boxShadow: '0 0 60px rgba(245,166,35,0.2), 0 0 120px rgba(245,166,35,0.08)',
        }}
      >
        <Timer size={size * 1.5} strokeWidth={1.2} color="#F5A623" />
        {/* Clock arc */}
        <svg
          width={size * 3}
          height={size * 3}
          viewBox="0 0 160 160"
          className="absolute"
          style={{ transform: 'rotate(-90deg)' }}
        >
          <motion.circle
            cx="80" cy="80" r="64"
            fill="none"
            stroke="rgba(245,166,35,0.25)"
            strokeWidth="2"
            strokeDasharray="402"
            strokeDashoffset="402"
            strokeLinecap="round"
            animate={{ strokeDashoffset: 100 }}
            transition={{ duration: 1.5, delay: 0.3, ease: 'easeOut' }}
          />
        </svg>
      </div>
    ),
    title: 'Быстрые\nупражнения',
    subtitle:
      '30–120 секунд для восстановления глаз. Научные методики офтальмологов.',
    cta: 'Дальше',
  },
  {
    icon: (size: number) => (
      <div
        className="relative flex items-center justify-center"
        style={{
          width: size * 4,
          height: size * 4,
          borderRadius: 40,
          background: 'linear-gradient(145deg, rgba(139,92,246,0.2) 0%, rgba(25,12,55,0.5) 100%)',
          border: '1px solid rgba(139,92,246,0.3)',
          boxShadow: '0 0 60px rgba(139,92,246,0.2), 0 0 120px rgba(139,92,246,0.08)',
        }}
      >
        <Eye size={size * 1.6} strokeWidth={1.2} color="#B78BFF" />
        {/* Focus ring */}
        <motion.div
          className="absolute rounded-full border"
          style={{
            width: size * 1.4,
            height: size * 1.4,
            borderColor: 'rgba(139,92,246,0.2)',
          }}
          animate={{ scale: [1, 1.4, 1], opacity: [0.6, 0, 0.6] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>
    ),
    title: 'Проверка зрения',
    subtitle:
      'Домашние тесты для контроля остроты и цветовосприятия.',
    cta: 'Дальше',
    disclaimer: 'Не медицинская диагностика.',
  },
  {
    icon: (size: number) => (
      <div
        className="relative flex items-center justify-center"
        style={{
          width: size * 4,
          height: size * 4,
          borderRadius: 40,
          background: 'linear-gradient(145deg, rgba(26,95,255,0.22) 0%, rgba(52,163,255,0.08) 50%, rgba(52,199,89,0.1) 100%)',
          border: '1px solid rgba(82,163,255,0.35)',
          boxShadow: '0 0 80px rgba(30,100,255,0.3), 0 0 160px rgba(30,100,255,0.1)',
        }}
      >
        <BarChart3 size={size * 1.5} strokeWidth={1.2} color="#52A3FF" />
        {/* Rising bars */}
        <div className="absolute flex items-end gap-1.5" style={{ bottom: size * 0.6 }}>
          {[0.5, 0.75, 1, 0.85].map((h, i) => (
            <motion.div
              key={i}
              className="w-1.5 rounded-t"
              style={{ background: 'linear-gradient(180deg, #52A3FF, #1A5FFF)' }}
              initial={{ height: 0 }}
              animate={{ height: h * size * 0.8 }}
              transition={{ delay: 0.5 + i * 0.12, duration: 0.6, ease: 'easeOut' }}
            />
          ))}
        </div>
      </div>
    ),
    title: 'Следи\nза прогрессом',
    subtitle:
      'Серии, достижения, статистика и персональная защита зрения.',
    cta: 'Начать',
    isLast: true,
  },
];

export default function OnboardingStory({ onFinish }: Props) {
  const [current, setCurrent] = useState(0);
  const [saving, setSaving] = useState(false);

  const handleNext = () => {
    if (current < SLIDES.length - 1) {
      setCurrent(current + 1);
    }
  };

  const handleFinish = async () => {
    if (saving) return;
    try {
      setSaving(true);
      await apiRequest('/users/settings', {
        method: 'PUT',
        body: JSON.stringify({
          screenHours: 6,
          symptoms: [],
          reminderCount: 3,
          onboardingDone: true,
        }),
      });
    } catch {
      // Continue even if API fails
    } finally {
      localStorage.setItem('eyeguard_onboarding_done', '1');
      onFinish();
    }
  };

  const handleCta = () => {
    if (current === SLIDES.length - 1) {
      handleFinish();
    } else {
      handleNext();
    }
  };

  const handleSkip = () => {
    handleFinish();
  };

  const slide = SLIDES[current];

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{
        background: 'linear-gradient(180deg, #08152F 0%, #0D2450 50%, #102B63 100%)',
      }}
    >
      {/* Top bar: progress + skip */}
      <div className="flex items-center justify-between px-4 pt-6 pb-2 max-w-md mx-auto w-full">
        <StoryProgress total={SLIDES.length} current={current} />
        <button
          onClick={handleSkip}
          className="flex items-center gap-1 text-[13px] font-medium transition-colors"
          style={{ color: 'rgba(255,255,255,0.4)' }}
        >
          Пропустить
          <X size={14} strokeWidth={1.8} />
        </button>
      </div>

      {/* Slide content */}
      <div className="flex-1 flex items-center justify-center max-w-md mx-auto w-full">
        <AnimatePresence mode="wait">
          <StorySlide
            key={current}
            icon={slide.icon(36)}
            title={slide.title}
            subtitle={slide.subtitle}
            cta={saving ? '...' : slide.cta}
            onCta={handleCta}
            isLast={slide.isLast}
            disclaimer={slide.disclaimer}
          />
        </AnimatePresence>
      </div>

      {/* Swipe hint — dots at bottom */}
      <div className="flex justify-center pb-10 max-w-md mx-auto w-full">
        <div className="flex gap-2">
          {SLIDES.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className="w-8 h-8 rounded-full flex items-center justify-center transition-all"
              style={{
                background:
                  i === current
                    ? 'rgba(82,163,255,0.2)'
                    : 'transparent',
              }}
            >
              <div
                className="rounded-full transition-all duration-300"
                style={{
                  width: i === current ? 8 : 5,
                  height: i === current ? 8 : 5,
                  background:
                    i <= current
                      ? '#52A3FF'
                      : 'rgba(255,255,255,0.15)',
                }}
              />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
