import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, Settings, Users, Sparkles, Flame, Dumbbell, Calendar, Trophy, Eye, Lock, Bell, Globe, Check, Gift, Share2, Crown, ChevronRight, Link, CircleDollarSign } from 'lucide-react';
import { apiRequest, shareToStory } from '../utils/telegram';

interface TelegramUser { id: number; first_name: string; last_name?: string; username?: string; language_code?: string; }
interface Props { onNavigate:(s:string)=>void; user:TelegramUser|null; initData:string; initialTab?:string; }
interface UP { id:string; firstName:string; isPremium:boolean; reminderCount:number; timezone:string; screenHours:number; }
interface St { weekExercises:number; monthExercises:number; totalExercises:number; streak:number; dailyLogs:{date:string;feeling:number;exerciseCount:number}[]; }
interface ReferralStats { referralCode:string; referralCount:number; coins:number; inviteLink:string; referrals:{id:string;firstName:string;username:string;createdAt:string}[]; milestones:{count:number;rewardType:string;label:string;reached:boolean;claimed:boolean;reward:any}[]; }

const PREMIUM_PRICE = 299;
type Tab = 'stats'|'settings'|'premium'|'referral';
const tabAnim = { initial:{opacity:0,y:14}, animate:{opacity:1,y:0,transition:{duration:0.35,ease:'easeOut'}} };

