import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Copy, QrCode, ChevronRight, Check, Gift, Users, Star } from 'lucide-react';
import { apiRequest } from '../utils/telegram';

interface ReferralStats {
  referralCode: string; referralCount: number; coins: number; inviteLink: string;
  referrals: { id: string; firstName: string; username: string; createdAt: string }[];
  milestones: { count: number; rewardType: string; label: string; reached: boolean; claimed: boolean; reward: unknown }[];
}

const REWARD_LADDER = [
  { from: 0, to: 1, tier: 'Новичок',       icon: Users,  color: '#52A3FF' },
  { from: 2, to: 5, tier: 'Заботливый друг', icon: Star,   color: '#34C759' },
  { from: 6, to: 15, tier: 'Фокус-команда',  icon: Users,  color: '#B78BFF' },
  { from: 16, to: 30, tier: 'Защитник зрения', icon: Star,  color: '#F5A623' },
  { from: 31, to: 999, tier: 'Легенда EyeGuard', icon: Star, color: '#FFD700' },
] as const;

const MASCOT_ORBIT = [
  { cx: 140, cy: 50, r: 60, delay: 0 },
  { cx: 160, cy: 100, r: 48, delay: 0.6 },
  { cx: 130, cy: 120, r: 36, delay: 1.2 },
];

