export type TransactionType = 'INCOME' | 'EXPENSE';

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  category: string;
  merchant: string;
  description: string;
  date: string;
  hasReceipt: boolean;
  receiptUrl?: string;
  receiptFileName?: string;
  deductiblePercent: number; // 0 to 100
  taxAmount?: number;
  taxNotes?: string;
  createdAt: string;
}

export type PlanType = 'LITE' | 'STANDARD' | 'PRO';

export interface BudgetSettings {
  enabled: boolean;
  totalMonthlyLimit: number;
  categoryLimits: Record<string, number>;
}

export interface SavingsGoalSettings {
  enabled: boolean;
  name: string;
  targetAmount: number;
  targetDate: string; // YYYY-MM-DD
  calculationPeriod: 'MONTH' | 'YEAR';
}

export interface CategoriesSettings {
  expense: string[];
  income: string[];
}

export interface TaxSettings {
  regime: string;
  vatRate: number; // e.g. 16 for 16%
  incomeTaxRate: number; // e.g. 15 for 15%
  estimatedMonthlyIncomeGoal: number;
  currency?: string; // e.g. 'USD'
  language?: 'es' | 'en' | 'pt'; // e.g. 'es'
  username?: string;
  plan?: PlanType;
  budgetSettings?: BudgetSettings;
  savingsGoal?: SavingsGoalSettings;
  categories?: CategoriesSettings;
}

export interface TaxEstimate {
  grossIncome: number;
  totalExpenses: number;
  deductibleExpenses: number;
  taxableIncome: number;
  estimatedVAT: number;
  estimatedIncomeTax: number;
  totalEstimatedTax: number;
  effectiveRate: number;
  marginAvailable: number;
}

export interface CategorySummary {
  category: string;
  amount: number;
  count: number;
  percentage: number;
  color: string;
}

export interface TaxAdviceAI {
  estimatedTax: number;
  effectiveTaxRatePercent: number;
  potentialSavings: number;
  recommendations: string[];
  taxCalendarTip: string;
}

export interface DeliverableDoc {
  hierarchy: {
    title: string;
    description: string;
    screens: { name: string; tag: string; description: string; access: 'FREE' | 'PREMIUM' }[];
  };
  wireframeMarkdown: string;
  dataFlowMarkdown: string;
  visualSpecs: {
    colorPalette: { name: string; hex: string; usage: string }[];
    typography: { role: string; family: string; size: string; weight: string }[];
    components: { name: string; spec: string }[];
  };
}

export type ActivityLogType = 'TRANSACTION_ADDED' | 'REGIME_CHANGED' | 'RECEIPT_SCANNED';

export interface ActivityLogItem {
  id: string;
  type: ActivityLogType;
  description: string;
  timestamp: string;
}
