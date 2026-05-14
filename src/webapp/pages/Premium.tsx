import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Infinity, BarChart3, Bell, Eye, Crown, ShieldCheck, Zap, Star, Check, ArrowRight } from 'lucide-react';
import { apiRequest } from '../utils/telegram';

interface UserProfile { id: string; firstName: string; isPremium: boolean }

const PREMIUM_PRICE = 299;

const FEATURES = [
  {
    Icon: Infinity,
    title: '12 упражнений для глаз',
    desc: '4 базовых + 8 Premium: полный набор для защиты зрения',
    color: '#52A3FF',
  },
  {
    Icon: BarChart3,
    title: 'Продвинутая аналитика',
    desc: 'История, прогресс и подробная статистика защиты зрения',
    color: '#34C759',
  },
  {
    Icon: Bell,
    title: 'Умные напоминания',
    desc: 'Персональные AI-напоминания о перерывах под ваш ритм',
    color: '#B78BFF',
  },
  {
    Icon: Eye,
    title: 'Расширенные тесты',
    desc: 'Полный набор тестов остроты и цветовосприятия',
    color: '#FF9500',
  },
  {
    Icon: Crown,
    title: 'Ранний доступ',
    desc: 'Новые функции и упражнения первыми',
    color: '#F5A623',
  },
];

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.45, delay, ease: [0.25, 0.46, 0.45, 0.94] },
});

const stagger = (baseDelay = 0) => (i: number) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, delay: baseDelay + i * 0.07, ease: 'easeOut' },
});

