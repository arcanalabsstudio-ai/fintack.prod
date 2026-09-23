import React, { useState } from 'react';
import { PlanType, TaxSettings } from '../types';
import { Crown, Settings, TrendingUp, Receipt, Scan, ShieldAlert, Activity, Menu, X, ChevronDown, Cloud, Home } from 'lucide-react';
import { TRANSLATIONS } from '../utils/translations';
import { SyncStatus } from '../services/cloudDatabase';
import { User } from '../lib/firebase';

interface HeaderProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  plan: PlanType;
  setPlan: (plan: PlanType) => void;
  taxSettings: TaxSettings;
  onOpenSettings: () => void;
  syncStatus?: SyncStatus;
  user?: User | null;
  onOpenCloudModal?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  setCurrentTab,
  plan,
  setPlan,
  taxSettings,
  onOpenSettings,
  syncStatus = 'synced',
  user,
  onOpenCloudModal,
}) => {
  const currentLang = taxSettings.language || 'es';
  const t = TRANSLATIONS[currentLang];
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const allTabs = [
    { id: 'dashboard', label: t.dashboard, icon: TrendingUp },
    { id: 'transactions', label: t.transactions, icon: Receipt },
    { id: 'scanner', label: t.scanner, icon: Scan, isAI: true },
    { id: 'tax', label: t.tax, icon: ShieldAlert },
    { id: 'deliverables', label: t.architecture, icon: Activity },
  ];

  // 🌱 Lite: Oculta las pestañas de "Impuestos" y "Centro de Control"
  const tabs = plan === 'LITE'
    ? allTabs.filter((tab) => tab.id !== 'tax' && tab.id !== 'deliverables')
    : allTabs;

  const handleTabClick = (tabId: string) => {
    setCurrentTab(tabId);
    setIsMobileMenuOpen(false);
  };

  return (
    <header className="bg-[#060D0B]/95 backdrop-blur-md border-b border-[#182F2A] sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-2 sm:gap-4">
          
          {/* 1. IZQUIERDA: Logo FINTACK con nuevo isotipo */}
          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => handleTabClick('dashboard')}
              className="flex items-center gap-2 sm:gap-2.5 text-left cursor-pointer group focus:outline-none"
              title="Fintack - Ir al Dashboard"
            >
              <div className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center bg-transparent shrink-0" id="header-logo">
                <svg
                  className="w-full h-full filter drop-shadow-[0_2px_8px_rgba(0,245,182,0.22)]"
                  viewBox="31 41 120.5 105"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <defs>
                    <linearGradient
                      id="headerBrandGrad1"
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
                      id="headerBrandGrad2"
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
                    fill="url(#headerBrandGrad1)"
                    stroke="#004d38"
                    strokeWidth="1.6"
                    d="M 91.499998,44.1 34.026839,143.64643 H 148.5 l -9.57642,-16.58684 H 102 L 120.61881,94.81086 110.59998,77.457743 82.015863,126.96689 H 63.3 l 38.1328,-66.047952 z"
                  />
                  <circle
                    fill="url(#headerBrandGrad2)"
                    stroke="#004d38"
                    strokeWidth="0.8"
                    cx="122.85"
                    cy="115.35"
                    r="7.05"
                  />
                </svg>
              </div>
              <div className="flex md:hidden lg:flex items-center gap-1.5">
                <span className="text-base font-black uppercase tracking-widest bg-clip-text text-transparent bg-gradient-to-r from-[#14B8A6] via-[#99F6E4] to-white leading-tight group-hover:brightness-110 transition">
                  FINTACK
                </span>
                <span className="hidden lg:inline-block text-[9px] font-bold tracking-wider uppercase bg-[#11221D] text-[#14B8A6] px-1.5 py-0.5 rounded-md border border-[#1C3A31]">
                  Freelance
                </span>
              </div>
            </button>
          </div>

          {/* 2. CENTRO: Pestañas Compactas (Solo en Escritorio / md:flex) */}
          <nav className="hidden md:flex items-center justify-center flex-1 max-w-xl mx-2">
            <div className="flex items-center gap-1 bg-[#0B1512] p-1 rounded-xl border border-[#1C3A31] w-full justify-between">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = currentTab === tab.id;
                const isSecondaryTab = tab.id === 'tax' || tab.id === 'deliverables';

                return (
                  <button
                    key={tab.id}
                    id={`nav-tab-${tab.id}`}
                    onClick={() => handleTabClick(tab.id)}
                    className={`${
                      isSecondaryTab ? 'hidden lg:flex' : 'flex'
                    } items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg transition-all duration-150 whitespace-nowrap ${
                      isActive
                        ? 'bg-[#163029] text-[#14B8A6] border border-[#14B8A6]/30 shadow-xs'
                        : 'text-[#7C9791] hover:text-white hover:bg-[#11241F]/50'
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-[#14B8A6]' : 'text-[#7C9791]'}`} />
                    <span>{tab.label}</span>
                    {tab.isAI && plan === 'FREE' && (
                      <span className="text-[8px] font-mono px-1 py-0.2 rounded bg-[#11221D] text-[#14B8A6] border border-[#1C3A31]">
                        IA
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </nav>

          {/* 3. DERECHA: Selector de Plan, Botones de Acción (Home, Nube, Config & Menú) */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Selector de Plan para Tablets (md:flex lg:hidden) */}
            <div className="hidden md:flex lg:hidden items-center relative">
              <select
                id="tablet-plan-select"
                value={plan}
                onChange={(e) => setPlan(e.target.value as PlanType)}
                className="appearance-none bg-[#0B1512] hover:bg-[#11241F] text-[#14B8A6] font-semibold text-xs py-1.5 pl-2.5 pr-7 rounded-xl border border-[#1C3A31] focus:outline-none focus:border-[#14B8A6]/60 cursor-pointer transition shadow-xs"
              >
                <option value="LITE" className="bg-[#0B1512] text-white">🌱 Lite</option>
                <option value="STANDARD" className="bg-[#0B1512] text-white">⚖️ Estándar</option>
                <option value="PRO" className="bg-[#0B1512] text-[#14B8A6]">⭐ Pro</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-[#14B8A6] absolute right-2 pointer-events-none" />
            </div>

            {/* Selector de 3 Modalidades en Escritorio (lg:flex) */}
            <div className="hidden lg:flex items-center bg-[#0B1512] p-0.5 rounded-xl border border-[#1C3A31]">
              <button
                onClick={() => setPlan('LITE')}
                className={`px-2 py-1 text-[11px] font-semibold rounded-lg transition-all ${
                  plan === 'LITE'
                    ? 'bg-[#1C3A31] text-[#14B8A6] border border-[#14B8A6]/40 shadow-xs'
                    : 'text-[#7C9791] hover:text-white'
                }`}
                title="🌱 Lite - Modo Esencial"
              >
                🌱 Lite
              </button>
              <button
                onClick={() => setPlan('STANDARD')}
                className={`px-2 py-1 text-[11px] font-semibold rounded-lg transition-all ${
                  plan === 'STANDARD'
                    ? 'bg-[#1C3A31] text-[#14B8A6] border border-[#14B8A6]/40 shadow-xs'
                    : 'text-[#7C9791] hover:text-white'
                }`}
                title="⚖️ Estándar - Modo Intermedio"
              >
                ⚖️ Estándar
              </button>
              <button
                onClick={() => setPlan('PRO')}
                className={`flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all ${
                  plan === 'PRO'
                    ? 'bg-[#14B8A6] text-[#020504] shadow-xs'
                    : 'text-[#7C9791] hover:text-white'
                }`}
                title="⭐ Pro - Modo Avanzado"
              >
                <Crown className={`w-2.5 h-2.5 ${plan === 'PRO' ? 'text-[#020504]' : 'text-amber-400'}`} />
                <span>⭐ Pro</span>
              </button>
            </div>

            {/* Botón Home (Casa) */}
            <button
              type="button"
              id="header-home-btn"
              onClick={() => handleTabClick('dashboard')}
              className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl border transition flex items-center justify-center cursor-pointer shadow-xs ${
                currentTab === 'dashboard'
                  ? 'bg-[#163029] text-[#14B8A6] border-[#14B8A6]/40 shadow-xs'
                  : 'text-[#7C9791] hover:text-[#14B8A6] hover:bg-[#11241F] bg-[#0B1512] border-[#1C3A31]'
              }`}
              title="Inicio (Dashboard)"
              aria-label="Ir al Inicio"
            >
              <Home className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
            </button>

            {/* Botón Nube Firestore */}
            <button
              type="button"
              onClick={onOpenCloudModal}
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#0B1512] hover:bg-[#11241F] border border-[#1C3A31] text-[#7C9791] hover:text-white flex items-center justify-center transition shadow-xs cursor-pointer relative"
              title={`Base de Datos en la Nube (${syncStatus === 'synced' ? 'Sincronizado' : syncStatus === 'saving' ? 'Guardando...' : 'Conectando'})`}
              id="cloud-sync-btn"
              aria-label="Estado de la Nube"
            >
              <div className="relative flex items-center justify-center">
                <Cloud className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-[#14B8A6]" />
                <span
                  className={`absolute -top-1 -right-1 w-2 h-2 rounded-full ${
                    syncStatus === 'synced'
                      ? 'bg-[#14B8A6] shadow-[0_0_6px_#14B8A6]'
                      : syncStatus === 'saving'
                      ? 'bg-amber-400 animate-pulse'
                      : 'bg-sky-400'
                  }`}
                />
              </div>
            </button>

            {/* Botón Configuración */}
            <button
              type="button"
              onClick={onOpenSettings}
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl text-[#7C9791] hover:text-white bg-[#0B1512] hover:bg-[#11241F] border border-[#1C3A31] transition flex items-center justify-center shadow-xs cursor-pointer"
              title="Configuración Fiscal"
              aria-label="Configuración"
            >
              <Settings className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
            </button>

            {/* Menú Hamburguesa para Móviles (md:hidden) */}
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden w-9 h-9 sm:w-10 sm:h-10 rounded-xl text-[#14B8A6] bg-[#0B1512] hover:bg-[#11241F] border border-[#1C3A31] transition flex items-center justify-center shadow-xs cursor-pointer"
              aria-label="Toggle Menu"
            >
              {isMobileMenuOpen ? (
                <X className="w-4.5 h-4.5 sm:w-5 sm:h-5" />
              ) : (
                <Menu className="w-4.5 h-4.5 sm:w-5 sm:h-5" />
              )}
            </button>
          </div>
        </div>

        {/* MENÚ HAMBURGUESA DESPLEGABLE MÓVIL */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-[#182F2A] py-3 space-y-2 animate-in fade-in slide-in-from-top-2 duration-150">
            {/* Modalidad Selector para Móviles */}
            <div className="px-2 pb-2 border-b border-[#182F2A]/60 flex flex-col gap-1">
              <span className="text-[10px] font-semibold text-[#7C9791] uppercase tracking-wider px-1">
                Modalidad del Sistema
              </span>
              <div className="grid grid-cols-3 gap-1 bg-[#0B1512] p-1 rounded-xl border border-[#1C3A31]">
                <button
                  onClick={() => setPlan('LITE')}
                  className={`py-1.5 text-xs font-semibold rounded-lg transition text-center ${
                    plan === 'LITE'
                      ? 'bg-[#1C3A31] text-[#14B8A6] border border-[#14B8A6]/30 font-bold'
                      : 'text-[#7C9791] hover:text-white'
                  }`}
                >
                  🌱 Lite
                </button>
                <button
                  onClick={() => setPlan('STANDARD')}
                  className={`py-1.5 text-xs font-semibold rounded-lg transition text-center ${
                    plan === 'STANDARD'
                      ? 'bg-[#1C3A31] text-[#14B8A6] border border-[#14B8A6]/30 font-bold'
                      : 'text-[#7C9791] hover:text-white'
                  }`}
                >
                  ⚖️ Estándar
                </button>
                <button
                  onClick={() => setPlan('PRO')}
                  className={`py-1.5 text-xs font-bold rounded-lg transition text-center ${
                    plan === 'PRO'
                      ? 'bg-[#14B8A6] text-[#020504]'
                      : 'text-[#7C9791] hover:text-white'
                  }`}
                >
                  ⭐ Pro
                </button>
              </div>
            </div>

            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = currentTab === tab.id;
              return (
                <button
                  key={tab.id}
                  id={`mobile-tab-${tab.id}`}
                  onClick={() => handleTabClick(tab.id)}
                  className={`w-full flex items-center justify-between px-4 py-2.5 text-xs font-semibold rounded-xl transition ${
                    isActive
                      ? 'bg-[#163029] text-[#14B8A6] border border-[#14B8A6]/30 shadow-xs'
                      : 'text-[#7C9791] hover:text-white hover:bg-[#0B1512]'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-[#14B8A6]' : 'text-[#7C9791]'}`} />
                    <span>{tab.label}</span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </header>
  );
};