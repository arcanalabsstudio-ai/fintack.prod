import React, { useState, useMemo, useEffect } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LabelList,
  AreaChart,
  Area,
} from 'recharts';
import { Transaction, TaxSettings, PlanType } from '../types';
import { calculateTaxEstimate, getCategoryBreakdown, formatCurrency } from '../utils/taxCalculator';
import { TRANSLATIONS } from '../utils/translations';
import {
  TrendingUp,
  TrendingDown,
  ShieldAlert,
  ArrowUpRight,
  ArrowDownRight,
  Receipt,
  Plus,
  Sparkles,
  ChevronRight,
  CheckCircle2,
  FileCheck,
  Crown,
  Info,
  AlertTriangle,
  Bell,
  PieChart,
  Target,
  BarChart3,
  Sliders,
  Calendar,
  DollarSign,
  Activity,
  Layers,
  Calculator,
  Check,
  X,
  ExternalLink,
  ArrowRight,
  Clock,
  ScanLine,
  FileSpreadsheet,
} from 'lucide-react';

interface DashboardViewProps {
  transactions: Transaction[];
  taxSettings: TaxSettings;
  plan: PlanType;
  onOpenQuickAdd: () => void;
  onNavigateTab: (tab: string) => void;
  onUpgradePlan: () => void;
}

type WindowType = 'budget' | 'scanner' | 'tax' | 'savings' | 'control_center' | 'history' | null;

