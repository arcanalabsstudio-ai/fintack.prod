import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';

interface SplashScreenProps {
  isFadingOut: boolean;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ isFadingOut }) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const startTime = Date.now();
    const duration = 3500;

    const updateProgress = () => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min(100, Math.floor((elapsed / duration) * 100));
      setProgress(pct);

      if (elapsed < duration) {
        requestAnimationFrame(updateProgress);
      }
    };

    const animFrame = requestAnimationFrame(updateProgress);
    return () => cancelAnimationFrame(animFrame);
  }, []);

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-br from-[#040807] to-[#0A1412] select-none transition-opacity duration-500 ease-in-out ${
        isFadingOut ? 'opacity-0' : 'opacity-100'
      }`}
      id="splash-screen-container"
    >
      {/* Background ambient technological lines or glowing circles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-[#14B8A6]/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-teal-600/5 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '6s' }} />
      </div>

      {/* Laser horizontal scanning line */}
      <motion.div
        className="absolute left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#14B8A6]/20 to-transparent pointer-events-none"
        initial={{ top: '0%' }}
        animate={{ top: '100%' }}
        transition={{
          duration: 5,
          repeat: Infinity,
          ease: 'linear',
        }}
      />

      {/* Floating tech particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        {[...Array(12)].map((_, i) => {
          const randomX = (i * 8.3) % 100;
          const randomY = (i * 12.7) % 100;
          const randomDelay = i * 0.35;
          const randomDuration = 5 + (i % 4) * 1.5;
          const randomSize = 2 + (i % 3);
          return (
            <motion.div
              key={i}
              className="absolute bg-[#14B8A6] rounded-full opacity-0"
              style={{
                left: `${randomX}%`,
                top: `${randomY}%`,
                width: randomSize,
                height: randomSize,
                boxShadow: '0 0 5px #14B8A6',
              }}
              animate={{
                y: [-20, -120],
                opacity: [0, 0.5, 0],
                scale: [1, 1.2, 1],
              }}
              transition={{
                duration: randomDuration,
                repeat: Infinity,
                delay: randomDelay,
                ease: 'easeInOut',
              }}
            />
          );
        })}
      </div>

      <div className="relative flex flex-col items-center justify-center z-10 text-center">
        {/* BLOQUE DE MARCA UNIFICADO (Isotipo + Logotipo + Subtítulo) */}
        <motion.div
          initial={{ opacity: 0, y: 16, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{
            duration: 0.7,
            ease: [0.16, 1, 0.3, 1],
            delay: 0.15,
          }}
          className="flex flex-col items-center justify-center select-none"
          id="splash-brand-block"
        >
          {/* ISOTIPO GEOMÉTRICO (Centrado óptico y vectorial exacto) */}
          <div
            className="w-24 h-24 sm:w-28 sm:h-28 flex items-center justify-center mb-3"
            id="splash-logo-container"
          >
            <svg
              className="w-full h-full filter drop-shadow-[0_4px_16px_rgba(0,245,182,0.22)]"
              viewBox="31 41 120.5 105"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <linearGradient
                  id="brandGrad1"
                  x1="72.167"
                  y1="116.299"
                  x2="148.16"
                  y2="53"
                  gradientUnits="userSpaceOnUse"
                >
                  <stop offset="0%" stopColor="#008c68" />
                  <stop offset="100%" stopColor="#00f5b6" />
                </linearGradient>
                <radialGradient
                  id="brandGrad2"
                  cx="122.85"
                  cy="115.35"
                  r="7.05"
                  gradientUnits="userSpaceOnUse"
                >
                  <stop offset="0%" stopColor="#ffffff" />
                  <stop offset="100%" stopColor="#a7f3d0" />
                </radialGradient>
              </defs>
              <path
                fill="url(#brandGrad1)"
                stroke="#004d38"
                strokeWidth="1.6"
                d="M 91.499998,44.1 34.026839,143.64643 H 148.5 l -9.57642,-16.58684 H 102 L 120.61881,94.81086 110.59998,77.457743 82.015863,126.96689 H 63.3 l 38.1328,-66.047952 z"
              />
              <circle
                fill="url(#brandGrad2)"
                stroke="#004d38"
                strokeWidth="0.8"
                cx="122.85"
                cy="115.35"
                r="7.05"
              />
            </svg>
          </div>

          {/* NOMBRE DE LA MARCA */}
          <h1
            className="text-3xl font-black uppercase tracking-widest bg-clip-text text-transparent bg-gradient-to-r from-[#14B8A6] via-[#99F6E4] to-white leading-tight"
            id="splash-app-name"
          >
            FINTACK
          </h1>

          {/* SUBTÍTULO / TAGLINE */}
          <p
            className="text-[10px] font-light uppercase tracking-[0.25em] text-[#7C9791] mt-2"
            id="splash-app-tagline"
          >
            Smart Tax Ledger
          </p>
        </motion.div>

        {/* PROGRESS LOADER */}
        <div className="w-48 space-y-2 mt-10" id="splash-progress-loader">
          <div className="flex items-center justify-between text-[9px] font-mono tracking-widest text-[#7C9791] uppercase">
            <span>{progress === 100 ? 'SISTEMA LISTO' : 'INICIANDO...'}</span>
            <span className="text-[#14B8A6] font-bold">{progress}%</span>
          </div>
          <div className="h-[2px] w-full bg-[#11241F] rounded-full overflow-hidden border border-[#1C3A31]/30">
            <motion.div
              className="h-full bg-[#14B8A6]"
              style={{
                width: `${progress}%`,
                boxShadow: '0 0 5px #14B8A6',
              }}
              transition={{ ease: 'linear' }}
            />
          </div>
        </div>

        {/* AUTHORSHIP */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.5 }}
          transition={{ duration: 0.8, delay: 0.9 }}
          className="mt-12 flex flex-col items-center gap-1.5"
          id="splash-authorship-container"
        >
          <div className="w-6 h-[1px] bg-emerald-950" />
          <p className="text-[10px] font-mono tracking-widest text-[#7C9791] uppercase">
            by ArcanaLabs
          </p>
          <p className="text-[9px] font-mono tracking-wider text-[#4A645F] mt-0.5">
            v1.0.0 / 2026
          </p>
        </motion.div>
      </div>

      {/* Decorative cyber grid background effect (subtle) */}
      <div className="absolute inset-0 bg-[radial-gradient(#152c25_1px,transparent_1px)] [background-size:24px_24px] opacity-25 pointer-events-none" />
    </div>
  );
};
