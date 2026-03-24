'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const AGE_GATE_KEY = 'age_verified_21';

export default function AgeGate({ children }: { children: React.ReactNode }) {
  const [verified, setVerified] = useState<boolean | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(AGE_GATE_KEY);
    setVerified(stored === 'true');
  }, []);

  const handleConfirm = useCallback(() => {
    setIsAnimating(true);
    setTimeout(() => {
      localStorage.setItem(AGE_GATE_KEY, 'true');
      setVerified(true);
    }, 1400);
  }, []);

  const handleDeny = useCallback(() => {
    window.location.href = 'https://google.com';
  }, []);

  // Initial load — show nothing until localStorage is checked
  if (verified === null) {
    return (
      <div className="fixed inset-0 z-[9999] bg-[#0A0A0A]" />
    );
  }

  if (verified) {
    return <>{children}</>;
  }

  return (
    <>
      {children}
      <AnimatePresence>
        {!verified && (
          <motion.div
            key="age-gate"
            className="fixed inset-0 z-[9999] flex items-center justify-center"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* Background */}
            <div className="absolute inset-0 bg-[#0A0A0A]" />

            {/* Smoke particles (animate out on confirm) */}
            <AnimatePresence>
              {isAnimating && (
                <>
                  {Array.from({ length: 12 }).map((_, i) => (
                    <motion.div
                      key={`smoke-${i}`}
                      className="absolute rounded-full"
                      style={{
                        width: 80 + Math.random() * 200,
                        height: 80 + Math.random() * 200,
                        left: `${10 + Math.random() * 80}%`,
                        top: `${10 + Math.random() * 80}%`,
                        background: `radial-gradient(circle, rgba(180,180,180,${0.15 + Math.random() * 0.2}) 0%, transparent 70%)`,
                        filter: 'blur(30px)',
                      }}
                      initial={{ opacity: 0, scale: 0.3 }}
                      animate={{
                        opacity: [0, 0.7, 0],
                        scale: [0.3, 1.8, 2.5],
                        y: [0, -100 - Math.random() * 200],
                        x: [(Math.random() - 0.5) * 100, (Math.random() - 0.5) * 300],
                      }}
                      transition={{
                        duration: 1.2,
                        delay: Math.random() * 0.3,
                        ease: 'easeOut',
                      }}
                    />
                  ))}
                </>
              )}
            </AnimatePresence>

            {/* Content */}
            <motion.div
              className="relative z-10 max-w-2xl mx-auto px-6"
              animate={isAnimating ? { opacity: 0, scale: 0.9, y: 20 } : {}}
              transition={{ duration: 0.4 }}
            >
              {/* Logo / Age Badge */}
              <div className="flex justify-center mb-10">
                <div className="relative">
                  <div className="w-28 h-28 rounded-full border-2 border-[#D4AF37]/40 flex items-center justify-center bg-[#D4AF37]/5 backdrop-blur-sm">
                    <span className="text-4xl font-bold text-[#D4AF37]">21+</span>
                  </div>
                  <div className="absolute -inset-3 rounded-full border border-[#D4AF37]/10 animate-pulse" />
                </div>
              </div>

              {/* Kazakh text FIRST */}
              <div className="text-center space-y-6">
                <p className="text-[#A0A0A0] text-sm leading-relaxed">
                  Жиырма бір жасқа толмаған тұлғаларға темекі бұйымдарын, оның ішінде
                  қыздырылатын темекісі бар бұйымдарды, қорқорға арналған темекіні,
                  қорқор қоспасын, темекіні қыздыруға арналған жүйелерді сатуға тыйым
                  салынады. <strong className="text-[#C0C0C0]">Сіз 21 жастасыз ба?</strong>
                </p>

                <div className="w-16 h-px bg-[#D4AF37]/30 mx-auto" />

                <p className="text-[#C0C0C0] text-sm leading-relaxed">
                  Запрещается продажа табачных изделий, в том числе изделий с нагреваемым
                  табаком, табака для кальяна, кальянной смеси, систем для нагрева табака
                  лицам в возрасте до двадцати одного года.{' '}
                  <strong className="text-[#F5F5F5]">Вам есть 21 год?</strong>
                </p>
              </div>

              {/* Buttons */}
              <div className="flex items-center justify-center gap-4 mt-10">
                <button
                  onClick={handleConfirm}
                  disabled={isAnimating}
                  className="px-10 py-3.5 bg-[#D4AF37] text-[#0A0A0A] font-semibold rounded-xl
                    hover:bg-[#C4A030] active:scale-[0.97] transition-all duration-200
                    disabled:opacity-70 disabled:cursor-not-allowed
                    shadow-lg shadow-[#D4AF37]/20 text-sm tracking-wide uppercase"
                >
                  {isAnimating ? (
                    <span className="flex items-center gap-2">
                      <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeDasharray="40 60" />
                      </svg>
                      Загрузка...
                    </span>
                  ) : (
                    'Иа / Да'
                  )}
                </button>
                <button
                  onClick={handleDeny}
                  className="px-10 py-3.5 border border-[#333] text-[#A0A0A0] font-medium rounded-xl
                    hover:border-[#555] hover:text-[#C0C0C0] active:scale-[0.97] transition-all duration-200
                    text-sm tracking-wide uppercase"
                >
                  Жоқ / Нет
                </button>
              </div>

              {/* Legal reference */}
              <p className="text-center text-[#555] text-xs mt-8">
                ст. 110 Кодекса РК «О здоровье народа и системе здравоохранения»
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
