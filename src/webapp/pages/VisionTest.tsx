import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, Palette, ChevronRight, ArrowLeft, AlertTriangle, Check, EyeOff } from 'lucide-react';
import { apiRequest } from '../utils/telegram';

interface TelegramUser { id: number; first_name: string; last_name?: string; username?: string; language_code?: string; }
interface Props { onNavigate:(s:string)=>void; user:TelegramUser|null; initData:string; }

const ACUITY = [
  { size:'text-6xl', text:'Ш', value:1.0 },
  { size:'text-5xl', text:'Б', value:0.8 },
  { size:'text-4xl', text:'М', value:0.6 },
  { size:'text-3xl', text:'Н', value:0.4 },
  { size:'text-2xl', text:'К', value:0.2 },
];
const PLATES = [
  { id:1, num:12, colors:['#FF6B6B','#4ECDC4','#FFE66D','#FF6B6B','#4ECDC4'] },
  { id:2, num:8,  colors:['#45B7D1','#96CEB4','#FFEAA7','#DDA0DD'] },
  { id:3, num:29, colors:['#E17055','#FDCB6E','#00B894','#6C5CE7'] },
];

const pageAnim = {
  initial: { opacity:0, x:20, filter:'blur(4px)' },
  animate: { opacity:1, x:0, filter:'blur(0px)', transition:{ duration:0.28, ease:'easeOut' } },
  exit:    { opacity:0, x:-20, filter:'blur(4px)', transition:{ duration:0.18 } },
};

// Generate dot pattern for Ishihara-like plates
const DotPlate = ({ colors, num }: { colors: string[]; num: number }) => {
  const dots = Array.from({ length: 200 }, (_, i) => ({
    x: Math.random() * 140 + 10,
    y: Math.random() * 140 + 10,
    r: Math.random() * 5 + 3,
    color: colors[Math.floor(Math.random() * colors.length)],
  }));
  return (
    <svg width="160" height="160" viewBox="0 0 160 160">
      <circle cx="80" cy="80" r="78" fill="#1a1a2e" />
      {dots.map((d, i) => (
        <circle key={i} cx={d.x} cy={d.y} r={d.r} fill={d.color} opacity={0.85} />
      ))}
      <text x="80" y="90" textAnchor="middle" fill="rgba(255,255,255,0.9)" fontSize="36" fontWeight="bold"
        style={{ fontFamily: 'Syne, sans-serif' }}>{num}</text>
    </svg>
  );
};

