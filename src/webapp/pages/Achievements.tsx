import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Flame, Trophy, Eye, Target, Star, Lock, Check, TrendingUp } from 'lucide-react';
import { apiRequest } from '../utils/telegram';

interface St {
  weekExercises: number; monthExercises: number; totalExercises: number; streak: number;
  dailyLogs: { date: string; feeling: number; exerciseCount: number }[];
}
interface UP { id: string; firstName: string; isPremium: boolean }

type Filter = 'all' | 'unlocked' | 'progress' | 'hidden';
type Tier = 'bronze' | 'silver' | 'gold' | 'premium';
const tierColors: Record<Tier, { color: string; bg: string; border: string }> = {
  bronze:  { color: '#CD7F32', bg: 'rgba(205,127,50,0.1)',  border: 'rgba(205,127,50,0.25)' },
  silver:  { color: '#A8B8C8', bg: 'rgba(168,184,200,0.1)', border: 'rgba(168,184,200,0.25)' },
  gold:    { color: '#F5A623', bg: 'rgba(245,166,35,0.1)',  border: 'rgba(245,166,35,0.25)' },
  premium: { color: '#B78BFF', bg: 'rgba(183,139,255,0.1)',  border: 'rgba(183,139,255,0.25)' },
};

const ACHIEVEMENTS = [
  { id: 'first_exercise',   title: 'Первый шаг',       desc: 'Выполнить первое упражнение',        Icon: Eye,    tier: 'bronze'  as Tier, check: (s: St | null) => (s?.totalExercises || 0) >= 1 },
  { id: 'week_streak',      title: '7 дней подряд',    desc: 'Неделя ежедневных тренировок',        Icon: Flame,  tier: 'silver'  as Tier, check: (s: St | null) => (s?.streak || 0) >= 7 },
  { id: 'ten_exercises',    title: 'Десятка',          desc: 'Выполнить 10 упражнений',             Icon: Target, tier: 'bronze'  as Tier, check: (s: St | null) => (s?.totalExercises || 0) >= 10 },
  { id: 'hundred_exercises',title: 'Сотня',             desc: '100 выполненных упражнений',          Icon: Star,   tier: 'silver'  as Tier, check: (s: St | null) => (s?.totalExercises || 0) >= 100 },
  { id: 'month_streak',     title: 'Защитник зрения',  desc: '30 дней непрерывных тренировок',      Icon: Trophy, tier: 'gold'    as Tier, check: (s: St | null) => (s?.streak || 0) >= 30 },
  { id: 'week_warrior',     title: 'Недельный воин',   desc: '20+ упражнений за неделю',            Icon: Target, tier: 'gold'    as Tier, check: (s: St | null) => (s?.weekExercises || 0) >= 20 },
  { id: 'mood_master',      title: 'Мастер настроения',desc: '7 дней отличного самочувствия',       Icon: Star,   tier: 'silver'  as Tier, check: (s: St | null) => (s?.dailyLogs?.filter(d => d.feeling >= 5).length || 0) >= 7 },
  { id: 'premium_guardian', title: 'Premium защитник',  desc: 'Активировать Premium подписку',      Icon: Trophy, tier: 'premium' as Tier, check: (_s: St | null, p?: UP | null) => p?.isPremium || false },
];

const fadeUp = (d = 0) => ({
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.45, delay: d, ease: [0.25, 0.46, 0.45, 0.94] },
});

