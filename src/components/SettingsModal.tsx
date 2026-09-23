import React, { useState, useEffect } from 'react';
import { TaxSettings, PlanType, Transaction } from '../types';
import { DEFAULT_EXPENSE_CATEGORIES, DEFAULT_INCOME_CATEGORIES } from '../data/constants';
import {
  X,
  Save,
  Crown,
  RefreshCw,
  CheckCircle2,
  Globe,
  Coins,
  Bell,
  Target,
  FolderPlus,
  Tag,
  Pencil,
  Trash2,
  Plus,
  AlertCircle,
  MoreVertical,
  Sliders,
  Sparkles,
  Zap,
  Check,
  Scale,
  FileText,
  Lock,
  Shield,
  ChevronDown,
  ChevronUp,
  ArrowRight,
} from 'lucide-react';
import { TRANSLATIONS, CURRENCY_OPTIONS, LanguageType } from '../utils/translations';
import { SyncStatus } from '../services/cloudDatabase';
import { Cloud, CheckCircle, Database, LogOut, User as UserIcon } from 'lucide-react';
import { User } from '../lib/firebase';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  taxSettings: TaxSettings;
  onSaveTaxSettings: (settings: TaxSettings) => void;
  plan: PlanType;
  setPlan: (plan: PlanType) => void;
  onResetData: () => void;
  transactions?: Transaction[];
  onReassignCategory?: (oldName: string, newName: string) => void;
  onReplayOnboarding?: () => void;
  onOpenCloudModal?: () => void;
  syncStatus?: SyncStatus;
  onSignOut?: () => void;
  user?: User | null;
}

interface PlanFeatureItem {
  category: string;
  name: string;
  description?: string;
  lite: boolean;
  standard: boolean;
  pro: boolean;
}

