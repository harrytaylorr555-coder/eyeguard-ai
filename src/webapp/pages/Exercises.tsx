import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Eye, Scan, RotateCw, Hand, ChevronRight, Lock, Crown, Sparkles, Clock } from 'lucide-react';
import { apiRequest } from '../utils/telegram';

interface Exercise { type:string; title:string; duration:number; description:string; steps:string[]; effect:string; color:string; premium?:boolean; }
interface TelegramUser { id: number; first_name: string; last_name?: string; username?: string; language_code?: string; }
interface Props { onNavigate:(s:string, ex?:string)=>void; user:TelegramUser|null; initData:string; }

const ExerciseIcons: Record<string, React.ComponentType<{ size?: number; strokeWidth?: number; color?: string }>> = {
  palming: Hand,
  blinking: Eye,
  focus_shift: Scan,
  eye_roll: RotateCw,
  figure_eight: ({ size, color }) => <span style={{fontSize: size||24, lineHeight:1}}>∞</span>,
  near_far_focus: ({ size, color }) => <span style={{fontSize: size||24, lineHeight:1}}>🔭</span>,
  diagonals: ({ size, color }) => <span style={{fontSize: size||24, lineHeight:1}}>✳️</span>,
  eyelid_massage: Hand,
  eye_squeeze: Eye,
  solarization: ({ size, color }) => <span style={{fontSize: size||24, lineHeight:1}}>☀️</span>,
  window_mark: ({ size, color }) => <span style={{fontSize: size||24, lineHeight:1}}>🪟</span>,
  nose_writing: ({ size, color }) => <span style={{fontSize: size||24, lineHeight:1}}>✍️</span>,
};

const FALLBACK: Exercise[] = [
  { type:'palming', title:'Пальминг', duration:120, color:'#3b82f6', premium:false, description:'Тепло ладоней расслабляет напряжённые мышцы глаз', steps:['Разотрите ладони до тепла','Прикройте ими закрытые глаза','Полная темнота','Дышите медленно и глубоко'], effect:'Снятие напряжения глазных мышц' },
  { type:'blinking', title:'Быстрое моргание', duration:30, color:'#10b981', premium:false, description:'Восстанавливает слёзную плёнку и снимает сухость', steps:['Расслабьте веки, смотрите прямо','Моргайте быстро 15 раз подряд','Закройте глаза на 5 секунд'], effect:'Увлажнение роговицы и снятие сухости' },
  { type:'focus_shift', title:'Смена фокуса', duration:60, color:'#f59e0b', premium:false, description:'Тренирует мышцы хрусталика, снижает близорукость', steps:['Фокус на пальце 3 сек','Взгляд вдаль 3 сек','Повторить 10 раз'], effect:'Тренировка мышц аккомодации' },
  { type:'eye_roll', title:'Вращение глазами', duration:30, color:'#8b5cf6', premium:false, description:'Разминает и укрепляет глазодвигательные мышцы', steps:['По часовой — 5 кругов','Против часовой — 5 кругов','Влево–вправо 10 раз','Вверх–вниз 10 раз'], effect:'Укрепление глазных мышц' },
  { type:'figure_eight', title:'Восьмёрка', duration:45, color:'#06b6d4', premium:true, description:'Плавное рисование знака бесконечности глазами', steps:['Представьте большую восьмёрку','Медленно обводите её глазами','5 раз в одну, 5 в другую сторону'], effect:'Гибкость глазодвигательных мышц' },
  { type:'near_far_focus', title:'Дальше-ближе', duration:60, color:'#f97316', premium:true, description:'Тренировка цилиарной мышцы с разными дистанциями', steps:['Фокус на кончике носа — 3 сек','Фокус на пальце — 3 сек','Фокус вдаль — 3 сек','Повторить цепочку 8 раз'], effect:'Укрепление аккомодации, профилактика спазма' },
  { type:'diagonals', title:'Диагонали', duration:30, color:'#a855f7', premium:true, description:'Диагональные движения для проработки косых мышц', steps:['Взгляд вверх-вправо → вниз-влево','Взгляд вверх-влево → вниз-вправо','Повторить оба цикла'], effect:'Тренировка косых мышц глаза' },
  { type:'eyelid_massage', title:'Массаж век', duration:60, color:'#ec4899', premium:true, description:'Мягкий массаж для стимуляции мейбомиевых желёз', steps:['Чистыми пальцами к закрытым векам','Круги от внутреннего уголка к внешнему','10 кругов по верхнему веку','10 кругов по нижнему веку'], effect:'Снятие сухости, профилактика блефарита' },
  { type:'eye_squeeze', title:'Зажмуривание', duration:30, color:'#14b8a6', premium:true, description:'Укрепление круговой мышцы глаза через напряжение', steps:['Сильно зажмурьтесь на 3-4 сек','Широко откройте глаза','Повторите 8-10 раз','В конце мягко поморгайте'], effect:'Укрепление век, улучшение кровотока' },
  { type:'solarization', title:'Соляризация', duration:90, color:'#eab308', premium:true, description:'Мягкая адаптация глаз к свету через закрытые веки', steps:['Закройте глаза, повернитесь к свету','Медленно поворачивайте голову','Ощутите смену света и тени','15-20 повторов'], effect:'Расслабление зрительного нерва и сетчатки' },
  { type:'window_mark', title:'Метка на стекле', duration:60, color:'#6366f1', premium:true, description:'Классическое упражнение офтальмологов для фокусировки', steps:['Наклейте метку на окно','Фокус на метке — 5 сек','Фокус вдаль за окном — 5 сек','Повторить 10 раз'], effect:'Тренировка цилиарной мышцы, профилактика ПИНА' },
  { type:'nose_writing', title:'Письмо носом', duration:45, color:'#84cc16', premium:true, description:'Рисование букв кончиком носа для расслабления', steps:['Закройте глаза, расслабьте плечи','Кончик носа — это ручка','Напишите 5-6 букв в воздухе','Двигайте головой плавно'], effect:'Снятие напряжения с шеи и глаз одновременно' },
];

