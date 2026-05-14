import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Play, Pause, Check, Sparkles, Crown, Lock } from 'lucide-react';
import { apiRequest } from '../../utils/telegram';

interface Props { exerciseType:string; onBack:()=>void; initData:string; isPremium?:boolean; }
interface Ex { type:string; title:string; duration:number; emoji:string; description:string; steps:string[]; effect:string; color:string; premium?:boolean; }

const FB: Record<string,Ex> = {
  palming: {
    type:'palming', title:'Пальминг', duration:120, emoji:'🖐️', description:'',
    steps:[
      'Разотрите ладони друг о друга до ощущения тепла',
      'Закройте глаза и прикройте их тёплыми ладонями — не давите на глаза',
      'Убедитесь, что перед глазами полная темнота',
      'Дышите медленно и глубоко, расслабьте мышцы лица и шеи',
    ],
    effect:'Снятие напряжения глазных мышц', color:'#52A3FF',
  },
  blinking: {
    type:'blinking', title:'Быстрое моргание', duration:30, emoji:'👁️', description:'',
    steps:[
      'Смотрите прямо перед собой, расслабьте веки',
      'Моргайте быстро и легко 15 раз подряд — без усилий',
      'Закройте глаза на 5 секунд, дайте им отдохнуть',
    ],
    effect:'Увлажнение роговицы и снятие сухости', color:'#34C759',
  },
  focus_shift: {
    type:'focus_shift', title:'Смена фокуса', duration:60, emoji:'🔍', description:'',
    steps:[
      'Вытяните руку и сфокусируйтесь на кончике пальца — удерживайте 3 секунды',
      'Переведите взгляд на объект вдали (окно, стена) — удерживайте 3 секунды',
      'Чередуйте палец ↔ даль 10 раз без спешки',
    ],
    effect:'Тренировка мышц аккомодации', color:'#FF9500',
  },
  eye_roll: {
    type:'eye_roll', title:'Вращение глазами', duration:30, emoji:'🔄', description:'',
    steps:[
      'Медленно ведите взгляд по кругу по часовой стрелке — 5 оборотов',
      'То же самое против часовой стрелки — 5 оборотов',
      'Переводите взгляд плавно влево–вправо 10 раз',
      'Переводите взгляд вверх–вниз 10 раз, голова неподвижна',
    ],
    effect:'Укрепление глазных мышц', color:'#B78BFF', premium:false,
  },
  figure_eight: { type:'figure_eight', title:'Восьмёрка', duration:45, emoji:'∞', description:'', steps:['Представьте большую восьмёрку перед собой','Медленно обводите её глазами — 5 раз в одну','5 раз в обратную сторону','Дышите ровно, голова неподвижна'], effect:'Гибкость глазодвигательных мышц', color:'#06b6d4', premium:true },
  near_far_focus: { type:'near_far_focus', title:'Дальше-ближе', duration:60, emoji:'🔭', description:'', steps:['Фокус на кончике носа — 3 сек','Фокус на вытянутом пальце — 3 сек','Фокус на дальнем объекте — 3 сек','Повторить цепочку 8 раз'], effect:'Укрепление аккомодации', color:'#f97316', premium:true },
  diagonals: { type:'diagonals', title:'Диагонали', duration:30, emoji:'✳️', description:'', steps:['Взгляд вверх-вправо → вниз-влево (5 раз)','Взгляд вверх-влево → вниз-вправо (5 раз)','Повторить оба цикла без напряжения'], effect:'Тренировка косых мышц глаза', color:'#a855f7', premium:true },
  eyelid_massage: { type:'eyelid_massage', title:'Массаж век', duration:60, emoji:'💆', description:'', steps:['Чистыми пальцами легко к закрытым векам','Круги от внутреннего уголка к внешнему','10 кругов по верхнему веку','10 кругов по нижнему веку'], effect:'Снятие сухости, профилактика блефарита', color:'#ec4899', premium:true },
  eye_squeeze: { type:'eye_squeeze', title:'Зажмуривание', duration:30, emoji:'😖', description:'', steps:['Сильно зажмурьтесь на 3-4 секунды','Широко откройте глаза — расслабьте','Повторите 8-10 раз','В конце мягко поморгайте'], effect:'Укрепление век, улучшение кровотока', color:'#14b8a6', premium:true },
  solarization: { type:'solarization', title:'Соляризация', duration:90, emoji:'☀️', description:'', steps:['Закройте глаза, повернитесь лицом к свету','Медленно поворачивайте голову влево-вправо','Ощутите смену света и тени через веки','15-20 повторов, дыхание ровное'], effect:'Расслабление зрительного нерва и сетчатки', color:'#eab308', premium:true },
  window_mark: { type:'window_mark', title:'Метка на стекле', duration:60, emoji:'🪟', description:'', steps:['Наклейте метку на окно на уровне глаз','Фокус на метке — 5 сек','Фокус на дальнем объекте — 5 сек','Повторить 10 раз'], effect:'Тренировка цилиарной мышцы', color:'#6366f1', premium:true },
  nose_writing: { type:'nose_writing', title:'Письмо носом', duration:45, emoji:'✍️', description:'', steps:['Закройте глаза, расслабьте плечи','Представьте, что кончик носа — ручка','Напишите 5-6 букв или цифр в воздухе','Двигайте всей головой плавно'], effect:'Снятие напряжения с шеи и глаз', color:'#84cc16', premium:true },
};

