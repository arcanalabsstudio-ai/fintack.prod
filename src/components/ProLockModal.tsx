import React from 'react';
import { Lock, Crown, Check, X, Sparkles } from 'lucide-react';

interface ProLockModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpgradePlan: () => void;
  featureName?: string;
  description?: string;
}

export const ProLockModal: React.FC<ProLockModalProps> = ({
  isOpen,
  onClose,
  onUpgradePlan,
  featureName = 'Función Avanzada',
  description,
}) => {
  if (!isOpen) return null;

  const handleUpgrade = () => {
    onUpgradePlan();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#0B1512] w-full max-w-md rounded-2xl border border-[#182F2A] shadow-2xl p-6 relative overflow-hidden text-center space-y-5">
        {/* Glow effect */}
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-40 h-40 bg-[#14B8A6]/15 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-[#7C9791] hover:text-white rounded-xl hover:bg-[#11241F] transition"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Lock Icon */}
        <div className="mx-auto w-14 h-14 rounded-2xl bg-[#11241F] border border-[#14B8A6]/30 flex items-center justify-center shadow-lg shadow-[#14B8A6]/10 text-[#14B8A6]">
          <Lock className="w-7 h-7 text-[#14B8A6]" />
        </div>

        {/* Title & Badge */}
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#11241F] border border-[#1C3A31] text-[11px] font-bold text-[#14B8A6]">
            <Crown className="w-3.5 h-3.5 text-amber-400" />
            <span>EXCLUSIVO PRO</span>
          </div>
          <h3 className="text-lg font-bold text-white tracking-tight">
            {featureName}
          </h3>
          <p className="text-xs text-[#14B8A6] font-semibold">
            Esta es una función Pro. Actualiza tu plan para acceder a ella.
          </p>
        </div>

        {/* Description or details */}
        <div className="p-3.5 bg-[#081512] rounded-xl border border-[#182F2A] text-left text-xs text-[#7C9791] space-y-2">
          <p className="text-white/90 text-xs">
            {description || 'El plan ⭐ Pro desbloquea todas las herramientas avanzadas sin límites:'}
          </p>
          <ul className="space-y-1.5 text-[11px] text-[#A7F3D0]">
            <li className="flex items-center gap-2">
              <Check className="w-3.5 h-3.5 text-[#14B8A6] shrink-0" />
              <span>Exportación completa en PDF, Excel y CSV</span>
            </li>
            <li className="flex items-center gap-2">
              <Check className="w-3.5 h-3.5 text-[#14B8A6] shrink-0" />
              <span>Escaneo masivo de recibos en lote (Multi-OCR)</span>
            </li>
            <li className="flex items-center gap-2">
              <Check className="w-3.5 h-3.5 text-[#14B8A6] shrink-0" />
              <span>Corrección manual y personalización fiscal</span>
            </li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 px-4 bg-[#11241F] hover:bg-[#163029] text-[#7C9791] hover:text-white font-semibold text-xs rounded-xl border border-[#1C3A31] transition"
          >
            Permanecer en mi plan
          </button>
          <button
            type="button"
            onClick={handleUpgrade}
            className="flex-1 py-2.5 px-4 bg-[#14B8A6] hover:bg-[#0D9488] text-[#020504] font-bold text-xs rounded-xl shadow-[0_0_15px_rgba(20, 184, 166, 0.14)] transition flex items-center justify-center gap-2"
          >
            <Crown className="w-4 h-4 text-[#020504]" />
            <span>Actualizar a Pro</span>
          </button>
        </div>
      </div>
    </div>
  );
};
