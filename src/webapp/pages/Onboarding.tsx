import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sun, Monitor, Laptop, AlertTriangle, Droplets, EyeOff, Focus, Brain, MessageCircle, Zap, AlarmClock, Clock3, Check, ArrowRight, ArrowLeft } from 'lucide-react';
import { apiRequest } from '../utils/telegram';

interface TelegramUser { id: number; first_name: string; last_name?: string; username?: string; language_code?: string; }
interface Props {
  onFinish: () => void;
  user: TelegramUser | null;
  initData: string;
}

const iconCls = 'w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0';

const SCREEN_TIME_OPTIONS = [
  { label: 'Меньше 2 часов', value: 1, Icon: Sun,             color: '#FFD60A' },
  { label: '2–4 часа',       value: 3, Icon: Monitor,         color: '#52A3FF' },
  { label: '4–8 часов',      value: 6, Icon: Laptop,          color: '#5E5CE6' },
  { label: 'Больше 8 часов', value: 9, Icon: AlertTriangle,   color: '#FF6B5E' },
];

const SYMPTOM_OPTIONS = [
  { label: 'Сухость и жжение',        value: 'dryness',   Icon: Droplets,       color: '#00D4FF' },
  { label: 'Усталость глаз',          value: 'fatigue',   Icon: EyeOff,          color: '#B78BFF' },
  { label: 'Размытость изображения',  value: 'blur',      Icon: Focus,           color: '#52A3FF' },
  { label: 'Головные боли',           value: 'headache',  Icon: Brain,           color: '#FF6B5E' },
  { label: 'Другое',                  value: 'other',     Icon: MessageCircle,   color: '#34C759' },
];

const REMINDER_OPTIONS = [
  { label: 'Каждый час',     value: 8,  Icon: Zap,         color: '#FFD60A' },
  { label: 'Каждые 2 часа', value: 4,  Icon: AlarmClock,  color: '#52A3FF' },
  { label: 'Каждые 3 часа', value: 3,  Icon: Clock3,      color: '#5E5CE6' },
];

const fadeSlide = {
  initial: { opacity: 0, x: 40, filter: 'blur(6px)' },
  animate: { opacity: 1, x: 0, filter: 'blur(0px)', transition: { duration: 0.38, ease: [0.25, 0.46, 0.45, 0.94] } },
  exit:    { opacity: 0, x: -30, filter: 'blur(6px)', transition: { duration: 0.22, ease: 'easeIn' } },
};