const CIRCLE_R = 90;
const CIRCUMFERENCE = 2 * Math.PI * CIRCLE_R;

export default function ExercisePlayer({ exerciseType, onBack, initData }: Props) {
  const [ex, setEx] = useState<Ex|null>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [userIsPremium, setUserIsPremium] = useState(false);
  const [checkingAccess, setCheckingAccess] = useState(true);
  const premiumBlocked = ex?.premium && !userIsPremium;
  const timer = useRef<NodeJS.Timeout|null>(null);

  useEffect(() => {
    const f = FB[exerciseType]; if (f) { setEx(f); setTimeLeft(f.duration); }
    (async () => {
      try {
        const [d, profile] = await Promise.all([
          apiRequest<Ex>(`/exercises/${exerciseType}`),
          apiRequest<{isPremium:boolean}>('/payments/status'),
        ]);
        setEx(d); setTimeLeft(d.duration);
        setUserIsPremium(profile.isPremium);
      } catch {
        // Use fallback from FB
      } finally {
        setCheckingAccess(false);
      }
    })();
    return () => { if (timer.current) clearInterval(timer.current); };
  }, [exerciseType]);

  const stopTimer = () => { if (timer.current) { clearInterval(timer.current); timer.current=null; } };
  const tick = useCallback(() => {
    stopTimer();
    timer.current = setInterval(() => {
      setTimeLeft(p => { if (p<=1) { stopTimer(); setIsRunning(false); setCompleted(true); return 0; } return p-1; });
    }, 1000);
  }, []);

  const progress = ex ? ((ex.duration-timeLeft)/ex.duration) : 0;
  const strokeOffset = CIRCUMFERENCE * (1 - progress);
  const fmt = (s:number) => `${Math.floor(s/60)}:${(s%60).toString().padStart(2,'0')}`;

  useEffect(() => {
    if (!isRunning||!ex) return;
    setStep(Math.min(Math.floor(((ex.duration-timeLeft)/ex.duration)*ex.steps.length), ex.steps.length-1));
  }, [timeLeft,isRunning,ex]);

  if (!ex) return (
    <div className="min-h-screen flex items-center justify-center" style={{}}>
      <div className="flex gap-2">
        {[0,1,2].map(i => (
          <motion.div key={i} className="w-3 h-3 rounded-full"
            style={{ background:'linear-gradient(135deg,#1A5FFF,#52A3FF)' }}
            animate={{ opacity:[0.25,1,0.25], scale:[0.85,1.15,0.85] }}
            transition={{ duration:1.3, repeat:Infinity, delay:i*0.22 }}
          />
        ))}
      </div>
    </div>
  );

  // Premium gate — shown when non-premium user tries to access premium exercise
  if (ex && premiumBlocked && !checkingAccess) {
    return (
      <div className="min-h-screen flex flex-col max-w-md mx-auto" style={{}}>
        <div className="px-4 py-4 flex items-center gap-3">
          <motion.button onClick={onBack}
            className="w-11 h-11 rounded-2xl flex items-center justify-center"
            style={{ background:'rgba(82,163,255,0.08)', border:'1px solid rgba(82,163,255,0.2)' }}
            whileHover={{ scale:1.05 }} whileTap={{ scale:0.92 }}
          >
            <ArrowLeft size={18} strokeWidth={2} color="#52A3FF" />
          </motion.button>
          <div>
            <h2 className="font-bold text-[17px] text-white" style={{ fontFamily:'Syne, sans-serif' }}>{ex.title}</h2>
            <p className="text-text-muted text-[12px]">{ex.effect}</p>
          </div>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
          {/* Lock icon */}
          <motion.div
            className="w-28 h-28 rounded-[32px] flex items-center justify-center mb-6"
            style={{
              background: 'linear-gradient(145deg, rgba(245,166,35,0.18), rgba(180,120,20,0.08))',
              border: '1px solid rgba(245,166,35,0.3)',
              boxShadow: '0 0 50px rgba(245,166,35,0.2)',
            }}
            initial={{ scale: 0, rotate: -10 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 180, damping: 16 }}
          >
            <Lock size={40} strokeWidth={1.5} color="#F5A623" />
          </motion.div>

          <motion.h2
            className="text-[24px] font-bold text-white mb-2"
            style={{ fontFamily: 'Syne, sans-serif' }}
            initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.15 }}
          >
            Premium упражнение
          </motion.h2>
          <motion.p
            className="text-[14px] mb-6 max-w-xs"
            style={{ color: 'rgba(255,255,255,0.5)' }}
            initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.2 }}
          >
            Это упражнение доступно только с Premium подпиской. Разблокируй полный доступ к 12 упражнениям.
          </motion.p>

          {/* Exercise preview (teaser) */}
          <motion.div
            className="card-t2 p-5 w-full max-w-xs mb-6 text-left"
            initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.28 }}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: `${ex.color}14`, border: `1px solid ${ex.color}30` }}>
                <span style={{fontSize:20}}>{ex.emoji}</span>
              </div>
              <div>
                <div className="font-semibold text-[15px] text-white">{ex.title}</div>
                <div className="text-text-muted text-[12px]">{fmt(ex.duration)}</div>
              </div>
            </div>
            <p className="text-[13px] text-text-secondary">{ex.description || ex.effect}</p>
          </motion.div>

          {/* CTA */}
          <motion.button
            onClick={() => window.Telegram?.WebApp?.openTelegramLink?.('https://t.me/eyeguardbot?start=premium')}
            className="btn-primary w-full max-w-xs flex items-center justify-center gap-2"
            style={{
              background: 'linear-gradient(135deg, #F5A623 0%, #D4891A 100%)',
              boxShadow: '0 4px 32px rgba(245,166,35,0.5), 0 1px 0 rgba(255,255,255,0.12) inset',
            }}
            initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.35 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
          >
            <Crown size={20} strokeWidth={2} />
            Купить Premium — 299 ⭐
          </motion.button>

          <motion.button
            onClick={onBack}
            className="mt-3 text-[14px] font-medium"
            style={{ color: 'rgba(255,255,255,0.35)' }}
            initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.45 }}
          >
            Вернуться к упражнениям
          </motion.button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col max-w-md mx-auto" style={{}}>
      {/* Header */}
      <div className="px-4 py-4 flex items-center gap-3">
        <motion.button onClick={onBack}
          className="w-11 h-11 rounded-2xl flex items-center justify-center"
          style={{ background:'rgba(82,163,255,0.08)', border:'1px solid rgba(82,163,255,0.2)' }}
          whileHover={{ scale:1.05, borderColor:'rgba(82,163,255,0.4)' }}
          whileTap={{ scale:0.92 }}
        >
          <ArrowLeft size={18} strokeWidth={2} color="#52A3FF" />
        </motion.button>
        <div>
          <h2 className="font-bold text-[17px]" style={{ fontFamily:'Syne, sans-serif' }}>{ex.title}</h2>
          <p className="text-text-muted text-[12px]">{fmt(ex.duration)} · {ex.effect}</p>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6">
        {/* SVG Timer Ring */}
        <div className="relative mb-4">
          {/* Outer glow ring */}
          <motion.div className="absolute inset-0 rounded-full"
            style={{ background:`radial-gradient(ellipse at center, ${ex.color}14 0%, transparent 65%)` }}
            animate={{ scale:[1, 1.08, 1], opacity:[0.6, 1, 0.6] }}
            transition={{ duration:4, repeat:Infinity, ease:'easeInOut' }}
          />

          <svg width="240" height="240" viewBox="0 0 240 240" className="-rotate-90">
            {/* Outer decorative ring */}
            <circle cx="120" cy="120" r="108" fill="none"
              stroke={`${ex.color}10`} strokeWidth="1" strokeDasharray="4 6" />
            {/* Track */}
            <circle cx="120" cy="120" r={CIRCLE_R} fill="none"
              stroke="rgba(255,255,255,0.06)" strokeWidth="10" />
            {/* Progress arc */}
            <motion.circle cx="120" cy="120" r={CIRCLE_R} fill="none"
              stroke={completed ? '#34C759' : ex.color}
              strokeWidth="10" strokeLinecap="round"
              strokeDasharray={CIRCUMFERENCE}
              animate={{ strokeDashoffset: strokeOffset }}
              transition={{ duration:1, ease:'linear' }}
              style={{ filter:`drop-shadow(0 0 12px ${completed?'#34C759':ex.color})` }}
            />
          </svg>

          {/* Center content */}
          <div className="absolute inset-0 flex items-center justify-center">
            <AnimatePresence mode="wait">
              {!completed ? (
                <motion.div key="timer" initial={{opacity:0,scale:0.8}} animate={{opacity:1,scale:1}} exit={{opacity:0}} className="text-center">
                  <div className={`text-[48px] font-bold tabular-nums tracking-tight ${timeLeft<=10&&isRunning?'text-status-red':'text-white'}`}
                    style={{ fontFamily:'Syne, sans-serif' }}>
                    {fmt(timeLeft)}
                  </div>
                  {isRunning && (
                    <motion.div className="text-[11px] text-text-muted mt-1 uppercase tracking-widest"
                      animate={{ opacity:[0.4,0.8,0.4] }} transition={{ duration:2, repeat:Infinity }}>
                      идёт упражнение
                    </motion.div>
                  )}
                </motion.div>
              ) : (
                <motion.div key="done"
                  initial={{opacity:0,scale:0.5}} animate={{opacity:1,scale:1}}
                  transition={{type:'spring',stiffness:200,damping:15}}>
                  <div className="w-20 h-20 rounded-full flex items-center justify-center"
                    style={{ background:'rgba(52,199,89,0.2)', border:'2px solid rgba(52,199,89,0.5)' }}>
                    <Check size={36} strokeWidth={2.5} color="#34C759" />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Glow beneath circle */}
        <motion.div className="w-36 h-2 rounded-full mb-8"
          style={{ background:ex.color, filter:'blur(18px)', opacity:0.35 }}
          animate={{ opacity:[0.2,0.45,0.2] }}
          transition={{ duration:3, repeat:Infinity, ease:'easeInOut' }}
        />

        {/* Steps */}
        <AnimatePresence mode="wait">
          {!completed ? (
            <motion.div key="steps" initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} exit={{opacity:0}} className="text-center w-full max-w-xs">
              <div className="card-t2 p-5 mb-4">
                <p className="text-text-secondary text-[16px] leading-relaxed">{ex.steps[step]}</p>
                <div className="flex justify-center gap-2 mt-4">
                  {ex.steps.map((_,i) => (
                    <motion.div key={i}
                      className="h-1 rounded-full transition-all duration-400"
                      style={{
                        width: i===step ? '24px' : '8px',
                        background: i<=step ? ex.color : 'rgba(255,255,255,0.1)',
                        boxShadow: i===step ? `0 0 8px ${ex.color}80` : undefined,
                      }}
                    />
                  ))}
                </div>
              </div>
              <p className="text-text-muted text-[13px]">
                Шаг {step+1} из {ex.steps.length}
              </p>
            </motion.div>
          ) : (
            <motion.div key="completed" initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} transition={{duration:0.4}} className="text-center">
              <h3 className="text-[22px] font-bold text-white mb-2" style={{ fontFamily:'Syne, sans-serif' }}>Упражнение выполнено!</h3>
              <p className="text-text-secondary text-[15px]">{ex.effect}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Controls */}
        <div className="flex gap-3 mt-8 w-full max-w-xs">
          {!isRunning && !completed && (
            <motion.button
              onClick={() => { setIsRunning(true); setIsPaused(false); tick(); }}
              className="btn-primary flex-1 py-4 text-[16px] flex items-center justify-center gap-2"
              whileHover={{scale:1.02}} whileTap={{scale:0.96}}>
              <Play size={18} strokeWidth={2.5} fill="white" color="white" />
              Начать
            </motion.button>
          )}
          {isRunning && !isPaused && (
            <motion.button
              onClick={() => { setIsPaused(true); stopTimer(); }}
              className="btn-secondary flex-1 py-4 flex items-center justify-center gap-2"
              whileHover={{scale:1.02}} whileTap={{scale:0.96}}>
              <Pause size={18} strokeWidth={2} color="#52A3FF" fill="#52A3FF" />
              Пауза
            </motion.button>
          )}
          {isPaused && (
            <>
              <motion.button
                onClick={() => { setIsPaused(false); tick(); }}
                className="btn-primary flex-1 py-4 flex items-center justify-center gap-2"
                whileHover={{scale:1.02}} whileTap={{scale:0.96}}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M5 3L19 12L5 21V3Z" fill="white" />
                </svg>
                Продолжить
              </motion.button>
              <motion.button onClick={onBack} className="btn-secondary px-5" whileHover={{scale:1.02}} whileTap={{scale:0.96}}>
                Выйти
              </motion.button>
            </>
          )}
          {completed && !saving && (
            <motion.button
              onClick={async () => {
                try { setSaving(true); await apiRequest('/exercises/complete',{method:'POST',body:JSON.stringify({type:exerciseType,duration:ex.duration})}); }
                catch {} finally { onBack(); }
              }}
              className="btn-primary flex-1 py-4 text-[16px] flex items-center justify-center gap-2"
              whileHover={{scale:1.02}} whileTap={{scale:0.96}}>
              <Check size={18} strokeWidth={2.5} color="white" />
              Готово
            </motion.button>
          )}
          {saving && <p className="text-text-muted text-[14px] self-center">Сохранение...</p>}
        </div>
      </div>
    </div>
  );
}