export const DashboardView: React.FC<DashboardViewProps> = ({
  transactions,
  taxSettings,
  plan,
  onOpenQuickAdd,
  onNavigateTab,
  onUpgradePlan,
}) => {
  const [activeWindow, setActiveWindow] = useState<WindowType>(null);
  const [activeChartType, setActiveChartType] = useState<'line' | 'bar'>('line');
  const [isPromoDismissed, setIsPromoDismissed] = useState<boolean>(() => {
    try {
      const today = new Date().toISOString().slice(0, 10);
      return localStorage.getItem('fintack_lite_promo_dismissed_date') === today;
    } catch {
      return false;
    }
  });

  const handleDismissPromo = () => {
    setIsPromoDismissed(true);
    try {
      const today = new Date().toISOString().slice(0, 10);
      localStorage.setItem('fintack_lite_promo_dismissed_date', today);
    } catch {
      // ignore
    }
  };

  const currentLang = taxSettings.language || 'es';
  const t = TRANSLATIONS[currentLang];
  const currency = taxSettings.currency || 'USD';

  const taxEstimate = calculateTaxEstimate(transactions, taxSettings);
  const expenseCategories = getCategoryBreakdown(transactions, 'EXPENSE');
  const recentTransactions = useMemo(() => {
    return [...transactions]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 8);
  }, [transactions]);

  // Months labels
  const monthNames = useMemo(() => {
    return currentLang === 'en'
      ? ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
      : currentLang === 'pt'
      ? ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
      : ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  }, [currentLang]);

  // Line Chart Data (Ingresos vs Gastos)
  const lineChartData = useMemo(() => {
    const months = [];
    const now = new Date();

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const mLabel = monthNames[d.getMonth()];
      const yearMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

      const monthTxs = transactions.filter((tx) => tx.date && tx.date.startsWith(yearMonth));
      const inc = monthTxs.filter((tx) => tx.type === 'INCOME').reduce((acc, tx) => acc + tx.amount, 0);
      const exp = monthTxs.filter((tx) => tx.type === 'EXPENSE').reduce((acc, tx) => acc + tx.amount, 0);

      months.push({
        month: mLabel,
        Ingresos: inc,
        Gastos: exp,
      });
    }

    const hasAnyData = months.some((m) => m.Ingresos > 0 || m.Gastos > 0);
    if (!hasAnyData) {
      return [
        { month: monthNames[(now.getMonth() - 5 + 12) % 12], Ingresos: 3200, Gastos: 1200 },
        { month: monthNames[(now.getMonth() - 4 + 12) % 12], Ingresos: 4100, Gastos: 1500 },
        { month: monthNames[(now.getMonth() - 3 + 12) % 12], Ingresos: 3800, Gastos: 1100 },
        { month: monthNames[(now.getMonth() - 2 + 12) % 12], Ingresos: 4500, Gastos: 1800 },
        { month: monthNames[(now.getMonth() - 1 + 12) % 12], Ingresos: 4200, Gastos: 1400 },
        { month: monthNames[now.getMonth()], Ingresos: taxEstimate.grossIncome || 5000, Gastos: taxEstimate.totalExpenses || 1600 },
      ];
    }
    return months;
  }, [transactions, monthNames, taxEstimate]);

  // Bar Chart Data (Distribución de Gastos)
  const barChartData = useMemo(() => {
    if (expenseCategories.length > 0) {
      return expenseCategories.map((cat) => ({
        category: cat.category.length > 16 ? cat.category.substring(0, 14) + '..' : cat.category,
        fullCategory: cat.category,
        amount: cat.amount,
      }));
    }
    return [
      { category: 'Software', fullCategory: 'Software & Herramientas', amount: 450 },
      { category: 'Espacio', fullCategory: 'Espacio de Trabajo', amount: 350 },
      { category: 'Equipamiento', fullCategory: 'Equipamiento & Hardware', amount: 280 },
      { category: 'Alimentación', fullCategory: 'Alimentación & Viáticos', amount: 200 },
      { category: 'Otros', fullCategory: 'Otros Gastos Operativos', amount: 150 },
    ];
  }, [expenseCategories]);

  // Tax Evolution Data (Evolución de Impuestos ISR e IVA)
  const taxEvolutionData = useMemo(() => {
    const months = [];
    const now = new Date();
    const vatRate = (taxSettings.vatRate || 16) / 100;
    const isrRate = (taxSettings.incomeTaxRate || 2) / 100;

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const mLabel = monthNames[d.getMonth()];
      const yearMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

      const monthTxs = transactions.filter((tx) => tx.date && tx.date.startsWith(yearMonth));
      const inc = monthTxs.filter((tx) => tx.type === 'INCOME').reduce((acc, tx) => acc + tx.amount, 0);
      const exp = monthTxs.filter((tx) => tx.type === 'EXPENSE').reduce((acc, tx) => acc + tx.amount, 0);
      const deductible = monthTxs
        .filter((tx) => tx.type === 'EXPENSE' && (tx.isDeductible ?? true))
        .reduce((acc, tx) => acc + tx.amount, 0);

      const isr = Math.round(inc * isrRate);
      const collectedVAT = inc * (vatRate / (1 + vatRate));
      const paidVAT = deductible * (vatRate / (1 + vatRate));
      const iva = Math.max(0, Math.round(collectedVAT - paidVAT));
      const totalTax = isr + iva;

      months.push({
        month: mLabel,
        ISR: isr,
        IVA: iva,
        'Total Impuestos': totalTax,
        Ingresos: inc,
      });
    }

    const hasAnyData = months.some((m) => m.ISR > 0 || m.IVA > 0);
    if (!hasAnyData) {
      return [
        { month: monthNames[(now.getMonth() - 5 + 12) % 12], ISR: 64, IVA: 180, 'Total Impuestos': 244, Ingresos: 3200 },
        { month: monthNames[(now.getMonth() - 4 + 12) % 12], ISR: 82, IVA: 240, 'Total Impuestos': 322, Ingresos: 4100 },
        { month: monthNames[(now.getMonth() - 3 + 12) % 12], ISR: 76, IVA: 210, 'Total Impuestos': 286, Ingresos: 3800 },
        { month: monthNames[(now.getMonth() - 2 + 12) % 12], ISR: 90, IVA: 260, 'Total Impuestos': 350, Ingresos: 4500 },
        { month: monthNames[(now.getMonth() - 1 + 12) % 12], ISR: 84, IVA: 235, 'Total Impuestos': 319, Ingresos: 4200 },
        {
          month: monthNames[now.getMonth()],
          ISR: Math.round(taxEstimate.estimatedIncomeTax || 100),
          IVA: Math.round(taxEstimate.estimatedVAT || 280),
          'Total Impuestos': Math.round(taxEstimate.totalEstimatedTax || 380),
          Ingresos: taxEstimate.grossIncome || 5000,
        },
      ];
    }
    return months;
  }, [transactions, monthNames, taxSettings, taxEstimate]);

  const BAR_COLORS = ['#14B8A6', '#10B981', '#34D399', '#059669', '#6EE7B7', '#A7F3D0'];

  // Presupuestos calculations
  const budget = taxSettings.budgetSettings || {
    enabled: true,
    totalMonthlyLimit: 1200,
    categoryLimits: {
      'Software/Suscripciones': 300,
      'Espacio de Trabajo': 500,
      'Equipamiento': 200,
      'Alimentación/Reuniones': 100,
      'Transporte': 80,
    },
  };

  const budgetCalculations = useMemo(() => {
    const now = new Date();
    const currentYM = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    let monthTxs = transactions.filter(
      (tx) => tx.type === 'EXPENSE' && tx.date && tx.date.startsWith(currentYM)
    );

    if (monthTxs.length === 0) {
      const expenseTxs = transactions.filter((tx) => tx.type === 'EXPENSE' && tx.date);
      if (expenseTxs.length > 0) {
        const sortedDates = expenseTxs.map((t) => t.date.substring(0, 7)).sort().reverse();
        const latestYM = sortedDates[0];
        monthTxs = transactions.filter((tx) => tx.type === 'EXPENSE' && tx.date.startsWith(latestYM));
      }
    }

    const totalSpent = monthTxs.reduce((acc, tx) => acc + tx.amount, 0);
    const totalLimit = budget.totalMonthlyLimit || 1200;
    const totalPercentage = Math.round((totalSpent / totalLimit) * 100);

    const catSpentMap: Record<string, number> = {};
    monthTxs.forEach((tx) => {
      const cat = tx.category || 'Otros Gastos';
      catSpentMap[cat] = (catSpentMap[cat] || 0) + tx.amount;
    });

    const categoryBudgets: {
      category: string;
      spent: number;
      limit: number;
      percentage: number;
      status: 'GREEN' | 'YELLOW' | 'RED';
      alertMessage?: string;
    }[] = [];

    const ALL_CATEGORIES = [
      'Software/Suscripciones',
      'Espacio de Trabajo',
      'Equipamiento',
      'Alimentación/Reuniones',
      'Transporte',
      'Honorarios Profesionales',
      'Servicios Públicos',
      'Marketing y Publicidad',
      'Otros Gastos',
    ];

    const allCategoriesSet = new Set([
      ...ALL_CATEGORIES,
      ...Object.keys(budget.categoryLimits || {}),
      ...Object.keys(catSpentMap),
    ]);

    allCategoriesSet.forEach((cat) => {
      const spent = catSpentMap[cat] || 0;
      const limit = budget.categoryLimits?.[cat] ?? 0;
      if (limit > 0) {
        const percentage = Math.round((spent / limit) * 100);
        let status: 'GREEN' | 'YELLOW' | 'RED' = 'GREEN';
        let alertMessage: string | undefined = undefined;

        if (percentage > 100) {
          status = 'RED';
          alertMessage = `¡Alerta! Has superado tu presupuesto de ${cat}`;
        } else if (percentage >= 80) {
          status = 'YELLOW';
          alertMessage = `¡Cuidado! Estás cerca de superar tu presupuesto de ${cat}`;
        }

        categoryBudgets.push({ category: cat, spent, limit, percentage, status, alertMessage });
      }
    });

    categoryBudgets.sort((a, b) => b.percentage - a.percentage);

    const hasRedAlert = totalPercentage >= 100 || categoryBudgets.some((c) => c.status === 'RED');
    const hasYellowAlert = totalPercentage >= 80 || categoryBudgets.some((c) => c.status === 'YELLOW');
    const activeAlerts = categoryBudgets.filter((c) => c.status === 'RED' || c.status === 'YELLOW');

    return {
      totalSpent,
      totalLimit,
      totalPercentage,
      categoryBudgets,
      activeAlerts,
      hasRedAlert,
      hasYellowAlert,
    };
  }, [transactions, budget]);

  // Savings Goal calculations
  const savingsGoal = taxSettings.savingsGoal || {
    enabled: true,
    name: 'Fondo de Emergencia',
    targetAmount: 5000,
    targetDate: '2026-12-31',
    calculationPeriod: 'MONTH' as const,
  };

  const savingsCalculations = useMemo(() => {
    const now = new Date();
    const currentYM = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const currentYear = `${now.getFullYear()}`;

    let relevantTxs = transactions;

    if (savingsGoal.calculationPeriod === 'MONTH') {
      let monthTxs = transactions.filter((tx) => tx.date && tx.date.startsWith(currentYM));
      if (monthTxs.length === 0) {
        const allDates = transactions.filter((tx) => tx.date).map((t) => t.date.substring(0, 7)).sort().reverse();
        if (allDates.length > 0) {
          const latestYM = allDates[0];
          monthTxs = transactions.filter((tx) => tx.date && tx.date.startsWith(latestYM));
        }
      }
      relevantTxs = monthTxs;
    } else {
      let yearTxs = transactions.filter((tx) => tx.date && tx.date.startsWith(currentYear));
      if (yearTxs.length === 0) {
        const allYears = transactions.filter((tx) => tx.date).map((t) => t.date.substring(0, 4)).sort().reverse();
        if (allYears.length > 0) {
          const latestYear = allYears[0];
          yearTxs = transactions.filter((tx) => tx.date && tx.date.startsWith(latestYear));
        }
      }
      relevantTxs = yearTxs;
    }

    const income = relevantTxs.filter((tx) => tx.type === 'INCOME').reduce((acc, tx) => acc + tx.amount, 0);
    const expense = relevantTxs.filter((tx) => tx.type === 'EXPENSE').reduce((acc, tx) => acc + tx.amount, 0);
    const currentSavings = Math.max(0, income - expense);

    const targetAmount = savingsGoal.targetAmount || 1;
    const percentage = Math.min(100, Math.round((currentSavings / targetAmount) * 100));
    const remaining = Math.max(0, targetAmount - currentSavings);
    const isReached = currentSavings >= targetAmount;

    const todayStr = new Date().toISOString().split('T')[0];
    const isExpired = !isReached && Boolean(savingsGoal.targetDate) && todayStr > savingsGoal.targetDate;

    return {
      currentSavings,
      targetAmount,
      percentage,
      remaining,
      isReached,
      isExpired,
    };
  }, [transactions, savingsGoal]);

  const incomeGoal = typeof taxSettings?.estimatedMonthlyIncomeGoal === 'number' && taxSettings.estimatedMonthlyIncomeGoal > 0
    ? taxSettings.estimatedMonthlyIncomeGoal
    : 5000;

  const goalProgress = Math.min(
    100,
    Math.round(((taxEstimate?.grossIncome || 0) / incomeGoal) * 100)
  );

  const getGreeting = () => {
    const hour = new Date().getHours();
    const isEn = currentLang === 'en';
    const isPt = currentLang === 'pt';

    if (hour >= 6 && hour < 12) {
      return isEn ? 'Good morning' : isPt ? 'Bom dia' : 'Buenos días';
    } else if (hour >= 12 && hour < 20) {
      return isEn ? 'Good afternoon' : isPt ? 'Boa tarde' : 'Buenas tardes';
    } else {
      return isEn ? 'Good evening' : isPt ? 'Boa noite' : 'Buenas noches';
    }
  };

  const getWelcomeText = () => {
    const user = taxSettings.username?.trim();
    if (user) return user;
    return 'Freelancer';
  };

  const greeting = getGreeting();
  const name = getWelcomeText();

  return (
    <div className="space-y-6 sm:space-y-7 pb-16 sm:pb-20 px-4 sm:px-0">
      {/* HEADER SECTION */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xs font-semibold tracking-wider text-[#7C9791] uppercase mb-1 flex items-center gap-1.5">
            <span>{t.dashboard}</span>
            <span>•</span>
            <span className="text-[#14B8A6]">{(taxSettings?.regime || 'Régimen Simplificado').split('(')[0].trim()}</span>
          </h2>
          <h1 className="text-2xl sm:text-3xl font-light text-white">
            {greeting}, <span className="font-semibold text-white">{name}</span>.
          </h1>
        </div>
      </header>

      {/* 1. SECCIÓN FIJA - NIVEL LITE (SIEMPRE VISIBLE): LAS 4 TARJETAS PRINCIPALES */}
      <section className="space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#7C9791] flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-[#14B8A6]" />
            Resumen Ejecutivo
          </span>
          <span className="text-[11px] text-[#7C9791] font-mono">
            {transactions.length} registros activos
          </span>
        </div>

        {/* 4 MAIN STATS CARDS */}
        <div id="kpi-summary-cards" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {/* Card 1: Balance Neto */}
          <div className="bg-[#0B1512] p-5 rounded-2xl border border-[#182F2A] flex flex-col justify-between shadow-[0_4px_20px_rgba(0,0,0,0.15)] relative overflow-hidden hover:border-[#1C3A31] transition">
            <div className="absolute top-0 right-0 w-16 h-16 bg-[#14B8A6]/3 rounded-full blur-xl" />
            <p className="text-[10px] sm:text-xs font-semibold text-[#7C9791] uppercase mb-3 tracking-wider flex items-center justify-between">
              <span>{t.netBalance}</span>
              <DollarSign className="w-3.5 h-3.5 text-[#14B8A6]" />
            </p>
            <div>
              <h3 className="text-2xl sm:text-3xl font-semibold text-white">
                {formatCurrency(taxEstimate.grossIncome - taxEstimate.totalExpenses, currency)}
              </h3>
              <p className="text-[10px] sm:text-xs text-[#14B8A6] font-semibold mt-1 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                <span>{t.incomeVsExpenses}</span>
              </p>
            </div>
          </div>

          {/* Card 2: Ingresos Brutos */}
          <div className="bg-[#0B1512] p-5 rounded-2xl border border-[#182F2A] flex flex-col justify-between shadow-[0_4px_20px_rgba(0,0,0,0.15)] relative overflow-hidden hover:border-[#1C3A31] transition">
            <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-500/3 rounded-full blur-xl" />
            <p className="text-[10px] sm:text-xs font-semibold text-[#7C9791] uppercase mb-3 tracking-wider flex items-center justify-between">
              <span>{t.grossIncome}</span>
              <ArrowUpRight className="w-3.5 h-3.5 text-emerald-400" />
            </p>
            <div>
              <h3 className="text-2xl sm:text-3xl font-semibold text-white">
                {formatCurrency(taxEstimate.grossIncome, currency)}
              </h3>
              <div className="w-full bg-[#11241F] h-1.5 rounded-full mt-2 overflow-hidden border border-[#1C3A31]/20">
                <div
                  className="bg-[#14B8A6] h-full rounded-full transition-all duration-500 shadow-[0_0_8px_rgba(20, 184, 166, 0.28)]"
                  style={{ width: `${goalProgress}%` }}
                />
              </div>
              <p className="text-[10px] sm:text-xs text-[#7C9791] mt-1">
                <span className="text-[#14B8A6] font-semibold">{goalProgress}%</span> {t.goalProgress} ({formatCurrency(incomeGoal, currency)})
              </p>
            </div>
          </div>

          {/* Card 3: Gastos Operativos */}
          <div className="bg-[#0B1512] p-5 rounded-2xl border border-[#182F2A] flex flex-col justify-between shadow-[0_4px_20px_rgba(0,0,0,0.15)] relative overflow-hidden hover:border-[#1C3A31] transition">
            <div className="absolute top-0 right-0 w-16 h-16 bg-rose-500/3 rounded-full blur-xl" />
            <p className="text-[10px] sm:text-xs font-semibold text-[#7C9791] uppercase mb-3 tracking-wider flex items-center justify-between">
              <span>{t.operatingExpenses}</span>
              <ArrowDownRight className="w-3.5 h-3.5 text-rose-400" />
            </p>
            <div>
              <h3 className="text-2xl sm:text-3xl font-semibold text-rose-400">
                {formatCurrency(taxEstimate.totalExpenses, currency)}
              </h3>
              <p className="text-[10px] sm:text-xs text-[#14B8A6] mt-1 font-semibold">
                {formatCurrency(taxEstimate.deductibleExpenses, currency)} {t.deductible}
              </p>
            </div>
          </div>

          {/* Card 4: Margen Disponible */}
          <div className="bg-[#0B1512] p-5 rounded-2xl border border-[#182F2A] flex flex-col justify-between shadow-[0_4px_20px_rgba(0,0,0,0.15)] relative overflow-hidden hover:border-[#1C3A31] transition">
            <div className="absolute top-0 right-0 w-16 h-16 bg-teal-500/3 rounded-full blur-xl" />
            <p className="text-[10px] sm:text-xs font-semibold text-[#7C9791] uppercase mb-3 tracking-wider flex items-center justify-between">
              <span>{t.freeMargin}</span>
              <Sparkles className="w-3.5 h-3.5 text-teal-400" />
            </p>
            <div>
              <h3 className="text-2xl sm:text-3xl font-semibold text-white">
                {formatCurrency(taxEstimate.marginAvailable, currency)}
              </h3>
              <p className="text-[10px] sm:text-xs text-[#7C9791] mt-1">
                {t.postExpensesAndTax}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 2. SECCIÓN DE ACCESOS DIRECTOS / MINITARJETAS (WIDGETS INTERACTIVOS) */}
      <section className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-2 pb-0.5">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#7C9791] flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-[#14B8A6]" />
              Tarjetas de Acceso
            </span>
            <span className="text-[10px] font-medium text-[#A1B5AF] bg-[#11241F] px-2 py-0.5 rounded-md border border-[#1C3A31]/60">
              Ventanas de Control
            </span>
          </div>
          <p className="text-[11px] text-[#7C9791]">
            💡 Toca una tarjeta para abrir su panel interactivo
          </p>
        </div>

        {/* GRID DE MINITARJETAS */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
          {/* MINITARJETA 1: PRESUPUESTOS (Oculta en Modo Lite) */}
          {plan !== 'LITE' && (
            <button
              type="button"
              onClick={() => setActiveWindow('budget')}
              className="bg-[#0B1512] hover:bg-[#11241F]/80 p-4 rounded-2xl border border-[#182F2A] hover:border-[#14B8A6]/40 text-left transition group shadow-md flex flex-col justify-between min-h-[130px] relative overflow-hidden cursor-pointer"
            >
              <div className="flex items-start justify-between">
                <div
                  className={`p-2 rounded-xl border ${
                    budgetCalculations.hasRedAlert
                      ? 'bg-rose-500/20 text-rose-400 border-rose-500/40'
                      : budgetCalculations.hasYellowAlert
                      ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                      : 'bg-[#11241F] text-[#14B8A6] border-[#1C3A31]'
                  }`}
                >
                  <Sliders className="w-4 h-4" />
                </div>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-md font-mono ${
                    budgetCalculations.hasRedAlert
                      ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                      : budgetCalculations.hasYellowAlert
                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      : 'bg-[#14B8A6]/15 text-[#14B8A6] border border-[#14B8A6]/30'
                  }`}
                >
                  {budgetCalculations.totalPercentage}%
                </span>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-white group-hover:text-[#14B8A6] transition flex items-center justify-between">
                  <span>Presupuestos</span>
                  <ChevronRight className="w-3.5 h-3.5 text-[#7C9791] group-hover:text-[#14B8A6] group-hover:translate-x-0.5 transition" />
                </h4>
                <p className="text-[11px] text-[#7C9791] mt-0.5 truncate">
                  {budgetCalculations.hasRedAlert
                    ? '⚠️ Presupuesto excedido'
                    : budgetCalculations.hasYellowAlert
                    ? '⚠️ Cerca del límite mensual'
                    : `${formatCurrency(budgetCalculations.totalSpent, currency)} gastados`}
                </p>
              </div>
            </button>
          )}

          {/* MINITARJETA 2: ESCÁNER IA (VISIBLE EN TODOS LOS PLANES) */}
          <button
            type="button"
            onClick={() => setActiveWindow('scanner')}
            className="bg-[#0B1512] hover:bg-[#11241F]/80 p-4 rounded-2xl border border-[#182F2A] hover:border-[#14B8A6]/40 text-left transition group shadow-md flex flex-col justify-between min-h-[130px] relative overflow-hidden cursor-pointer"
          >
            <div className="flex items-start justify-between">
              <div className="p-2 bg-[#11241F] text-[#14B8A6] rounded-xl border border-[#1C3A31]">
                <Sparkles className="w-4 h-4 text-[#14B8A6]" />
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#14B8A6]/15 text-[#14B8A6] border border-[#14B8A6]/30 font-mono">
                IA Activa
              </span>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-white group-hover:text-[#14B8A6] transition flex items-center justify-between">
                <span>Escáner IA</span>
                <ChevronRight className="w-3.5 h-3.5 text-[#7C9791] group-hover:text-[#14B8A6] group-hover:translate-x-0.5 transition" />
              </h4>
              <p className="text-[11px] text-[#7C9791] mt-0.5 truncate">
                Extracción OCR y deducciones con Gemini
              </p>
            </div>
          </button>

          {/* MINITARJETA 3: IMPUESTOS (Oculta en Modo Lite) */}
          {plan !== 'LITE' && (
            <button
              type="button"
              onClick={() => setActiveWindow('tax')}
              className="bg-[#0B1512] hover:bg-[#11241F]/80 p-4 rounded-2xl border border-[#182F2A] hover:border-[#14B8A6]/40 text-left transition group shadow-md flex flex-col justify-between min-h-[130px] relative overflow-hidden cursor-pointer"
            >
              <div className="flex items-start justify-between">
                <div className="p-2 bg-[#11241F] text-[#14B8A6] rounded-xl border border-[#1C3A31]">
                  <Calculator className="w-4 h-4 text-[#14B8A6]" />
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#11241F] text-emerald-300 border border-[#1C3A31] font-mono">
                  {(taxEstimate?.effectiveRate ?? 0).toFixed(1)}% tasa
                </span>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-white group-hover:text-[#14B8A6] transition flex items-center justify-between">
                  <span>Impuestos</span>
                  <ChevronRight className="w-3.5 h-3.5 text-[#7C9791] group-hover:text-[#14B8A6] group-hover:translate-x-0.5 transition" />
                </h4>
                <p className="text-[11px] text-[#7C9791] mt-0.5 truncate">
                  Est. {formatCurrency(taxEstimate.totalEstimatedTax, currency)} ({taxSettings.regime.split('/')[0]})
                </p>
              </div>
            </button>
          )}

          {/* MINITARJETA 4: META DE AHORRO (Oculta en Modo Lite) */}
          {plan !== 'LITE' && (
            <button
              type="button"
              onClick={() => setActiveWindow('savings')}
              className="bg-[#0B1512] hover:bg-[#11241F]/80 p-4 rounded-2xl border border-[#182F2A] hover:border-[#14B8A6]/40 text-left transition group shadow-md flex flex-col justify-between min-h-[130px] relative overflow-hidden cursor-pointer"
            >
              <div className="flex items-start justify-between">
                <div className="p-2 bg-[#11241F] text-[#14B8A6] rounded-xl border border-[#1C3A31]">
                  <Target className="w-4 h-4 text-[#14B8A6]" />
                </div>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-md font-mono ${
                    savingsCalculations.isReached
                      ? 'bg-[#14B8A6]/20 text-[#14B8A6] border border-[#14B8A6]/40'
                      : 'bg-[#11241F] text-white border border-[#1C3A31]'
                  }`}
                >
                  {savingsCalculations.percentage}%
                </span>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-white group-hover:text-[#14B8A6] transition flex items-center justify-between">
                  <span>Meta de Ahorro</span>
                  <ChevronRight className="w-3.5 h-3.5 text-[#7C9791] group-hover:text-[#14B8A6] group-hover:translate-x-0.5 transition" />
                </h4>
                <p className="text-[11px] text-[#7C9791] mt-0.5 truncate">
                  {savingsCalculations.isReached
                    ? '🎉 ¡Meta 100% alcanzada!'
                    : `${formatCurrency(savingsCalculations.currentSavings, currency)} de ${formatCurrency(savingsGoal.targetAmount, currency)}`}
                </p>
              </div>
            </button>
          )}

          {/* MINITARJETA 5: CENTRO DE CONTROL (Oculta en Modo Lite) */}
          {plan !== 'LITE' && (
            <button
              type="button"
              onClick={() => setActiveWindow('control_center')}
              className="bg-[#0B1512] hover:bg-[#11241F]/80 p-4 rounded-2xl border border-[#182F2A] hover:border-[#14B8A6]/40 text-left transition group shadow-md flex flex-col justify-between min-h-[130px] relative overflow-hidden cursor-pointer"
            >
              <div className="flex items-start justify-between">
                <div className="p-2 bg-[#11241F] text-[#14B8A6] rounded-xl border border-[#1C3A31]">
                  <BarChart3 className="w-4 h-4 text-[#14B8A6]" />
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#11241F] text-[#14B8A6] border border-[#1C3A31]">
                  Gráficos
                </span>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-white group-hover:text-[#14B8A6] transition flex items-center justify-between">
                  <span>Centro de Control</span>
                  <ChevronRight className="w-3.5 h-3.5 text-[#7C9791] group-hover:text-[#14B8A6] group-hover:translate-x-0.5 transition" />
                </h4>
                <p className="text-[11px] text-[#7C9791] mt-0.5 truncate">
                  Flujo de ingresos, gastos y categorías
                </p>
              </div>
            </button>
          )}

          {/* MINITARJETA 6: HISTORIAL DE MOVIMIENTOS (VISIBLE EN TODOS LOS PLANES) */}
          <button
            type="button"
            onClick={() => setActiveWindow('history')}
            className="bg-[#0B1512] hover:bg-[#11241F]/80 p-4 rounded-2xl border border-[#182F2A] hover:border-[#14B8A6]/40 text-left transition group shadow-md flex flex-col justify-between min-h-[130px] relative overflow-hidden cursor-pointer"
          >
            <div className="flex items-start justify-between">
              <div className="p-2 bg-[#11241F] text-[#14B8A6] rounded-xl border border-[#1C3A31]">
                <Receipt className="w-4 h-4 text-[#14B8A6]" />
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#11241F] text-white border border-[#1C3A31] font-mono">
                {transactions.length} txs
              </span>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-white group-hover:text-[#14B8A6] transition flex items-center justify-between">
                <span>Historial</span>
                <ChevronRight className="w-3.5 h-3.5 text-[#7C9791] group-hover:text-[#14B8A6] group-hover:translate-x-0.5 transition" />
              </h4>
              <p className="text-[11px] text-[#7C9791] mt-0.5 truncate">
                Últimos movimientos y comprobantes
              </p>
            </div>
          </button>
        </div>
      </section>

      {/* 3. BANNER SUTIL DE DESCUBRIMIENTO PRO (SOLO SI NO ES PRO Y NO FUE DESCARTADO HOY) */}
      {plan !== 'PRO' && !isPromoDismissed && (
        <section className="bg-[#081512] rounded-2xl p-4 sm:p-4.5 border border-[#182F2A] shadow-sm relative overflow-hidden transition-all">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[#11241F] text-[#14B8A6] rounded-xl border border-[#1C3A31] shrink-0">
                <Sparkles className="w-4 h-4 text-[#14B8A6]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-semibold text-white">Descubre las funciones Pro</h4>
                  <span className="text-[9px] bg-[#14B8A6]/10 text-[#14B8A6] border border-[#14B8A6]/30 px-1.5 py-0.5 rounded font-bold uppercase">
                    ⭐ Pro
                  </span>
                </div>
                <p className="text-[11px] text-[#7C9791] mt-0.5">
                  Con el plan Pro, puedes exportar reportes y escanear múltiples recibos.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end pt-1 sm:pt-0">
              <button
                type="button"
                onClick={onUpgradePlan}
                className="px-3 py-1.5 bg-[#11241F] hover:bg-[#163029] text-[#14B8A6] hover:text-white border border-[#1C3A31] hover:border-[#14B8A6]/40 font-semibold text-xs rounded-xl transition flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Crown className="w-3.5 h-3.5 text-amber-400" />
                <span>Probar Nivel PRO</span>
              </button>
              <button
                type="button"
                onClick={handleDismissPromo}
                title="Descartar por hoy"
                className="p-1.5 text-[#7C9791] hover:text-white hover:bg-[#11241F] rounded-lg transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </section>
      )}

      {/* ========================================================================= */}
      {/* 3. VENTANAS DETALLADAS (MODALES EXPANDIDOS / HOJAS DE CONTROL) */}
      {/* ========================================================================= */}

      {/* VENTANA 1: PRESUPUESTOS Y ALERTAS */}
      {activeWindow === 'budget' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#0B1512] border border-[#182F2A] rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Header de la Ventana */}
            <div className="p-5 border-b border-[#182F2A] flex items-center justify-between bg-[#081512]">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-[#11241F] text-[#14B8A6] rounded-xl border border-[#1C3A31]">
                  <Sliders className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <span>Estado de Presupuestos</span>
                    {budgetCalculations.hasRedAlert && (
                      <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded bg-rose-500/20 text-rose-400 border border-rose-500/30">
                        Presupuesto Excedido
                      </span>
                    )}
                  </h3>
                  <p className="text-xs text-[#7C9791]">
                    Seguimiento en tiempo real de límites mensuales por categoría
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setActiveWindow(null)}
                className="p-2 text-[#7C9791] hover:text-white hover:bg-[#11241F] rounded-xl transition cursor-pointer"
                title="Cerrar ventana"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Contenido de la Ventana */}
            <div className="p-5 sm:p-6 overflow-y-auto space-y-6">
              {/* Barra de progreso global */}
              <div className="p-4 bg-[#081512] rounded-xl border border-[#182F2A]">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-1 mb-2">
                  <span className="text-xs font-semibold text-white">
                    Gasto Total del Mes vs. Límite Global
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-white">
                      {formatCurrency(budgetCalculations.totalSpent, currency)} / {formatCurrency(budgetCalculations.totalLimit, currency)}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                        budgetCalculations.totalPercentage > 100
                          ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          : budgetCalculations.totalPercentage >= 80
                          ? 'bg-amber-400/20 text-amber-400 border border-amber-400/30'
                          : 'bg-[#14B8A6]/20 text-[#14B8A6] border border-[#14B8A6]/30'
                      }`}
                    >
                      {budgetCalculations.totalPercentage}% usado
                    </span>
                  </div>
                </div>

                <div className="w-full bg-[#11241F] h-3 rounded-full overflow-hidden border border-[#1C3A31]/40">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      budgetCalculations.totalPercentage > 100
                        ? 'bg-rose-500 shadow-[0_0_12px_rgba(244,63,94,0.6)]'
                        : budgetCalculations.totalPercentage >= 80
                        ? 'bg-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.6)]'
                        : 'bg-[#14B8A6] shadow-[0_0_12px_rgba(20, 184, 166, 0.28)]'
                    }`}
                    style={{ width: `${Math.min(100, budgetCalculations.totalPercentage)}%` }}
                  />
                </div>
              </div>

              {/* Desglose de presupuestos por categoría */}
              {budgetCalculations.categoryBudgets.length > 0 ? (
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-[#7C9791] uppercase tracking-wider">
                    Límites Asignados por Categoría ({budgetCalculations.categoryBudgets.length})
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {budgetCalculations.categoryBudgets.map((catItem) => {
                      const isRed = catItem.status === 'RED';
                      const isYellow = catItem.status === 'YELLOW';

                      return (
                        <div
                          key={catItem.category}
                          className={`p-4 rounded-xl border transition ${
                            isRed
                              ? 'bg-rose-500/10 border-rose-500/40'
                              : isYellow
                              ? 'bg-amber-500/10 border-amber-500/40'
                              : 'bg-[#081512] border-[#182F2A]'
                          }`}
                        >
                          <div className="flex justify-between items-center mb-1.5">
                            <span className="text-xs font-bold text-white flex items-center gap-1.5 truncate pr-2">
                              {isRed ? (
                                <ShieldAlert className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                              ) : isYellow ? (
                                <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                              ) : (
                                <CheckCircle2 className="w-3.5 h-3.5 text-[#14B8A6] shrink-0" />
                              )}
                              <span className="truncate">{catItem.category}</span>
                            </span>
                            <span
                              className={`text-xs font-mono font-bold shrink-0 ${
                                isRed ? 'text-rose-400' : isYellow ? 'text-amber-400' : 'text-[#14B8A6]'
                              }`}
                            >
                              {catItem.percentage}% usado
                            </span>
                          </div>

                          <div className="flex justify-between text-[11px] text-[#7C9791] font-mono mb-2">
                            <span>Gastado: {formatCurrency(catItem.spent, currency)}</span>
                            <span>Límite: {formatCurrency(catItem.limit, currency)}</span>
                          </div>

                          <div className="w-full bg-[#11241F] h-2.5 rounded-full overflow-hidden border border-[#1C3A31]">
                            <div
                              className={`h-full rounded-full transition-all duration-300 ${
                                isRed
                                  ? 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]'
                                  : isYellow
                                  ? 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.5)]'
                                  : 'bg-[#14B8A6] shadow-[0_0_8px_rgba(20, 184, 166, 0.28)]'
                              }`}
                              style={{ width: `${Math.min(100, catItem.percentage)}%` }}
                            />
                          </div>

                          {catItem.alertMessage && (
                            <div
                              className={`mt-2.5 p-2 rounded-lg text-[11px] font-semibold flex items-center gap-1.5 ${
                                isRed
                                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              }`}
                            >
                              {isRed ? (
                                <ShieldAlert className="w-3.5 h-3.5 shrink-0 text-rose-400" />
                              ) : (
                                <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-amber-400" />
                              )}
                              <span>{catItem.alertMessage}</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="p-5 bg-[#081512] rounded-xl border border-[#182F2A] text-center">
                  <p className="text-xs text-[#7C9791]">
                    No tienes categorías con límites asignados. Puedes configurarlos en Configuración.
                  </p>
                </div>
              )}
            </div>

            {/* Footer de la Ventana */}
            <div className="p-4 border-t border-[#182F2A] bg-[#081512] flex items-center justify-between">
              <button
                type="button"
                onClick={() => setActiveWindow(null)}
                className="px-4 py-2 bg-[#11241F] text-white hover:text-[#14B8A6] text-xs font-semibold rounded-xl border border-[#1C3A31] transition cursor-pointer"
              >
                Volver al Dashboard
              </button>
              <button
                type="button"
                onClick={() => onNavigateTab('tax')}
                className="px-4 py-2 bg-[#14B8A6] text-[#020504] font-bold text-xs rounded-xl hover:bg-[#0D9488] transition flex items-center gap-1.5 cursor-pointer"
              >
                <span>Ajustar Presupuestos</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VENTANA 2: ESCÁNER IA Y RECIBOS */}
      {activeWindow === 'scanner' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#0B1512] border border-[#182F2A] rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="p-5 border-b border-[#182F2A] flex items-center justify-between bg-[#081512]">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-[#11241F] text-[#14B8A6] rounded-xl border border-[#1C3A31]">
                  <Sparkles className="w-5 h-5 text-[#14B8A6]" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Escáner de Recibos IA</h3>
                  <p className="text-xs text-[#7C9791]">
                    Procesamiento visual con OCR inteligente y cálculo automático de deducciones
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setActiveWindow(null)}
                className="p-2 text-[#7C9791] hover:text-white hover:bg-[#11241F] rounded-xl transition cursor-pointer"
                title="Cerrar ventana"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Contenido */}
            <div className="p-5 sm:p-6 overflow-y-auto space-y-5">
              <div className="p-5 bg-[#081512] rounded-xl border border-[#182F2A] flex flex-col items-center text-center space-y-4">
                <div className="w-16 h-16 bg-[#11241F] text-[#14B8A6] rounded-2xl border border-[#1C3A31] flex items-center justify-center">
                  <ScanLine className="w-8 h-8 text-[#14B8A6] animate-pulse" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-white">Escaneo Instantáneo de Comprobantes</h4>
                  <p className="text-xs text-[#7C9791] max-w-md mx-auto mt-1">
                    Sube una foto o PDF de tu factura. La IA extraerá el comercio, fecha, monto total, desglose de IVA y determinará si es deducible para tu régimen.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setActiveWindow(null);
                    onNavigateTab('scanner');
                  }}
                  className="px-6 py-3 bg-[#14B8A6] text-[#020504] font-bold text-sm rounded-xl hover:bg-[#0D9488] transition flex items-center gap-2 shadow-[0_0_20px_rgba(20, 184, 166, 0.21)] cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Abrir Escáner de Recibos</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

              {/* Beneficios */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3.5 bg-[#11241F]/30 rounded-xl border border-[#1C3A31]">
                  <p className="text-xs font-bold text-white flex items-center gap-1.5 mb-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#14B8A6]" />
                    Extracción OCR
                  </p>
                  <p className="text-[11px] text-[#7C9791]">
                    Identifica montos, fechas y conceptos sin escribir nada.
                  </p>
                </div>

                <div className="p-3.5 bg-[#11241F]/30 rounded-xl border border-[#1C3A31]">
                  <p className="text-xs font-bold text-white flex items-center gap-1.5 mb-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#14B8A6]" />
                    Deducción Fiscal
                  </p>
                  <p className="text-[11px] text-[#7C9791]">
                    Clasifica el gasto según tu régimen tributario configurado.
                  </p>
                </div>

                <div className="p-3.5 bg-[#11241F]/30 rounded-xl border border-[#1C3A31]">
                  <p className="text-xs font-bold text-white flex items-center gap-1.5 mb-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#14B8A6]" />
                    Archivo Digital
                  </p>
                  <p className="text-[11px] text-[#7C9791]">
                    Vincula el comprobante a tu historial de transacciones.
                  </p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-[#182F2A] bg-[#081512] flex items-center justify-between">
              <button
                type="button"
                onClick={() => setActiveWindow(null)}
                className="px-4 py-2 bg-[#11241F] text-white hover:text-[#14B8A6] text-xs font-semibold rounded-xl border border-[#1C3A31] transition cursor-pointer"
              >
                Volver al Dashboard
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VENTANA 3: IMPUESTOS Y PROYECCIÓN FISCAL */}
      {activeWindow === 'tax' && plan !== 'LITE' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#0B1512] border border-[#182F2A] rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="p-5 border-b border-[#182F2A] flex items-center justify-between bg-[#081512]">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-[#11241F] text-[#14B8A6] rounded-xl border border-[#1C3A31]">
                  <Calculator className="w-5 h-5 text-[#14B8A6]" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Proyección e Impuestos</h3>
                  <p className="text-xs text-[#7C9791]">
                    Estimación tributaria en tiempo real • {taxSettings.regime}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setActiveWindow(null)}
                className="p-2 text-[#7C9791] hover:text-white hover:bg-[#11241F] rounded-xl transition cursor-pointer"
                title="Cerrar ventana"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Contenido */}
            <div className="p-5 sm:p-6 overflow-y-auto space-y-6">
              {/* Resumen de Impuesto Total */}
              <div className="p-5 bg-[#081512] rounded-xl border border-[#182F2A]">
                <div className="flex justify-between items-end mb-2">
                  <div>
                    <span className="text-xs text-[#7C9791] uppercase font-semibold">Impuesto Total Estimado</span>
                    <h4 className="text-3xl font-bold text-[#14B8A6] font-mono mt-0.5">
                      {formatCurrency(taxEstimate.totalEstimatedTax, currency)}
                    </h4>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-[#7C9791]">Tasa Efectiva:</span>
                    <p className="text-lg font-bold text-white font-mono">{(taxEstimate?.effectiveRate ?? 0).toFixed(1)}%</p>
                  </div>
                </div>

                <div className="w-full bg-[#11241F] h-2.5 rounded-full overflow-hidden my-3 border border-[#1C3A31]/20">
                  <div
                    className="bg-[#14B8A6] h-full rounded-full transition-all duration-500 shadow-[0_0_10px_rgba(20, 184, 166, 0.28)]"
                    style={{ width: `${Math.min(100, (taxEstimate?.effectiveRate ?? 0) * 3.5)}%` }}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                  <div className="p-3.5 bg-[#11241F]/40 rounded-xl border border-[#1C3A31]">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs font-semibold text-white">IVA Estimado ({taxSettings?.vatRate ?? 16}%)</span>
                      <span className="text-xs font-mono text-teal-400">Cobrado - Acreditable</span>
                    </div>
                    <p className="text-xl font-bold text-white font-mono">
                      {formatCurrency(taxEstimate.estimatedVAT, currency)}
                    </p>
                  </div>

                  <div className="p-3.5 bg-[#11241F]/40 rounded-xl border border-[#1C3A31]">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs font-semibold text-white">ISR Estimado ({taxSettings?.incomeTaxRate ?? 2}%)</span>
                      <span className="text-xs font-mono text-emerald-400">Tasa fija sobre ingreso</span>
                    </div>
                    <p className="text-xl font-bold text-white font-mono">
                      {formatCurrency(taxEstimate.estimatedIncomeTax, currency)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Gráfico de Evolución de Impuestos */}
              <div className="p-5 bg-[#081512] rounded-xl border border-[#182F2A]">
                <h4 className="text-sm font-semibold text-white mb-1">Evolución de Impuestos en los Últimos 6 Meses</h4>
                <p className="text-xs text-[#7C9791] mb-4">Comportamiento de retención ISR e IVA mensual</p>

                <div className="w-full h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={taxEvolutionData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#182F2A" opacity={0.6} />
                      <XAxis dataKey="month" stroke="#7C9791" tick={{ fill: '#7C9791', fontSize: 12 }} />
                      <YAxis stroke="#7C9791" tick={{ fill: '#7C9791', fontSize: 12 }} tickFormatter={(val) => `$${val}`} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#0B1512',
                          borderColor: '#182F2A',
                          borderRadius: '0.75rem',
                          color: '#FFFFFF',
                          fontSize: '12px',
                        }}
                        formatter={(val: number, name: string) => [formatCurrency(val, currency), name]}
                      />
                      <Area type="monotone" dataKey="Total Impuestos" stroke="#14B8A6" fill="#14B8A6" fillOpacity={0.2} />
                      <Area type="monotone" dataKey="ISR" stroke="#34D399" fill="#34D399" fillOpacity={0.15} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-[#182F2A] bg-[#081512] flex items-center justify-between">
              <button
                type="button"
                onClick={() => setActiveWindow(null)}
                className="px-4 py-2 bg-[#11241F] text-white hover:text-[#14B8A6] text-xs font-semibold rounded-xl border border-[#1C3A31] transition cursor-pointer"
              >
                Volver al Dashboard
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveWindow(null);
                  onNavigateTab('tax');
                }}
                className="px-4 py-2 bg-[#14B8A6] text-[#020504] font-bold text-xs rounded-xl hover:bg-[#0D9488] transition flex items-center gap-1.5 cursor-pointer"
              >
                <span>Centro Fiscal Completo</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VENTANA 4: META DE AHORRO */}
      {activeWindow === 'savings' && plan !== 'LITE' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#0B1512] border border-[#182F2A] rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="p-5 border-b border-[#182F2A] flex items-center justify-between bg-[#081512]">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-[#11241F] text-[#14B8A6] rounded-xl border border-[#1C3A31]">
                  <Target className="w-5 h-5 text-[#14B8A6]" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <span>🎯 {savingsGoal.name || 'Meta de Ahorro'}</span>
                    {savingsCalculations.isReached && (
                      <span className="px-2.5 py-0.5 text-[10px] font-bold uppercase rounded-md bg-[#14B8A6]/20 text-[#14B8A6] border border-[#14B8A6]/30">
                        ¡Alcanzada! 🎉
                      </span>
                    )}
                  </h3>
                  <p className="text-xs text-[#7C9791]">
                    Objetivo financiero: {formatCurrency(savingsGoal.targetAmount, currency)} • Límite: {savingsGoal.targetDate || 'Sin fecha'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setActiveWindow(null)}
                className="p-2 text-[#7C9791] hover:text-white hover:bg-[#11241F] rounded-xl transition cursor-pointer"
                title="Cerrar ventana"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Contenido */}
            <div className="p-5 sm:p-6 overflow-y-auto space-y-6">
              <div className="p-5 bg-[#081512] rounded-xl border border-[#182F2A] space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                  <div>
                    <span className="text-[10px] font-semibold text-[#7C9791] uppercase">Ahorro Acumulado (Ingresos - Gastos)</span>
                    <h4 className="text-3xl font-bold text-white font-mono mt-0.5">
                      {formatCurrency(savingsCalculations.currentSavings, currency)}
                    </h4>
                  </div>
                  <div className="sm:text-right">
                    <span
                      className={`inline-block px-3 py-1 rounded-xl text-xs font-bold font-mono ${
                        savingsCalculations.isReached
                          ? 'bg-[#14B8A6]/20 text-[#14B8A6] border border-[#14B8A6]/40'
                          : 'bg-[#11241F] text-white border border-[#1C3A31]'
                      }`}
                    >
                      {savingsCalculations.percentage}% completado
                    </span>
                    {!savingsCalculations.isReached && (
                      <p className="text-xs text-[#7C9791] mt-1 font-mono">
                        Faltan <span className="text-white font-bold">{formatCurrency(savingsCalculations.remaining, currency)}</span>
                      </p>
                    )}
                  </div>
                </div>

                <div className="w-full bg-[#11241F] h-3.5 rounded-full overflow-hidden border border-[#1C3A31]/40 p-0.5">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      savingsCalculations.isReached
                        ? 'bg-[#14B8A6] shadow-[0_0_14px_rgba(20, 184, 166, 0.49)]'
                        : 'bg-[#14B8A6] shadow-[0_0_10px_rgba(20, 184, 166, 0.28)]'
                    }`}
                    style={{ width: `${Math.min(100, savingsCalculations.percentage)}%` }}
                  />
                </div>

                {savingsCalculations.isReached ? (
                  <div className="p-3.5 bg-[#14B8A6]/10 border border-[#14B8A6]/30 rounded-xl flex items-center gap-2.5">
                    <CheckCircle2 className="w-5 h-5 text-[#14B8A6] shrink-0" />
                    <p className="text-xs text-[#14B8A6] font-semibold">
                      ¡Felicidades! Has alcanzado tu objetivo financiero de <strong>{formatCurrency(savingsGoal.targetAmount, currency)}</strong>.
                    </p>
                  </div>
                ) : (
                  <div className="flex justify-between text-xs text-[#7C9791] pt-1">
                    <span>🎯 Mantén tu ritmo de facturación para llegar a tiempo.</span>
                    <span className="font-mono text-white font-semibold">
                      {Math.max(0, Math.ceil((new Date(savingsGoal.targetDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)))} días restantes
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-[#182F2A] bg-[#081512] flex items-center justify-between">
              <button
                type="button"
                onClick={() => setActiveWindow(null)}
                className="px-4 py-2 bg-[#11241F] text-white hover:text-[#14B8A6] text-xs font-semibold rounded-xl border border-[#1C3A31] transition cursor-pointer"
              >
                Volver al Dashboard
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VENTANA 5: CENTRO DE CONTROL Y MÉTRICAS (GRÁFICOS) */}
      {activeWindow === 'control_center' && plan !== 'LITE' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#0B1512] border border-[#182F2A] rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="p-5 border-b border-[#182F2A] flex items-center justify-between bg-[#081512]">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-[#11241F] text-[#14B8A6] rounded-xl border border-[#1C3A31]">
                  <BarChart3 className="w-5 h-5 text-[#14B8A6]" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Centro de Control & Gráficos</h3>
                  <p className="text-xs text-[#7C9791]">
                    Evolución mensual de flujo de caja y distribución por categoría
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 bg-[#11241F] p-1 rounded-xl border border-[#1C3A31]">
                  <button
                    type="button"
                    onClick={() => setActiveChartType('line')}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                      activeChartType === 'line'
                        ? 'bg-[#14B8A6] text-[#020504]'
                        : 'text-[#7C9791] hover:text-white'
                    }`}
                  >
                    📈 Líneas
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveChartType('bar')}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                      activeChartType === 'bar'
                        ? 'bg-[#14B8A6] text-[#020504]'
                        : 'text-[#7C9791] hover:text-white'
                    }`}
                  >
                    📊 Barras
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setActiveWindow(null)}
                  className="p-2 text-[#7C9791] hover:text-white hover:bg-[#11241F] rounded-xl transition cursor-pointer"
                  title="Cerrar ventana"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Contenido */}
            <div className="p-5 sm:p-6 overflow-y-auto space-y-6">
              <div className="w-full h-80 bg-[#081512] p-4 rounded-xl border border-[#182F2A]">
                {activeChartType === 'line' ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={lineChartData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#182F2A" opacity={0.6} />
                      <XAxis dataKey="month" stroke="#7C9791" tick={{ fill: '#7C9791', fontSize: 12 }} />
                      <YAxis stroke="#7C9791" tick={{ fill: '#7C9791', fontSize: 12 }} tickFormatter={(val) => `$${val}`} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#0B1512',
                          borderColor: '#182F2A',
                          borderRadius: '0.75rem',
                          color: '#FFFFFF',
                          fontSize: '12px',
                        }}
                        formatter={(val: number) => [formatCurrency(val, currency), '']}
                      />
                      <Legend verticalAlign="top" height={36} />
                      <Line type="monotone" dataKey="Ingresos" stroke="#14B8A6" strokeWidth={3} dot={{ fill: '#14B8A6', r: 4 }} />
                      <Line type="monotone" dataKey="Gastos" stroke="#FB7185" strokeWidth={3} dot={{ fill: '#FB7185', r: 4 }} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart layout="vertical" data={barChartData} margin={{ top: 10, right: 50, left: 10, bottom: 10 }}>
                      <CartesianGrid horizontal={false} stroke="#182F2A" opacity={0.6} />
                      <XAxis type="number" stroke="#7C9791" tick={{ fill: '#7C9791', fontSize: 11 }} tickFormatter={(val) => `$${val}`} />
                      <YAxis type="category" dataKey="category" stroke="#7C9791" tick={{ fill: '#E5E7EB', fontSize: 12 }} width={110} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#0B1512',
                          borderColor: '#182F2A',
                          borderRadius: '0.75rem',
                          color: '#FFFFFF',
                          fontSize: '12px',
                        }}
                        formatter={(val: number) => [formatCurrency(val, currency), 'Gasto']}
                      />
                      <Bar dataKey="amount" radius={[0, 6, 6, 0]} barSize={22}>
                        {barChartData.map((_entry, index) => (
                          <Cell key={`cell-${index}`} fill={BAR_COLORS[index % BAR_COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>

              {/* Resumen de Categorías */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {expenseCategories.slice(0, 4).map((cat) => (
                  <div key={cat.category} className="p-3 bg-[#081512] rounded-xl border border-[#182F2A]">
                    <p className="text-xs font-semibold text-white truncate">{cat.category}</p>
                    <p className="text-base font-bold text-[#14B8A6] font-mono mt-1">
                      {formatCurrency(cat.amount, currency)}
                    </p>
                    <p className="text-[10px] text-[#7C9791] font-mono">{cat.percentage}% del total</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-[#182F2A] bg-[#081512] flex items-center justify-between">
              <button
                type="button"
                onClick={() => setActiveWindow(null)}
                className="px-4 py-2 bg-[#11241F] text-white hover:text-[#14B8A6] text-xs font-semibold rounded-xl border border-[#1C3A31] transition cursor-pointer"
              >
                Volver al Dashboard
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VENTANA 6: HISTORIAL DE TRANSACCIONES */}
      {activeWindow === 'history' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#0B1512] border border-[#182F2A] rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="p-5 border-b border-[#182F2A] flex items-center justify-between bg-[#081512]">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-[#11241F] text-[#14B8A6] rounded-xl border border-[#1C3A31]">
                  <Receipt className="w-5 h-5 text-[#14B8A6]" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Historial de Movimientos</h3>
                  <p className="text-xs text-[#7C9791]">
                    {transactions.length} transacciones registradas • Ingresos y gastos
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setActiveWindow(null)}
                className="p-2 text-[#7C9791] hover:text-white hover:bg-[#11241F] rounded-xl transition cursor-pointer"
                title="Cerrar ventana"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Contenido */}
            <div className="p-5 sm:p-6 overflow-y-auto space-y-3">
              {recentTransactions.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between p-3.5 rounded-xl bg-[#081512] border border-[#182F2A] hover:border-[#1C3A31] transition"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-xs border ${
                        tx.type === 'INCOME'
                          ? 'bg-[#11241F] text-[#14B8A6] border-[#1C3A31]/40'
                          : 'bg-rose-500/10 text-rose-400 border-rose-500/10'
                      }`}
                    >
                      {tx.type === 'INCOME' ? '+' : '-'}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">{tx.merchant}</p>
                      <p className="text-xs text-[#7C9791]">
                        {tx.category} • {tx.date}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span
                      className={`text-sm font-bold font-mono ${
                        tx.type === 'INCOME' ? 'text-[#14B8A6]' : 'text-white'
                      }`}
                    >
                      {tx.type === 'INCOME' ? '+' : '-'} {formatCurrency(tx.amount, currency)}
                    </span>
                    {tx.hasReceipt && (
                      <div className="text-[10px] text-[#14B8A6] font-semibold flex items-center justify-end gap-1 mt-0.5">
                        <Check className="w-3 h-3" />
                        <span>Comprobante Adjunto</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-[#182F2A] bg-[#081512] flex items-center justify-between">
              <button
                type="button"
                onClick={() => setActiveWindow(null)}
                className="px-4 py-2 bg-[#11241F] text-white hover:text-[#14B8A6] text-xs font-semibold rounded-xl border border-[#1C3A31] transition cursor-pointer"
              >
                Volver al Dashboard
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveWindow(null);
                  onNavigateTab('transactions');
                }}
                className="px-4 py-2 bg-[#14B8A6] text-[#020504] font-bold text-xs rounded-xl hover:bg-[#0D9488] transition flex items-center gap-1.5 cursor-pointer"
              >
                <span>Ver Todos los Movimientos</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
