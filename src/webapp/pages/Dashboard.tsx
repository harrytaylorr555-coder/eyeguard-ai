import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Gift, Flame, Eye, Monitor, Crosshair, ChevronRight, BarChart3, Sparkles, Check, Wrench } from 'lucide-react';
import { apiRequest } from '../utils/telegram';

interface TelegramUser { id: number; first_name: string; last_name?: string; username?: string; language_code?: string; }
interface Props { onNavigate: (screen: string, exType?: string) => void; user: TelegramUser | null; initData: string; }
interface Stats { weekExercises:number; streak:number; totalExercises:number; dailyLogs:{date:string;feeling:number;exerciseCount:number}[]; reminderCount:number; isPremium:boolean; }

const iconSm = (color: string) => ({ size: 20, strokeWidth: 1.8, color });
const iconMd = (color: string) => ({ size: 22, strokeWidth: 1.8, color });

const STATUS_CARDS = [
  { bg: 'card-status-red',   Icon: Eye,        title: 'Нужен отдых',     sub: 'Глаза устали',         accent: '#FF3B30' },
  { bg: 'card-status-blue',  Icon: Monitor,    title: 'Рабочий режим',   sub: 'Всё в порядке',        accent: '#2B7FFF' },
  { bg: 'card-status-green', Icon: Crosshair,  title: 'Комфорт',         sub: 'Отлично!',             accent: '#34C759' },
];

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 22 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.45, delay, ease: [0.25, 0.46, 0.45, 0.94] },
});