export default function Onboarding({ onFinish, user, initData }: Props) {
  const [step, setStep] = useState(0); // 0 = screen time, 1 = symptoms, 2 = reminders
  const [screenHours, setScreenHours] = useState<number|null>(null);
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [reminders, setReminders] = useState<number|null>(null);
  const [saving, setSaving] = useState(false);

  const toggleSymptom = (v: string) => {
    setSymptoms(s => s.includes(v) ? s.filter(x => x !== v) : [...s, v]);
  };

  const handleFinish = async () => {
    try {
      setSaving(true);
      await apiRequest('/users/settings', {
        method: 'PUT',
        body: JSON.stringify({
          screenHours,
          symptoms,
          reminderCount: reminders,
          onboardingDone: true,
        }),
      });
    } catch {}
    finally {
      localStorage.setItem('eyeguard_onboarding_done', '1');
      onFinish();
    }
  };

  const canNext = () => {
    if (step === 0) return screenHours !== null;
    if (step === 1) return symptoms.length > 0;
    if (step === 2) return reminders !== null;
    return false;
  };

  const steps = [
    {
      title: 'Сколько времени в день\nты проводишь за экраном?',
      subtitle: 'Это поможет настроить оптимальные напоминания для тебя.',
    },
    {
      title: 'Что тебя обычно беспокоит?',
      subtitle: 'Выбери всё, что подходит.',
    },
    {
      title: 'Когда удобно получать\nнапоминания?',
      subtitle: 'Мы подстроимся под твой ритм дня.',
    },
  ];

  return (
    <div className="min-h-screen flex flex-col px-5 py-6 max-w-md mx-auto">

      {/* Progress bar */}
      <div className="flex gap-2 mb-8">
        {[0, 1, 2].map(i => (
          <motion.div
            key={i}
            className="h-1 rounded-full flex-1"
            style={{
              background: i <= step
                ? 'linear-gradient(90deg, #1A5FFF, #52A3FF)'
                : 'rgba(255,255,255,0.1)',
              boxShadow: i === step ? '0 0 8px rgba(82,163,255,0.7)' : undefined,
            }}
            animate={{ opacity: i <= step ? 1 : 0.4 }}
            transition={{ duration: 0.3 }}
          />
        ))}
      </div>

      {/* Step content */}
      <div className="flex-1">
        <AnimatePresence mode="wait">
          <motion.div key={step} {...fadeSlide} className="space-y-5">

            {/* Title */}
            <div className="mb-6">
              <h1 className="text-[24px] font-bold text-white leading-snug whitespace-pre-line"
                style={{ fontFamily: 'Syne, sans-serif' }}>
                {steps[step].title}
              </h1>
              <p className="text-text-muted text-[14px] mt-2">{steps[step].subtitle}</p>
            </div>

            {/* Step 0: Screen time */}
            {step === 0 && (
              <div className="space-y-3">
                {SCREEN_TIME_OPTIONS.map(opt => (
                  <motion.button
                    key={opt.value}
                    onClick={() => setScreenHours(opt.value)}
                    className="w-full p-4 rounded-2xl flex items-center gap-4 text-left transition-all duration-200"
                    style={{
                      background: screenHours === opt.value
                        ? `${opt.color}14`
                        : 'rgba(10,18,42,0.75)',
                      border: screenHours === opt.value
                        ? `1px solid ${opt.color}55`
                        : '1px solid rgba(82,163,255,0.14)',
                      boxShadow: screenHours === opt.value
                        ? `0 0 20px ${opt.color}22`
                        : undefined,
                    }}
                    whileHover={{ scale: 1.02, y: -1 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    <div className={iconCls}
                      style={{ background: `${opt.color}14`, border: `1px solid ${opt.color}25` }}>
                      <opt.Icon size={20} strokeWidth={1.8} color={opt.color} />
                    </div>
                    <span className="text-[15px] font-medium text-white">{opt.label}</span>
                    {screenHours === opt.value && (
                      <motion.div
                        className="ml-auto w-5 h-5 rounded-full flex items-center justify-center"
                        style={{ background: opt.color, boxShadow: `0 0 10px ${opt.color}55` }}
                        initial={{ scale: 0 }} animate={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                      >
                        <Check size={12} strokeWidth={3} color="white" />
                      </motion.div>
                    )}
                  </motion.button>
                ))}
              </div>
            )}

            {/* Step 1: Symptoms */}
            {step === 1 && (
              <div className="space-y-3">
                {SYMPTOM_OPTIONS.map(opt => {
                  const selected = symptoms.includes(opt.value);
                  return (
                    <motion.button
                      key={opt.value}
                      onClick={() => toggleSymptom(opt.value)}
                      className="w-full p-4 rounded-2xl flex items-center gap-4 text-left transition-all duration-200"
                      style={{
                        background: selected ? `${opt.color}14` : 'rgba(10,18,42,0.75)',
                        border: selected ? `1px solid ${opt.color}55` : '1px solid rgba(82,163,255,0.14)',
                        boxShadow: selected ? `0 0 20px ${opt.color}22` : undefined,
                      }}
                      whileHover={{ scale: 1.02, y: -1 }}
                      whileTap={{ scale: 0.97 }}
                    >
                      <div className={iconCls}
                        style={{ background: `${opt.color}14`, border: `1px solid ${opt.color}25` }}>
                        <opt.Icon size={20} strokeWidth={1.8} color={opt.color} />
                      </div>
                      <span className="text-[15px] font-medium text-white flex-1">{opt.label}</span>
                      <div className="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 transition-all duration-200"
                        style={{
                          background: selected ? opt.color : 'transparent',
                          border: selected ? `1px solid ${opt.color}` : '1px solid rgba(255,255,255,0.2)',
                          boxShadow: selected ? `0 0 10px ${opt.color}55` : undefined,
                        }}>
                        {selected && (
                          <Check size={12} strokeWidth={3} color="white" />
                        )}
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            )}

            {/* Step 2: Reminders */}
            {step === 2 && (
              <div className="space-y-3">
                {REMINDER_OPTIONS.map(opt => (
                  <motion.button
                    key={opt.value}
                    onClick={() => setReminders(opt.value)}
                    className="w-full p-4 rounded-2xl flex items-center gap-4 text-left transition-all duration-200"
                    style={{
                      background: reminders === opt.value ? `${opt.color}14` : 'rgba(10,18,42,0.75)',
                      border: reminders === opt.value ? `1px solid ${opt.color}55` : '1px solid rgba(82,163,255,0.14)',
                      boxShadow: reminders === opt.value ? `0 0 20px ${opt.color}22` : undefined,
                    }}
                    whileHover={{ scale: 1.02, y: -1 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    <div className={iconCls}
                      style={{ background: `${opt.color}14`, border: `1px solid ${opt.color}25` }}>
                      <opt.Icon size={20} strokeWidth={1.8} color={opt.color} />
                    </div>
                    <span className="text-[15px] font-medium text-white">{opt.label}</span>
                    {reminders === opt.value && (
                      <motion.div
                        className="ml-auto w-5 h-5 rounded-full flex items-center justify-center"
                        style={{ background: opt.color, boxShadow: `0 0 10px ${opt.color}55` }}
                        initial={{ scale: 0 }} animate={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                      >
                        <Check size={12} strokeWidth={3} color="white" />
                      </motion.div>
                    )}
                  </motion.button>
                ))}
              </div>
            )}

          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom button */}
      <div className="mt-6">
        <motion.button
          onClick={() => {
            if (step < 2) setStep(s => s + 1);
            else handleFinish();
          }}
          disabled={!canNext() || saving}
          className="w-full btn-primary py-4 text-[16px] disabled:opacity-40 flex items-center justify-center gap-2"
          whileHover={canNext() ? { scale: 1.02, y: -1 } : {}}
          whileTap={canNext() ? { scale: 0.97 } : {}}
        >
          {saving ? 'Сохранение...' : step < 2 ? (
            <>Далее <ArrowRight size={20} strokeWidth={2} /></>
          ) : (
            <>Завершить <Check size={20} strokeWidth={2.5} /></>
          )}
        </motion.button>

        {step > 0 && (
          <button
            onClick={() => setStep(s => s - 1)}
            className="w-full mt-3 py-2 text-[14px] text-text-muted hover:text-white transition-colors flex items-center justify-center gap-1.5"
          >
            <ArrowLeft size={16} strokeWidth={1.8} />
            Назад
          </button>
        )}
      </div>
    </div>
  );
}