const COMPARISON_FEATURES: PlanFeatureItem[] = [
  // Dashboard y Finanzas
  {
    category: 'Dashboard y Finanzas',
    name: 'Tarjetas de Balance, Ingresos, Gastos y Margen',
    description: 'Resumen financiero en tiempo real con cálculo automático',
    lite: true,
    standard: true,
    pro: true,
  },
  {
    category: 'Dashboard y Finanzas',
    name: 'Gráficos de Evolución Mensual e Ingresos vs Gastos',
    description: 'Tendencias visuales comparativas e interactivas',
    lite: false,
    standard: true,
    pro: true,
  },
  {
    category: 'Dashboard y Finanzas',
    name: 'Metas de Ahorro con Plazos y Proyecciones',
    description: 'Calcula tu ritmo de ahorro mensual y anual',
    lite: false,
    standard: true,
    pro: true,
  },
  {
    category: 'Dashboard y Finanzas',
    name: 'Presupuestos por Categoría con Alertas de Límite',
    description: 'Control de techos de gasto y notificaciones de sobregiro',
    lite: false,
    standard: true,
    pro: true,
  },

  // Historial y Operaciones
  {
    category: 'Historial y Operaciones',
    name: 'Registro y Consulta de Transacciones',
    description: 'Listado completo de ingresos y gastos',
    lite: true,
    standard: true,
    pro: true,
  },
  {
    category: 'Historial y Operaciones',
    name: 'Búsqueda en Tiempo Real y Filtros Avanzados',
    description: 'Filtra por fecha, categoría, tipo y montos',
    lite: false,
    standard: true,
    pro: true,
  },
  {
    category: 'Historial y Operaciones',
    name: 'Categorías Personalizadas de Ingresos y Gastos',
    description: 'Crea, edita y organiza tus propias categorías',
    lite: true,
    standard: true,
    pro: true,
  },
  {
    category: 'Historial y Operaciones',
    name: 'Soporte Multidivisa e Idiomas',
    description: 'USD, EUR, MXN, ARS, COP, BRL, etc.',
    lite: true,
    standard: true,
    pro: true,
  },

  // IA y Digitalización de Recibos
  {
    category: 'IA y Digitalización de Recibos',
    name: 'Escáner de Comprobantes con IA (Individual)',
    description: 'Extracción instantánea de emisor, montos e impuestos',
    lite: true,
    standard: true,
    pro: true,
  },
  {
    category: 'IA y Digitalización de Recibos',
    name: 'Escáner Masivo en Lote (Multi-OCR Simultáneo)',
    description: 'Sube y procesa decenas de comprobantes a la vez',
    lite: false,
    standard: false,
    pro: true,
  },
  {
    category: 'IA y Digitalización de Recibos',
    name: 'Corrección Manual de Comprobantes Escaneados',
    description: 'Edita directamente montos y deducciones extraídas por IA',
    lite: false,
    standard: false,
    pro: true,
  },

  // Fiscalidad y Reportes
  {
    category: 'Fiscalidad y Reportes',
    name: 'Estimación y Retención de Impuestos (ISR/IVA/IRPF)',
    description: 'Cálculo automatizado según tu régimen fiscal',
    lite: false,
    standard: true,
    pro: true,
  },
  {
    category: 'Fiscalidad y Reportes',
    name: 'Centro de Control y Diagnóstico Tributario',
    description: 'Métricas de salud financiera y alertas fiscales',
    lite: false,
    standard: true,
    pro: true,
  },
  {
    category: 'Fiscalidad y Reportes',
    name: 'Exportación Contable en PDF, Excel (.xlsx) y CSV',
    description: 'Descarga reportes estructurados para tu gestión',
    lite: false,
    standard: false,
    pro: true,
  },
  {
    category: 'Fiscalidad y Reportes',
    name: 'Paquete de Auditoría Fiscal Descargable',
    description: 'Resumen completo listo para enviar a tu contador',
    lite: false,
    standard: false,
    pro: true,
  },
];

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  taxSettings,
  onSaveTaxSettings,
  plan,
  setPlan,
  onResetData,
  transactions = [],
  onReassignCategory,
  onReplayOnboarding,
  onOpenCloudModal,
  syncStatus = 'synced',
  onSignOut,
  user,
}) => {
  const currentLang = taxSettings.language || 'es';
  const t = TRANSLATIONS[currentLang];

  // Active Tab: 'general' | 'plans'
  const [activeTab, setActiveTab] = useState<'general' | 'plans'>('general');
  const [planToast, setPlanToast] = useState<string | null>(null);
  const [expandedMobilePlans, setExpandedMobilePlans] = useState<Record<PlanType, boolean>>({
    LITE: false,
    STANDARD: false,
    PRO: false,
  });

  const toggleMobilePlanExpand = (targetPlan: PlanType) => {
    setExpandedMobilePlans((prev) => ({
      ...prev,
      [targetPlan]: !prev[targetPlan],
    }));
  };

  const defaultCategoryLimits: Record<string, number> = {
    'Software/Suscripciones': 300,
    'Espacio de Trabajo': 500,
    'Equipamiento': 200,
    'Alimentación/Reuniones': 100,
    'Transporte': 80,
    'Honorarios Profesionales': 0,
    'Servicios Públicos': 0,
    'Marketing y Publicidad': 0,
    'Otros Gastos': 150,
  };

  const [regime, setRegime] = useState<string>(taxSettings.regime);
  const [vatRate, setVatRate] = useState<number>(taxSettings.vatRate);
  const [incomeTaxRate, setIncomeTaxRate] = useState<number>(taxSettings.incomeTaxRate);
  const [goal, setGoal] = useState<number>(taxSettings.estimatedMonthlyIncomeGoal);
  const [currency, setCurrency] = useState<string>(taxSettings.currency || 'USD');
  const [language, setLanguage] = useState<LanguageType>(currentLang);
  const [username, setUsername] = useState<string>(taxSettings.username || '');
  const [saved, setSaved] = useState<boolean>(false);

  // Presupuestos y Alertas
  const [budgetEnabled, setBudgetEnabled] = useState<boolean>(taxSettings.budgetSettings?.enabled ?? true);
  const [totalMonthlyLimit, setTotalMonthlyLimit] = useState<number>(taxSettings.budgetSettings?.totalMonthlyLimit ?? 1200);
  const [categoryLimits, setCategoryLimits] = useState<Record<string, number>>(
    taxSettings.budgetSettings?.categoryLimits || defaultCategoryLimits
  );

  // Meta de Ahorro
  const [savingsEnabled, setSavingsEnabled] = useState<boolean>(taxSettings.savingsGoal?.enabled ?? true);
  const [savingsName, setSavingsName] = useState<string>(taxSettings.savingsGoal?.name || 'Fondo de Emergencia');
  const [savingsTargetAmount, setSavingsTargetAmount] = useState<number | string>(taxSettings.savingsGoal?.targetAmount ?? 5000);
  const [savingsTargetDate, setSavingsTargetDate] = useState<string>(taxSettings.savingsGoal?.targetDate || '2026-12-31');
  const [savingsPeriod, setSavingsPeriod] = useState<'MONTH' | 'YEAR'>(taxSettings.savingsGoal?.calculationPeriod || 'MONTH');
  const [savingsError, setSavingsError] = useState<string | null>(null);

  // Categorías Personalizadas
  const [expenseCategories, setExpenseCategories] = useState<string[]>(
    taxSettings.categories?.expense || DEFAULT_EXPENSE_CATEGORIES
  );
  const [incomeCategories, setIncomeCategories] = useState<string[]>(
    taxSettings.categories?.income || DEFAULT_INCOME_CATEGORIES
  );

  // Estados UI para Gestión de Categorías
  const [showAddCatModal, setShowAddCatModal] = useState<boolean>(false);
  const [newCatName, setNewCatName] = useState<string>('');
  const [newCatType, setNewCatType] = useState<'EXPENSE' | 'INCOME'>('EXPENSE');

  const [editingCat, setEditingCat] = useState<{ oldName: string; type: 'EXPENSE' | 'INCOME' } | null>(null);
  const [editCatName, setEditCatName] = useState<string>('');

  const [deletingCat, setDeletingCat] = useState<{ name: string; type: 'EXPENSE' | 'INCOME'; usageCount: number } | null>(null);
  const [activeMenuCat, setActiveMenuCat] = useState<{ name: string; type: 'EXPENSE' | 'INCOME' } | null>(null);
  const [legalModalType, setLegalModalType] = useState<'TERMS' | 'PRIVACY' | null>(null);

  const handleVatChange = (val: number) => {
    if (isNaN(val)) {
      setVatRate(0);
      return;
    }
    let limited = val;
    if (limited < 0) limited = 0;
    if (limited > 30) limited = 30;
    setVatRate(limited);
  };

  const handleIncomeTaxChange = (val: number) => {
    if (isNaN(val)) {
      setIncomeTaxRate(0);
      return;
    }
    let limited = val;
    if (limited < 0) limited = 0;
    if (limited > 50) limited = 50;
    setIncomeTaxRate(limited);
  };

  const handleSwitchPlan = (newPlan: PlanType) => {
    setPlan(newPlan);
    const planNames: Record<PlanType, string> = {
      LITE: '🌱 Lite',
      STANDARD: '⚖️ Estándar',
      PRO: '⭐ Pro',
    };
    setPlanToast(`Has cambiado al plan ${planNames[newPlan]}`);
    setTimeout(() => setPlanToast(null), 3000);
  };

  // Sync internal state when settings prop changes (e.g. reset data)
  useEffect(() => {
    if (isOpen) {
      setRegime(taxSettings.regime);
      setVatRate(taxSettings.vatRate);
      setIncomeTaxRate(taxSettings.incomeTaxRate);
      setGoal(taxSettings.estimatedMonthlyIncomeGoal);
      setCurrency(taxSettings.currency || 'USD');
      setLanguage(taxSettings.language || 'es');
      setUsername(taxSettings.username || '');
      setBudgetEnabled(taxSettings.budgetSettings?.enabled ?? true);
      setTotalMonthlyLimit(taxSettings.budgetSettings?.totalMonthlyLimit ?? 1200);
      setCategoryLimits(taxSettings.budgetSettings?.categoryLimits || defaultCategoryLimits);
      setSavingsEnabled(taxSettings.savingsGoal?.enabled ?? true);
      setSavingsName(taxSettings.savingsGoal?.name || 'Fondo de Emergencia');
      setSavingsTargetAmount(taxSettings.savingsGoal?.targetAmount ?? 5000);
      setSavingsTargetDate(taxSettings.savingsGoal?.targetDate || '2026-12-31');
      setSavingsPeriod(taxSettings.savingsGoal?.calculationPeriod || 'MONTH');
      setSavingsError(null);
      setExpenseCategories(taxSettings.categories?.expense || DEFAULT_EXPENSE_CATEGORIES);
      setIncomeCategories(taxSettings.categories?.income || DEFAULT_INCOME_CATEGORIES);
    }
  }, [isOpen, taxSettings]);

  if (!isOpen) return null;

  const handleSavingsAmountChange = (val: string) => {
    setSavingsTargetAmount(val);
    const num = Number(val);
    if (isNaN(num) || num <= 0) {
      setSavingsError('Por favor, ingresa un número mayor a 0');
    } else if (num > 999999999) {
      setSavingsError('Por favor, ingresa un monto menor a 999,999,999');
    } else {
      setSavingsError(null);
    }
  };

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newCatName.trim();
    if (!trimmed) return;

    if (newCatType === 'EXPENSE') {
      if (!expenseCategories.includes(trimmed)) {
        setExpenseCategories((prev) => [...prev, trimmed]);
        setCategoryLimits((prev) => ({ ...prev, [trimmed]: 0 }));
      }
    } else {
      if (!incomeCategories.includes(trimmed)) {
        setIncomeCategories((prev) => [...prev, trimmed]);
      }
    }

    setNewCatName('');
    setShowAddCatModal(false);
  };

  const handleStartEditCat = (name: string, type: 'EXPENSE' | 'INCOME') => {
    setEditingCat({ oldName: name, type });
    setEditCatName(name);
  };

  const handleSaveEditCat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCat) return;
    const trimmed = editCatName.trim();
    if (!trimmed || trimmed === editingCat.oldName) {
      setEditingCat(null);
      return;
    }

    if (editingCat.type === 'EXPENSE') {
      setExpenseCategories((prev) => prev.map((c) => (c === editingCat.oldName ? trimmed : c)));
      setCategoryLimits((prev) => {
        const copy = { ...prev };
        const oldLimit = copy[editingCat.oldName] || 0;
        delete copy[editingCat.oldName];
        copy[trimmed] = oldLimit;
        return copy;
      });
    } else {
      setIncomeCategories((prev) => prev.map((c) => (c === editingCat.oldName ? trimmed : c)));
    }

    if (onReassignCategory) {
      onReassignCategory(editingCat.oldName, trimmed);
    }

    setEditingCat(null);
  };

  const handleStartDeleteCat = (name: string, type: 'EXPENSE' | 'INCOME') => {
    const usageCount = transactions.filter((t) => t.category === name).length;
    setDeletingCat({ name, type, usageCount });
  };

  const handleConfirmDeleteCat = () => {
    if (!deletingCat) return;

    const fallbackCat = deletingCat.type === 'EXPENSE' ? 'Otros Gastos' : 'Otros Ingresos';

    if (deletingCat.type === 'EXPENSE') {
      setExpenseCategories((prev) => prev.filter((c) => c !== deletingCat.name));
      setCategoryLimits((prev) => {
        const copy = { ...prev };
        delete copy[deletingCat.name];
        return copy;
      });
    } else {
      setIncomeCategories((prev) => prev.filter((c) => c !== deletingCat.name));
    }

    if (onReassignCategory) {
      onReassignCategory(deletingCat.name, fallbackCat);
    }

    setDeletingCat(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (savingsEnabled) {
      const parsedSavings = Number(savingsTargetAmount);
      if (isNaN(parsedSavings) || parsedSavings <= 0) {
        setSavingsError('Por favor, ingresa un número mayor a 0');
        return;
      }
      if (parsedSavings > 999999999) {
        setSavingsError('Por favor, ingresa un monto menor a 999,999,999');
        return;
      }
    }
    setSavingsError(null);

    onSaveTaxSettings({
      regime,
      vatRate: Number(vatRate),
      incomeTaxRate: Number(incomeTaxRate),
      estimatedMonthlyIncomeGoal: Number(goal),
      currency,
      language,
      username,
      plan,
      categories: {
        expense: expenseCategories,
        income: incomeCategories,
      },
      budgetSettings: {
        enabled: budgetEnabled,
        totalMonthlyLimit: Number(totalMonthlyLimit),
        categoryLimits,
      },
      savingsGoal: {
        enabled: savingsEnabled,
        name: savingsName,
        targetAmount: Math.max(1, Number(savingsTargetAmount) || 0),
        targetDate: savingsTargetDate,
        calculationPeriod: savingsPeriod,
      },
    });
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onClose();
    }, 1000);
  };

  // Group features by category
  const featureCategories = Array.from(new Set(COMPARISON_FEATURES.map((f) => f.category)));

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div
        className={`bg-[#0B1512] rounded-2xl w-full p-5 sm:p-6 shadow-2xl border border-[#182F2A] relative animate-in fade-in zoom-in-95 duration-200 my-auto max-h-[92vh] overflow-y-auto transition-all ${
          activeTab === 'plans' ? 'max-w-4xl' : 'max-w-xl'
        }`}
      >
        {/* Header with Title & Close Button */}
        <div className="flex items-start justify-between border-b border-[#182F2A] pb-4 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-white text-lg">
                {activeTab === 'general' ? t.settings : 'Planes y Precios'}
              </h3>
              {activeTab === 'plans' && (
                <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-[#14B8A6]/10 text-[#14B8A6] border border-[#14B8A6]/30">
                  Tabla Comparativa
                </span>
              )}
            </div>
            <p className="text-xs text-[#7C9791] mt-0.5">
              {activeTab === 'general'
                ? t.settingsDesc
                : 'Compara las funciones de cada modalidad y elige la ideal para tu flujo contable.'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-[#7C9791] hover:text-[#14B8A6] p-1.5 rounded-xl hover:bg-[#11241F] transition shrink-0 cursor-pointer"
            title="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 p-1 bg-[#081512] rounded-xl border border-[#182F2A] mb-5">
          <button
            type="button"
            onClick={() => setActiveTab('general')}
            className={`flex-1 py-2 px-3 text-xs font-semibold rounded-lg transition flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'general'
                ? 'bg-[#11241F] text-[#14B8A6] border border-[#1C3A31] shadow-xs'
                : 'text-[#7C9791] hover:text-white'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Configuración General</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('plans')}
            className={`flex-1 py-2 px-3 text-xs font-bold rounded-lg transition flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'plans'
                ? 'bg-[#14B8A6] text-[#020504] shadow-[0_0_12px_rgba(20, 184, 166, 0.175)]'
                : 'text-[#7C9791] hover:text-[#14B8A6]'
            }`}
          >
            <Crown className="w-3.5 h-3.5" />
            <span>Planes y Precios</span>
            <span
              className={`px-1.5 py-0.2 text-[9px] rounded font-mono font-bold ${
                activeTab === 'plans' ? 'bg-[#020504] text-[#14B8A6]' : 'bg-[#182F2A] text-[#7C9791]'
              }`}
            >
              {plan === 'LITE' ? 'LITE' : plan === 'STANDARD' ? 'ESTÁNDAR' : 'PRO'}
            </span>
          </button>
        </div>

        {/* Toast notification when switching plan */}
        {planToast && (
          <div className="mb-4 p-3 bg-[#14B8A6]/15 border border-[#14B8A6]/40 rounded-xl flex items-center gap-2 text-xs text-[#14B8A6] font-semibold animate-in fade-in slide-in-from-top-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-[#14B8A6]" />
            <span>{planToast}</span>
          </div>
        )}

        {/* TAB 1: CONFIGURACIÓN GENERAL */}
        {activeTab === 'general' && (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Cuenta y Sesión de Usuario */}
            <div className="p-3.5 bg-[#081512] rounded-xl border border-[#182F2A] flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="p-2 bg-[#11241F] rounded-lg border border-[#14B8A6]/30 text-[#14B8A6] shrink-0">
                  <UserIcon className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-white truncate">
                      {user?.displayName || taxSettings.username || 'Usuario Fintack'}
                    </span>
                    <span className="w-1.5 h-1.5 rounded-full bg-[#14B8A6] shadow-[0_0_6px_#14B8A6] shrink-0" />
                  </div>
                  <p className="text-[10px] text-[#7C9791] truncate">
                    {user?.email || 'Cuenta conectada con Firebase'}
                  </p>
                </div>
              </div>
              {onSignOut && (
                <button
                  type="button"
                  id="btn-settings-signout"
                  onClick={() => {
                    if (window.confirm('¿Seguro que deseas cerrar sesión?')) {
                      onClose();
                      onSignOut();
                    }
                  }}
                  className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 hover:text-rose-200 border border-rose-500/30 text-xs font-semibold rounded-lg transition flex items-center gap-1.5 shrink-0 cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5 text-rose-400" />
                  <span>Cerrar Sesión</span>
                </button>
              )}
            </div>

            {/* Estado de Base de Datos en la Nube */}
            <div className="p-3.5 bg-[#081512] rounded-xl border border-[#182F2A] flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-[#11241F] rounded-lg border border-[#14B8A6]/30 text-[#14B8A6]">
                  <Cloud className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-white">Base de Datos en la Nube</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-[#14B8A6] shadow-[0_0_6px_#14B8A6]" />
                  </div>
                  <p className="text-[10px] text-[#7C9791]">
                    Firebase Firestore &bull; Sincronización en tiempo real
                  </p>
                </div>
              </div>
              {onOpenCloudModal && (
                <button
                  type="button"
                  onClick={onOpenCloudModal}
                  className="px-2.5 py-1.5 bg-[#11241F] hover:bg-[#182F2A] text-[#14B8A6] border border-[#1C3A31] hover:border-[#14B8A6]/40 text-xs font-semibold rounded-lg transition cursor-pointer"
                >
                  Gestionar Cuenta
                </button>
              )}
            </div>

            {/* Plan Actual (Modalidad del Sistema) */}
            <div className="p-3.5 bg-[#11241F]/30 text-white rounded-xl border border-[#1C3A31] space-y-2.5">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="flex items-center gap-1.5 text-white">
                  <Crown className="w-3.5 h-3.5 text-[#14B8A6]" />
                  <span>Plan Actual</span>
                </span>
                <button
                  type="button"
                  onClick={() => setActiveTab('plans')}
                  className="text-[11px] text-[#14B8A6] hover:underline font-bold flex items-center gap-1 cursor-pointer"
                >
                  <span>Ver comparativa completa</span>
                  <span>→</span>
                </button>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => handleSwitchPlan('LITE')}
                  className={`py-2 text-xs font-semibold rounded-xl border transition cursor-pointer ${
                    plan === 'LITE'
                      ? 'bg-[#1C3A31] text-[#14B8A6] border-[#14B8A6]/50 shadow-xs font-bold'
                      : 'bg-[#081512] text-[#7C9791] border-[#182F2A] hover:text-white hover:border-[#1C3A31]'
                  }`}
                >
                  🌱 Lite
                </button>
                <button
                  type="button"
                  onClick={() => handleSwitchPlan('STANDARD')}
                  className={`py-2 text-xs font-semibold rounded-xl border transition cursor-pointer ${
                    plan === 'STANDARD'
                      ? 'bg-[#1C3A31] text-[#14B8A6] border-[#14B8A6]/50 shadow-xs font-bold'
                      : 'bg-[#081512] text-[#7C9791] border-[#182F2A] hover:text-white hover:border-[#1C3A31]'
                  }`}
                >
                  ⚖️ Estándar
                </button>
                <button
                  type="button"
                  onClick={() => handleSwitchPlan('PRO')}
                  className={`flex items-center justify-center gap-1 py-2 text-xs font-bold rounded-xl border transition cursor-pointer ${
                    plan === 'PRO'
                      ? 'bg-[#14B8A6] text-[#020504] border-[#14B8A6] shadow-[0_0_10px_rgba(20, 184, 166, 0.175)]'
                      : 'bg-[#081512] text-[#7C9791] border-[#182F2A] hover:text-white hover:border-[#1C3A31]'
                  }`}
                >
                  <Crown className={`w-3 h-3 ${plan === 'PRO' ? 'text-[#020504]' : 'text-amber-400'}`} />
                  <span>⭐ Pro</span>
                </button>
              </div>

              <p className="text-[10px] text-[#7C9791] leading-tight">
                {plan === 'LITE' && '🌱 Modo Esencial: Muestra las 4 tarjetas clave de ingresos/gastos sin distracciones.'}
                {plan === 'STANDARD' && '⚖️ Modo Intermedio: Incluye gráficos, presupuestos, alertas y filtros avanzados.'}
                {plan === 'PRO' && '⭐ Modo Avanzado: Todas las herramientas activas, escaneo en lote, corrección y exportación contable.'}
              </p>
            </div>

            {/* Nombre de Usuario / Perfil */}
            <div>
              <label className="block text-xs font-semibold text-white mb-1">
                {currentLang === 'en' ? 'User Name / Profile' : currentLang === 'pt' ? 'Nome de Usuário / Perfil' : 'Nombre de Usuario / Perfil'}
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder={currentLang === 'en' ? 'e.g. John Doe' : 'ej. Tu Nombre o Empresa'}
                className="w-full px-3 py-2 bg-[#081512] border border-[#182F2A] rounded-xl text-xs font-semibold text-white focus:outline-none focus:ring-1 focus:ring-[#14B8A6]"
              />
            </div>

            {/* Language and Currency Config */}
            <div className="grid grid-cols-2 gap-3">
              {/* Language Selector */}
              <div>
                <label className="flex items-center gap-1 text-xs font-semibold text-white mb-1">
                  <Globe className="w-3.5 h-3.5 text-[#7C9791]" />
                  <span>{t.languageSelector}</span>
                </label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value as LanguageType)}
                  className="w-full px-3 py-2 bg-[#081512] border border-[#182F2A] rounded-xl text-xs font-semibold text-white focus:outline-none focus:ring-1 focus:ring-[#14B8A6]"
                >
                  <option value="es" className="bg-[#0B1512]">Español</option>
                  <option value="en" className="bg-[#0B1512]">English</option>
                  <option value="pt" className="bg-[#0B1512]">Português</option>
                </select>
              </div>

              {/* Currency Selector */}
              <div>
                <label className="flex items-center gap-1 text-xs font-semibold text-white mb-1">
                  <Coins className="w-3.5 h-3.5 text-[#7C9791]" />
                  <span>{t.currencySelector}</span>
                </label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full px-3 py-2 bg-[#081512] border border-[#182F2A] rounded-xl text-xs font-semibold text-white focus:outline-none focus:ring-1 focus:ring-[#14B8A6]"
                >
                  {CURRENCY_OPTIONS.map((opt) => (
                    <option key={opt.code} value={opt.code} className="bg-[#0B1512]">
                      {opt.code} ({opt.symbol})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Regime */}
            <div>
              <label className="block text-xs font-semibold text-white mb-1">
                {t.regime}
              </label>
              <select
                value={regime}
                onChange={(e) => setRegime(e.target.value)}
                className="w-full px-3 py-2 bg-[#081512] border border-[#182F2A] rounded-xl text-xs font-semibold text-white focus:outline-none focus:ring-1 focus:ring-[#14B8A6]"
              >
                <option value="RESICO / Régimen Simplificado (México - 2.0% ISR)" className="bg-[#0B1512]">
                  RESICO / Régimen Simplificado (México)
                </option>
                <option value="Persona Física Actividad Empresarial (México)" className="bg-[#0B1512]">
                  Persona Física / Servicios Prof. (México)
                </option>
                <option value="Autónomos IRPF + IVA (España)" className="bg-[#0B1512]">
                  Régimen de Autónomos (España)
                </option>
                <option value="Régimen Simple de Tributación (Colombia)" className="bg-[#0B1512]">
                  Régimen Simple (Colombia)
                </option>
                <option value="Monotributo / Responsable Inscripto (Argentina)" className="bg-[#0B1512]">
                  Monotributo / Resp. Inscripto (Argentina)
                </option>
                <option value="General Freelance / Persona Física" className="bg-[#0B1512]">
                  General Freelance Internacional
                </option>
              </select>
            </div>

            {/* Rates */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-white mb-1">
                  {t.vatRate}
                </label>
                <input
                  type="number"
                  step="any"
                  min="0"
                  max="100"
                  value={vatRate}
                  onChange={(e) => handleVatChange(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-[#081512] border border-[#182F2A] rounded-xl text-xs font-mono font-bold text-white focus:outline-none focus:ring-1 focus:ring-[#14B8A6]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-white mb-1">
                  {t.incomeTaxRate}
                </label>
                <input
                  type="number"
                  step="any"
                  min="0"
                  max="100"
                  value={incomeTaxRate}
                  onChange={(e) => handleIncomeTaxChange(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-[#081512] border border-[#182F2A] rounded-xl text-xs font-mono font-bold text-white focus:outline-none focus:ring-1 focus:ring-[#14B8A6]"
                />
              </div>
            </div>

            {/* Goal */}
            <div>
              <label className="block text-xs font-semibold text-white mb-1">
                {t.monetaryGoalUnit}
              </label>
              <input
                type="number"
                step="any"
                min="0"
                value={goal}
                onChange={(e) => setGoal(Number(e.target.value))}
                className="w-full px-3 py-2 bg-[#081512] border border-[#182F2A] rounded-xl text-xs font-mono font-bold text-white focus:outline-none focus:ring-1 focus:ring-[#14B8A6]"
              />
            </div>

            {/* Sección Meta de Ahorro */}
            <div className="p-4 bg-[#081512] rounded-2xl border border-[#182F2A] space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-[#11241F] rounded-lg border border-[#1C3A31] text-[#14B8A6]">
                    <Target className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">Meta de Ahorro</h4>
                    <p className="text-[10px] text-[#7C9791]">Configura tu objetivo financiero</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSavingsEnabled(!savingsEnabled)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    savingsEnabled ? 'bg-[#14B8A6]' : 'bg-[#182F2A]'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-[#020504] shadow-lg ring-0 transition duration-200 ease-in-out ${
                      savingsEnabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {savingsEnabled && (
                <div className="space-y-3 pt-3 border-t border-[#182F2A]">
                  <div>
                    <label className="block text-xs font-semibold text-white mb-1">
                      Nombre de la Meta (Opcional)
                    </label>
                    <input
                      type="text"
                      value={savingsName}
                      onChange={(e) => setSavingsName(e.target.value)}
                      placeholder="ej. Fondo de emergencia o Vacaciones"
                      className="w-full px-3 py-2 bg-[#0B1512] border border-[#182F2A] rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-[#14B8A6]"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-white mb-1">
                        Monto Objetivo ({currency})
                      </label>
                      <input
                        type="number"
                        step="any"
                        min="0.01"
                        max="999999999"
                        value={savingsTargetAmount}
                        onChange={(e) => handleSavingsAmountChange(e.target.value)}
                        placeholder="ej. 1900"
                        className={`w-full px-3 py-2 bg-[#0B1512] border ${
                          savingsError ? 'border-rose-500 ring-1 ring-rose-500/30' : 'border-[#182F2A]'
                        } rounded-xl text-xs font-mono font-bold text-[#14B8A6] focus:outline-none focus:ring-1 focus:ring-[#14B8A6]`}
                      />
                      {savingsError && (
                        <p className="text-[11px] text-rose-400 font-medium mt-1 flex items-center gap-1">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                          <span>{savingsError}</span>
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-white mb-1">
                        Fecha Límite
                      </label>
                      <input
                        type="date"
                        value={savingsTargetDate}
                        onChange={(e) => setSavingsTargetDate(e.target.value)}
                        className="w-full px-3 py-2 bg-[#0B1512] border border-[#182F2A] rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-[#14B8A6]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-white mb-1">
                      Calcular Ahorro por
                    </label>
                    <select
                      value={savingsPeriod}
                      onChange={(e) => setSavingsPeriod(e.target.value as 'MONTH' | 'YEAR')}
                      className="w-full px-3 py-2 bg-[#0B1512] border border-[#182F2A] rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-[#14B8A6]"
                    >
                      <option value="MONTH" className="bg-[#0B1512]">Mes Actual (Ingresos - Gastos del Mes)</option>
                      <option value="YEAR" className="bg-[#0B1512]">Año Actual (Ingresos - Gastos del Año)</option>
                    </select>
                  </div>
                </div>
              )}
            </div>

            {/* Sección Mis Categorías */}
            <div className="p-4 bg-[#081512] rounded-2xl border border-[#182F2A] space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-[#11241F] rounded-lg border border-[#1C3A31] text-[#14B8A6]">
                    <FolderPlus className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">Mis Categorías</h4>
                    <p className="text-[10px] text-[#7C9791]">Crea, edita o elimina tus propias categorías</p>
                  </div>
                </div>
              </div>

              {/* Categorías de Gastos */}
              <div className="space-y-2 pt-2 border-t border-[#182F2A]">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-rose-400 flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5" /> Categorías de Gastos ({expenseCategories.length})
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setNewCatType('EXPENSE');
                      setNewCatName('');
                      setShowAddCatModal(true);
                    }}
                    className="px-2.5 py-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 font-semibold text-[11px] rounded-lg border border-rose-500/20 transition flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Agregar</span>
                  </button>
                </div>

                <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                  {expenseCategories.map((cat) => {
                    const isMenuOpen = activeMenuCat?.name === cat && activeMenuCat?.type === 'EXPENSE';
                    return (
                      <div key={cat} className="relative flex items-center justify-between px-3 py-1.5 bg-[#0B1512] rounded-xl border border-[#182F2A] hover:border-[#22443C] transition">
                        <span className="text-xs font-medium text-[#E5E7EB] w-[80%] pr-2 break-words leading-tight">{cat}</span>
                        <div className="relative shrink-0">
                          <button
                            type="button"
                            onClick={() => setActiveMenuCat(isMenuOpen ? null : { name: cat, type: 'EXPENSE' })}
                            className="p-1 text-[#7C9791] hover:text-white rounded-lg hover:bg-[#11241F] transition cursor-pointer"
                            title="Opciones"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>

                          {isMenuOpen && (
                            <>
                              <div className="fixed inset-0 z-10" onClick={() => setActiveMenuCat(null)} />
                              <div className="absolute right-0 top-7 z-20 w-32 bg-[#0B1512] border border-[#182F2A] rounded-xl shadow-xl py-1 overflow-hidden animate-in fade-in zoom-in-95">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveMenuCat(null);
                                    handleStartEditCat(cat, 'EXPENSE');
                                  }}
                                  className="w-full px-3 py-1.5 text-left text-xs font-semibold text-[#14B8A6] hover:bg-[#11241F] transition flex items-center gap-2 cursor-pointer"
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                  <span>Editar</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveMenuCat(null);
                                    handleStartDeleteCat(cat, 'EXPENSE');
                                  }}
                                  className="w-full px-3 py-1.5 text-left text-xs font-semibold text-rose-400 hover:bg-rose-500/10 transition flex items-center gap-2 cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  <span>Eliminar</span>
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Categorías de Ingresos */}
              <div className="space-y-2 pt-3 border-t border-[#182F2A]">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#14B8A6] flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5" /> Categorías de Ingresos ({incomeCategories.length})
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setNewCatType('INCOME');
                      setNewCatName('');
                      setShowAddCatModal(true);
                    }}
                    className="px-2.5 py-1 bg-[#11241F] hover:bg-[#163029] text-[#14B8A6] font-semibold text-[11px] rounded-lg border border-[#1C3A31] transition flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Agregar</span>
                  </button>
                </div>

                <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                  {incomeCategories.map((cat) => {
                    const isMenuOpen = activeMenuCat?.name === cat && activeMenuCat?.type === 'INCOME';
                    return (
                      <div key={cat} className="relative flex items-center justify-between px-3 py-1.5 bg-[#0B1512] rounded-xl border border-[#182F2A] hover:border-[#22443C] transition">
                        <span className="text-xs font-medium text-[#E5E7EB] w-[80%] pr-2 break-words leading-tight">{cat}</span>
                        <div className="relative shrink-0">
                          <button
                            type="button"
                            onClick={() => setActiveMenuCat(isMenuOpen ? null : { name: cat, type: 'INCOME' })}
                            className="p-1 text-[#7C9791] hover:text-white rounded-lg hover:bg-[#11241F] transition cursor-pointer"
                            title="Opciones"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>

                          {isMenuOpen && (
                            <>
                              <div className="fixed inset-0 z-10" onClick={() => setActiveMenuCat(null)} />
                              <div className="absolute right-0 top-7 z-20 w-32 bg-[#0B1512] border border-[#182F2A] rounded-xl shadow-xl py-1 overflow-hidden animate-in fade-in zoom-in-95">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveMenuCat(null);
                                    handleStartEditCat(cat, 'INCOME');
                                  }}
                                  className="w-full px-3 py-1.5 text-left text-xs font-semibold text-[#14B8A6] hover:bg-[#11241F] transition flex items-center gap-2 cursor-pointer"
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                  <span>Editar</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveMenuCat(null);
                                    handleStartDeleteCat(cat, 'INCOME');
                                  }}
                                  className="w-full px-3 py-1.5 text-left text-xs font-semibold text-rose-400 hover:bg-rose-500/10 transition flex items-center gap-2 cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  <span>Eliminar</span>
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Sección Presupuestos Mensuales */}
            <div className="p-4 bg-[#081512] rounded-2xl border border-[#182F2A] space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-[#11241F] rounded-lg border border-[#1C3A31] text-[#14B8A6]">
                    <Bell className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">Presupuestos Mensuales</h4>
                    <p className="text-[10px] text-[#7C9791]">Asigna un presupuesto por categoría (0 = Sin límite)</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setBudgetEnabled(!budgetEnabled)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    budgetEnabled ? 'bg-[#14B8A6]' : 'bg-[#182F2A]'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-[#020504] shadow-lg ring-0 transition duration-200 ease-in-out ${
                      budgetEnabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {budgetEnabled && (
                <div className="space-y-3 pt-3 border-t border-[#182F2A]">
                  <div>
                    <label className="block text-xs font-semibold text-white mb-1">
                      Límite de Gasto Mensual TOTAL ({currency})
                    </label>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      value={totalMonthlyLimit}
                      onChange={(e) => setTotalMonthlyLimit(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-[#0B1512] border border-[#182F2A] rounded-xl text-xs font-mono font-bold text-[#14B8A6] focus:outline-none focus:ring-1 focus:ring-[#14B8A6]"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold text-[#7C9791] mb-2 uppercase tracking-wider">
                      Límites por Categoría de Gasto ({currency})
                    </label>
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                      {expenseCategories.map((catName) => {
                        const currentLimit = categoryLimits[catName] ?? defaultCategoryLimits[catName] ?? 0;
                        const isNoLimit = !currentLimit || currentLimit <= 0;

                        return (
                          <div key={catName} className="flex items-center justify-between gap-2 bg-[#0B1512] p-2.5 rounded-xl border border-[#182F2A]">
                            <div className="flex items-center gap-2 min-w-0 flex-1">
                              <span className="text-xs text-white font-medium truncate">{catName}</span>
                              {isNoLimit && (
                                <span className="text-[10px] text-amber-400/90 font-semibold bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20 shrink-0">
                                  Sin límite
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              <span className="text-[10px] text-[#7C9791] font-mono">$</span>
                              <input
                                type="number"
                                step="any"
                                min="0"
                                placeholder="0"
                                value={currentLimit || ''}
                                onChange={(e) => {
                                  const val = Math.max(0, Number(e.target.value));
                                  setCategoryLimits((prev) => ({
                                    ...prev,
                                    [catName]: val,
                                  }));
                                }}
                                className="w-24 px-2 py-1 bg-[#081512] border border-[#182F2A] rounded-lg text-xs font-mono font-bold text-white text-right focus:outline-none focus:ring-1 focus:ring-[#14B8A6]"
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        handleSubmit(e);
                      }}
                      className="w-full py-2 bg-[#11241F] hover:bg-[#163029] text-[#14B8A6] font-bold text-xs rounded-xl border border-[#1C3A31] transition flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                    >
                      <Save className="w-3.5 h-3.5 text-[#14B8A6]" />
                      <span>Guardar Presupuestos</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Reset Demo Data, Tutorial & SignOut Buttons */}
            <div className={`pt-2 grid ${onSignOut ? 'grid-cols-3' : 'grid-cols-2'} gap-2`}>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onReplayOnboarding?.();
                }}
                className="py-2 bg-[#0B1512] border border-[#182F2A] hover:bg-[#11241F] text-[#14B8A6] hover:text-white font-semibold text-xs rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#14B8A6]" />
                <span>Ver Tutorial</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (confirm(t.resetConfirm)) {
                    onResetData();
                    onClose();
                  }
                }}
                className="py-2 bg-[#0B1512] border border-[#182F2A] hover:bg-[#11241F] text-[#7C9791] hover:text-white font-semibold text-xs rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>{t.resetData}</span>
              </button>

              {onSignOut && (
                <button
                  type="button"
                  id="btn-settings-signout-bottom"
                  onClick={() => {
                    if (window.confirm('¿Seguro que deseas cerrar sesión?')) {
                      onClose();
                      onSignOut();
                    }
                  }}
                  className="py-2 bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/20 text-rose-300 hover:text-rose-200 font-semibold text-xs rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5 text-rose-400" />
                  <span>Cerrar Sesión</span>
                </button>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              className="w-full py-2.5 bg-[#14B8A6] hover:bg-[#0D9488] text-[#020504] font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5 shadow-[0_0_12px_rgba(20, 184, 166, 0.105)] cursor-pointer"
            >
              {saved ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-[#020504]" />
                  <span>{t.saved}</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 text-[#020504]" />
                  <span>{t.saveChanges}</span>
                </>
              )}
            </button>

            {/* Legal & Policies Navigation */}
            <div className="pt-2 border-t border-[#182F2A]/60 flex flex-wrap items-center justify-center gap-4 text-xs text-[#7C9791]">
              <button
                type="button"
                onClick={() => setLegalModalType('TERMS')}
                className="hover:text-[#14B8A6] transition flex items-center gap-1.5 cursor-pointer py-1"
              >
                <Scale className="w-3.5 h-3.5 text-[#14B8A6]" />
                <span className="underline-offset-2 hover:underline">Términos y Condiciones</span>
              </button>
              <span>•</span>
              <button
                type="button"
                onClick={() => setLegalModalType('PRIVACY')}
                className="hover:text-[#14B8A6] transition flex items-center gap-1.5 cursor-pointer py-1"
              >
                <Lock className="w-3.5 h-3.5 text-[#14B8A6]" />
                <span className="underline-offset-2 hover:underline">Política de Privacidad</span>
              </button>
            </div>
          </form>
        )}

        {/* TAB 2: PLANES Y PRECIOS (TABLA COMPARATIVA) */}
        {activeTab === 'plans' && (
          <div className="space-y-6">
            {/* ------------------------------------------------------------- */}
            {/* 1. VISTA MÓVIL (< 768px): TARJETAS APILADAS RESPONSIVAS      */}
            {/* ------------------------------------------------------------- */}
            <div className="block md:hidden space-y-4">
              <div className="flex items-center justify-between pb-1 px-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#7C9791] flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-[#14B8A6]" />
                  Comparativa de Planes
                </span>
                <span className="text-[10px] text-[#7C9791]">
                  Toca &quot;Ver más&quot; para desplegar
                </span>
              </div>

              {[
                {
                  id: 'LITE' as PlanType,
                  emoji: '🌱',
                  name: 'Lite',
                  price: 'Gratis',
                  period: '/ para siempre',
                  description: 'Control esencial para nuevos usuarios y registro básico sin distracciones.',
                  badge: null,
                },
                {
                  id: 'STANDARD' as PlanType,
                  emoji: '⚖️',
                  name: 'Estándar',
                  price: '$9',
                  period: 'USD / mes',
                  description: 'Presupuestos, gráficos, estimación de impuestos y filtros avanzados.',
                  badge: 'Popular',
                },
                {
                  id: 'PRO' as PlanType,
                  emoji: '⭐',
                  name: 'Pro',
                  price: '$19',
                  period: 'USD / mes',
                  description: 'Exportación contable (PDF/Excel), multi-OCR en lote y corrección con IA.',
                  badge: 'Recomendado',
                },
              ].map((pCard) => {
                const isCurrent = plan === pCard.id;
                const isExpanded = expandedMobilePlans[pCard.id];
                const displayedFeatures = isExpanded
                  ? COMPARISON_FEATURES
                  : COMPARISON_FEATURES.slice(0, 5);
                const remainingCount = COMPARISON_FEATURES.length - 5;

                return (
                  <div
                    key={pCard.id}
                    className={`rounded-2xl p-4.5 transition-all flex flex-col justify-between border relative ${
                      isCurrent
                        ? 'bg-[#11241F]/80 border-[#14B8A6] shadow-[0_0_20px_rgba(20,184,166,0.14)] ring-1 ring-[#14B8A6]'
                        : pCard.id === 'PRO'
                        ? 'bg-[#081512] border-[#14B8A6]/40 hover:border-[#14B8A6]/70'
                        : 'bg-[#081512] border-[#182F2A] hover:border-[#1C3A31]'
                    }`}
                  >
                    {/* Badge */}
                    {isCurrent ? (
                      <span className="absolute -top-2.5 right-4 bg-[#14B8A6] text-[#020504] text-[10px] font-bold px-2.5 py-0.5 rounded-full shadow-sm">
                        Tu Plan Actual
                      </span>
                    ) : pCard.id === 'PRO' ? (
                      <span className="absolute -top-2.5 right-4 bg-[#14B8A6] text-[#020504] text-[10px] font-bold px-2.5 py-0.5 rounded-full shadow-sm flex items-center gap-1">
                        <Sparkles className="w-2.5 h-2.5" /> Recomendado
                      </span>
                    ) : pCard.badge ? (
                      <span className="absolute -top-2.5 right-4 bg-emerald-500/20 text-[#14B8A6] border border-[#14B8A6]/30 text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                        {pCard.badge}
                      </span>
                    ) : null}

                    <div>
                      {/* Header */}
                      <div className="flex items-center justify-between gap-2 mb-1.5 pt-0.5">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{pCard.emoji}</span>
                          <h4 className="font-bold text-white text-base flex items-center gap-1.5">
                            {pCard.name}
                            {pCard.id === 'PRO' && <Crown className="w-4 h-4 text-amber-400" />}
                          </h4>
                        </div>
                      </div>

                      <p className="text-[11px] text-[#7C9791] leading-relaxed mb-3">
                        {pCard.description}
                      </p>

                      <div className="mb-3.5 flex items-baseline">
                        <span
                          className={`text-2xl font-extrabold font-mono ${
                            pCard.id === 'PRO' ? 'text-[#14B8A6]' : 'text-white'
                          }`}
                        >
                          {pCard.price}
                        </span>
                        <span className="text-xs text-[#7C9791] ml-1.5">{pCard.period}</span>
                      </div>

                      {/* Lista de Funcionalidades */}
                      <div className="border-t border-b border-[#182F2A] py-3 my-2.5 space-y-2.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-[#14B8A6]">
                            Funcionalidades ({isExpanded ? COMPARISON_FEATURES.length : 5})
                          </span>
                          <span className="text-[10px] text-[#7C9791]">
                            {isExpanded ? 'Detalle completo' : '5 principales'}
                          </span>
                        </div>

                        <ul className="space-y-2 text-xs">
                          {displayedFeatures.map((feat, idx) => {
                            const isIncluded =
                              pCard.id === 'LITE'
                                ? feat.lite
                                : pCard.id === 'STANDARD'
                                ? feat.standard
                                : feat.pro;

                            return (
                              <li
                                key={idx}
                                className={`flex items-start gap-2.5 py-0.5 ${
                                  isIncluded ? 'text-white' : 'text-[#7C9791]/60'
                                }`}
                              >
                                <span className="text-xs select-none shrink-0 mt-0.5">
                                  {isIncluded ? '✅' : '❌'}
                                </span>
                                <div className="leading-tight flex-1">
                                  <span
                                    className={`text-xs ${
                                      isIncluded
                                        ? 'font-medium'
                                        : 'line-through decoration-[#7C9791]/40'
                                    }`}
                                  >
                                    {feat.name}
                                  </span>
                                  {isExpanded && feat.description && isIncluded && (
                                    <p className="text-[10px] text-[#7C9791] mt-0.5">
                                      {feat.description}
                                    </p>
                                  )}
                                </div>
                              </li>
                            );
                          })}
                        </ul>

                        {/* Botón Ver Más / Ver Menos */}
                        <button
                          type="button"
                          onClick={() => toggleMobilePlanExpand(pCard.id)}
                          className="w-full mt-2 pt-2 border-t border-[#182F2A]/60 text-center text-xs font-semibold text-[#14B8A6] hover:text-[#0D9488] transition flex items-center justify-center gap-1 cursor-pointer py-1"
                        >
                          <span>
                            {isExpanded
                              ? 'Ver menos funciones'
                              : `Ver más (${remainingCount} funcionalidades)`}
                          </span>
                          {isExpanded ? (
                            <ChevronUp className="w-3.5 h-3.5" />
                          ) : (
                            <ChevronDown className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Botón de Acción */}
                    <div className="pt-2">
                      {isCurrent ? (
                        <button
                          disabled
                          className="w-full py-2.5 px-4 rounded-xl bg-[#1C3A31] text-[#14B8A6] font-bold text-xs border border-[#14B8A6]/40 flex items-center justify-center gap-1.5 cursor-default shadow-xs"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Plan Activo</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleSwitchPlan(pCard.id)}
                          className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer ${
                            pCard.id === 'PRO'
                              ? 'bg-[#14B8A6] hover:bg-[#0D9488] text-[#020504] shadow-[0_0_15px_rgba(20,184,166,0.2)]'
                              : pCard.id === 'STANDARD'
                              ? 'bg-[#11241F] hover:bg-[#163029] text-[#14B8A6] border border-[#1C3A31] hover:border-[#14B8A6]/40 shadow-xs'
                              : 'bg-[#081512] hover:bg-[#11241F] text-[#E5E7EB] hover:text-white border border-[#182F2A] hover:border-[#1C3A31]'
                          }`}
                        >
                          {pCard.id === 'PRO' && <Crown className="w-3.5 h-3.5" />}
                          <span>
                            {pCard.id === 'PRO'
                              ? 'Actualizar a Pro ($19/mes)'
                              : `Cambiar a ${pCard.name}`}
                          </span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* ------------------------------------------------------------- */}
            {/* 2. VISTA ESCRITORIO / TABLETS (>= 768px): TABLA COMPLETA      */}
            {/* ------------------------------------------------------------- */}
            <div className="hidden md:block space-y-6">
              {/* 3 Top Plan Cards */}
              <div className="grid grid-cols-3 gap-3.5">
                {/* PLAN 1: LITE */}
                <div
                  className={`relative rounded-2xl p-4 transition-all flex flex-col justify-between border ${
                    plan === 'LITE'
                      ? 'bg-[#11241F]/60 border-[#14B8A6] shadow-[0_0_15px_rgba(20, 184, 166, 0.105)] ring-1 ring-[#14B8A6]'
                      : 'bg-[#081512] border-[#182F2A] hover:border-[#1C3A31]'
                  }`}
                >
                  {plan === 'LITE' && (
                    <span className="absolute -top-2.5 right-4 bg-[#14B8A6] text-[#020504] text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                      Tu Plan Actual
                    </span>
                  )}
                  <div>
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-xl">🌱</span>
                      <h4 className="font-bold text-white text-base">Lite</h4>
                    </div>
                    <p className="text-[11px] text-[#7C9791] leading-relaxed mb-3">
                      Control esencial para nuevos usuarios y registro básico sin distracciones.
                    </p>
                    <div className="mb-4">
                      <span className="text-2xl font-extrabold text-white font-mono">Gratis</span>
                      <span className="text-xs text-[#7C9791] ml-1">/ para siempre</span>
                    </div>
                  </div>

                  <div>
                    {plan === 'LITE' ? (
                      <button
                        disabled
                        className="w-full py-2 px-3 rounded-xl bg-[#1C3A31] text-[#14B8A6] font-bold text-xs border border-[#14B8A6]/30 flex items-center justify-center gap-1.5 cursor-default"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Plan Activo</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleSwitchPlan('LITE')}
                        className="w-full py-2 px-3 rounded-xl bg-[#081512] hover:bg-[#11241F] text-[#E5E7EB] hover:text-white font-semibold text-xs border border-[#182F2A] hover:border-[#1C3A31] transition cursor-pointer"
                      >
                        Cambiar a Lite
                      </button>
                    )}
                  </div>
                </div>

                {/* PLAN 2: ESTÁNDAR */}
                <div
                  className={`relative rounded-2xl p-4 transition-all flex flex-col justify-between border ${
                    plan === 'STANDARD'
                      ? 'bg-[#11241F]/60 border-[#14B8A6] shadow-[0_0_15px_rgba(20, 184, 166, 0.105)] ring-1 ring-[#14B8A6]'
                      : 'bg-[#081512] border-[#182F2A] hover:border-[#1C3A31]'
                  }`}
                >
                  {plan === 'STANDARD' ? (
                    <span className="absolute -top-2.5 right-4 bg-[#14B8A6] text-[#020504] text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                      Tu Plan Actual
                    </span>
                  ) : (
                    <span className="absolute -top-2.5 right-4 bg-emerald-500/20 text-[#14B8A6] border border-[#14B8A6]/30 text-[10px] font-bold px-2 py-0.5 rounded-full">
                      Popular
                    </span>
                  )}
                  <div>
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-xl">⚖️</span>
                      <h4 className="font-bold text-white text-base">Estándar</h4>
                    </div>
                    <p className="text-[11px] text-[#7C9791] leading-relaxed mb-3">
                      Presupuestos, gráficos, estimación de impuestos y filtros avanzados.
                    </p>
                    <div className="mb-4">
                      <span className="text-2xl font-extrabold text-white font-mono">$9</span>
                      <span className="text-xs text-[#7C9791] ml-1">USD / mes</span>
                    </div>
                  </div>

                  <div>
                    {plan === 'STANDARD' ? (
                      <button
                        disabled
                        className="w-full py-2 px-3 rounded-xl bg-[#1C3A31] text-[#14B8A6] font-bold text-xs border border-[#14B8A6]/30 flex items-center justify-center gap-1.5 cursor-default"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Plan Activo</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleSwitchPlan('STANDARD')}
                        className="w-full py-2 px-3 rounded-xl bg-[#11241F] hover:bg-[#163029] text-[#14B8A6] font-bold text-xs border border-[#1C3A31] hover:border-[#14B8A6]/40 transition shadow-xs cursor-pointer"
                      >
                        Cambiar a Estándar
                      </button>
                    )}
                  </div>
                </div>

                {/* PLAN 3: PRO */}
                <div
                  className={`relative rounded-2xl p-4 transition-all flex flex-col justify-between border ${
                    plan === 'PRO'
                      ? 'bg-[#11241F]/60 border-[#14B8A6] shadow-[0_0_20px_rgba(20, 184, 166, 0.14)] ring-1 ring-[#14B8A6]'
                      : 'bg-[#081512] border-[#14B8A6]/30 hover:border-[#14B8A6]/60'
                  }`}
                >
                  {plan === 'PRO' ? (
                    <span className="absolute -top-2.5 right-4 bg-[#14B8A6] text-[#020504] text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                      Tu Plan Actual
                    </span>
                  ) : (
                    <span className="absolute -top-2.5 right-4 bg-[#14B8A6] text-[#020504] text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm flex items-center gap-1">
                      <Sparkles className="w-2.5 h-2.5" /> Recomendado
                    </span>
                  )}
                  <div>
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-xl">⭐</span>
                      <h4 className="font-bold text-[#14B8A6] text-base flex items-center gap-1.5">
                        Pro
                        <Crown className="w-4 h-4 text-amber-400" />
                      </h4>
                    </div>
                    <p className="text-[11px] text-[#7C9791] leading-relaxed mb-3">
                      Exportación contable (PDF/Excel), multi-OCR en lote y corrección con IA.
                    </p>
                    <div className="mb-4">
                      <span className="text-2xl font-extrabold text-[#14B8A6] font-mono">$19</span>
                      <span className="text-xs text-[#7C9791] ml-1">USD / mes</span>
                    </div>
                  </div>

                  <div>
                    {plan === 'PRO' ? (
                      <button
                        disabled
                        className="w-full py-2 px-3 rounded-xl bg-[#14B8A6] text-[#020504] font-bold text-xs border border-[#14B8A6] shadow-[0_0_12px_rgba(20, 184, 166, 0.21)] flex items-center justify-center gap-1.5 cursor-default"
                      >
                        <Crown className="w-3.5 h-3.5" />
                        <span>Plan Activo</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleSwitchPlan('PRO')}
                        className="w-full py-2 px-3 rounded-xl bg-[#14B8A6] hover:bg-[#0D9488] text-[#020504] font-extrabold text-xs shadow-[0_0_15px_rgba(20, 184, 166, 0.21)] hover:shadow-[0_0_20px_rgba(20, 184, 166, 0.315)] transition flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Crown className="w-3.5 h-3.5" />
                        <span>Actualizar a Pro</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* TABLA COMPARATIVA DE FUNCIONALIDADES */}
              <div className="bg-[#081512] rounded-2xl border border-[#182F2A] overflow-hidden shadow-lg">
                <div className="p-4 border-b border-[#182F2A] bg-[#0B1512]/80 flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                      <Zap className="w-4 h-4 text-[#14B8A6]" />
                      Tabla Comparativa de Funcionalidades
                    </h4>
                    <p className="text-[11px] text-[#7C9791] mt-0.5">
                      Detalle de todas las herramientas incluidas y bloqueadas por nivel de suscripción
                    </p>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-[#7C9791]">
                    <span className="flex items-center gap-1">
                      <span>✅</span> = Incluida
                    </span>
                    <span className="flex items-center gap-1">
                      <span>❌</span> = No incluida
                    </span>
                  </div>
                </div>

                {/* Table Wrapper */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-[#182F2A] bg-[#0A1310] text-[11px] font-bold text-white uppercase tracking-wider">
                        <th className="py-3 px-4 w-[46%]">Funcionalidad</th>
                        <th
                          className={`py-3 px-3 text-center w-[18%] transition-colors ${
                            plan === 'LITE'
                              ? 'bg-[#11241F] text-[#14B8A6] border-x border-[#14B8A6]/30'
                              : 'text-[#7C9791]'
                          }`}
                        >
                          <div className="flex flex-col items-center">
                            <span>🌱 Lite</span>
                            {plan === 'LITE' && (
                              <span className="text-[9px] font-bold text-[#14B8A6] tracking-normal capitalize">
                                (Actual)
                              </span>
                            )}
                          </div>
                        </th>
                        <th
                          className={`py-3 px-3 text-center w-[18%] transition-colors ${
                            plan === 'STANDARD'
                              ? 'bg-[#11241F] text-[#14B8A6] border-x border-[#14B8A6]/30'
                              : 'text-[#7C9791]'
                          }`}
                        >
                          <div className="flex flex-col items-center">
                            <span>⚖️ Estándar</span>
                            {plan === 'STANDARD' && (
                              <span className="text-[9px] font-bold text-[#14B8A6] tracking-normal capitalize">
                                (Actual)
                              </span>
                            )}
                          </div>
                        </th>
                        <th
                          className={`py-3 px-3 text-center w-[18%] transition-colors ${
                            plan === 'PRO'
                              ? 'bg-[#11241F] text-[#14B8A6] border-x border-[#14B8A6]/30'
                              : 'text-[#14B8A6]'
                          }`}
                        >
                          <div className="flex flex-col items-center">
                            <span className="flex items-center gap-1 justify-center">
                              ⭐ Pro
                              <Crown className="w-3 h-3 text-amber-400" />
                            </span>
                            {plan === 'PRO' && (
                              <span className="text-[9px] font-bold text-[#14B8A6] tracking-normal capitalize">
                                (Actual)
                              </span>
                            )}
                          </div>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#182F2A]/60 text-xs">
                      {featureCategories.map((catName) => {
                        const catFeatures = COMPARISON_FEATURES.filter((f) => f.category === catName);

                        return (
                          <React.Fragment key={catName}>
                            {/* Category Header Row */}
                            <tr className="bg-[#0D1B16]/90 font-bold text-[11px] text-[#14B8A6]">
                              <td colSpan={4} className="py-2 px-4 border-t border-[#182F2A]">
                                <span className="flex items-center gap-1.5">
                                  <span className="w-1.5 h-1.5 rounded-full bg-[#14B8A6]" />
                                  {catName}
                                </span>
                              </td>
                            </tr>

                            {/* Category Feature Rows */}
                            {catFeatures.map((feat, idx) => (
                              <tr
                                key={idx}
                                className="hover:bg-[#0E1F1A]/50 transition-colors"
                              >
                                <td className="py-2.5 px-4">
                                  <div className="font-medium text-white text-xs leading-tight">
                                    {feat.name}
                                  </div>
                                  {feat.description && (
                                    <div className="text-[10px] text-[#7C9791] mt-0.5">
                                      {feat.description}
                                    </div>
                                  )}
                                </td>

                                {/* LITE COLUMN */}
                                <td
                                  className={`py-2.5 px-3 text-center text-sm ${
                                    plan === 'LITE'
                                      ? 'bg-[#11241F]/40 border-x border-[#14B8A6]/20 font-bold'
                                      : ''
                                  }`}
                                >
                                  <span className="text-base select-none">
                                    {feat.lite ? '✅' : '❌'}
                                  </span>
                                </td>

                                {/* STANDARD COLUMN */}
                                <td
                                  className={`py-2.5 px-3 text-center text-sm ${
                                    plan === 'STANDARD'
                                      ? 'bg-[#11241F]/40 border-x border-[#14B8A6]/20 font-bold'
                                      : ''
                                  }`}
                                >
                                  <span className="text-base select-none">
                                    {feat.standard ? '✅' : '❌'}
                                  </span>
                                </td>

                                {/* PRO COLUMN */}
                                <td
                                  className={`py-2.5 px-3 text-center text-sm ${
                                    plan === 'PRO'
                                      ? 'bg-[#11241F]/40 border-x border-[#14B8A6]/20 font-bold'
                                      : ''
                                  }`}
                                >
                                  <span className="text-base select-none">
                                    {feat.pro ? '✅' : '❌'}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </React.Fragment>
                        );
                      })}
                    </tbody>
                    <tfoot>
                      <tr className="border-t border-[#182F2A] bg-[#0A1310]">
                        <td className="py-3.5 px-4 text-xs font-semibold text-[#7C9791]">
                          Selección rápida de plan:
                        </td>
                        <td className={`py-3.5 px-2 text-center ${plan === 'LITE' ? 'bg-[#11241F]/40 border-x border-[#14B8A6]/20' : ''}`}>
                          {plan === 'LITE' ? (
                            <span className="text-[11px] font-bold text-[#14B8A6]">✓ Activo</span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleSwitchPlan('LITE')}
                              className="px-2.5 py-1 text-[11px] font-semibold text-[#7C9791] hover:text-white bg-[#081512] rounded-lg border border-[#182F2A] hover:border-[#1C3A31] transition cursor-pointer"
                            >
                              Seleccionar
                            </button>
                          )}
                        </td>
                        <td className={`py-3.5 px-2 text-center ${plan === 'STANDARD' ? 'bg-[#11241F]/40 border-x border-[#14B8A6]/20' : ''}`}>
                          {plan === 'STANDARD' ? (
                            <span className="text-[11px] font-bold text-[#14B8A6]">✓ Activo</span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleSwitchPlan('STANDARD')}
                              className="px-2.5 py-1 text-[11px] font-bold text-[#14B8A6] bg-[#11241F] rounded-lg border border-[#1C3A31] hover:border-[#14B8A6]/40 transition cursor-pointer"
                            >
                              Seleccionar
                            </button>
                          )}
                        </td>
                        <td className={`py-3.5 px-2 text-center ${plan === 'PRO' ? 'bg-[#11241F]/40 border-x border-[#14B8A6]/20' : ''}`}>
                          {plan === 'PRO' ? (
                            <span className="text-[11px] font-bold text-[#14B8A6] flex items-center justify-center gap-1">
                              <Crown className="w-3 h-3 text-amber-400" />
                              Activo
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleSwitchPlan('PRO')}
                              className="px-3 py-1 text-[11px] font-bold text-[#020504] bg-[#14B8A6] hover:bg-[#0D9488] rounded-lg shadow-xs transition cursor-pointer"
                            >
                              ⭐ Pro
                            </button>
                          )}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </div>

            {/* Bottom Upgrade Banner / Helper */}
            {plan !== 'PRO' && (
              <div className="p-4 rounded-2xl bg-gradient-to-r from-[#11241F] to-[#0A1814] border border-[#14B8A6]/30 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-[0_0_20px_rgba(20, 184, 166, 0.056)]">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-[#14B8A6]/15 rounded-xl border border-[#14B8A6]/30 text-[#14B8A6]">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h5 className="font-bold text-white text-xs">
                      ¿Necesitas exportación contable en Excel y escáner en lote?
                    </h5>
                    <p className="text-[11px] text-[#7C9791]">
                      Actualiza a Pro en un solo clic y desbloquea todas las funcionalidades avanzadas.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleSwitchPlan('PRO')}
                  className="w-full sm:w-auto px-4 py-2 bg-[#14B8A6] hover:bg-[#0D9488] text-[#020504] font-extrabold text-xs rounded-xl shadow-[0_0_12px_rgba(20, 184, 166, 0.21)] transition flex items-center justify-center gap-1.5 shrink-0 cursor-pointer"
                >
                  <Crown className="w-3.5 h-3.5" />
                  <span>Actualizar a Pro ($19/mes)</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Submodal: Agregar Categoría */}
        {showAddCatModal && (
          <div className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-[#0B1512] rounded-2xl max-w-sm w-full p-5 border border-[#182F2A] shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between border-b border-[#182F2A] pb-3">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <Plus className="w-4 h-4 text-[#14B8A6]" />
                  Nueva Categoría
                </h4>
                <button
                  type="button"
                  onClick={() => setShowAddCatModal(false)}
                  className="text-[#7C9791] hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleAddCategory} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-[#7C9791] mb-1">Nombre de la Categoría</label>
                  <input
                    type="text"
                    required
                    autoFocus
                    placeholder="ej. Licencias de Software, Publicidad Meta..."
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                    className="w-full px-3 py-2 bg-[#081512] border border-[#182F2A] rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-[#14B8A6]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#7C9791] mb-1">Tipo de Categoría</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setNewCatType('EXPENSE')}
                      className={`py-2 text-xs font-bold rounded-xl border transition cursor-pointer ${
                        newCatType === 'EXPENSE'
                          ? 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                          : 'bg-[#081512] text-[#7C9791] border-[#182F2A]'
                      }`}
                    >
                      Gasto
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewCatType('INCOME')}
                      className={`py-2 text-xs font-bold rounded-xl border transition cursor-pointer ${
                        newCatType === 'INCOME'
                          ? 'bg-[#11241F] text-[#14B8A6] border-[#1C3A31]'
                          : 'bg-[#081512] text-[#7C9791] border-[#182F2A]'
                      }`}
                    >
                      Ingreso
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddCatModal(false)}
                    className="flex-1 py-2 bg-[#081512] text-[#7C9791] hover:text-white text-xs font-semibold rounded-xl border border-[#182F2A] cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2 bg-[#14B8A6] hover:bg-[#0D9488] text-[#020504] text-xs font-bold rounded-xl shadow-sm cursor-pointer"
                  >
                    Guardar Categoría
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Submodal: Editar Categoría */}
        {editingCat && (
          <div className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-[#0B1512] rounded-2xl max-w-sm w-full p-5 border border-[#182F2A] shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between border-b border-[#182F2A] pb-3">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <Pencil className="w-4 h-4 text-[#14B8A6]" />
                  Editar Categoría
                </h4>
                <button
                  type="button"
                  onClick={() => setEditingCat(null)}
                  className="text-[#7C9791] hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveEditCat} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-[#7C9791] mb-1">Nombre de la Categoría</label>
                  <input
                    type="text"
                    required
                    autoFocus
                    value={editCatName}
                    onChange={(e) => setEditCatName(e.target.value)}
                    className="w-full px-3 py-2 bg-[#081512] border border-[#182F2A] rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-[#14B8A6]"
                  />
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setEditingCat(null)}
                    className="flex-1 py-2 bg-[#081512] text-[#7C9791] hover:text-white text-xs font-semibold rounded-xl border border-[#182F2A] cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2 bg-[#14B8A6] hover:bg-[#0D9488] text-[#020504] text-xs font-bold rounded-xl shadow-sm cursor-pointer"
                  >
                    Guardar Cambios
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Submodal: Eliminar Categoría */}
        {deletingCat && (
          <div className="fixed inset-0 z-[60] bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-[#0B1512] rounded-2xl max-w-sm w-full p-5 border border-rose-500/30 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
              <div className="flex items-center gap-3 text-rose-400">
                <div className="p-2 bg-rose-500/10 rounded-xl border border-rose-500/20">
                  <AlertCircle className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">¿Eliminar categoría?</h4>
                  <p className="text-xs text-rose-400 font-mono font-semibold">"{deletingCat.name}"</p>
                </div>
              </div>

              <div className="bg-[#081512] p-3 rounded-xl border border-[#182F2A] text-xs text-[#E5E7EB] space-y-2">
                {deletingCat.usageCount > 0 ? (
                  <p className="text-amber-300 font-medium">
                    Esta categoría está siendo usada en <strong className="font-bold text-white underline">{deletingCat.usageCount}</strong> transacción(es). ¿Seguro que quieres eliminarla? Las transacciones se moverán a <strong className="text-[#14B8A6]">'{deletingCat.type === 'EXPENSE' ? 'Otros Gastos' : 'Otros Ingresos'}'</strong>.
                  </p>
                ) : (
                  <p className="text-[#7C9791]">
                    ¿Estás seguro de eliminar la categoría <strong className="text-white">"{deletingCat.name}"</strong>? Las transacciones futuras ya no podrán usarla.
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setDeletingCat(null)}
                  className="flex-1 py-2 bg-[#081512] text-[#7C9791] hover:text-white text-xs font-semibold rounded-xl border border-[#182F2A] cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDeleteCat}
                  className="flex-1 py-2 bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold rounded-xl shadow-sm cursor-pointer"
                >
                  Sí, Eliminar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL: TÉRMINOS Y CONDICIONES / POLÍTICA DE PRIVACIDAD */}
        {legalModalType && (
          <div className="fixed inset-0 z-60 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-[#0B1512] border border-[#182F2A] rounded-3xl w-full max-w-xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
              {/* Modal Header */}
              <div className="p-5 border-b border-[#182F2A] flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-[#11241F] text-[#14B8A6] rounded-xl border border-[#1C3A31]">
                    {legalModalType === 'TERMS' ? <Scale className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-base">
                      {legalModalType === 'TERMS' ? 'Términos y Condiciones de Uso' : 'Política de Privacidad'}
                    </h3>
                    <p className="text-[11px] text-[#7C9791]">Fintack Finanzas Freelance • Versión 2026</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setLegalModalType(null)}
                  className="p-1.5 text-[#7C9791] hover:text-white hover:bg-[#11241F] rounded-lg transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Scrollable Body */}
              <div className="p-6 overflow-y-auto space-y-4 text-xs text-[#94A3B8] leading-relaxed">
                {legalModalType === 'TERMS' ? (
                  <>
                    <section className="space-y-1.5">
                      <h4 className="text-sm font-semibold text-white">1. Objeto y Alcance del Software</h4>
                      <p>
                        Fintack es una solución tecnológica desarrollada para asistir a trabajadores independientes, freelancers y consultores en la gestión, registro y visualización de sus ingresos, egresos y estimaciones impositivas referenciales.
                      </p>
                    </section>

                    <section className="space-y-1.5 bg-[#11241F]/40 p-3.5 rounded-2xl border border-[#1C3A31]">
                      <h4 className="text-sm font-semibold text-emerald-300 flex items-center gap-1.5">
                        <AlertCircle className="w-4 h-4 text-[#14B8A6]" />
                        <span>2. Cláusula de No Asesoramiento Contable</span>
                      </h4>
                      <p className="text-emerald-100">
                        <strong>Fintack es una herramienta de apoyo y no sustituye el asesoramiento de un contador profesional.</strong> Las sugerencias y cálculos generados por la plataforma no constituyen dictámenes tributarios oficiales ni auditorías contables.
                      </p>
                    </section>

                    <section className="space-y-1.5">
                      <h4 className="text-sm font-semibold text-white">3. Estimaciones y Legislación Fiscal</h4>
                      <p>
                        <strong>Los cálculos de impuestos son estimados y pueden variar según la legislación de tu país</strong>, así como por deducciones personales, regímenes especiales, retenciones y normativas fiscales locales aplicables a tu actividad económica.
                      </p>
                    </section>

                    <section className="space-y-1.5">
                      <h4 className="text-sm font-semibold text-white">4. Responsabilidad del Usuario</h4>
                      <p>
                        <strong>El usuario es el único responsable de la veracidad y precisión de los datos ingresados</strong>, incluyendo montos, categorías, facturas escaneadas y porcentajes impositivos configurados manualmente en el sistema.
                      </p>
                    </section>

                    <section className="space-y-1.5">
                      <h4 className="text-sm font-semibold text-white">5. Inteligencia Artificial en Comprobantes</h4>
                      <p>
                        El escáner asistido por IA extrae información preliminar de tickets y facturas. El usuario debe inspeccionar y validar siempre que los datos leídos coincidan fielmente con el documento original antes de confirmar el registro contable.
                      </p>
                    </section>
                  </>
                ) : (
                  <>
                    <section className="space-y-1.5">
                      <h4 className="text-sm font-semibold text-white">1. Privacidad y Almacenamiento Local (Local-First)</h4>
                      <p>
                        En Fintack garantizamos la máxima privacidad. Todos tus registros de ingresos, gastos, clientes, configuraciones de presupuestos y metas de ahorro se guardan localmente en tu dispositivo mediante el almacenamiento de tu navegador.
                      </p>
                    </section>

                    <section className="space-y-1.5 bg-[#11241F]/40 p-3.5 rounded-2xl border border-[#1C3A31]">
                      <h4 className="text-sm font-semibold text-emerald-300 flex items-center gap-1.5">
                        <Shield className="w-4 h-4 text-[#14B8A6]" />
                        <span>2. Protección y No Comercialización de Datos</span>
                      </h4>
                      <p className="text-emerald-100">
                        No vendemos, no transferimos ni compartimos tus datos contables o transacciones con terceros ni con redes publicitarias bajo ninguna circunstancia.
                      </p>
                    </section>

                    <section className="space-y-1.5">
                      <h4 className="text-sm font-semibold text-white">3. Procesamiento Seguro de Facturas</h4>
                      <p>
                        Las imágenes subidas al escáner de recibos se analizan mediante conexiones seguras cifradas exclusivamente con el propósito de extraer montos y conceptos, sin retención permanente de archivos en servidores externos.
                      </p>
                    </section>

                    <section className="space-y-1.5">
                      <h4 className="text-sm font-semibold text-white">4. Borrado y Control Total</h4>
                      <p>
                        Tienes control absoluto sobre tus datos. Puedes exportar tu información en PDF/Excel/CSV o borrar todos los registros instantáneamente usando el botón de restablecimiento en la Configuración.
                      </p>
                    </section>
                  </>
                )}
              </div>

              {/* Modal Footer */}
              <div className="p-4 bg-[#081512] border-t border-[#182F2A] flex justify-end">
                <button
                  type="button"
                  onClick={() => setLegalModalType(null)}
                  className="px-5 py-2 bg-[#14B8A6] hover:bg-[#0D9488] text-[#020504] font-bold text-xs rounded-xl transition cursor-pointer"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