export default function Achievements() {
  const [stats, setStats] = useState<St | null>(null);
  const [profile, setProfile] = useState<UP | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>('all');

  useEffect(() => {
    (async () => {
      try {
        const [s, p] = await Promise.all([
          apiRequest<St>('/exercises/stats/summary'),
          apiRequest<UP>('/users/me'),
        ]);
        setStats(s); setProfile(p);
      } catch {} finally { setLoading(false); }
    })();
  }, []);

  const filtered = ACHIEVEMENTS.filter((a) => {
    const unlocked = a.check(stats, profile);
    if (filter === 'unlocked') return unlocked;
    if (filter === 'progress') return !unlocked;
    // 'hidden' = not unlocked and far from completion — show none for now if no progress data
    if (filter === 'hidden') return false;
    return true; // all
  });

  const unlockedCount = ACHIEVEMENTS.filter((a) => a.check(stats, profile)).length;
  const totalCount = ACHIEVEMENTS.length;
  const bestStreak = stats?.streak || 0; // best = current for simplicity
  const pct = Math.round((unlockedCount / totalCount) * 100);

  if (loading) return (
    <div className="px-4 py-5 space-y-4 max-w-md mx-auto">
      {[1, 2, 3, 4].map(i => <div key={i} className="h-28 skeleton-shimmer" />)}
    </div>
  );

  const FILTERS: { id: Filter; label: string }[] = [
    { id: 'all',      label: 'Все' },
    { id: 'unlocked', label: 'Открыты' },
    { id: 'progress', label: 'В процессе' },
    { id: 'hidden',   label: 'Скрытые' },
  ];

  return (
    <AnimatePresence mode="wait">
      <motion.div key={filter} className="px-4 py-5 space-y-4 max-w-md mx-auto pb-28" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        {/* ── STREAK HERO (compact) ── */}
        <motion.div className="card-t1 p-3.5 relative overflow-hidden" {...fadeUp(0)}>
          <div className="flex items-center gap-3 relative z-10">
            {/* Flame icon */}
            <motion.div
              className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, rgba(255,149,0,0.2), rgba(255,80,0,0.1))', border: '1px solid rgba(255,149,0,0.35)', boxShadow: '0 0 20px rgba(255,149,0,0.3)' }}
              animate={{ y: [0, -2, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            >
              <Flame size={20} strokeWidth={1.8} color="#FF9500" />
            </motion.div>

            {/* Streak number + info */}
            <div className="flex-1">
              <div className="flex items-baseline gap-1">
                <span className="text-[32px] font-bold text-white" style={{ fontFamily: 'Syne, sans-serif' }}>{bestStreak}</span>
                <span className="text-[14px]" style={{ color: '#FF9500' }}>дней подряд</span>
              </div>
              <p className="text-[11px] text-text-muted">Лучший результат: {bestStreak} дней</p>
            </div>

            {/* Progress ring */}
            <div className="relative w-12 h-12 flex-shrink-0">
              <svg viewBox="0 0 48 48" className="w-12 h-12 -rotate-90">
                <defs>
                  <linearGradient id="achGrad" x1="0" y1="0" x2="48" y2="48">
                    <stop offset="0%" stopColor="#FF9500" /><stop offset="100%" stopColor="#F5A623" />
                  </linearGradient>
                </defs>
                <circle cx="24" cy="24" r="20" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="3" />
                <motion.circle cx="24" cy="24" r="20" fill="none" stroke="url(#achGrad)" strokeWidth="3" strokeLinecap="round"
                  strokeDasharray={2 * Math.PI * 20}
                  initial={{ strokeDashoffset: 2 * Math.PI * 20 }}
                  animate={{ strokeDashoffset: (1 - unlockedCount / totalCount) * 2 * Math.PI * 20 }}
                  transition={{ duration: 1.2, delay: 0.4, ease: 'easeOut' }} />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-[12px] font-bold text-white" style={{ fontFamily: 'Syne, sans-serif' }}>{pct}%</span>
              </div>
            </div>
          </div>

          {/* Week indicators + achievement count */}
          <div className="flex items-center justify-between mt-3 pt-2.5 relative z-10" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
            <div className="flex gap-1">
              {(stats?.dailyLogs || []).slice(0, 7).reverse().map((d, i) => (
                <motion.div key={i} className="w-1.5 rounded-full"
                  initial={{ height: 0 }}
                  animate={{ height: d.exerciseCount > 0 ? 14 : 6 }}
                  transition={{ delay: 0.3 + i * 0.04, duration: 0.25 }}
                  style={{ background: d.exerciseCount > 0 ? 'linear-gradient(180deg, #FF9500, #FF6B00)' : 'rgba(255,255,255,0.1)', boxShadow: d.exerciseCount > 0 ? '0 0 4px rgba(255,149,0,0.4)' : undefined, borderRadius: 3 }} />
              ))}
            </div>
            <span className="text-[11px] text-text-muted">{unlockedCount}/{totalCount} достижений</span>
          </div>
        </motion.div>

        {/* ── FILTER PILLS ── */}
        <motion.div className="flex gap-2 overflow-x-auto hide-scrollbar" {...fadeUp(0.08)}>
          {FILTERS.map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className="px-4 py-2 rounded-full text-[13px] font-semibold whitespace-nowrap transition-all duration-200"
              style={{
                background: filter === f.id ? 'rgba(30,100,255,0.18)' : 'rgba(10,20,44,0.6)',
                border: filter === f.id ? '1px solid rgba(82,163,255,0.4)' : '1px solid rgba(82,163,255,0.1)',
                color: filter === f.id ? '#52A3FF' : 'rgba(255,255,255,0.4)',
                boxShadow: filter === f.id ? '0 0 12px rgba(30,100,255,0.15)' : undefined,
              }}
            >
              {f.label}
            </button>
          ))}
        </motion.div>

        {/* ── ACHIEVEMENT GRID ── */}
        {filtered.length > 0 ? (
          <motion.div className="grid grid-cols-2 gap-2.5" {...fadeUp(0.12)}>
            {filtered.map((a, i) => {
              const unlocked = a.check(stats, profile);
              const tier = tierColors[a.tier];
              return (
                <motion.div
                  key={a.id}
                  className="card-t2 p-4 flex flex-col items-center text-center gap-2"
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 + i * 0.04, duration: 0.35, ease: 'easeOut' }}
                  whileHover={{ y: -2 }}
                  style={{
                    opacity: unlocked ? 1 : 0.5,
                    borderColor: unlocked ? tier.border : 'rgba(255,255,255,0.05)',
                  }}
                >
                  {/* Icon */}
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center"
                    style={{
                      background: unlocked ? tier.bg : 'rgba(255,255,255,0.03)',
                      border: `1px solid ${unlocked ? tier.border : 'rgba(255,255,255,0.06)'}`,
                      boxShadow: unlocked ? `0 0 16px ${tier.color}18` : undefined,
                    }}
                  >
                    {unlocked ? (
                      <Check size={22} strokeWidth={2.5} color={tier.color} />
                    ) : (
                      <Lock size={18} strokeWidth={1.5} color="rgba(255,255,255,0.15)" />
                    )}
                  </div>

                  {/* Info */}
                  <div>
                    <div className="text-[13px] font-semibold" style={{ fontFamily: 'Syne, sans-serif', color: unlocked ? 'white' : 'rgba(255,255,255,0.35)' }}>
                      {a.title}
                    </div>
                    <div className="text-[11px] mt-0.5 text-text-muted leading-tight">{a.desc}</div>
                  </div>

                  {/* Tier badge */}
                  <span
                    className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                    style={{
                      background: tier.bg,
                      color: tier.color,
                      border: `1px solid ${tier.border}`,
                    }}
                  >
                    {a.tier === 'premium' ? 'Premium' : a.tier === 'gold' ? 'Золото' : a.tier === 'silver' ? 'Серебро' : 'Бронза'}
                  </span>

                  {/* State badge */}
                  {unlocked && (
                    <motion.div
                      className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center"
                      style={{ background: tier.color, boxShadow: `0 0 8px ${tier.color}55` }}
                      initial={{ scale: 0 }} animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                    >
                      <Check size={10} strokeWidth={3} color="white" />
                    </motion.div>
                  )}
                </motion.div>
              );
            })}
          </motion.div>
        ) : (
          /* Empty state */
          <motion.div className="card-t2 p-6 text-center" {...fadeUp(0.15)}>
            <div className="flex justify-center mb-3">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
                style={{ background: 'rgba(82,163,255,0.08)', border: '1px solid rgba(82,163,255,0.15)' }}>
                <Eye size={28} strokeWidth={1.5} color="rgba(255,255,255,0.2)" />
              </div>
            </div>
            <p className="text-[14px] font-semibold" style={{ fontFamily: 'Syne, sans-serif' }}>
              {filter === 'hidden' ? 'Скрытых достижений пока нет' : 'Нет достижений в этой категории'}
            </p>
            <p className="text-[12px] text-text-muted mt-1">Продолжайте тренировки, чтобы открыть больше</p>
          </motion.div>
        )}

        {/* ── NEXT GOAL ── */}
        <motion.div className="card-t1 p-5" {...fadeUp(0.25)}>
          <div className="flex items-center gap-3 mb-3">
            <div className="icon-box icon-box-sm rounded-xl" style={{ background: 'rgba(82,163,255,0.12)', border: '1px solid rgba(82,163,255,0.25)' }}>
              <TrendingUp size={16} strokeWidth={1.8} color="#52A3FF" />
            </div>
            <h3 className="font-bold text-[15px]" style={{ fontFamily: 'Syne, sans-serif' }}>Следующая цель</h3>
          </div>

          {(() => {
            const next = ACHIEVEMENTS.find((a) => !a.check(stats, profile));
            if (!next) {
              return (
                <div className="text-center py-3">
                  <Check size={28} strokeWidth={2} color="#34C759" className="mx-auto mb-2" />
                  <p className="text-[14px] font-semibold text-status-green">Все достижения открыты!</p>
                  <p className="text-[12px] text-text-muted mt-0.5">Вы — настоящий защитник зрения</p>
                </div>
              );
            }
            const tier = tierColors[next.tier];
            const progress = next.id === 'week_streak' ? Math.min((stats?.streak || 0) / 7 * 100, 100)
              : next.id === 'month_streak' ? Math.min((stats?.streak || 0) / 30 * 100, 100)
              : next.id === 'hundred_exercises' ? Math.min((stats?.totalExercises || 0) / 100 * 100, 100)
              : next.id === 'ten_exercises' ? Math.min((stats?.totalExercises || 0) / 10 * 100, 100)
              : next.id === 'week_warrior' ? Math.min((stats?.weekExercises || 0) / 20 * 100, 100)
              : 0;

            return (
              <div>
                <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: tier.bg, border: `1px solid ${tier.border}` }}>
                  <next.Icon size={22} strokeWidth={1.8} color={tier.color} />
                  <div className="flex-1">
                    <div className="text-[14px] font-semibold" style={{ fontFamily: 'Syne, sans-serif' }}>{next.title}</div>
                    <div className="text-[12px] text-text-muted">{next.desc}</div>
                  </div>
                  <span className="text-[11px] font-semibold px-2 py-1 rounded-full" style={{ background: `${tier.color}18`, color: tier.color }}>
                    {tier.color === tierColors.premium.color ? 'Premium' : tier.color === tierColors.gold.color ? 'Золото' : tier.color === tierColors.silver.color ? 'Серебро' : 'Бронза'}
                  </span>
                </div>
                {progress > 0 && (
                  <div className="mt-3">
                    <div className="flex justify-between text-[11px] mb-1.5">
                      <span className="text-text-muted">Прогресс</span>
                      <span style={{ color: tier.color }}>{Math.round(progress)}%</span>
                    </div>
                    <div className="progress-track h-2">
                      <motion.div
                        className="progress-fill"
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 0.8, delay: 0.3, ease: 'easeOut' }}
                        style={{ background: `linear-gradient(90deg, ${tier.color}, ${tier.color}88)` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })()}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