export default function Profile({ onNavigate, user, initData, initialTab }: Props) {
  const [tab, setTab] = useState<Tab>(initialTab==='referral'?'referral':initialTab==='premium'?'premium':initialTab==='settings'?'settings':'stats');

  useEffect(() => {
    if (initialTab) setTab(initialTab as Tab);
  }, [initialTab]);
  const [profile, setProfile] = useState<UP|null>(null);
  const [stats, setStats] = useState<St|null>(null);
  const [refStats, setRefStats] = useState<ReferralStats|null>(null);
  const [loading, setLoading] = useState(true);
  const [rc, setRc] = useState(3);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [claiming, setClaiming] = useState<number|null>(null);
  const [lang, setLang] = useState<string>(() => localStorage.getItem('eyeguard_lang') || 'ru');

  useEffect(() => {
    (async () => {
      try {
        const [p,s,r] = await Promise.all([
          apiRequest<UP>('/users/me'),
          apiRequest<St>('/exercises/stats/summary'),
          apiRequest<ReferralStats>('/referral/stats'),
        ]);
        setProfile(p); setStats(s); setRc(p.reminderCount||3);
        setRefStats(r);
      } catch {} finally { setLoading(false); }
    })();
  }, []);

  const saveSettings = async () => {
    try { setSaving(true); await apiRequest('/users/settings',{method:'PUT',body:JSON.stringify({reminderCount:rc})}); setSaved(true); setTimeout(()=>setSaved(false),2000); }
    catch {} finally { setSaving(false); }
  };

  const claimReward = async (milestone: number) => {
    try {
      setClaiming(milestone);
      await apiRequest(`/referral/claim/${milestone}`, { method: 'POST' });
      // Refresh referral stats
      const r = await apiRequest<ReferralStats>('/referral/stats');
      setRefStats(r);
    } catch {} finally { setClaiming(null); }
  };

  const allTabs: { id:Tab; label:string; Icon: React.ComponentType<{size?:number;strokeWidth?:number;color?:string}> }[] = [
    { id:'stats',    label:'Статистика', Icon: BarChart3 },
    { id:'settings', label:'Настройки',  Icon: Settings },
    { id:'referral', label:'Рефералы',   Icon: Users },
    { id:'premium',  label:'Premium',    Icon: Sparkles },
  ];

  // When opened from "Прогресс" nav — show only stats, no other tabs
  // When opened from "Ещё" nav — show settings, referral, premium
  const tabs = initialTab === 'stats'
    ? allTabs.filter(t => t.id === 'stats')
    : allTabs.filter(t => t.id !== 'stats');

  const headerTitle = initialTab === 'stats' ? 'Прогресс' : 'Профиль';

  if (loading) return (
    <div className="px-4 py-5 space-y-4 max-w-md mx-auto">
      <h1 className="text-[28px] font-bold text-white" style={{ fontFamily:'Syne, sans-serif' }}>{headerTitle}</h1>
      {[1,2,3].map(i => <div key={i} className="h-32 skeleton-shimmer"/>)}
    </div>
  );

  return (
    <motion.div className="px-4 py-5 space-y-4 max-w-md mx-auto pb-28" initial={{opacity:0}} animate={{opacity:1}} transition={{duration:0.28}}>

      {/* Header */}
      <h1 className="text-[28px] font-bold text-white tracking-tight" style={{ fontFamily:'Syne, sans-serif' }}>{headerTitle}</h1>

      {/* User card */}
      <motion.div className="card-t2 p-4 flex items-center gap-4" initial={{opacity:0,y:14}} animate={{opacity:1,y:0}} transition={{duration:0.38}}>
        <div className="w-13 h-13 w-[52px] h-[52px] rounded-2xl flex items-center justify-center text-white font-bold text-xl flex-shrink-0"
          style={{ background:'linear-gradient(135deg,#1A5FFF,#52A3FF)', boxShadow:'0 0 20px rgba(30,100,255,0.45)' }}>
          {profile?.firstName?.[0] || user?.first_name?.[0] || '?'}
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-[17px]" style={{ fontFamily:'Syne, sans-serif' }}>
            {profile?.firstName || user?.first_name || 'Пользователь'}
          </h3>
          <p className="text-text-muted text-[13px] mt-0.5">
            {profile?.isPremium ? <><Sparkles size={14} strokeWidth={2} className="inline -mt-0.5" color="#F5A623" /> Premium</> : 'Free'} · <Flame size={14} strokeWidth={2} className="inline -mt-0.5" color="#FF9500" /> {stats?.streak||0} дней подряд
          </p>
        </div>
        {!profile?.isPremium && (
          <motion.button onClick={() => setTab('premium')} className="btn-sm" whileHover={{scale:1.04}} whileTap={{scale:0.96}}>
            <Sparkles size={14} strokeWidth={2} className="mr-1" /> Upgrade
          </motion.button>
        )}
      </motion.div>

      {/* Tabs — hidden when only one tab (stats-only mode) */}
      {tabs.length > 1 && (
      <div className="flex rounded-2xl p-1 gap-1" style={{ background:'rgba(10,18,40,0.8)', border:'1px solid rgba(82,163,255,0.14)' }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => {
            if (t.id === 'premium' || t.id === 'referral') {
              onNavigate(t.id);
            } else {
              setTab(t.id);
            }
          }}
            className="flex-1 py-2.5 rounded-xl text-[13px] font-semibold transition-all duration-200 relative"
            style={tab === t.id ? {
              background: 'rgba(30,100,255,0.18)',
              color: '#52A3FF',
              boxShadow: '0 0 12px rgba(30,100,255,0.2)',
            } : { color: 'rgba(255,255,255,0.35)' }}
          >
            <t.Icon size={16} strokeWidth={1.8} style={{display:'inline',marginRight:4,marginTop:-2}} /> {t.label}
            {tab === t.id && (
              <motion.div layoutId="tab-indicator" className="absolute inset-0 rounded-xl"
                style={{ border:'1px solid rgba(82,163,255,0.35)' }}
                transition={{ type:'spring', stiffness:400, damping:30 }} />
            )}
          </button>
        ))}
      </div>
      )}

      {/* === STATS === */}
      {tab==='stats' && (
        <motion.div key="stats" {...tabAnim} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {[
              { Icon: Dumbbell, v:stats?.weekExercises||0,   l:'за неделю',  c:'#52A3FF' },
              { Icon: Flame,    v:stats?.streak||0,            l:'дней подряд', c:'#FF9500' },
              { Icon: Calendar, v:stats?.monthExercises||0,   l:'за месяц',   c:'#B464FF' },
              { Icon: Trophy,   v:stats?.totalExercises||0,   l:'всего',      c:'#34C759' },
            ].map((s,i) => (
              <motion.div key={i} className="card-t2 p-4 text-center relative overflow-hidden"
                initial={{opacity:0,y:14}} animate={{opacity:1,y:0}} transition={{duration:0.35,delay:i*0.07}}
                whileHover={{y:-2}}>
                <div className="absolute inset-0 opacity-15"
                  style={{ background:`radial-gradient(ellipse at 50% 100%, ${s.c}44, transparent 70%)` }} />
                <div className="mb-1.5"><s.Icon size={22} strokeWidth={1.8} color={s.c} /></div>
                <div className="text-[26px] font-bold" style={{ color:s.c, fontFamily:'Syne, sans-serif' }}>{s.v}</div>
                <div className="text-text-muted text-[12px] mt-0.5">{s.l}</div>
              </motion.div>
            ))}
          </div>

          {/* Achievements */}
          <div className="card-t2 p-5">
            <h3 className="font-bold text-[16px] mb-3 flex items-center gap-2" style={{ fontFamily:'Syne, sans-serif' }}>
              <Trophy size={18} strokeWidth={2} color="#F5A623" /> Достижения
            </h3>
            <div className="space-y-1.5">
              {[
                {Icon:Flame,t:'7 дней подряд',   d:'Неделя без перерыва',  u:(stats?.streak||0)>=7,    c:'#FF9500'},
                {Icon:Sparkles,t:'100 упражнений',d:'Всего 100+ выполнено', u:(stats?.totalExercises||0)>=100, c:'#52A3FF'},
                {Icon:Eye,   t:'Защитник зрения', d:'30 дней тренировок',   u:(stats?.streak||0)>=30,   c:'#34C759'},
                {Icon:Crown, t:'Premium',          d:'Поддержка проекта',    u:profile?.isPremium||false, c:'#F5A623'},
              ].map((a,i) => (
                <div key={i} className={`flex items-center gap-3 p-3 rounded-xl transition-all ${a.u ? '' : 'opacity-40'}`}
                  style={a.u ? { background:`${a.c}10`, border:`1px solid ${a.c}25` } : { background:'rgba(255,255,255,0.03)' }}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={a.u ? { background:`${a.c}18`, boxShadow:`0 0 12px ${a.c}30` } : { background:'rgba(255,255,255,0.06)' }}>
                    {a.u ? <a.Icon size={18} strokeWidth={1.8} color={a.c} /> : <Lock size={16} strokeWidth={1.8} color="rgba(255,255,255,0.3)" />}
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-[14px]" style={{ fontFamily:'Syne, sans-serif' }}>{a.t}</div>
                    <div className="text-text-muted text-[12px]">{a.d}</div>
                  </div>
                  {a.u && <Check size={18} strokeWidth={2.5} color="#34C759" />}
                </div>
              ))}
            </div>
          </div>

          {/* Mood chart */}
          <div className="card-t2 p-5">
            <h3 className="font-bold text-[16px] mb-4" style={{ fontFamily:'Syne, sans-serif' }}><Eye size={18} strokeWidth={2} className="inline mr-1.5 -mt-0.5" color="#52A3FF" /> Динамика самочувствия</h3>
            <div className="flex items-end gap-1 h-20">
              {(stats?.dailyLogs||[]).slice(0,14).reverse().map((log,i) => (
                <motion.div key={i} className="flex-1 rounded-t"
                  initial={{ height:0 }}
                  animate={{ height:`${(log.feeling/5)*100}%` }}
                  transition={{ duration:0.6, delay:i*0.04, ease:'easeOut' }}
                  style={{
                    backgroundColor: log.feeling>=4?'#34C759':log.feeling>=2?'#FF9500':'#FF3B30',
                    opacity: 0.5+(log.feeling/10),
                    boxShadow: log.feeling>=4?'0 0 8px rgba(52,199,89,0.4)':undefined,
                  }}
                />
              ))}
            </div>
            <div className="flex justify-between mt-2 text-text-muted text-[12px]">
              <span>14 дней назад</span><span>Сегодня</span>
            </div>
          </div>

          <motion.button onClick={() => shareToStory(
            `EyeGuard AI:\n${stats?.streak||0} дней подряд\n${stats?.totalExercises||0} всего\nПроверь зрение: t.me/eyeguardbot/app`
          )}
            className="w-full btn-primary py-4 flex items-center justify-center gap-2"
            whileHover={{scale:1.02}} whileTap={{scale:0.96}}>
            <Share2 size={18} strokeWidth={2} />
            Поделиться прогрессом
          </motion.button>
        </motion.div>
      )}

      {/* === SETTINGS === */}
      {tab==='settings' && (
        <motion.div key="settings" {...tabAnim} className="space-y-4">
          <div className="card-t2 p-5 space-y-5">
            <div>
              <h3 className="font-bold text-[16px] flex items-center gap-2" style={{ fontFamily:'Syne, sans-serif' }}>
                <Bell size={18} strokeWidth={1.8} color="#52A3FF" />
                Напоминания
              </h3>
              <p className="text-text-secondary text-[14px] mt-1 mb-3">Сколько раз в день присылать</p>
              <div className="flex gap-2">
                {[1,2,3,4,5,6].map(n => (
                  <motion.button key={n} onClick={() => setRc(n)}
                    className="flex-1 py-3 rounded-xl text-[15px] font-bold transition-all duration-200"
                    style={rc===n ? {
                      background:'linear-gradient(135deg,#1A5FFF,#52A3FF)',
                      color:'white',
                      boxShadow:'0 4px 16px rgba(30,100,255,0.45)',
                    } : {
                      background:'rgba(82,163,255,0.07)',
                      color:'rgba(255,255,255,0.4)',
                      border:'1px solid rgba(82,163,255,0.15)',
                    }}
                    whileHover={{scale:1.05}} whileTap={{scale:0.95}}
                  >{n}</motion.button>
                ))}
              </div>
            </div>

            <div className="divider" />

            <div>
              <h3 className="font-bold text-[16px] mb-2 flex items-center gap-2" style={{ fontFamily:'Syne, sans-serif' }}>
                <Globe size={18} strokeWidth={1.8} color="#52A3FF" /> Язык
              </h3>
              <div className="flex gap-2">
                {[
                  { code: 'ru', label: 'Русский' },
                  { code: 'en', label: 'English' },
                ].map((l) => (
                  <button
                    key={l.code}
                    onClick={() => {
                      localStorage.setItem('eyeguard_lang', l.code);
                      setLang(l.code);
                    }}
                    className="flex-1 py-3 rounded-xl text-[14px] font-semibold transition-all duration-200"
                    style={{
                      background: lang === l.code
                        ? 'linear-gradient(135deg,#1A5FFF,#2B7FFF)'
                        : 'rgba(82,163,255,0.07)',
                      color: lang === l.code ? '#ffffff' : 'rgba(255,255,255,0.4)',
                      border: lang === l.code ? 'none' : '1px solid rgba(82,163,255,0.15)',
                      boxShadow: lang === l.code ? '0 2px 12px rgba(30,100,255,0.35)' : 'none',
                    }}
                  >
                    {l.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="divider" />

            <div>
              <h3 className="font-bold text-[16px] mb-2 flex items-center gap-2" style={{ fontFamily:'Syne, sans-serif' }}>
                <Globe size={18} strokeWidth={1.8} color="#34C759" /> Часовой пояс
              </h3>
              <select
                value={profile?.timezone||'Europe/Moscow'}
                onChange={e => setProfile(p => p ? {...p, timezone:e.target.value} : null)}
                className="w-full px-4 py-3.5 rounded-2xl text-[14px] text-white font-medium focus:outline-none"
                style={{ background:'rgba(10,18,42,0.9)', border:'1px solid rgba(82,163,255,0.22)', color:'white' }}
              >
                <option value="Europe/Moscow">Москва (GMT+3)</option>
                <option value="Europe/London">Лондон (GMT+0)</option>
                <option value="Europe/Berlin">Берлин (GMT+1)</option>
                <option value="Asia/Yekaterinburg">Екатеринбург (GMT+5)</option>
                <option value="Asia/Novosibirsk">Новосибирск (GMT+7)</option>
                <option value="Asia/Vladivostok">Владивосток (GMT+10)</option>
              </select>
            </div>

            <motion.button onClick={saveSettings} disabled={saving}
              className="w-full btn-primary py-3.5 disabled:opacity-50"
              whileHover={{scale:1.02}} whileTap={{scale:0.96}}>
              {saving ? 'Сохранение...' : saved ? '✓ Сохранено!' : 'Сохранить настройки'}
            </motion.button>
          </div>

          <div className="card-t2 p-5">
            <h3 className="font-bold text-[16px] mb-1 flex items-center gap-2" style={{ fontFamily:'Syne, sans-serif' }}>
              <Sparkles size={18} strokeWidth={1.8} color="#F5A623" /> Premium статус
            </h3>
            <p className="text-text-secondary text-[14px]">
              {profile?.isPremium ? 'У вас активен Premium. Спасибо за поддержку!' : 'Откройте все функции с Premium'}
            </p>
            {!profile?.isPremium && (
              <motion.button onClick={() => setTab('premium')} className="btn-primary w-full py-3.5 mt-3 flex items-center justify-center gap-2"
                whileHover={{scale:1.02}} whileTap={{scale:0.96}}>
                <Sparkles size={18} strokeWidth={1.8} /> Перейти на Premium
              </motion.button>
            )}
          </div>
        </motion.div>
      )}

      {/* === PREMIUM === */}
      {tab==='premium' && (
        <motion.div key="premium" {...tabAnim} className="space-y-4">
          {profile?.isPremium ? (
            <div className="text-center py-6 space-y-4">
              <motion.div
                className="w-24 h-24 mx-auto rounded-full flex items-center justify-center"
                style={{ background:'linear-gradient(135deg,rgba(245,166,35,0.25),rgba(255,200,80,0.15))', border:'2px solid rgba(245,166,35,0.5)', boxShadow:'0 0 40px rgba(245,166,35,0.35)' }}
                initial={{scale:0}} animate={{scale:1}} transition={{type:'spring',stiffness:200,damping:15}}>
                <Sparkles size={40} strokeWidth={1.5} color="#F5A623" />
              </motion.div>
              <h2 className="text-[26px] font-bold text-white" style={{ fontFamily:'Syne, sans-serif' }}>Вы — Premium!</h2>
              <p className="text-text-secondary text-[15px]">Все функции разблокированы. Спасибо за поддержку!</p>
              <div className="card-t2 p-5 text-left">
                {['12 упражнений (4 базовых + 8 Premium)','Умные AI-напоминания','Детальная статистика','Расширенные тесты','Экспорт данных','Персональные рекомендации'].map((f,i) => (
                  <div key={i} className="flex items-center gap-2.5 py-2">
                    <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ background:'rgba(52,199,89,0.2)', border:'1px solid rgba(52,199,89,0.4)' }}>
                      <Check size={10} strokeWidth={3} color="#34C759" />
                    </div>
                    <span className="text-[14px] text-white">{f}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <>
              <motion.div className="relative overflow-hidden rounded-[22px] p-6 text-center"
                style={{ background:'linear-gradient(135deg,#0F2060 0%,#1A3B8F 50%,#0A1540 100%)', border:'1px solid rgba(82,163,255,0.35)' }}
                initial={{opacity:0,scale:0.96}} animate={{opacity:1,scale:1}} transition={{duration:0.38}}>
                <div className="absolute inset-0 opacity-20"
                  style={{ background:'radial-gradient(ellipse at 30% 30%, rgba(245,166,35,0.4), transparent 60%)' }} />
                <div className="mb-3 flex justify-center"><Sparkles size={44} strokeWidth={1.5} color="#F5A623" /></div>
                <h2 className="text-[26px] font-bold text-white mb-2" style={{ fontFamily:'Syne, sans-serif' }}>EyeGuard Premium</h2>
                <p className="text-[15px]" style={{ color:'rgba(255,255,255,0.75)' }}>Полный доступ к защите зрения</p>
              </motion.div>

              <motion.div className="card-t2 p-6 text-center"
                initial={{opacity:0,y:14}} animate={{opacity:1,y:0}} transition={{duration:0.35,delay:0.1}}>
                <div className="text-text-muted text-[14px] mb-2">Месячная подписка</div>
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-[52px] font-bold text-gradient" style={{ fontFamily:'Syne, sans-serif' }}>{PREMIUM_PRICE}</span>
                  <Sparkles size={18} strokeWidth={2} color="#F5A623" />
                </div>
                <div className="text-text-muted text-[13px] mt-1">Telegram Stars</div>
                <motion.button
                  onClick={() => window.Telegram?.WebApp?.openTelegramLink?.('https://t.me/eyeguardbot?start=premium')}
                  className="btn-primary w-full py-4 mt-5 text-[16px] flex items-center justify-center gap-2"
                  whileHover={{scale:1.02}} whileTap={{scale:0.96}}>
                  <Sparkles size={18} strokeWidth={2} />
                  Оплатить {PREMIUM_PRICE} Stars
                </motion.button>
                <p className="text-text-muted text-[12px] mt-2">Безопасная оплата через Telegram</p>
              </motion.div>

              <motion.div className="card-t3 overflow-hidden"
                initial={{opacity:0,y:14}} animate={{opacity:1,y:0}} transition={{duration:0.35,delay:0.2}}>
                <div className="grid grid-cols-2 text-center">
                  <div className="p-3 font-semibold text-[14px]" style={{ color:'rgba(255,255,255,0.45)', background:'rgba(10,18,40,0.8)' }}>Free</div>
                  <div className="p-3 font-semibold text-[14px] text-white" style={{ background:'linear-gradient(135deg,#1A5FFF,#0048CC)' }}>Premium ⭐</div>
                </div>
                {[
                  {free:'4 базовых',prem:'12 упражнений'},
                  {free:'Каждые 2 часа',prem:'AI-персонализация'},
                  {free:'За неделю',prem:'Детальная + экспорт'},
                  {free:'Базовый',prem:'Расширенный'},
                  {free:'Общие',prem:'Персональные'},
                ].map((r,i) => (
                  <div key={i} className={`grid grid-cols-2 text-center border-t ${i%2===0?'bg-bg-card-hover/20':''}`}
                    style={{ borderColor:'rgba(82,163,255,0.1)' }}>
                    <div className="p-2.5 text-[13px] text-text-muted">{r.free}</div>
                    <div className="p-2.5 text-[13px] font-semibold text-accent-blue-bright">{r.prem}</div>
                  </div>
                ))}
              </motion.div>
              <p className="text-text-muted text-[12px] text-center">Оплачивая подписку, вы принимаете условия. Отмена в любое время.</p>
            </>
          )}
        </motion.div>
      )}

      {/* === REFERRAL === */}
      {tab==='referral' && (
        <motion.div key="referral" {...tabAnim} className="space-y-4">
          {/* Stats card */}
          <motion.div className="card-t2 p-5 text-center relative overflow-hidden"
            initial={{opacity:0,scale:0.96}} animate={{opacity:1,scale:1}} transition={{duration:0.38}}>
            <div className="absolute inset-0 opacity-10"
              style={{ background:'radial-gradient(ellipse at 50% 0%, rgba(82,163,255,0.5), transparent 60%)' }} />
            <div className="mb-2 flex justify-center"><Users size={44} strokeWidth={1.5} color="#52A3FF" /></div>
            <div className="text-[42px] font-bold text-gradient" style={{ fontFamily:'Syne, sans-serif' }}>
              {refStats?.referralCount || 0}
            </div>
            <p className="text-text-muted text-[14px]">друзей приглашено</p>
            <div className="flex justify-center gap-4 mt-3">
              <div className="text-center">
                <div className="text-[18px] font-bold text-status-gold" style={{ fontFamily:'Syne, sans-serif' }}>
                  <CircleDollarSign size={16} strokeWidth={2} className="inline mr-0.5 -mt-0.5" color="#F5A623" /> {refStats?.coins || 0}
                </div>
                <div className="text-[11px] text-text-muted">монет</div>
              </div>
            </div>
          </motion.div>

          {/* Invite link */}
          <motion.div className="card-t2 p-4"
            initial={{opacity:0,y:14}} animate={{opacity:1,y:0}} transition={{duration:0.35,delay:0.08}}>
            <h3 className="font-bold text-[16px] mb-2 flex items-center gap-2" style={{ fontFamily:'Syne, sans-serif' }}>
              <Link size={18} strokeWidth={1.8} className="inline mr-1.5 -mt-0.5" color="#52A3FF" /> Твоя ссылка
            </h3>
            <div className="flex items-center gap-2 p-3 rounded-2xl"
              style={{ background:'rgba(10,18,42,0.9)', border:'1px solid rgba(82,163,255,0.18)' }}>
              <code className="text-[12px] text-accent-blue-bright flex-1 truncate select-all">
                {refStats?.inviteLink || '...'}
              </code>
              <motion.button
                onClick={() => {
                  navigator.clipboard?.writeText(refStats?.inviteLink || '');
                }}
                className="px-3 py-2 rounded-xl text-[12px] font-semibold text-white flex-shrink-0"
                style={{ background:'rgba(30,100,255,0.25)', border:'1px solid rgba(82,163,255,0.3)' }}
                whileHover={{ scale:1.05 }} whileTap={{ scale:0.95 }}
              >
                Копировать
              </motion.button>
            </div>
            <motion.button
              onClick={() => shareToStory(
                '👁️ Защити своё зрение с EyeGuard AI! Присоединяйся:',
                refStats?.inviteLink
              )}
              className="w-full btn-primary py-3.5 mt-3 flex items-center justify-center gap-2"
              whileHover={{ scale:1.02 }} whileTap={{ scale:0.96 }}
            >
              <Share2 size={18} strokeWidth={2} />
              Поделиться
            </motion.button>
          </motion.div>

          {/* Milestones */}
          <motion.div className="card-t2 p-5 space-y-3"
            initial={{opacity:0,y:14}} animate={{opacity:1,y:0}} transition={{duration:0.35,delay:0.14}}>
            <h3 className="font-bold text-[16px] mb-2 flex items-center gap-2" style={{ fontFamily:'Syne, sans-serif' }}>
              <Trophy size={18} strokeWidth={1.8} className="inline mr-1.5 -mt-0.5" color="#F5A623" /> Награды
            </h3>
            {(refStats?.milestones || []).map((m) => (
              <div key={m.count}
                className="flex items-center gap-3 p-3 rounded-xl transition-all"
                style={{
                  background: m.reached
                    ? m.claimed ? 'rgba(52,199,89,0.08)' : 'rgba(30,100,255,0.1)'
                    : 'rgba(255,255,255,0.03)',
                  border: m.reached
                    ? m.claimed ? '1px solid rgba(52,199,89,0.2)' : '1px solid rgba(82,163,255,0.25)'
                    : '1px solid rgba(255,255,255,0.05)',
                  opacity: m.reached ? 1 : 0.5,
                }}
              >
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                  style={{
                    background: m.claimed ? 'rgba(52,199,89,0.15)' : m.reached ? 'rgba(30,100,255,0.18)' : 'rgba(255,255,255,0.06)',
                    border: `1px solid ${m.claimed ? 'rgba(52,199,89,0.3)' : m.reached ? 'rgba(82,163,255,0.3)' : 'rgba(255,255,255,0.1)'}`,
                  }}>
                  {m.claimed ? <Check size={18} strokeWidth={2.5} color="#34C759" /> : m.reached ? <Gift size={18} strokeWidth={1.8} color="#52A3FF" /> : <Lock size={16} strokeWidth={1.8} color="rgba(255,255,255,0.3)" />}
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-[14px]" style={{ fontFamily:'Syne, sans-serif' }}>
                    {m.label}
                  </div>
                  <div className="text-text-muted text-[12px]">
                    {m.count} {m.count === 1 ? 'друг' : m.count < 5 ? 'друга' : 'друзей'}
                  </div>
                </div>
                {m.reached && !m.claimed && (
                  <motion.button
                    onClick={() => claimReward(m.count)}
                    disabled={claiming === m.count}
                    className="px-4 py-2 rounded-xl text-[13px] font-semibold text-white disabled:opacity-50"
                    style={{ background:'linear-gradient(135deg,#1A5FFF,#52A3FF)', boxShadow:'0 4px 16px rgba(30,100,255,0.35)' }}
                    whileHover={{ scale:1.05 }} whileTap={{ scale:0.95 }}
                  >
                    {claiming === m.count ? '...' : 'Забрать'}
                  </motion.button>
                )}
                {m.claimed && (
                  <span className="text-status-green text-[12px] font-semibold">Получено</span>
                )}
              </div>
            ))}
          </motion.div>

          {/* Referred users */}
          {(refStats?.referrals?.length || 0) > 0 && (
            <motion.div className="card-t2 p-5"
              initial={{opacity:0,y:14}} animate={{opacity:1,y:0}} transition={{duration:0.35,delay:0.2}}>
              <h3 className="font-bold text-[16px] mb-3 flex items-center gap-2" style={{ fontFamily:'Syne, sans-serif' }}>
                👤 Приглашённые
              </h3>
              <div className="space-y-2">
                {refStats!.referrals.map((r, i) => (
                  <div key={i} className="flex items-center gap-3 p-2.5 rounded-xl"
                    style={{ background:'rgba(10,18,40,0.6)', border:'1px solid rgba(82,163,255,0.08)' }}>
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0"
                      style={{ background:'linear-gradient(135deg,rgba(30,100,255,0.2),rgba(82,163,255,0.1))', color:'#52A3FF' }}>
                      {(r.firstName || r.username || '?')[0]}
                    </div>
                    <div className="text-[14px] font-medium text-white">
                      {r.firstName || r.username || 'Anonymous'}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </motion.div>
      )}
    </motion.div>
  );
}
