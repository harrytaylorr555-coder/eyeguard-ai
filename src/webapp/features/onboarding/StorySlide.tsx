import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Check } from 'lucide-react';

interface Props {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  cta: string;
  onCta: () => void;
  isLast?: boolean;
  disclaimer?: string;
}

export default function StorySlide({ icon, title, subtitle, cta, onCta, isLast, disclaimer }: Props) {
  return (
    <motion.div
      className="flex flex-col items-center justify-center text-center px-8 min-h-full"
      initial={{ opacity: 0, x: 40, filter: 'blur(4px)' }}
      animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
      exit={{ opacity: 0, x: -40, filter: 'blur(4px)' }}
      transition={{ duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      {/* Illustration area */}
      <motion.div
        className="mb-8"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.15, duration: 0.5, type: 'spring', stiffness: 200, damping: 18 }}
      >
        {icon}
      </motion.div>

      {/* Title */}
      <motion.h1
        className="text-[26px] font-bold text-white leading-snug mb-3"
        style={{ fontFamily: 'Syne, sans-serif' }}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.4 }}
      >
        {title}
      </motion.h1>

      {/* Subtitle */}
      <motion.p
        className="text-[15px] leading-relaxed max-w-xs mx-auto"
        style={{ color: 'rgba(255,255,255,0.55)' }}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.28, duration: 0.4 }}
      >
        {subtitle}
      </motion.p>

      {/* Disclaimer */}
      {disclaimer && (
        <motion.p
          className="text-[11px] mt-3"
          style={{ color: 'rgba(255,255,255,0.3)' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          {disclaimer}
        </motion.p>
      )}

      {/* CTA Button */}
      <motion.button
        onClick={onCta}
        className="btn-primary mt-8 max-w-[280px] flex items-center justify-center gap-2"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.36, duration: 0.4 }}
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
      >
        {cta}
        {isLast ? (
          <Check size={20} strokeWidth={2.5} />
        ) : (
          <ArrowRight size={20} strokeWidth={2} />
        )}
      </motion.button>
    </motion.div>
  );
}
