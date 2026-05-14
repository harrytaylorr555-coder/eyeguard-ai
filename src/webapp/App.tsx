import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { LayoutDashboard, Eye, ClipboardCheck, BarChart3, Ellipsis } from 'lucide-react';
import { useTelegram } from './hooks/useTelegram';
import { getStartParam } from './utils/telegram';
import Start from './pages/Start';
import OnboardingStory from './features/onboarding/OnboardingStory';
import Dashboard from './pages/Dashboard';
import Exercises from './pages/Exercises';
import VisionTest from './pages/VisionTest';
import Profile from './pages/Profile';
import Invite from './pages/Invite';
import Premium from './pages/Premium';
import Achievements from './pages/Achievements';
import ExercisePlayer from './components/Exercise/ExercisePlayer';

type Screen = 'dashboard' | 'exercises' | 'vision_test' | 'stats' | 'settings' | 'premium' | 'referral' | 'exercise_player';
type AppStage = 'start' | 'onboarding' | 'app';

const slideRight = {
  initial:  { opacity: 0, x: 32, filter: 'blur(4px)' },
  animate:  { opacity: 1, x: 0, filter: 'blur(0px)', transition: { duration: 0.38, ease: [0.25, 0.46, 0.45, 0.94] } },
  exit:     { opacity: 0, x: -20, filter: 'blur(4px)', transition: { duration: 0.2, ease: 'easeIn' } },
};

const NAV = [
  { id: 'dashboard' as const,   Icon: LayoutDashboard, label: 'Главная' },
  { id: 'exercises' as const,   Icon: Eye,             label: 'Зрение' },
  { id: 'vision_test' as const, Icon: ClipboardCheck,  label: 'Тесты' },
  { id: 'stats' as const,       Icon: BarChart3,       label: 'Прогресс' },
  { id: 'settings' as const,    Icon: Ellipsis,        label: 'Ещё' },
];

export default function App() {
  const { tg, user, initData, haptic, showBackButton, hideBackButton } = useTelegram();
  const [stage, setStage] = useState<AppStage>(() => {
    // Skip start/onboarding if already done
    const done = localStorage.getItem('eyeguard_onboarding_done');
    return done ? 'app' : 'start';
  });
  const [screen, setScreen] = useState<Screen>('dashboard');
  const [exerciseType, setExerciseType] = useState<string>('');

  useEffect(() => {
    if (tg) document.documentElement.classList.toggle('dark', tg.colorScheme === 'dark');
  }, [tg]);

  useEffect(() => {
    const p = getStartParam();
    if (!p) return;
    if (p.startsWith('exercise_'))  { setExerciseType(p.replace('exercise_', '')); setScreen('exercise_player'); }
    else if (p === 'vision_test')   setScreen('vision_test');
    else if (p === 'stats')         setScreen('stats');
    else if (p === 'settings')      setScreen('settings');
    else if (p === 'referral')      setScreen('referral');
    else if (p === 'exercises')     setScreen('exercises');
  }, []);

  useEffect(() => {
    if (['dashboard','exercises','vision_test','stats','settings','premium','referral'].includes(screen)) hideBackButton();
  }, [screen, hideBackButton]);

  const navigate = (newScreen: Screen, exType?: string) => {
    haptic();
    if (newScreen === 'exercise_player' && exType) { setExerciseType(exType); showBackButton(() => setScreen('exercises')); }
    setScreen(newScreen);
  };

  const renderScreen = () => {
    const p = { onNavigate: navigate, user, initData };
    switch (screen) {
      case 'dashboard':       return <Dashboard {...p} />;
      case 'exercises':       return <Exercises {...p} />;
      case 'vision_test':     return <VisionTest {...p} />;
      case 'stats':           return <Achievements />;
      case 'settings':        return <Profile {...p} initialTab="settings" />;
      case 'premium':         return <Premium />;
      case 'referral':        return <Invite />;
      case 'exercise_player': return <ExercisePlayer exerciseType={exerciseType} onBack={() => { setScreen('exercises'); hideBackButton(); }} initData={initData} />;
      default:                return <Dashboard {...p} />;
    }
  };

  // ── Start screen ──
  if (stage === 'start') {
    return (
      <AnimatePresence mode="wait">
        <motion.div key="start"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, scale: 0.97 }}
          transition={{ duration: 0.3 }}>
          <Start user={user} onContinue={() => setStage('onboarding')} />
        </motion.div>
      </AnimatePresence>
    );
  }

  // ── Onboarding ──
  if (stage === 'onboarding') {
    return (
      <AnimatePresence mode="wait">
        <motion.div key="onboarding"
          initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
          transition={{ duration: 0.35 }}>
          <OnboardingStory onFinish={() => setStage('app')} />
        </motion.div>
      </AnimatePresence>
    );
  }

  // ── Main app ──
  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-1 overflow-y-auto pb-28 hide-scrollbar">
        <AnimatePresence mode="wait">
          <motion.div key={screen} variants={slideRight} initial="initial" animate="animate" exit="exit">
            {renderScreen()}
          </motion.div>
        </AnimatePresence>
      </div>

      {screen !== 'exercise_player' && (
        <nav className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-auto"
          style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
          <motion.div
            className="nav-pill flex items-center gap-0.5 px-1.5 py-1"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.4, ease: 'easeOut' }}
          >
            {NAV.map((item) => {
              const active =
                (item.id === 'dashboard'   && screen === 'dashboard') ||
                (item.id === 'exercises'   && screen === 'exercises') ||
                (item.id === 'vision_test' && screen === 'vision_test') ||
                (item.id === 'stats'       && screen === 'stats') ||
                (item.id === 'settings'    && ['settings', 'premium', 'referral'].includes(screen));
              return (
                <button
                  key={item.id}
                  onClick={() => { haptic(); setScreen(item.id as Screen); }}
                  className={`nav-pill-btn ${active ? 'active' : ''}`}
                >
                  <motion.span
                    animate={active ? { scale: 1.1, y: -1 } : { scale: 1, y: 0 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                  >
                    <item.Icon
                      size={20}
                      strokeWidth={1.8}
                      color={active ? '#52A3FF' : 'rgba(255,255,255,0.35)'}
                    />
                  </motion.span>
                  <span>{item.label}</span>
                </button>
              );
            })}
          </motion.div>
        </nav>
      )}
    </div>
  );
}