export default function Exercises({ onNavigate, user, initData }: Props) {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [isPremium, setIsPremium] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [list, profile] = await Promise.all([
          apiRequest<Exercise[]>('/exercises'),
          apiRequest<{isPremium:boolean}>('/payments/status'),
        ]);
        setExercises(list);
        setIsPremium(profile.isPremium);
      } catch {
        setExercises(FALLBACK);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const fmt = (s:number) => s<60 ? `${s} сек` : `${Math.floor(s/60)} мин${s%60 ? ` ${s%60}с` : ''}`;

  const freeEx = exercises.filter(e => !e.premium);
  const premiumEx = exercises.filter(e => e.premium);

  const handleExClick = (ex: Exercise) => {
    if (ex.premium && !isPremium) {
      onNavigate('premium');
    } else {
      onNavigate('exercise_player', ex.type);
    }
  };

  const renderExerciseCard = (ex: Exercise, i: number, locked: boolean) => {
    const IconFn = ExerciseIcons[ex.type];
    return (
      <motion.button
        key={ex.type}
        onClick={() => handleExClick(ex)}
        className="w-full card-interactive p-4 flex items-center gap-4 text-left group relative overflow-hidden"
        initial={{ opacity:0, y:18 }}
        animate={{ opacity:1, y:0 }}
        transition={{ duration:0.38, delay:0.08*i, ease:'easeOut' }}
        whileHover={locked ? {} : { y:-2 }}
        whileTap={locked ? {} : { scale:0.975 }}
        style={locked ? {
          borderColor: 'rgba(245,166,35,0.2)',
          background: 'rgba(15,22,50,0.55)',
        } : undefined}
      >
        {/* Locked overlay gradient */}
        {locked && (
          <div className="absolute inset-0 rounded-[18px]"
            style={{
              background: 'linear-gradient(135deg, rgba(245,166,35,0.04) 0%, rgba(10,18,42,0.5) 100%)',
              backdropFilter: 'blur(1px)',
            }} />
        )}

        {/* Icon */}
        <motion.div
          className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 relative z-10"
          style={{
            background: locked ? 'rgba(245,166,35,0.08)' : `${ex.color}14`,
            border: locked ? '1px solid rgba(245,166,35,0.2)' : `1px solid ${ex.color}30`,
          }}
          whileHover={locked ? {} : { boxShadow: `0 0 20px ${ex.color}40` }}
        >
          {IconFn ? <IconFn size={24} strokeWidth={1.8} color={locked ? 'rgba(245,166,35,0.5)' : ex.color} /> : null}
        </motion.div>

        {/* Info */}
        <div className="flex-1 min-w-0 relative z-10">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-[16px]" style={{
              fontFamily: 'Syne, sans-serif',
              color: locked ? 'rgba(255,255,255,0.45)' : 'white',
            }}>{ex.title}</h3>
            {locked && <Lock size={12} strokeWidth={2.5} color="#F5A623" />}
          </div>
          <p className="text-text-muted text-[13px] mt-0.5 line-clamp-1" style={locked ? {opacity:0.5} : {}}>{ex.description}</p>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-[11px] px-2.5 py-1 rounded-full font-semibold"
              style={{
                background: locked ? 'rgba(245,166,35,0.1)' : `${ex.color}18`,
                color: locked ? '#F5A623' : ex.color,
                border: locked ? '1px solid rgba(245,166,35,0.2)' : `1px solid ${ex.color}28`,
              }}>
              <Clock size={12} strokeWidth={2} style={{ display: 'inline', marginRight: 2 }} /> {fmt(ex.duration)}
            </span>
            <span className="text-text-muted text-[12px]" style={locked ? {opacity:0.4} : {}}>{ex.effect}</span>
          </div>
        </div>

        {/* Right icon: lock or arrow */}
        <div className="relative z-10 flex-shrink-0">
          {locked ? (
            <motion.div
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, rgba(245,166,35,0.2), rgba(200,130,20,0.1))',
                border: '1px solid rgba(245,166,35,0.3)',
                boxShadow: '0 0 12px rgba(245,166,35,0.15)',
              }}
              whileHover={{ scale: 1.08 }}
              animate={{ boxShadow: ['0 0 8px rgba(245,166,35,0.1)', '0 0 18px rgba(245,166,35,0.25)', '0 0 8px rgba(245,166,35,0.1)'] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
            >
              <Crown size={16} strokeWidth={1.6} color="#F5A623" />
            </motion.div>
          ) : (
            <motion.div
              className="w-8 h-8 rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ background: 'rgba(82,163,255,0.12)', border: '1px solid rgba(82,163,255,0.22)' }}
              initial={{ x: -4 }}
              whileHover={{ x: 0 }}
            >
              <ChevronRight size={16} strokeWidth={2} color="#52A3FF" />
            </motion.div>
          )}
        </div>
      </motion.button>
    );
  };

  return (
    <motion.div className="px-4 py-5 space-y-4 max-w-md mx-auto pb-28">

      {/* Header */}
      <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.45, ease:'easeOut' }}>
        <div className="flex items-center gap-3 mb-1">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: 'rgba(82,163,255,0.15)', border: '1px solid rgba(82,163,255,0.28)' }}>
            <Eye size={16} strokeWidth={1.8} color="#52A3FF" />
          </div>
          <span className="text-[12px] font-semibold text-accent-blue-bright uppercase tracking-wider">Гимнастика</span>
        </div>
        <h1 className="text-[28px] font-bold text-white tracking-tight" style={{ fontFamily: 'Syne, sans-serif' }}>Упражнения</h1>
        <p className="text-text-secondary text-[15px] mt-1">Регулярность снижает усталость на 30%</p>
      </motion.div>

      {loading ? (
        <div className="space-y-3">
          {[1,2,3,4,5,6].map(i => <div key={i} className="h-24 skeleton-shimmer" />)}
        </div>
      ) : (
        <>
          {/* ── FREE EXERCISES ── */}
          <div className="space-y-3">
            {freeEx.map((ex, i) => renderExerciseCard(ex, i, false))}
          </div>

          {/* ── PREMIUM EXERCISES ── */}
          {premiumEx.length > 0 && (
            <div className="space-y-3">
              {/* Premium section header */}
              <motion.div
                className="flex items-center gap-3 pt-2"
                initial={{ opacity:0, y:14 }}
                animate={{ opacity:1, y:0 }}
                transition={{ duration:0.4, delay:0.35 }}
              >
                <div className="flex-1 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(245,166,35,0.3), transparent)' }} />
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full"
                  style={{ background: 'rgba(245,166,35,0.1)', border: '1px solid rgba(245,166,35,0.25)' }}>
                  <Crown size={13} strokeWidth={1.8} color="#F5A623" />
                  <span className="text-[11px] font-semibold" style={{ color: '#F5A623', letterSpacing: '0.5px' }}>PREMIUM</span>
                </div>
                <div className="flex-1 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(245,166,35,0.3), transparent)' }} />
              </motion.div>

              {premiumEx.map((ex, i) => renderExerciseCard(ex, i, !isPremium))}

              {/* Premium upsell banner (shown when not premium) */}
              {!isPremium && (
                <motion.button
                  onClick={() => onNavigate('premium')}
                  className="w-full card-t1 p-4 flex items-center gap-4 text-left"
                  initial={{ opacity:0, y:16 }}
                  animate={{ opacity:1, y:0 }}
                  transition={{ duration:0.42, delay:0.5 }}
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.97 }}
                  style={{
                    background: 'linear-gradient(135deg, rgba(245,166,35,0.12) 0%, rgba(180,100,20,0.06) 100%)',
                    border: '1px solid rgba(245,166,35,0.3)',
                    boxShadow: '0 0 30px rgba(245,166,35,0.1)',
                  }}
                >
                  <motion.div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
                    style={{
                      background: 'linear-gradient(135deg, rgba(245,166,35,0.2), rgba(200,130,20,0.1))',
                      border: '1px solid rgba(245,166,35,0.35)',
                    }}
                    animate={{ boxShadow: ['0 0 12px rgba(245,166,35,0.15)', '0 0 28px rgba(245,166,35,0.35)', '0 0 12px rgba(245,166,35,0.15)'] }}
                    transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                  >
                    <Sparkles size={22} strokeWidth={1.6} color="#F5A623" />
                  </motion.div>
                  <div className="flex-1">
                    <div className="font-bold text-[15px] text-white" style={{ fontFamily: 'Syne, sans-serif' }}>
                      Разблокировать все упражнения
                    </div>
                    <div className="text-[12px] mt-0.5" style={{ color: 'rgba(245,166,35,0.7)' }}>
                      8 Premium упражнений + умные напоминания + аналитика
                    </div>
                  </div>
                  <div className="flex-shrink-0 px-4 py-2.5 rounded-xl text-[13px] font-bold text-white"
                    style={{
                      background: 'linear-gradient(135deg, #F5A623, #D4891A)',
                      boxShadow: '0 4px 20px rgba(245,166,35,0.4)',
                    }}>
                    299 ⭐
                  </div>
                </motion.button>
              )}
            </div>
          )}
        </>
      )}
    </motion.div>
  );
}