export default function VisionTest({ onNavigate, user, initData }: Props) {
  const [mode, setMode] = useState<'menu'|'acuity'|'color'>('menu');
  const [level, setLevel] = useState(0);
  const [answers, setAnswers] = useState<boolean[]>([]);
  const [result, setResult] = useState<number|null>(null);
  const [letterInput, setLetterInput] = useState('');
  const [shake, setShake] = useState(false);
  const [cStep, setCStep] = useState(0);
  const [cAnswers, setCAnswers] = useState<number[]>([]);
  const [cInput, setCInput] = useState('');
  const [cResult, setCResult] = useState<string|null>(null);

  const save = async (t:string, d:Record<string, unknown>) => {
    try { await apiRequest('/exercises/vision-test', { method:'POST', body:JSON.stringify({ result:JSON.stringify({ testType:t, ...d }) }) }); } catch {}
  };
  const reset = () => { setMode('menu'); setLevel(0); setAnswers([]); setResult(null); setLetterInput(''); setCStep(0); setCAnswers([]); setCInput(''); setCResult(null); };

  const handleAcuityInput = () => {
    const typed = letterInput.trim().toUpperCase();
    if (!typed) return;
    const correct = typed === ACUITY[level].text.toUpperCase();
    const a = [...answers, correct]; setAnswers(a); setLetterInput('');
    if (!correct || level >= ACUITY.length - 1) {
      const idx = a.lastIndexOf(true);
      const r = idx >= 0 ? ACUITY[idx].value : 0.2;
      setResult(r); save('acuity', { result: r, answers: a });
    } else {
      setLevel(level + 1);
    }
  };
  const handleAcuityCantSee = () => {
    const a = [...answers, false]; setAnswers(a); setLetterInput('');
    const idx = a.lastIndexOf(true);
    const r = idx >= 0 ? ACUITY[idx].value : 0.2;
    setResult(r); save('acuity', { result: r, answers: a });
  };
  const handleColor = () => {
    const n=parseInt(cInput); if (isNaN(n)) return;
    const a=[...cAnswers,n]; setCAnswers(a); setCInput('');
    if (cStep>=PLATES.length-1) { const correct=a.filter((v,i)=>v===PLATES[i].num).length; setCResult(correct===PLATES.length?'normal':'deviations'); save('color_blind',{result:correct===PLATES.length?'normal':'deviations',answers:a,correct}); }
    else setCStep(cStep+1);
  };

  if (mode==='menu') return (
    <motion.div className="px-4 py-5 space-y-4 max-w-md mx-auto pb-28" {...pageAnim}>
      {/* Header */}
      <div className="mb-2">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: 'rgba(255,149,0,0.15)', border: '1px solid rgba(255,149,0,0.3)' }}>
            <Eye size={16} strokeWidth={1.8} color="#FF9500" />
          </div>
          <span className="text-[12px] font-semibold text-status-orange uppercase tracking-wider">Диагностика</span>
        </div>
        <h1 className="text-[28px] font-bold text-white tracking-tight" style={{ fontFamily: 'Syne, sans-serif' }}>Тест зрения</h1>
        <p className="text-text-secondary text-[15px] mt-1">Быстрая проверка. Не заменяет визит к врачу.</p>
      </div>

      <div className="space-y-3">
        {[
          {
            Icon: Eye,
            title: 'Острота зрения',
            sub: 'Таблица Сивцева',
            desc: 'Определи, насколько хорошо ты видишь буквы',
            color: '#52A3FF',
            action: () => setMode('acuity'),
          },
          {
            Icon: Palette,
            title: 'Цветовое зрение',
            sub: 'Пластины Ишихары',
            desc: 'Проверь способность различать цвета',
            color: '#B464FF',
            action: () => setMode('color'),
          },
        ].map((t, i) => (
          <motion.button
            key={i} onClick={t.action}
            className="w-full card-interactive p-5 flex items-center gap-4 text-left group"
            initial={{ opacity:0, y:16 }}
            animate={{ opacity:1, y:0 }}
            transition={{ duration:0.38, delay:i*0.08, ease:'easeOut' }}
            whileHover={{ scale:1.02 }}
            whileTap={{ scale:0.96 }}
          >
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
              style={{ background:`${t.color}12`, border:`1px solid ${t.color}28` }}>
              <t.Icon size={24} strokeWidth={1.8} color={t.color} />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-[16px]" style={{ fontFamily: 'Syne, sans-serif' }}>{t.title}</h3>
              <p className="text-text-muted text-[12px]">{t.sub}</p>
              <p className="text-text-secondary text-[13px] mt-1">{t.desc}</p>
            </div>
            <ChevronRight size={18} strokeWidth={2} color="#52A3FF" className="opacity-0 group-hover:opacity-100 transition-opacity" />
          </motion.button>
        ))}
      </div>

      {/* Warning */}
      <motion.div
        className="card-t3 p-4 relative overflow-hidden"
        initial={{ opacity:0, y:14 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.38, delay:0.2 }}
        style={{ background:'rgba(255,149,0,0.06)', borderColor:'rgba(255,149,0,0.25)' }}
      >
        <div className="absolute top-0 left-0 right-0 h-px"
          style={{ background: 'linear-gradient(90deg, transparent, rgba(255,149,0,0.4), transparent)' }} />
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
            style={{ background:'rgba(255,149,0,0.15)', border:'1px solid rgba(255,149,0,0.3)' }}>
            <AlertTriangle size={16} strokeWidth={1.8} color="#FF9500" />
          </div>
          <p className="text-[13px] text-status-orange leading-relaxed">
            Тесты ознакомительные. При проблемах со зрением обратитесь к офтальмологу.
          </p>
        </div>
      </motion.div>
    </motion.div>
  );

  if (mode==='acuity') {
    if (result!==null) {
      const g=result>=0.8, ok=result>=0.6;
      const statusColor = g ? '#34C759' : ok ? '#FF9500' : '#FF3B30';
      return (
        <motion.div className="px-4 py-5 space-y-4 text-center max-w-md mx-auto"
          initial={{ opacity:0, scale:0.95 }} animate={{ opacity:1, scale:1 }} transition={{ duration:0.38 }}>
          <motion.div
            className="w-24 h-24 mx-auto rounded-full flex items-center justify-center"
            style={{ background:`${statusColor}18`, border:`2px solid ${statusColor}40`, boxShadow:`0 0 40px ${statusColor}30` }}
            initial={{ scale:0, rotate:-30 }} animate={{ scale:1, rotate:0 }}
            transition={{ type:'spring', stiffness:200, damping:15 }}
          >
            {g ? (
              <Eye size={36} strokeWidth={1.8} color="#34C759" />
            ) : ok ? (
              <AlertTriangle size={36} strokeWidth={1.8} color="#FF9500" />
            ) : (
              <AlertTriangle size={36} strokeWidth={1.8} color="#FF3B30" />
            )}
          </motion.div>

          <div>
            <h1 className="text-[26px] font-bold text-white" style={{ fontFamily:'Syne, sans-serif' }}>Результат</h1>
          </div>

          <div className="card-t2 p-6 mx-auto max-w-[200px]">
            <div className="text-[56px] font-bold" style={{ color: statusColor, fontFamily:'Syne, sans-serif' }}>
              {result.toFixed(1)}
            </div>
            <p className="text-text-muted text-[13px] mt-1">острота зрения</p>
          </div>

          <p className="text-[16px] font-semibold" style={{ color: statusColor }}>
            {g ? '✓ Отличный результат!' : ok ? '⚡ Небольшое снижение — делайте перерывы.' : '⚠️ Рекомендована консультация офтальмолога.'}
          </p>

          <div className="flex gap-3 justify-center">
            <motion.button onClick={reset} className="btn-primary px-8" whileHover={{ scale:1.02 }} whileTap={{ scale:0.96 }}>
              Повторить
            </motion.button>
            <motion.button onClick={() => onNavigate('dashboard')} className="btn-secondary px-6" whileHover={{ scale:1.02 }} whileTap={{ scale:0.96 }}>
              На главную
            </motion.button>
          </div>
        </motion.div>
      );
    }

    const lvl = ACUITY[level];
    return (
      <motion.div className="px-4 py-5 space-y-4 max-w-md mx-auto" {...pageAnim}>
        <div className="flex justify-between items-center">
          <button onClick={reset} className="flex items-center gap-1.5 text-accent-blue-bright text-[15px] font-medium">
            <ArrowLeft size={18} strokeWidth={2} color="#52A3FF" />
            Назад
          </button>
          <div className="flex items-center gap-2">
            {ACUITY.map((_, i) => (
              <div key={i} className="w-2 h-2 rounded-full transition-all duration-300"
                style={{ background: i <= level ? '#52A3FF' : 'rgba(255,255,255,0.12)',
                  boxShadow: i === level ? '0 0 8px rgba(82,163,255,0.8)' : undefined }} />
            ))}
          </div>
        </div>

        <div className="text-center">
          <h2 className="text-[22px] font-bold text-white" style={{ fontFamily:'Syne, sans-serif' }}>Острота зрения</h2>
          <p className="text-text-muted text-[14px] mt-1">Держите телефон на расстоянии 30–40 см</p>
        </div>

        <div className="card-t2 p-8 flex items-center justify-center" style={{ minHeight: 180 }}>
          <AnimatePresence mode="wait">
            <motion.div key={level}
              initial={{ opacity:0, scale:0.8, y:10 }}
              animate={{ opacity:1, scale:1, y:0 }}
              exit={{ opacity:0, scale:1.1, y:-10 }}
              transition={{ duration:0.25 }}
              className="text-center"
            >
              <div className={`${lvl.size} font-bold text-white select-none`}
                style={{ fontFamily:'Syne, sans-serif', textShadow:'0 0 40px rgba(82,163,255,0.5)' }}>
                {lvl.text}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Question label */}
        <p className="text-center text-[15px] font-semibold text-text-secondary">
          Какую букву вы видите?
        </p>

        {/* Letter input */}
        <div className="flex gap-3">
          <motion.input
            type="text"
            value={letterInput}
            onChange={e => setLetterInput(e.target.value.slice(-1))}
            onKeyDown={e => e.key === 'Enter' && handleAcuityInput()}
            placeholder="А"
            maxLength={1}
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            className="flex-1 py-4 rounded-2xl text-white text-center text-[28px] font-bold uppercase focus:outline-none placeholder:text-text-muted"
            style={{
              background: 'rgba(10,18,42,0.85)',
              border: letterInput ? '1px solid rgba(82,163,255,0.55)' : '1px solid rgba(82,163,255,0.2)',
              boxShadow: letterInput ? '0 0 20px rgba(82,163,255,0.2)' : undefined,
              fontFamily: 'Syne, sans-serif',
              letterSpacing: '2px',
            }}
            animate={shake ? { x: [-6, 6, -4, 4, 0] } : {}}
            transition={{ duration: 0.3 }}
          />
          <motion.button
            onClick={handleAcuityInput}
            disabled={!letterInput.trim()}
            className="px-7 rounded-2xl font-semibold text-white disabled:opacity-30"
            style={{ background: 'linear-gradient(135deg,#1A5FFF,#0048CC)', boxShadow: '0 4px 24px rgba(30,100,255,0.45)' }}
            whileHover={{ scale: 1.03, y: -1 }}
            whileTap={{ scale: 0.96 }}
          >
            <Check size={22} strokeWidth={2.5} color="white" />
          </motion.button>
        </div>

        {/* Can't see button */}
        <motion.button
          onClick={handleAcuityCantSee}
          className="w-full py-3.5 rounded-2xl font-medium text-[14px] flex items-center justify-center gap-2"
          style={{ background: 'rgba(255,59,48,0.08)', border: '1px solid rgba(255,59,48,0.25)', color: '#FF6B5E' }}
          whileHover={{ scale: 1.02, background: 'rgba(255,59,48,0.14)' }}
          whileTap={{ scale: 0.97 }}
        >
          <EyeOff size={16} strokeWidth={1.8} color="#FF6B5E" />
          Не вижу букву — закончить тест
        </motion.button>
      </motion.div>
    );
  }

  if (mode==='color') {
    if (cResult!==null) {
      const normal = cResult === 'normal';
      const correct = cAnswers.filter((v,i) => v === PLATES[i].num).length;
      return (
        <motion.div className="px-4 py-5 space-y-4 text-center max-w-md mx-auto"
          initial={{ opacity:0, scale:0.95 }} animate={{ opacity:1, scale:1 }} transition={{ duration:0.38 }}>
          <motion.div
            className="w-24 h-24 mx-auto rounded-full flex items-center justify-center"
            style={{
              background: normal ? 'rgba(52,199,89,0.15)' : 'rgba(255,149,0,0.15)',
              border: `2px solid ${normal ? 'rgba(52,199,89,0.4)' : 'rgba(255,149,0,0.4)'}`,
              boxShadow: `0 0 40px ${normal ? 'rgba(52,199,89,0.3)' : 'rgba(255,149,0,0.3)'}`,
            }}
            initial={{ scale:0 }} animate={{ scale:1 }}
            transition={{ type:'spring', stiffness:200, damping:15 }}
          >
            {normal ? (
              <Check size={36} strokeWidth={2.5} color="#34C759" />
            ) : (
              <AlertTriangle size={36} strokeWidth={1.8} color="#FF9500" />
            )}
          </motion.div>

          <h1 className="text-[26px] font-bold text-white" style={{ fontFamily:'Syne, sans-serif' }}>Результат</h1>

          <div className="card-t2 p-5 mx-auto max-w-[220px]">
            <div className="text-[18px] font-bold" style={{ color: normal ? '#34C759' : '#FF9500', fontFamily:'Syne, sans-serif' }}>
              {normal ? 'Цветовое зрение в норме' : 'Возможны отклонения'}
            </div>
            <p className="text-text-muted text-[14px] mt-2">Правильно: {correct} из {PLATES.length}</p>
          </div>

          {!normal && <p className="text-status-orange text-[14px]">Рекомендуется консультация офтальмолога.</p>}

          <div className="flex gap-3 justify-center">
            <motion.button onClick={reset} className="btn-primary px-8" whileHover={{ scale:1.02 }} whileTap={{ scale:0.96 }}>
              Повторить
            </motion.button>
            <motion.button onClick={() => onNavigate('dashboard')} className="btn-secondary px-6" whileHover={{ scale:1.02 }} whileTap={{ scale:0.96 }}>
              На главную
            </motion.button>
          </div>
        </motion.div>
      );
    }

    const plate = PLATES[cStep];
    return (
      <motion.div className="px-4 py-5 space-y-4 max-w-md mx-auto" {...pageAnim}>
        <div className="flex justify-between items-center">
          <button onClick={reset} className="flex items-center gap-1.5 text-accent-blue-bright text-[15px] font-medium">
            <ArrowLeft size={18} strokeWidth={2} color="#52A3FF" />
            Назад
          </button>
          <div className="flex items-center gap-2">
            {PLATES.map((_, i) => (
              <div key={i} className="w-2 h-2 rounded-full transition-all duration-300"
                style={{ background: i <= cStep ? '#B464FF' : 'rgba(255,255,255,0.12)',
                  boxShadow: i === cStep ? '0 0 8px rgba(180,100,255,0.8)' : undefined }} />
            ))}
          </div>
        </div>

        <div className="text-center">
          <h2 className="text-[22px] font-bold text-white" style={{ fontFamily:'Syne, sans-serif' }}>Цветовое зрение</h2>
          <p className="text-text-muted text-[14px] mt-1">Какое число вы видите?</p>
        </div>

        <AnimatePresence mode="wait">
          <motion.div key={cStep}
            initial={{ opacity:0, scale:0.9, rotate:-5 }}
            animate={{ opacity:1, scale:1, rotate:0 }}
            exit={{ opacity:0, scale:0.9, rotate:5 }}
            transition={{ duration:0.25 }}
            className="flex justify-center"
          >
            <div className="rounded-full overflow-hidden"
              style={{ boxShadow:'0 0 50px rgba(180,100,255,0.25), 0 0 80px rgba(30,100,255,0.1)' }}>
              <DotPlate colors={plate.colors} num={plate.num} />
            </div>
          </motion.div>
        </AnimatePresence>

        <div className="flex gap-3">
          <input
            type="number" value={cInput}
            onChange={e => setCInput(e.target.value)}
            placeholder="Введите число"
            className="flex-1 px-4 py-4 rounded-2xl text-white text-center text-lg font-bold focus:outline-none placeholder:text-text-muted"
            style={{
              background: 'rgba(10,18,42,0.8)',
              border: cInput ? '1px solid rgba(82,163,255,0.5)' : '1px solid rgba(82,163,255,0.18)',
              boxShadow: cInput ? '0 0 16px rgba(82,163,255,0.2)' : undefined,
            }}
            onKeyDown={e => e.key === 'Enter' && handleColor()}
          />
          <motion.button
            onClick={handleColor} disabled={!cInput}
            className="btn-primary px-8 w-auto disabled:opacity-30"
            whileHover={{ scale:1.02 }} whileTap={{ scale:0.96 }}
          >
            OK
          </motion.button>
        </div>
      </motion.div>
    );
  }

  return null;
}
