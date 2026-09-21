import React, { useState, useEffect } from 'react';
import { Sparkles, ArrowRight, ArrowLeft, Check, X, Plus, TrendingUp, Calculator, ShieldCheck, DollarSign } from 'lucide-react';

export interface OnboardingStep {
  id: string;
  stepNumber: number;
  title: string;
  description: string;
  highlightText: string;
  icon: React.ComponentType<{ className?: string }>;
  accentColor: string;
}

const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: 'step-fab',
    stepNumber: 1,
    title: 'Agrega tu primer movimiento',
    description: "Usa el botón '+' para registrar tus ingresos y gastos de forma rápida y sencilla.",
    highlightText: "Botón flotante (+)",
    icon: Plus,
    accentColor: '#14B8A6',
  },
  {
    id: 'step-dashboard',
    stepNumber: 2,
    title: 'Visualiza tu panorama financiero',
    description: 'En el Dashboard verás tu Balance, Ingresos, Gastos y Margen disponible al instante.',
    highlightText: "Métricas en tiempo real",
    icon: TrendingUp,
    accentColor: '#38BDF8',
  },
  {
    id: 'step-tax',
    stepNumber: 3,
    title: 'Controla tus impuestos',
    description: 'Fintack calcula automáticamente tus impuestos y te recuerda las fechas de declaración.',
    highlightText: "Cálculo automático y alertas",
    icon: Calculator,
    accentColor: '#F59E0B',
  },
];

interface OnboardingTourProps {
  isOpen: boolean;
  onComplete: () => void;
  onNavigateToTab?: (tab: string) => void;
}

