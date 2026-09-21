import { Transaction, TaxSettings, CategorySummary, TaxEstimate } from '../types';

export function calculateTaxEstimate(
  transactions: Transaction[],
  settings: TaxSettings
): TaxEstimate {
  const safeTransactions = Array.isArray(transactions) ? transactions : [];
  const safeVatRate = typeof settings?.vatRate === 'number' ? settings.vatRate : 16;
  const safeIncomeTaxRate = typeof settings?.incomeTaxRate === 'number' ? settings.incomeTaxRate : 2;

  const totalIncome = safeTransactions
    .filter((t) => t.type === 'INCOME')
    .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

  const totalExpenses = safeTransactions
    .filter((t) => t.type === 'EXPENSE')
    .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

  const deductibleExpenses = safeTransactions
    .filter((t) => t.type === 'EXPENSE')
    .reduce((sum, t) => sum + ((Number(t.amount) || 0) * (Number(t.deductiblePercent) || 0)) / 100, 0);

  const taxableIncome = Math.max(0, totalIncome - deductibleExpenses);

  // Estimación de IVA (IVA Cobrado menos IVA Acreditable Deducible)
  const vatCollected = (totalIncome * safeVatRate) / 100;
  const vatPaidDeductible = (deductibleExpenses * safeVatRate) / 100;
  const estimatedVAT = Math.max(0, vatCollected - vatPaidDeductible);

  // Estimación de Impuesto a la Renta (ISR / IRPF / Directo)
  const estimatedIncomeTax = (taxableIncome * safeIncomeTaxRate) / 100;

  const totalEstimatedTax = estimatedVAT + estimatedIncomeTax;

  const effectiveRate = totalIncome > 0 ? (totalEstimatedTax / totalIncome) * 100 : 0;

  const marginAvailable = totalIncome - totalExpenses - totalEstimatedTax;

  return {
    grossIncome: totalIncome,
    totalExpenses,
    deductibleExpenses,
    taxableIncome,
    estimatedVAT,
    estimatedIncomeTax,
    totalEstimatedTax,
    effectiveRate,
    marginAvailable,
  };
}

const CATEGORY_COLORS: Record<string, string> = {
  'Software/Suscripciones': '#3B82F6', // Blue
  'Espacio de Trabajo': '#10B981', // Emerald
  'Equipamiento': '#8B5CF6', // Purple
  'Alimentación/Reuniones': '#F59E0B', // Amber
  'Transporte': '#EC4899', // Pink
  'Servicios Profesionales': '#6366F1', // Indigo
  'Servicios Públicos': '#14B8A6', // Teal
  'Educación/Cursos': '#06B6D4', // Cyan
  'Honorarios / Proyecto': '#10B981',
  'Consultoría / Retainer': '#059669',
  'Otros': '#64748B', // Slate
};

export function getCategoryBreakdown(transactions: Transaction[], type: 'EXPENSE' | 'INCOME' = 'EXPENSE'): CategorySummary[] {
  const filtered = transactions.filter((t) => t.type === type);
  const total = filtered.reduce((sum, t) => sum + t.amount, 0);

  if (total === 0) return [];

  const map: Record<string, { amount: number; count: number }> = {};

  filtered.forEach((t) => {
    if (!map[t.category]) {
      map[t.category] = { amount: 0, count: 0 };
    }
    map[t.category].amount += t.amount;
    map[t.category].count += 1;
  });

  const categories = Object.entries(map).map(([catName, data]) => ({
    category: catName,
    amount: data.amount,
    count: data.count,
    percentage: Math.round((data.amount / total) * 100),
    color: CATEGORY_COLORS[catName] || '#64748B',
  }));

  return categories.sort((a, b) => b.amount - a.amount);
}

export function formatCurrency(amount: number | undefined | null, currencyCodeOrSymbol: string = 'USD'): string {
  const safeNum = typeof amount === 'number' && !isNaN(amount) ? amount : 0;
  
  const symbols: Record<string, string> = {
    USD: '$',
    EUR: '€',
    MXN: '$',
    BRL: 'R$',
    ARS: '$',
    COP: '$',
    PEN: 'S/.',
    CLP: '$',
    GBP: '£',
    JPY: '¥',
  };

  const symbol = symbols[currencyCodeOrSymbol] || currencyCodeOrSymbol || '$';
  
  return `${symbol}${safeNum.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}