export default function Premium() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const p = await apiRequest<UserProfile>('/users/me');
        setProfile(p);
      } catch {} finally {
        setLoading(false);
      }
    })();
  }, []);

  const handlePurchase = () => {
    window.Telegram?.WebApp?.openTelegramLink?.('https://t.me/eyeguardbot?start=premium');
  };

  if (loading) {
    return (
      <div className="px-4 py-5 space-y-4 max-w-md mx-auto">
        {[1, 2, 3].map((i) => <div key={i} className="h-32 skeleton-shimmer" />)}
      </div>
    );
  }

  // ── ALREADY PREMIUM ──
  if (profile?.isPremium) {
    return (
      <motion.div className="px-4 py-6 space-y-5 max-w-md mx-auto pb-28" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <motion.div className="card-t1 p-6 text-center" {...fadeUp(0)}>
          <motion.div
            className="flex justify-center mb-4"
            initial={{ scale: 0, rotate: -20 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 180, damping: 15 }}
          >
            <div
              className="w-28 h-28 rounded-full flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, rgba(245,166,35,0.2), rgba(255,200,80,0.1))',
                border: '2px solid rgba(245,166,35,0.4)',
                boxShadow: '0 0 60px rgba(245,166,35,0.3)',
              }}
            >
              <Crown size={44} strokeWidth={1.2} color="#F5A623" />
            </div>
          </motion.div>
          <h1 className="text-[28px] font-bold text-white mb-2" style={{ fontFamily: 'Syne, sans-serif' }}>
            Вы — Premium!
          </h1>
          <p className="text-[14px]" style={{ color: 'rgba(255,255,255,0.5)' }}>
            Все функции разблокированы. Спасибо за поддержку!
          </p>
        </motion.div>

        <motion.div className="card-t2 p-5" {...fadeUp(0.15)}>
          <h3 className="font-bold text-[16px] mb-4" style={{ fontFamily: 'Syne, sans-serif' }}>
            Ваши возможности
          </h3>
          <div className="space-y-2">
            {[
              '12 упражнений: 4 базовых + 8 Premium',
              'Умные AI-напоминания',
              'Детальная статистика и экспорт',
              'Расширенные тесты зрения',
              'Персональные рекомендации',
              'Ранний доступ к новым функциям',
            ].map((f, i) => (
              <div key={i} className="flex items-center gap-2.5 py-1.5">
                <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: 'rgba(52,199,89,0.2)', border: '1px solid rgba(52,199,89,0.4)' }}>
                  <Check size={10} strokeWidth={3} color="#34C759" />
                </div>
                <span className="text-[14px] text-white">{f}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </motion.div>
    );
  }

  // ── PAYWALL ──
  return (
    <motion.div className="px-4 py-6 space-y-5 max-w-md mx-auto pb-28" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      {/* ── HERO ── */}
      <motion.div className="card-t1 p-6 text-center relative overflow-hidden" {...fadeUp(0)}>
        {/* Animated gradient orbs behind mascot */}
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(245,166,35,0.12), transparent 60%)' }}
          animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute top-1/3 left-1/4 w-48 h-48 rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(82,163,255,0.1), transparent 60%)' }}
          animate={{ scale: [1, 1.15, 1], opacity: [0.4, 0.7, 0.4] }}
          transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
        />

        {/* Premium shield icon */}
        <motion.div
          className="flex justify-center mb-4 relative z-10"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 180, damping: 16, delay: 0.15 }}
        >
          <div
            className="w-[104px] h-[104px] rounded-[28px] flex items-center justify-center"
            style={{
              background: 'linear-gradient(145deg, rgba(245,166,35,0.2), rgba(26,95,255,0.15))',
              border: '1px solid rgba(245,166,35,0.35)',
              boxShadow: '0 0 50px rgba(245,166,35,0.2), 0 0 80px rgba(30,100,255,0.1)',
            }}
          >
            <Crown size={48} strokeWidth={1.2} color="#F5A623" />
          </div>
        </motion.div>

        {/* Headline */}
        <div className="relative z-10">
          <h1 className="text-[24px] font-bold text-white leading-snug mb-2" style={{ fontFamily: 'Syne, sans-serif' }}>
            Разблокируй полную
            <br />
            <span className="text-gradient">защиту зрения</span>
          </h1>
          <p className="text-[13px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.45)' }}>
            Персональные инструменты для тех, кто много времени проводит перед экраном
          </p>
        </div>
      </motion.div>

      {/* ── VALUE BLOCKS ── */}
      <motion.div className="space-y-2" {...fadeUp(0.1)}>
        <h3 className="text-[12px] font-semibold uppercase tracking-wider mb-1 text-text-muted px-1">
          Premium включает
        </h3>
        {FEATURES.map((f, i) => {
          const anim = stagger(0.15)(i);
          return (
            <motion.div
              key={i}
              className="card-interactive p-4 flex items-center gap-4 text-left"
              {...anim}
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.985 }}
            >
              <div
                className="icon-box icon-box-md rounded-xl flex-shrink-0"
                style={{
                  background: `${f.color}12`,
                  border: `1px solid ${f.color}25`,
                  boxShadow: `0 0 14px ${f.color}12`,
                }}
              >
                <f.Icon size={20} strokeWidth={1.8} color={f.color} />
              </div>
              <div>
                <div className="font-semibold text-[14px]" style={{ fontFamily: 'Syne, sans-serif' }}>{f.title}</div>
                <div className="text-[12px] mt-0.5 text-text-muted">{f.desc}</div>
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      {/* ── PRICE + PLAN SELECTOR ── */}
      <motion.div className="card-t1 p-5 text-center" {...fadeUp(0.25)}>
        {/* Recommended badge */}
        <div
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full mb-4"
          style={{
            background: 'rgba(245,166,35,0.15)',
            border: '1px solid rgba(245,166,35,0.3)',
          }}
        >
          <Star size={13} strokeWidth={2} color="#F5A623" />
          <span className="text-[12px] font-semibold" style={{ color: '#F5A623' }}>Лучшее предложение</span>
        </div>

        {/* Price */}
        <div className="flex items-baseline justify-center gap-1 mb-2">
          <span className="text-[56px] font-bold text-gradient" style={{ fontFamily: 'Syne, sans-serif' }}>
            {PREMIUM_PRICE}
          </span>
          <span className="text-[22px] font-bold" style={{ color: '#F5A623' }}>
            <Sparkles size={22} strokeWidth={2} color="#F5A623" />
          </span>
        </div>
        <p className="text-[14px] text-text-muted mb-1">Telegram Stars / месяц</p>
        <p className="text-[12px]" style={{ color: 'rgba(255,255,255,0.25)' }}>
          Безопасная оплата через Telegram
        </p>

        {/* CTA */}
        <motion.button
          onClick={handlePurchase}
          className="btn-primary mt-5 flex items-center justify-center gap-2"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          style={{
            background: 'linear-gradient(135deg, #F5A623 0%, #D4891A 100%)',
            boxShadow: '0 4px 32px rgba(245,166,35,0.5), 0 1px 0 rgba(255,255,255,0.12) inset',
          }}
        >
          <Crown size={20} strokeWidth={2} />
          Получить Premium
          <ArrowRight size={20} strokeWidth={2} />
        </motion.button>
      </motion.div>

      {/* ── TRUST SECTION ── */}
      <motion.div className="text-center space-y-1.5" {...fadeUp(0.35)}>
        {[
          { Icon: ShieldCheck, text: 'Безопасная оплата через Telegram' },
          { Icon: Zap,         text: 'Доступ активируется мгновенно' },
          { Icon: Check,       text: 'Отменить можно в любой момент' },
        ].map((t, i) => (
          <div key={i} className="flex items-center justify-center gap-2 py-1">
            <t.Icon size={14} strokeWidth={1.8} color="rgba(255,255,255,0.25)" />
            <span className="text-[12px]" style={{ color: 'rgba(255,255,255,0.3)' }}>
              {t.text}
            </span>
          </div>
        ))}
      </motion.div>

      {/* ── SOCIAL PROOF ── */}
      <motion.div className="card-t3 px-4 py-4 text-center" {...fadeUp(0.4)}>
        <p className="text-[13px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.4)' }}>
          Лучший выбор для тех, кто работает за экраном каждый день
        </p>
      </motion.div>
    </motion.div>
  );
}
