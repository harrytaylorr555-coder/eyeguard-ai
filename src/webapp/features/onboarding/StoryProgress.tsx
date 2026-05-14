import React from 'react';
import { motion } from 'framer-motion';

interface Props {
  total: number;
  current: number;
}

export default function StoryProgress({ total, current }: Props) {
  return (
    <div className="flex gap-1.5">
      {Array.from({ length: total }).map((_, i) => (
        <motion.div
          key={i}
          className="h-1 rounded-full"
          initial={false}
          animate={{
            width: i === current ? 24 : 8,
            background:
              i <= current
                ? 'linear-gradient(90deg, #1A5FFF, #52A3FF)'
                : 'rgba(255,255,255,0.12)',
            boxShadow:
              i === current
                ? '0 0 8px rgba(82,163,255,0.7)'
                : i < current
                  ? '0 0 4px rgba(82,163,255,0.3)'
                  : 'none',
          }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
        />
      ))}
    </div>
  );
}