export const OnboardingTour: React.FC<OnboardingTourProps> = ({
  isOpen,
  onComplete,
  onNavigateToTab,
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  // Reset to first step when opened
  useEffect(() => {
    if (isOpen) {
      setCurrentStepIndex(0);
    }
  }, [isOpen]);

  // Handle step tab switching for context preview
  useEffect(() => {
    if (!isOpen) return;
    const step = ONBOARDING_STEPS[currentStepIndex];
    if (step.id === 'step-tax') {
      onNavigateToTab?.('tax');
    } else {
      onNavigateToTab?.('dashboard');
    }
  }, [isOpen, currentStepIndex, onNavigateToTab]);

  // Keyboard navigation (Arrow keys, Enter, Escape)
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleSkip();
      } else if (e.key === 'ArrowRight' || e.key === 'Enter') {
        handleNext();
      } else if (e.key === 'ArrowLeft' && currentStepIndex > 0) {
        handlePrev();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentStepIndex]);

  const handleNext = () => {
    if (currentStepIndex < ONBOARDING_STEPS.length - 1) {
      setCurrentStepIndex((prev) => prev + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrev = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex((prev) => prev - 1);
    }
  };

  const handleSkip = () => {
    handleComplete();
  };

  const handleComplete = () => {
    try {
      localStorage.setItem('fintack_onboarding_completed', 'true');
    } catch (e) {
      console.error('Error saving onboarding state:', e);
    }
    onComplete();
  };

  if (!isOpen) return null;

  const currentStep = ONBOARDING_STEPS[currentStepIndex];
  const StepIcon = currentStep.icon;
  const isLastStep = currentStepIndex === ONBOARDING_STEPS.length - 1;

  return (
    <div
      id="fintack-onboarding-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-[#020504]/80 backdrop-blur-md transition-opacity duration-300"
      role="dialog"
      aria-modal="true"
      aria-labelledby="onboarding-step-title"
    >
      {/* Click outside to skip (optional background handler) */}
      <div className="absolute inset-0" onClick={handleSkip} />

      {/* Central Interactive Modal Card */}
      <div className="relative w-full max-w-md bg-[#0B1512] border border-[#1C3A31] rounded-3xl p-6 sm:p-8 shadow-[0_24px_50px_rgba(0,0,0,0.9),0_0_30px_rgba(20, 184, 166, 0.084)] text-white z-10 flex flex-col items-center text-center animate-in fade-in zoom-in-95 duration-200">
        
        {/* Top bar with Step Counter & Close/Skip Button */}
        <div className="w-full flex items-center justify-between gap-2 mb-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[#11241F] text-[#14B8A6] border border-[#14B8A6]/30">
            <Sparkles className="w-3.5 h-3.5 text-[#14B8A6]" />
            <span>Paso {currentStep.stepNumber} de {ONBOARDING_STEPS.length}</span>
          </div>

          <button
            id="onboarding-skip-btn"
            onClick={handleSkip}
            className="flex items-center gap-1 text-xs font-medium text-[#7C9791] hover:text-white transition px-2.5 py-1.5 rounded-lg hover:bg-[#11241F] cursor-pointer"
            title="Omitir tutorial"
          >
            <span>Omitir</span>
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Step Visual Illustration & Glowing Icon Container */}
        <div className="relative mb-6 flex items-center justify-center">
          {/* Ambient Glow */}
          <div
            className="absolute inset-0 rounded-full blur-xl opacity-30 transition-all duration-500"
            style={{ backgroundColor: currentStep.accentColor }}
          />

          {/* Central Icon Disc */}
          <div
            className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl flex items-center justify-center border transition-all duration-300 shadow-lg bg-[#11241F]"
            style={{
              borderColor: `${currentStep.accentColor}55`,
              boxShadow: `0 0 24px ${currentStep.accentColor}33`,
            }}
          >
            {currentStep.id === 'step-fab' && (
              <div className="relative flex items-center justify-center">
                <div className="w-12 h-12 rounded-full bg-[#14B8A6] flex items-center justify-center shadow-[0_0_16px_rgba(20, 184, 166, 0.42)]">
                  <Plus className="w-7 h-7 text-[#020504] stroke-[3]" />
                </div>
              </div>
            )}

            {currentStep.id === 'step-dashboard' && (
              <div className="relative flex flex-col items-center justify-center">
                <div className="w-12 h-12 rounded-xl bg-[#38BDF8]/20 border border-[#38BDF8]/50 flex items-center justify-center">
                  <TrendingUp className="w-7 h-7 text-[#38BDF8]" />
                </div>
              </div>
            )}

            {currentStep.id === 'step-tax' && (
              <div className="relative flex flex-col items-center justify-center">
                <div className="w-12 h-12 rounded-xl bg-[#F59E0B]/20 border border-[#F59E0B]/50 flex items-center justify-center">
                  <Calculator className="w-7 h-7 text-[#F59E0B]" />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Title */}
        <h2
          id="onboarding-step-title"
          className="text-xl sm:text-2xl font-black text-white tracking-tight leading-snug mb-3"
        >
          {currentStep.title}
        </h2>

        {/* Description */}
        <p className="text-sm sm:text-base text-[#A1B5AF] leading-relaxed max-w-sm mb-6">
          {currentStep.description}
        </p>

        {/* Feature highlight capsule */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#11241F] border border-[#1C3A31] text-xs font-semibold text-[#14B8A6] mb-8">
          <ShieldCheck className="w-3.5 h-3.5 text-[#14B8A6]" />
          <span>{currentStep.highlightText}</span>
        </div>

        {/* Progress Step Dots */}
        <div className="flex items-center justify-center gap-2 mb-6 w-full" aria-label="Progreso del tutorial">
          {ONBOARDING_STEPS.map((s, idx) => (
            <button
              key={s.id}
              onClick={() => setCurrentStepIndex(idx)}
              className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                idx === currentStepIndex
                  ? 'w-8 bg-[#14B8A6] shadow-[0_0_10px_rgba(20, 184, 166, 0.42)]'
                  : idx < currentStepIndex
                  ? 'w-2.5 bg-[#1C3A31] hover:bg-[#285044]'
                  : 'w-2.5 bg-[#162723] hover:bg-[#203630]'
              }`}
              title={`Ir al paso ${s.stepNumber}`}
              aria-label={`Paso ${s.stepNumber}`}
            />
          ))}
        </div>

        {/* Action Buttons (Full width on mobile, responsive row) */}
        <div className="w-full flex items-center gap-3">
          {currentStepIndex > 0 ? (
            <button
              id="onboarding-prev-btn"
              onClick={handlePrev}
              className="flex-1 py-3 px-4 min-h-[48px] text-sm font-semibold text-[#A1B5AF] hover:text-white bg-[#11241F] hover:bg-[#163029] active:scale-95 rounded-xl border border-[#1C3A31] transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Anterior</span>
            </button>
          ) : (
            <button
              id="onboarding-skip-secondary-btn"
              onClick={handleSkip}
              className="flex-1 py-3 px-4 min-h-[48px] text-sm font-medium text-[#7C9791] hover:text-white bg-[#11241F]/60 hover:bg-[#11241F] active:scale-95 rounded-xl border border-[#1C3A31] transition flex items-center justify-center cursor-pointer"
            >
              <span>Saltar</span>
            </button>
          )}

          {isLastStep ? (
            <button
              id="onboarding-finish-btn"
              onClick={handleComplete}
              className="flex-1 py-3 px-5 min-h-[48px] bg-[#14B8A6] hover:bg-[#0D9488] active:scale-95 text-[#020504] font-bold text-sm rounded-xl transition flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(20, 184, 166, 0.28)] cursor-pointer"
            >
              <span>¡Empezar!</span>
              <Check className="w-4 h-4 stroke-[3]" />
            </button>
          ) : (
            <button
              id="onboarding-next-btn"
              onClick={handleNext}
              className="flex-1 py-3 px-5 min-h-[48px] bg-[#14B8A6] hover:bg-[#0D9488] active:scale-95 text-[#020504] font-bold text-sm rounded-xl transition flex items-center justify-center gap-2 shadow-[0_0_16px_rgba(20, 184, 166, 0.21)] cursor-pointer"
            >
              <span>Siguiente</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>

      </div>
    </div>
  );
};