export default function Invite() {
  const [ref, setRef] = useState<ReferralStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [claiming, setClaiming] = useState<number | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const r = await apiRequest<ReferralStats>('/referral/stats');
        setRef(r);
      } catch {} finally {
        setLoading(false);
      }
    })();
  }, []);

  const currentTier = REWARD_LADDER.find(
    (t) => (ref?.referralCount || 0) >= t.from && (ref?.referralCount || 0) <= t.to
  ) || REWARD_LADDER[0];

  const handleCopy = () => {
    navigator.clipboard?.writeText(ref?.inviteLink || '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleClaim = async (milestone: number) => {
    try {
      setClaiming(milestone);
      await apiRequest(`/referral/claim/${milestone}`, { method: 'POST' });
      const r = await apiRequest<ReferralStats>('/referral/stats');
      setRef(r);
    } catch {} finally {
      setClaiming(null);
    }
  };

  const fadeUp = (delay = 0) => ({
    initial: { opacity: 0, y: 24 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.45, delay, ease: [0.25, 0.46, 0.45, 0.94] },
  });

  if (loading) {
    return (
      <div className="px-4 py-5 space-y-4 max-w-md mx-auto">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-24 skeleton-shimmer" />
        ))}
      </div>
    );
  }

  return (
    <motion.div className="px-4 py-6 space-y-5 max-w-md mx-auto pb-28" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      {/* ── HERO with mascot ── */}
      <motion.div className="card-t1 p-5 relative overflow-hidden" {...fadeUp(0)}>
        {/* Animated orbit rings behind mascot */}
        <div className="absolute inset-0 pointer-events-none">
          {MASCOT_ORBIT.map((o, i) => (
            <motion.div
              key={i}
              className="absolute rounded-full border"
              style={{
                left: o.cx - o.r,
                top: o.cy - o.r,
                width: o.r * 2,
                height: o.r * 2,
                borderColor: 'rgba(82,163,255,0.08)',
                borderWidth: 1,
              }}
              animate={{ rotate: [0, 360], scale: [1, 1.04, 1] }}
              transition={{ duration: 20 + o.delay * 5, repeat: Infinity, ease: 'linear', delay: o.delay }}
            />
          ))}
        </div>

        {/* Premium abstract referral visual */}
        <div className="flex justify-center mb-4 relative z-10">
          <motion.div
            className="relative w-[120px] h-[120px] rounded-[32px] flex items-center justify-center"
            style={{
              background: 'linear-gradient(145deg, rgba(30,100,255,0.18), rgba(82,163,255,0.08))',
              border: '1px solid rgba(82,163,255,0.3)',
              boxShadow: '0 0 50px rgba(30,100,255,0.2)',
            }}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 180, damping: 16, delay: 0.2 }}
          >
            {/* Orbit rings */}
            <motion.div
              className="absolute w-[140px] h-[140px] rounded-full border"
              style={{ borderColor: 'rgba(82,163,255,0.08)', borderWidth: 1 }}
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
            />
            <motion.div
              className="absolute w-[100px] h-[100px] rounded-full border"
              style={{ borderColor: 'rgba(82,163,255,0.1)', borderWidth: 1 }}
              animate={{ rotate: [360, 0] }}
              transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
            />
            <Users size={44} strokeWidth={1.2} color="#52A3FF" />
          </motion.div>
        </div>

        {/* Title */}
        <motion.div className="text-center relative z-10" {...fadeUp(0.3)}>
          <h1 className="text-[22px] font-bold text-white leading-snug" style={{ fontFamily: 'Syne, sans-serif' }}>
            Приглашай друзей
            <br />
            <span className="text-gradient">заботиться о зрении</span>
          </h1>
          <p className="text-[13px] mt-2" style={{ color: 'rgba(255,255,255,0.45)' }}>
            Получайте бонусы вместе за здоровые привычки
          </p>

          {/* Tier badge */}
          <div
            className="inline-flex items-center gap-2 mt-3 px-4 py-2 rounded-full"
            style={{
              background: `${currentTier.color}14`,
              border: `1px solid ${currentTier.color}30`,
            }}
          >
            <currentTier.icon size={16} strokeWidth={1.8} color={currentTier.color} />
            <span className="text-[13px] font-semibold" style={{ color: currentTier.color }}>
              {currentTier.tier}
            </span>
            <span className="text-[12px]" style={{ color: 'rgba(255,255,255,0.35)' }}>
              · {ref?.referralCount || 0} друзей
            </span>
          </div>
        </motion.div>
      </motion.div>

      {/* ── ACTION CARDS ── */}
      <motion.div className="grid grid-cols-2 gap-2.5" {...fadeUp(0.15)}>
        {/* Copy link card */}
        <motion.button
          onClick={handleCopy}
          className="card-interactive p-4 flex flex-col items-center gap-2.5 text-center"
          whileHover={{ y: -2 }} whileTap={{ scale: 0.96 }}
        >
          <div className="icon-box icon-box-md rounded-xl icon-glow-blue">
            {copied ? (
              <Check size={20} strokeWidth={2.5} color="#34C759" />
            ) : (
              <Copy size={20} strokeWidth={1.8} color="#52A3FF" />
            )}
          </div>
          <div>
            <div className="font-semibold text-[14px]" style={{ fontFamily: 'Syne, sans-serif' }}>
              {copied ? 'Скопировано' : 'Ссылка'}
            </div>
            <div className="text-[11px] mt-0.5 text-text-muted">
              Пригласить друга
            </div>
          </div>
        </motion.button>

        {/* QR card */}
        <motion.button
          className="card-interactive p-4 flex flex-col items-center gap-2.5 text-center"
          whileHover={{ y: -2 }} whileTap={{ scale: 0.96 }}
        >
          <div className="icon-box icon-box-md rounded-xl icon-glow-purple">
            <QrCode size={20} strokeWidth={1.8} color="#B78BFF" />
          </div>
          <div>
            <div className="font-semibold text-[14px]" style={{ fontFamily: 'Syne, sans-serif' }}>QR-код</div>
            <div className="text-[11px] mt-0.5 text-text-muted">Показать в чате</div>
          </div>
        </motion.button>
      </motion.div>

      {/* ── REWARD LADDER ── */}
      <motion.div className="card-t2 p-5" {...fadeUp(0.22)}>
        <h3 className="font-bold text-[16px] mb-4 flex items-center gap-2" style={{ fontFamily: 'Syne, sans-serif' }}>
          <Gift size={18} strokeWidth={1.8} color="#F5A623" />
          Уровни наград
        </h3>
        <div className="space-y-1.5">
          {REWARD_LADDER.map((t, i) => {
            const active = (ref?.referralCount || 0) >= t.from;
            const isCurrent = currentTier.tier === t.tier;
            return (
              <div
                key={i}
                className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all"
                style={{
                  background: isCurrent ? `${t.color}10` : 'transparent',
                  border: isCurrent ? `1px solid ${t.color}25` : '1px solid transparent',
                  opacity: active ? 1 : 0.4,
                }}
              >
                <div
                  className="icon-box icon-box-sm rounded-lg flex-shrink-0"
                  style={{
                    background: active ? `${t.color}15` : 'rgba(255,255,255,0.04)',
                    border: `1px solid ${active ? t.color + '30' : 'rgba(255,255,255,0.06)'}`,
                  }}
                >
                  <t.icon size={14} strokeWidth={1.8} color={active ? t.color : 'rgba(255,255,255,0.2)'} />
                </div>
                <div className="flex-1">
                  <div className="text-[14px] font-semibold" style={{ fontFamily: 'Syne, sans-serif', color: active ? 'white' : 'rgba(255,255,255,0.3)' }}>
                    {t.tier}
                  </div>
                  <div className="text-[11px] text-text-muted">
                    {t.from === 0 ? '0' : t.from}{t.to === 999 ? '+' : `–${t.to}`} приглашений
                  </div>
                </div>
                {isCurrent && (
                  <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full" style={{ background: `${t.color}15`, color: t.color }}>
                    Текущий
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* ── BONUS MESSAGING ── */}
      <motion.div className="card-t3 p-5" {...fadeUp(0.28)}>
        <h3 className="font-bold text-[15px] mb-3 flex items-center gap-2" style={{ fontFamily: 'Syne, sans-serif' }}>
          <Star size={16} strokeWidth={2} color="#FFD700" />
          Бонусы за приглашения
        </h3>
        <p className="text-[13px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.5)' }}>
          Пригласи друга — вы оба получаете бонусы. Premium-дни, монеты, новые упражнения и персональные награды открываются с каждым новым другом.
        </p>
      </motion.div>

      {/* ── REFERRAL MILESTONES — claimable rewards ── */}
      {ref && ref.milestones.some((m) => m.reached && !m.claimed) && (
        <motion.div className="card-t2 p-5" {...fadeUp(0.34)}>
          <h3 className="font-bold text-[16px] mb-4 flex items-center gap-2" style={{ fontFamily: 'Syne, sans-serif' }}>
            <Gift size={18} strokeWidth={1.8} color="#34C759" />
            Доступные награды
          </h3>
          <div className="space-y-2">
            {ref.milestones
              .filter((m) => m.reached && !m.claimed)
              .map((m) => (
                <div
                  key={m.count}
                  className="flex items-center gap-3 p-3 rounded-xl"
                  style={{
                    background: 'rgba(30,100,255,0.08)',
                    border: '1px solid rgba(82,163,255,0.2)',
                  }}
                >
                  <div className="icon-box icon-box-sm rounded-lg icon-glow-blue">
                    <Gift size={14} strokeWidth={1.8} color="#52A3FF" />
                  </div>
                  <div className="flex-1">
                    <div className="text-[14px] font-semibold" style={{ fontFamily: 'Syne, sans-serif' }}>
                      {m.label}
                    </div>
                    <div className="text-[11px] text-text-muted">{m.count} друзей</div>
                  </div>
                  <motion.button
                    onClick={() => handleClaim(m.count)}
                    disabled={claiming === m.count}
                    className="btn-sm"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {claiming === m.count ? '...' : 'Забрать'}
                  </motion.button>
                </div>
              ))}
          </div>
        </motion.div>
      )}

      {/* ── REFERRED FRIENDS LIST ── */}
      {ref && ref.referrals.length > 0 && (
        <motion.div className="card-t3 p-5" {...fadeUp(0.4)}>
          <h3 className="font-bold text-[15px] mb-3" style={{ fontFamily: 'Syne, sans-serif' }}>
            Приглашённые друзья ({ref.referrals.length})
          </h3>
          <div className="space-y-1.5">
            {ref.referrals.slice(0, 10).map((r, i) => (
              <div
                key={i}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl"
                style={{ background: 'rgba(10,20,44,0.5)' }}
              >
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold"
                  style={{
                    background: 'linear-gradient(135deg, rgba(30,100,255,0.2), rgba(82,163,255,0.1))',
                    color: '#52A3FF',
                  }}
                >
                  {(r.firstName || r.username || '?')[0]}
                </div>
                <span className="text-[13px] text-white">
                  {r.firstName || r.username || 'Anonymous'}
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
