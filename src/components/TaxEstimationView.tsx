import React, { useState } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { Transaction, TaxSettings, PlanType, TaxAdviceAI } from '../types';
import { calculateTaxEstimate, formatCurrency } from '../utils/taxCalculator';
import { TRANSLATIONS } from '../utils/translations';
import {
  Calculator,
  ShieldCheck,
  Sparkles,
  TrendingDown,
  Info,
  Calendar,
  Crown,
  Lightbulb,
  CheckCircle2,
  RefreshCw,
  FileSpreadsheet,
  AlertTriangle,
  Clock,
} from 'lucide-react';

interface TaxEstimationViewProps {
  transactions: Transaction[];
  taxSettings: TaxSettings;
  onUpdateTaxSettings: (settings: TaxSettings) => void;
  plan: PlanType;
  onUpgradePlan: () => void;
}

export const TaxEstimationView: React.FC<TaxEstimationViewProps> = ({
  transactions,
  taxSettings,
  onUpdateTaxSettings,
  plan,
  onUpgradePlan,
}) => {
  const currentLang = taxSettings.language || 'es';
  const t = TRANSLATIONS[currentLang];
  const currency = taxSettings.currency || 'USD';

  const [aiAdvice, setAiAdvice] = useState<TaxAdviceAI | null>(null);
  const [loadingAdvice, setLoadingAdvice] = useState<boolean>(false);

  const taxEstimate = calculateTaxEstimate(transactions, taxSettings) || {
    grossIncome: 0,
    totalExpenses: 0,
    deductibleExpenses: 0,
    taxableIncome: 0,
    estimatedIncomeTax: 0,
    estimatedVAT: 0,
    totalEstimatedTax: 0,
    effectiveRate: 0,
    marginAvailable: 0
  };

  // Evolution of tax burden month by month
  const monthlyTaxData = React.useMemo(() => {
    const monthNames = currentLang === 'en' 
      ? ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
      : currentLang === 'pt'
      ? ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
      : ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

    const hasAnyTransactions = transactions && transactions.length > 0;
    if (!hasAnyTransactions) {
      return { data: [], hasData: false };
    }

    const months = [];
    const now = new Date();

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const mLabel = monthNames[d.getMonth()];
      const yearMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

      const monthTxs = transactions.filter((tx) => tx.date && tx.date.startsWith(yearMonth));
      const inc = monthTxs.filter((tx) => tx.type === 'INCOME').reduce((acc, tx) => acc + tx.amount, 0);
      const exp = monthTxs.filter((tx) => tx.type === 'EXPENSE').reduce((acc, tx) => acc + tx.amount, 0);
      const mEstimate = calculateTaxEstimate(monthTxs, taxSettings);
      const estimatedTax = mEstimate ? mEstimate.totalEstimatedTax : 0;

      months.push({
        month: mLabel,
        yearMonth,
        Ingresos: inc,
        Gastos: exp,
        'Impuestos Estimados': estimatedTax,
        isPeak: false,
      });
    }

    const totalInc = months.reduce((a, b) => a + b.Ingresos, 0);
    const totalExp = months.reduce((a, b) => a + b.Gastos, 0);

    // If transactions exist but not in current YYYY-MM window, fallback to months found in transactions
    if (totalInc === 0 && totalExp === 0 && transactions.length > 0) {
      const ymSet = new Set<string>(transactions.map((t) => (t.date ? t.date.substring(0, 7) : '')).filter(Boolean));
      const sortedYMs = Array.from(ymSet).sort().slice(-6);

      const fallbackMonths = sortedYMs.map((ym) => {
        const [yStr, mStr] = ym.split('-');
        const mIdx = parseInt(mStr, 10) - 1;
        const mLabel = monthNames[mIdx] || ym;
        const monthTxs = transactions.filter((tx) => tx.date && tx.date.startsWith(ym));
        const inc = monthTxs.filter((tx) => tx.type === 'INCOME').reduce((acc, tx) => acc + tx.amount, 0);
        const exp = monthTxs.filter((tx) => tx.type === 'EXPENSE').reduce((acc, tx) => acc + tx.amount, 0);
        const mEstimate = calculateTaxEstimate(monthTxs, taxSettings);
        const estimatedTax = mEstimate ? mEstimate.totalEstimatedTax : 0;

        return {
          month: `${mLabel} ${yStr.slice(2)}`,
          yearMonth: ym,
          Ingresos: inc,
          Gastos: exp,
          'Impuestos Estimados': estimatedTax,
          isPeak: false,
        };
      });

      const maxTaxVal = Math.max(...fallbackMonths.map((m) => m['Impuestos Estimados']));
      if (maxTaxVal > 0) {
        const peakObj = fallbackMonths.find((m) => m['Impuestos Estimados'] === maxTaxVal);
        if (peakObj) peakObj.isPeak = true;
      }

      return { data: fallbackMonths, hasData: true };
    }

    const maxTaxVal = Math.max(...months.map((m) => m['Impuestos Estimados']));
    if (maxTaxVal > 0) {
      const peakObj = months.find((m) => m['Impuestos Estimados'] === maxTaxVal);
      if (peakObj) peakObj.isPeak = true;
    }

    return { data: months, hasData: true };
  }, [transactions, currentLang, taxSettings]);

  // Tax regime declaration reminder
  const getRegimeAlertInfo = () => {
    const regime = taxSettings.regime || '';
    
    if (regime.includes('México') || regime.includes('RESICO') || regime.includes('Persona Física Actividad')) {
      return {
        title: 'Calendario Fiscal - México (SAT)',
        reminder: 'Declaración mensual: 17 de cada mes. Declaración anual: abril del año siguiente.',
        notice: 'Recuerda presentar tu declaración antes del 17 de cada mes para evitar recargos.',
        badge: 'México (SAT)',
        colorClass: 'border-emerald-500/30 bg-emerald-500/10 text-[#14B8A6]',
      };
    } else if (regime.includes('España') || regime.includes('Autónomos')) {
      return {
        title: 'Calendario Fiscal - España (AEAT)',
        reminder: 'Declaración trimestral: 20 de abril, 20 de julio, 20 de octubre y 20 de enero.',
        notice: 'El IVA e IRPF se declaran trimestralmente. Revisa tus gastos deducibles.',
        badge: 'España (AEAT)',
        colorClass: 'border-blue-500/30 bg-blue-500/10 text-blue-400',
      };
    } else if (regime.includes('Colombia')) {
      return {
        title: 'Calendario Fiscal - Colombia (DIAN)',
        reminder: 'Declaración bimestral: 15 de marzo, 15 de mayo, 15 de julio, 15 de septiembre, 15 de noviembre.',
        notice: 'El Régimen Simple requiere declaración bimestral. No olvides incluir todos tus ingresos.',
        badge: 'Colombia (DIAN)',
        colorClass: 'border-amber-500/30 bg-amber-500/10 text-amber-400',
      };
    } else if (regime.includes('Argentina')) {
      return {
        title: 'Calendario Fiscal - Argentina (AFIP)',
        reminder: 'Declaración mensual: 20 de cada mes. Declaración anual: junio del año siguiente.',
        notice: 'Monotributo: pago mensual fijo. Responsable Inscripto: declaración mensual de IVA y Ganancias.',
        badge: 'Argentina (AFIP)',
        colorClass: 'border-sky-500/30 bg-sky-500/10 text-sky-400',
      };
    } else {
      return {
        title: 'Calendario Fiscal - General Freelance',
        reminder: 'Revisa tu declaración fiscal según tu país de residencia.',
        notice: 'Te recomendamos consultar con un contador local para conocer tus obligaciones específicas.',
        badge: 'Internacional',
        colorClass: 'border-[#1C3A31] bg-[#11241F]/40 text-[#14B8A6]',
      };
    }
  };

  // Generate AI Tax Diagnosis
  const handleGenerateAiAdvice = async () => {
    setLoadingAdvice(true);
    try {
      const response = await fetch('/api/tax-advice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          totalIncome: taxEstimate.grossIncome,
          totalExpenses: taxEstimate.totalExpenses,
          deductibleExpenses: taxEstimate.deductibleExpenses,
          taxRegime: taxSettings.regime,
        }),
      });

      const resData = await response.json();
      if (resData.success && resData.data) {
        setAiAdvice(resData.data);
      } else {
        throw new Error('Respuesta no válida del servicio fiscal.');
      }
    } catch (err) {
      console.error('Error al solicitar consejo tributario:', err);
      // Fallback advice depending on language
      if (currentLang === 'es') {
        setAiAdvice({
          estimatedTax: taxEstimate.totalEstimatedTax,
          effectiveTaxRatePercent: taxEstimate.effectiveRate,
          potentialSavings: 145.0,
          recommendations: [
            'Factura tus servicios de software e internet para aprovechar hasta un 15% adicional de deducción.',
            'Conserva los comprobantes digitales con IVA desglosado para acreditar impuestos.',
            'Realiza el apartado de tu reserva tributaria semanalmente en una cuenta de rendimiento para no afectar tu liquidez.',
          ],
          taxCalendarTip: 'Próxima declaración mensual estimada el día 17 del siguiente mes.',
        });
      } else if (currentLang === 'en') {
        setAiAdvice({
          estimatedTax: taxEstimate.totalEstimatedTax,
          effectiveTaxRatePercent: taxEstimate.effectiveRate,
          potentialSavings: 145.0,
          recommendations: [
            'Invoice your software and internet services to take advantage of up to an additional 15% deduction.',
            'Keep digital receipts with broken down VAT to claim taxes.',
            'Set aside your weekly tax reserve in a yield-generating account to avoid affecting your liquidity.',
          ],
          taxCalendarTip: 'Next estimated monthly declaration is on the 17th of the following month.',
        });
      } else {
        setAiAdvice({
          estimatedTax: taxEstimate.totalEstimatedTax,
          effectiveTaxRatePercent: taxEstimate.effectiveRate,
          potentialSavings: 145.0,
          recommendations: [
            'Fature seus serviços de software e internet para aproveitar até 15% adicionais de dedução.',
            'Guarde os comprovantes digitais com IVA detalhado para creditar impostos.',
            'Separe sua reserva fiscal semanalmente em uma conta de rendimento para não afetar sua liquidez.',
          ],
          taxCalendarTip: 'Próxima declaração mensal estimada no dia 17 do próximo mês.',
        });
      }
    } finally {
      setLoadingAdvice(false);
    }
  };

  const getTaxTitle = () => {
    if (currentLang === 'es') return 'Estimación Tributaria';
    if (currentLang === 'en') return 'Tax Estimation';
    return 'Estimativa de Impostos';
  };

  const getTaxSubtitle = () => {
    if (currentLang === 'es') return 'Calcula automáticamente tus reservas de impuestos.';
    if (currentLang === 'en') return 'Automatically calculate your tax reserves.';
    return 'Calcule automaticamente suas reservas de impostos.';
  };

  const getActiveRegimeLabel = () => {
    if (currentLang === 'es') return 'Régimen Fiscal Activo';
    if (currentLang === 'en') return 'Active Tax Regime';
    return 'Regime Fiscal Ativo';
  };

  const getTaxableBaseLabel = () => {
    if (currentLang === 'es') return 'Base Gravable Neta';
    if (currentLang === 'en') return 'Net Taxable Base';
    return 'Base Tributável Líquida';
  };

  const getTaxableBaseSub = () => {
    const grossStr = formatCurrency(taxEstimate.grossIncome, currency);
    const dedStr = formatCurrency(taxEstimate.deductibleExpenses, currency);
    if (currentLang === 'es') return `Ingresos (${grossStr}) menos deducibles (${dedStr})`;
    if (currentLang === 'en') return `Income (${grossStr}) minus deductibles (${dedStr})`;
    return `Receitas (${grossStr}) menos deduções (${dedStr})`;
  };

  const getIncomeTaxLabel = () => {
    if (currentLang === 'es') return `ISR / Impuesto Renta (${taxSettings.incomeTaxRate}%)`;
    if (currentLang === 'en') return `Income Tax (${taxSettings.incomeTaxRate}%)`;
    return `Imposto de Renda (${taxSettings.incomeTaxRate}%)`;
  };

  const getIncomeTaxSub = () => {
    if (currentLang === 'es') return 'Calculado sobre la base gravable neta';
    if (currentLang === 'en') return 'Calculated on the net taxable base';
    return 'Calculado sobre a base tributável líquida';
  };

  const getVatLabel = () => {
    if (currentLang === 'es') return `IVA Neto Est. (${taxSettings.vatRate}%)`;
    if (currentLang === 'en') return `Est. Net VAT (${taxSettings.vatRate}%)`;
    return `IVA Líquido Est. (${taxSettings.vatRate}%)`;
  };

  const getVatSub = () => {
    if (currentLang === 'es') return 'IVA cobrado menos IVA de compras deducibles';
    if (currentLang === 'en') return 'Collected VAT minus deductible purchase VAT';
    return 'IVA cobrado menos IVA de compras dedutíveis';
  };

  const getTaxReserveLabel = () => {
    if (currentLang === 'es') return 'Reserva Fiscal Total';
    if (currentLang === 'en') return 'Total Tax Reserve';
    return 'Reserva Fiscal Total';
  };

  const getTaxReserveSub = () => {
    const rate = taxEstimate.effectiveRate.toFixed(1);
    if (currentLang === 'es') return `Tasa efectiva global: ${rate}% de tus ingresos`;
    if (currentLang === 'en') return `Global effective rate: ${rate}% of your income`;
    return `Alíquota efetiva global: ${rate}% de suas receitas`;
  };

  const getAiDiagnosisLabel = () => {
    if (currentLang === 'es') return 'Diagnóstico de Optimización Fiscal IA';
    if (currentLang === 'en') return 'AI Tax Optimization Diagnosis';
    return 'Diagnóstico de Otimização Fiscal por IA';
  };

  const getAiDiagnosisSub = () => {
    if (currentLang === 'es') return 'Analiza tu patrón de facturación y gastos para identificar oportunidades legales de deducción.';
    if (currentLang === 'en') return 'Analyze your billing pattern and expenses to identify legal deduction opportunities.';
    return 'Analise seu padrão de faturamento e despesas para identificar oportunidades de dedução legal.';
  };

  const getGeneratingLabel = () => {
    if (currentLang === 'es') return 'Generando Recomendaciones...';
    if (currentLang === 'en') return 'Generating Recommendations...';
    return 'Gerando Recomendações...';
  };

  const getGenerateBtnLabel = () => {
    if (currentLang === 'es') return 'Generar Diagnóstico Fiscal';
    if (currentLang === 'en') return 'Generate Tax Diagnosis';
    return 'Gerar Diagnóstico Fiscal';
  };

  const getPotentialSavingsTitle = () => {
    if (currentLang === 'es') return 'Ahorro Fiscal Potencial Detectado';
    if (currentLang === 'en') return 'Potential Tax Savings Detected';
    return 'Economia Fiscal Potencial Detectada';
  };

  const getPotentialSavingsDesc = () => {
    if (currentLang === 'es') return 'Puedes reducir tu carga proyectada aprovechando deducciones no registradas.';
    if (currentLang === 'en') return 'You can reduce your projected tax load by taking advantage of unregistered deductions.';
    return 'Você pode reduzir sua carga tributária projetada aproveitando deduções não registradas.';
  };

  const getEstSavingsLabel = () => {
    if (currentLang === 'es') return 'Ahorro Est.';
    if (currentLang === 'en') return 'Est. Savings';
    return 'Economia Est.';
  };

  const getTacticalRecsTitle = () => {
    if (currentLang === 'es') return 'Recomendaciones Tácticas';
    if (currentLang === 'en') return 'Tactical Recommendations';
    return 'Recomendações Táticas';
  };

  const getTipPrefix = () => {
    if (currentLang === 'es') return 'Consejo';
    if (currentLang === 'en') return 'Tip';
    return 'Dica';
  };

  const getTaxCalendarReminderLabel = () => {
    if (currentLang === 'es') return 'Recordatorio Calendario Fiscal:';
    if (currentLang === 'en') return 'Tax Calendar Reminder:';
    return 'Lembrete do Calendário Fiscal:';
  };

  const getCallToActionButtonText = () => {
    if (currentLang === 'es') return 'Presiona el botón "Generar Diagnóstico Fiscal" para obtener un análisis automatizado con recomendaciones de ahorro basadas en tu régimen actual.';
    if (currentLang === 'en') return 'Press the "Generate Tax Diagnosis" button to get an automated analysis with savings recommendations based on your current regime.';
    return 'Pressione o botão "Gerar Diagnóstico Fiscal" para obter uma análise automatizada com recomendações de economia com base no seu regime atual.';
  };

  const getProUpgradeTitle = () => {
    if (currentLang === 'es') return '¿Necesitas exportar tu reporte contable?';
    if (currentLang === 'en') return 'Need to export your accounting report?';
    return 'Precisa exportar seu relatório contábil?';
  };

  const getProUpgradeDesc = () => {
    if (currentLang === 'es') return 'En la versión PRO puedes descargar reportes detallados en CSV o PDF para enviar directamente a tu contador.';
    if (currentLang === 'en') return 'In the PRO version you can download detailed reports in CSV or PDF to send directly to your accountant.';
    return 'Na versão PRO você pode baixar relatórios detalhados em CSV ou PDF para enviar diretamente ao seu contador.';
  };

  const getActivateProLabel = () => {
    if (currentLang === 'es') return 'Activar Nivel PRO';
    if (currentLang === 'en') return 'Activate PRO Level';
    return 'Ativar Nível PRO';
  };

  return (
    <div className="space-y-4 sm:space-y-6 max-w-5xl mx-auto pb-16 px-4 sm:px-0">
      {/* HEADER SECTION */}
      <div className="bg-[#0B1512] p-5 sm:p-6 rounded-2xl border border-[#182F2A] shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-[#11241F] text-[#14B8A6] rounded-lg border border-[#1C3A31]">
              <Calculator className="w-5 h-5" />
            </span>
            <h2 className="text-lg font-semibold text-white">{getTaxTitle()}</h2>
            <span className="hidden sm:inline-block text-[10px] font-mono bg-[#11241F] text-[#14B8A6] border border-[#1C3A31]/50 px-2 py-0.5 rounded-full">
              {currentLang === 'es' ? 'Proyección Pro' : currentLang === 'en' ? 'Pro Projection' : 'Projeção Pro'}
            </span>
          </div>
          <p className="text-xs text-[#7C9791] mt-1">
            {getTaxSubtitle()}
          </p>
        </div>

        {/* REGIME SELECTOR DROPDOWN */}
        <div className="bg-[#11241F]/30 p-2.5 rounded-xl border border-[#1C3A31] text-xs shrink-0 w-full md:w-auto">
          <label className="block text-[11px] text-[#7C9791] mb-1 font-semibold">{getActiveRegimeLabel()}</label>
          <select
            value={taxSettings.regime}
            onChange={(e) =>
              onUpdateTaxSettings({
                ...taxSettings,
                regime: e.target.value,
              })
            }
            className="w-full bg-[#0B1512] text-white px-3 py-1.5 rounded-lg border border-[#182F2A] text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-[#14B8A6]"
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
      </div>

      {/* TAX CARDS SUMMARY */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Ingresos vs Base Gravable */}
        <div className="bg-[#0B1512] p-5 rounded-2xl border border-[#182F2A] shadow-md">
          <span className="text-xs font-semibold text-[#7C9791] block">{getTaxableBaseLabel()}</span>
          <div className="text-2xl font-bold text-white mt-2 tracking-tight">
            {formatCurrency(taxEstimate.taxableIncome, currency)}
          </div>
          <p className="text-[11px] text-[#7C9791] mt-1">
            {getTaxableBaseSub()}
          </p>
        </div>

        {/* Card 2: ISR / Impuesto a la Renta */}
        <div className="bg-[#0B1512] p-5 rounded-2xl border border-[#182F2A] shadow-md">
          <span className="text-xs font-semibold text-[#7C9791] block">
            {getIncomeTaxLabel()}
          </span>
          <div className="text-2xl font-bold text-amber-400 mt-2 tracking-tight">
            {formatCurrency(taxEstimate.estimatedIncomeTax, currency)}
          </div>
          <p className="text-[11px] text-[#7C9791] mt-1">
            {getIncomeTaxSub()}
          </p>
        </div>

        {/* Card 3: IVA Estimado */}
        <div className="bg-[#0B1512] p-5 rounded-2xl border border-[#182F2A] shadow-md">
          <span className="text-xs font-semibold text-[#7C9791] block">
            {getVatLabel()}
          </span>
          <div className="text-2xl font-bold text-amber-400 mt-2 tracking-tight">
            {formatCurrency(taxEstimate.estimatedVAT, currency)}
          </div>
          <p className="text-[11px] text-[#7C9791] mt-1">
            {getVatSub()}
          </p>
        </div>

        {/* Card 4: Reserva Total Recomendada */}
        <div className="bg-[#0B1512] border border-[#182F2A] p-5 rounded-2xl shadow-md">
          <span className="text-xs font-semibold text-[#7C9791] uppercase tracking-wider block">
            {getTaxReserveLabel()}
          </span>
          <div className="text-2xl font-bold text-[#14B8A6] mt-2 tracking-tight">
            {formatCurrency(taxEstimate.totalEstimatedTax, currency)}
          </div>
          <p className="text-[11px] text-[#7C9791] mt-1 font-semibold">
            {getTaxReserveSub()}
          </p>
        </div>
      </div>

      {/* TAX DISCLAIMER NOTICE */}
      <div className="flex items-center gap-2 px-3 py-2 bg-[#17140B] rounded-xl border border-amber-500/20 text-xs text-amber-300 font-medium">
        <span className="shrink-0 text-sm">⚠️</span>
        <p className="text-xs text-amber-200/90 leading-relaxed">
          Esta es una estimación orientativa. Consulta a un contador profesional para confirmar los montos exactos según la legislación de tu país.
        </p>
      </div>

      {/* REGIME TAX DECLARATION ALERT CARD */}
      {(() => {
        const regimeAlert = getRegimeAlertInfo();
        return (
          <div className="bg-[#0B1512] p-5 rounded-2xl border border-[#182F2A] shadow-md relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="p-2.5 bg-[#11241F] text-[#14B8A6] rounded-xl border border-[#1C3A31] shrink-0 mt-0.5 shadow-sm">
                <Calendar className="w-5 h-5 text-[#14B8A6]" />
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-sm font-bold text-white">{regimeAlert.title}</h3>
                  <span className={`text-[10px] font-mono px-2.5 py-0.5 rounded-full border font-semibold ${regimeAlert.colorClass}`}>
                    {regimeAlert.badge}
                  </span>
                </div>
                <p className="text-xs font-semibold text-white/90">
                  <span className="text-[#14B8A6]">🗓️ </span>
                  <span className="text-[#CBD5E1]">{regimeAlert.reminder}</span>
                </p>
                <p className="text-xs text-[#7C9791] leading-relaxed flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 inline" />
                  <span>{regimeAlert.notice}</span>
                </p>
              </div>
            </div>
          </div>
        );
      })()}

      {/* TAX LOAD EVOLUTION CHART */}
      <div className="bg-[#0B1512] p-5 sm:p-6 rounded-2xl border border-[#182F2A] shadow-md text-white">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-6">
          <div>
            <h3 className="text-base sm:text-lg font-semibold text-white">
              Evolución de Ingresos, Gastos e Impuestos
            </h3>
            <p className="text-xs text-[#7C9791]">
              Histórico mensual estimado con base en tus transacciones registradas
            </p>
          </div>
          <div className="flex items-center gap-2 bg-[#081512] px-3 py-1.5 rounded-xl border border-[#182F2A] text-xs font-mono text-[#14B8A6]">
            <Clock className="w-3.5 h-3.5 text-[#14B8A6]" />
            <span>Últimos 6 Meses</span>
          </div>
        </div>

        {!monthlyTaxData.hasData || monthlyTaxData.data.length === 0 ? (
          <div className="p-8 bg-[#081512] rounded-xl border border-[#182F2A] text-center space-y-3">
            <TrendingDown className="w-8 h-8 text-[#7C9791] mx-auto opacity-60" />
            <p className="text-sm font-semibold text-white">
              Agrega transacciones para ver la evolución de tus impuestos.
            </p>
            <p className="text-xs text-[#7C9791]">
              Registra tus ingresos y gastos para generar automáticamente este gráfico comparativo.
            </p>
          </div>
        ) : (
          <div className="w-full h-72 sm:h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyTaxData.data} margin={{ top: 15, right: 20, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1C3A31" opacity={0.4} />
                <XAxis
                  dataKey="month"
                  stroke="#7C9791"
                  tick={{ fill: '#7C9791', fontSize: 12 }}
                  tickLine={{ stroke: '#1C3A31' }}
                />
                <YAxis
                  stroke="#7C9791"
                  tick={{ fill: '#7C9791', fontSize: 12 }}
                  tickLine={{ stroke: '#1C3A31' }}
                  tickFormatter={(val) => `$${val}`}
                />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const isPeakMonth = payload[0]?.payload?.isPeak && payload[0]?.payload?.['Impuestos Estimados'] > 0;
                      return (
                        <div className="bg-[#070E0C] p-3.5 rounded-xl border border-[#1C3A31] shadow-2xl text-xs space-y-2">
                          <div className="flex items-center justify-between gap-3 border-b border-[#182F2A] pb-1.5 font-bold text-white">
                            <span>{label}</span>
                            {isPeakMonth && (
                              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center gap-1">
                                <Sparkles className="w-3 h-3 inline" />
                                Pico Máximo
                              </span>
                            )}
                          </div>
                          {payload.map((entry: any, index: number) => (
                            <div key={`item-${index}`} className="flex items-center justify-between gap-4">
                              <span className="flex items-center gap-1.5 font-semibold" style={{ color: entry.color }}>
                                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
                                {entry.name}:
                              </span>
                              <span className="font-mono font-bold text-white">
                                {formatCurrency(entry.value, currency)}
                              </span>
                            </div>
                          ))}
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend
                  verticalAlign="top"
                  height={36}
                  formatter={(value) => <span className="text-xs text-white font-medium">{value}</span>}
                />
                {/* Línea 1: Ingresos (verde esmeralda #10B981) */}
                <Line
                  type="monotone"
                  dataKey="Ingresos"
                  stroke="#10B981"
                  strokeWidth={3}
                  dot={{ fill: '#10B981', r: 4 }}
                  activeDot={{ r: 6, fill: '#14B8A6' }}
                />
                {/* Línea 2: Gastos (rojo #E11D48) */}
                <Line
                  type="monotone"
                  dataKey="Gastos"
                  stroke="#E11D48"
                  strokeWidth={3}
                  dot={{ fill: '#E11D48', r: 4 }}
                  activeDot={{ r: 6, fill: '#FDA4AF' }}
                />
                {/* Línea 3: Impuestos Estimados (dorado #D4AF37) */}
                <Line
                  type="monotone"
                  dataKey="Impuestos Estimados"
                  stroke="#D4AF37"
                  strokeWidth={3}
                  dot={(props: any) => {
                    const { cx, cy, payload } = props;
                    if (!cx || !cy) return null;
                    if (payload.isPeak && payload['Impuestos Estimados'] > 0) {
                      return (
                        <g key={`peak-${cx}-${cy}`}>
                          <circle cx={cx} cy={cy} r={7} fill="#D4AF37" stroke="#FFF" strokeWidth={2} />
                        </g>
                      );
                    }
                    return <circle key={`dot-${cx}-${cy}`} cx={cx} cy={cy} r={4} fill="#D4AF37" />;
                  }}
                  activeDot={{ r: 8, fill: '#FBBF24', stroke: '#FFF', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* TAX OPTIMIZATION AI ENGINE */}
      <div className="bg-[#0B1512] p-6 rounded-2xl border border-[#182F2A] shadow-md space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[#182F2A] pb-4">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#14B8A6]" />
              <h3 className="font-semibold text-white text-base">
                {getAiDiagnosisLabel()}
              </h3>
            </div>
            <p className="text-xs text-[#7C9791] mt-0.5">
              {getAiDiagnosisSub()}
            </p>
          </div>

          <button
            onClick={handleGenerateAiAdvice}
            disabled={loadingAdvice}
            className="px-4 py-2.5 bg-[#14B8A6] hover:bg-[#0D9488] disabled:opacity-40 text-[#020504] font-bold text-xs rounded-xl transition flex items-center gap-2 shadow-[0_0_12px_rgba(20, 184, 166, 0.105)] shrink-0"
          >
            {loadingAdvice ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-[#020504]" />
                <span>{getGeneratingLabel()}</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-[#020504]" />
                <span>{getGenerateBtnLabel()}</span>
              </>
            )}
          </button>
        </div>

        {/* AI ADVICE RESULT DISPLAY */}
        {aiAdvice ? (
          <div className="space-y-4 animate-in fade-in duration-300">
            {/* Savings Callout */}
            <div className="p-4 bg-[#11241F]/40 border border-[#1C3A31] rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[#14B8A6] text-[#020504] rounded-lg font-bold">
                  <Lightbulb className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-white text-sm">
                    {getPotentialSavingsTitle()}
                  </h4>
                  <p className="text-xs text-[#7C9791] font-semibold">
                    {getPotentialSavingsDesc()}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs text-[#14B8A6] block uppercase font-mono font-bold">{getEstSavingsLabel()}</span>
                <span className="text-lg font-bold text-[#14B8A6] font-mono">
                  {formatCurrency(aiAdvice.potentialSavings, currency)}
                </span>
              </div>
            </div>

            {/* Recommendations Bullet List */}
            <div className="space-y-2">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-[#7C9791]">
                {getTacticalRecsTitle()}
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {aiAdvice.recommendations.map((rec, i) => (
                  <div
                    key={i}
                    className="p-3.5 bg-[#081512] rounded-xl border border-[#182F2A] text-xs text-white space-y-1"
                  >
                    <span className="font-bold text-[#14B8A6] block">{getTipPrefix()} #{i + 1}</span>
                    <p className="leading-snug text-[#7C9791] font-semibold">{rec}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Tax Calendar Tip */}
            <div className="p-3 bg-[#11241F]/20 rounded-xl text-xs text-white flex items-center gap-2 border border-[#1C3A31]">
              <Calendar className="w-4 h-4 text-[#14B8A6] shrink-0" />
              <span>
                <strong className="font-bold text-[#14B8A6]">{getTaxCalendarReminderLabel()}</strong> {aiAdvice.taxCalendarTip}
              </span>
            </div>
          </div>
        ) : (
          <div className="py-8 text-center text-[#7C9791] text-xs">
            {getCallToActionButtonText()}
          </div>
        )}
      </div>

      {/* FREEMIUM PRO EXPORT BANNER */}
      {plan !== 'PRO' && (
        <div className="p-5 bg-[#11241F]/30 text-white rounded-2xl border border-[#1C3A31] flex flex-col sm:flex-row items-center justify-between gap-4 shadow-md">
          <div className="flex items-center gap-3">
            <Crown className="w-6 h-6 text-amber-400 shrink-0" />
            <div>
              <h4 className="font-bold text-sm text-white">{getProUpgradeTitle()}</h4>
              <p className="text-xs text-[#7C9791]">
                {getProUpgradeDesc()}
              </p>
            </div>
          </div>
          <button
            onClick={onUpgradePlan}
            className="px-4 py-2 bg-[#14B8A6] hover:bg-[#0D9488] text-[#020504] font-bold text-xs rounded-xl shadow-[0_0_12px_rgba(20, 184, 166, 0.105)] transition shrink-0"
          >
            {getActivateProLabel()}
          </button>
        </div>
      )}
    </div>
  );
};