export default function Dashboard({ onNavigate, user, initData }: Props) {
  const [stats, setStats] = useState<Stats|null>(null);
  const [mood, setMood] = useState<number|null>(null);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, []);
  const load = async () => {
    try { setStats(await apiRequest<Stats>('/exercises/stats/summary')); } catch {} finally { setLoading(false); }
  };

  const handleMood = async (v: number) => {
    try {
      setMood(v);
      await apiRequest('/users/feeling', { method: 'POST', body: JSON.stringify({ feeling: v }) });
      setSaved(true); setTimeout(() => setSaved(false), 2500);
    } catch {}
  };

  const today  = stats?.dailyLogs?.[0]?.exerciseCount || 0;
  const target = stats?.reminderCount || 6;
  const pct    = Math.min((today / target) * 100, 100);

  return (
    <motion.div className="px-4 py-5 space-y-4 max-w-md mx-auto pb-28">

      {/* ── HERO SECTION (compact) ── */}
      <motion.div className="card-t1 p-3.5 relative overflow-hidden" {...fadeUp(0)}>
        <div className="flex items-center justify-between mb-2.5 relative z-10">
          <div>
            <p className="text-[11px] font-semibold text-accent-blue-bright uppercase tracking-wider mb-0.5">
              {user?.first_name ? `С возвращением, ${user.first_name}` : 'Добро пожаловать'}
            </p>
            <h1 className="text-[22px] font-bold tracking-tight" style={{ fontFamily: 'Syne, sans-serif' }}>
              EyeGuard <span className="text-gradient">AI</span>
            </h1>
          </div>
          <motion.button
            onClick={() => onNavigate('referral')}
            className="icon-box icon-box-md rounded-xl relative"
            style={{ background: 'rgba(245,166,35,0.12)', border: '1px solid rgba(245,166,35,0.3)', boxShadow: '0 0 16px rgba(245,166,35,0.15)' }}
            whileHover={{ scale: 1.06 }}
            whileTap={{ scale: 0.94 }}
            animate={{ boxShadow: ['0 0 8px rgba(245,166,35,0.1)', '0 0 20px rgba(245,166,35,0.3)', '0 0 8px rgba(245,166,35,0.1)'] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          >
            <Gift size={18} strokeWidth={1.6} color="#F5A623" />
          </motion.button>
        </div>

        {/* Stats row — compact */}
        <div className="grid grid-cols-3 gap-2 relative z-10">
          {[
            { label: 'Дней подряд', value: stats?.streak || 0, Icon: Flame, color: '#FF9500', ring: false },
            { label: 'Сегодня',     value: `${today}/${target}`, Icon: Eye,  color: '#52A3FF', ring: true },
            { label: 'За неделю',   value: stats?.weekExercises || 0, Icon: BarChart3, color: '#34C759', ring: false },
          ].map((s, i) => (
            <div key={i} className="text-center">
              {s.ring ? (
                <div className="relative w-[48px] h-[48px] mx-auto mb-0.5">
                  <svg viewBox="0 0 48 48" className="w-[48px] h-[48px] -rotate-90">
                    <defs>
                      <linearGradient id="heroRing" x1="0" y1="0" x2="48" y2="48">
                        <stop offset="0%" stopColor="#1A5FFF" /><stop offset="100%" stopColor="#52A3FF" />
                      </linearGradient>
                    </defs>
                    <circle cx="24" cy="24" r="20" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="3" />
                    <motion.circle cx="24" cy="24" r="20" fill="none" stroke="url(#heroRing)" strokeWidth="3" strokeLinecap="round"
                      strokeDasharray={2 * Math.PI * 20}
                      initial={{ strokeDashoffset: 2 * Math.PI * 20 }}
                      animate={{ strokeDashoffset: (1 - pct / 100) * 2 * Math.PI * 20 }}
                      transition={{ duration: 1.2, delay: 0.3, ease: 'easeOut' }} />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-[14px] font-bold text-white" style={{ fontFamily: 'Syne, sans-serif' }}>{s.value}</span>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="flex items-center justify-center gap-1 mb-0.5">
                    <s.Icon size={13} strokeWidth={2} color={s.color} />
                  </div>
                  <div className="text-[18px] font-bold text-white" style={{ fontFamily: 'Syne, sans-serif' }}>{s.value}</div>
                </div>
              )}
              <div className="text-[10px] text-text-muted mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* ── MOOD CARDS ── */}
      <motion.div {...fadeUp(0.08)}>
        <p className="text-[12px] font-semibold mb-2.5 text-text-muted uppercase tracking-wider">Как глаза?</p>
        <div className="grid grid-cols-3 gap-2">
          {STATUS_CARDS.map((c, i) => (
            <motion.button
              key={i}
              onClick={() => handleMood(i + 1)}
              whileTap={{ scale: 0.93 }}
              whileHover={{ scale: 1.03, y: -2 }}
              className={`${c.bg} p-3 text-left relative overflow-hidden`}
              style={{
                borderRadius: 16,
                boxShadow: mood === i + 1 ? `0 0 24px ${c.accent}44, 0 0 8px ${c.accent}25` : undefined,
                outline: mood === i + 1 ? `2px solid ${c.accent}50` : undefined,
              }}
            >
              <div className="mb-2"><c.Icon size={20} strokeWidth={1.8} color={c.accent} /></div>
              <div className="text-[11px] font-bold text-white leading-tight">{c.title}</div>
              <div className="text-[10px] mt-0.5" style={{ color: `${c.accent}CC` }}>{c.sub}</div>
              {mood === i + 1 && (
                <motion.div
                  className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full flex items-center justify-center"
                  initial={{ scale: 0 }} animate={{ scale: 1 }}
                  style={{ background: c.accent }}
                >
                  <Check size={10} strokeWidth={3} color="white" />
                </motion.div>
              )}
            </motion.button>
          ))}
        </div>
        <AnimatePresence>
          {saved && (
            <motion.p
              initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="text-center text-[13px] mt-3 font-semibold text-status-green"
            >
              <Check size={14} strokeWidth={2.5} className="inline-block mr-1 -mt-0.5" color="#34C759" /> Записано
            </motion.p>
          )}
        </AnimatePresence>
      </motion.div>

      {/* ── DAILY PROGRESS ── */}
      <motion.div className="card-t2 p-4" {...fadeUp(0.14)}>
        <div className="flex justify-between items-center mb-3">
          <span className="text-[15px] font-semibold" style={{ fontFamily: 'Syne, sans-serif' }}>Дневной прогресс</span>
          <span className="text-[15px] font-bold text-gradient">{Math.round(pct)}%</span>
        </div>
        <div className="progress-track">
          <motion.div
            className="progress-fill"
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 1.1, ease: [0.25,0.46,0.45,0.94], delay: 0.3 }}
          />
        </div>
        <div className="flex justify-between items-center mt-2.5">
          <p className="text-[12px] text-text-muted">
            {today >= target ? (
              <><Check size={14} strokeWidth={2.5} className="inline-block mr-1 -mt-0.5" color="#34C759" /> Норма выполнена!</>
            ) : `Осталось ${target - today} из ${target}`}
          </p>
          <div className="flex gap-1">
            {Array.from({ length: target }).map((_, i) => (
              <div key={i} className="w-1.5 h-1.5 rounded-full transition-all duration-300"
                style={{ background: i < today ? '#52A3FF' : 'rgba(255,255,255,0.12)',
                  boxShadow: i < today ? '0 0 6px rgba(82,163,255,0.8)' : undefined }} />
            ))}
          </div>
        </div>
      </motion.div>

      {/* ── QUICK ACTIONS ── */}
      <motion.div className="grid grid-cols-2 gap-2.5" {...fadeUp(0.2)}>
        {[
          { Icon: Eye,    title: 'Упражнения', sub: '4 упражнения', s: 'exercises' as const,   color: '#52A3FF', glow: 'icon-glow-blue' },
          { Icon: Wrench, title: 'Тест зрения', sub: '2 теста',    s: 'vision_test' as const, color: '#FF9500', glow: 'icon-glow-amber' },
        ].map((a) => (
          <motion.button
            key={a.s} onClick={() => onNavigate(a.s)}
            className="card-interactive p-4 flex flex-col gap-2.5 text-left"
            whileHover={{ y: -3 }} whileTap={{ scale: 0.96 }}
          >
            <div className={`icon-box icon-box-md rounded-xl ${a.glow}`}>
              <a.Icon size={22} strokeWidth={1.8} color={a.color} />
            </div>
            <div>
              <div className="font-semibold text-[14px]" style={{ fontFamily: 'Syne, sans-serif' }}>{a.title}</div>
              <div className="text-[12px] mt-0.5 text-text-muted">{a.sub}</div>
            </div>
          </motion.button>
        ))}
      </motion.div>

      {/* ── STATS ROW ── */}
      <motion.button
        onClick={() => onNavigate('stats')}
        className="card-interactive p-4 flex items-center gap-3 text-left w-full"
        whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }}
        {...fadeUp(0.26)}
      >
        <div className="icon-box icon-box-md rounded-xl icon-glow-green">
          <BarChart3 size={20} strokeWidth={1.8} color="#34C759" />
        </div>
        <div className="flex-1">
          <div className="font-semibold text-[14px]" style={{ fontFamily: 'Syne, sans-serif' }}>Статистика</div>
          <div className="text-[12px] mt-0.5 text-text-muted">Детальный отчёт и достижения</div>
        </div>
        <ChevronRight size={16} strokeWidth={1.8} color="rgba(82,163,255,0.7)" />
      </motion.button>

      {/* ── PREMIUM BANNER ── */}
      <motion.button
        onClick={() => onNavigate('premium')}
        className="card-t1 w-full p-4 flex items-center gap-3 text-left"
        style={{
          background: 'linear-gradient(135deg, rgba(26,95,255,0.22) 0%, rgba(100,60,220,0.15) 50%, rgba(245,166,35,0.08) 100%)',
          border: '1px solid rgba(82,163,255,0.3)',
        }}
        whileHover={{ y: -2, borderColor: 'rgba(245,166,35,0.5)' }}
        whileTap={{ scale: 0.97 }}
        animate={{ boxShadow: ['0 0 0 rgba(82,163,255,0)', '0 0 28px rgba(82,163,255,0.16)', '0 0 0 rgba(82,163,255,0)'] }}
        transition={{ duration: 3.5, repeat: Infinity }}
        {...fadeUp(0.32)}
      >
        <div className="icon-box icon-box-md rounded-xl icon-glow-amber">
          <Sparkles size={20} strokeWidth={1.8} color="#F5A623" />
        </div>
        <div className="flex-1">
          <div className="font-bold text-[14px] text-gradient-gold" style={{ fontFamily: 'Syne, sans-serif' }}>Премиум</div>
          <div className="text-[12px] mt-0.5 text-text-muted">Умные напоминания и все упражнения</div>
        </div>
        <ChevronRight size={16} strokeWidth={1.8} color="rgba(245,166,35,0.7)" />
      </motion.button>

      {loading && (
        <div className="flex justify-center py-4 gap-1.5">
          {[0,1,2].map(i => (
            <motion.div
              key={i}
              className="w-2 h-2 rounded-full exercise-dot"
              style={{ background: 'linear-gradient(135deg, #1A5FFF, #52A3FF)' }}
              animate={{ opacity: [0.25, 1, 0.25], scale: [0.85, 1.15, 0.85] }}
              transition={{ duration: 1.3, repeat: Infinity, delay: i * 0.22 }}
            />
          ))}
        </div>
      )}
    </motion.div>
  );
}
