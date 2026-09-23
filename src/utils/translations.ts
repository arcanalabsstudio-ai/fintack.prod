export type LanguageType = 'es' | 'en' | 'pt';

export interface TranslationKeys {
  appName: string;
  dashboard: string;
  transactions: string;
  scanner: string;
  tax: string;
  architecture: string;
  greeting: string;
  currencySelector: string;
  languageSelector: string;
  plan: string;
  proPlan: string;
  freePlan: string;
  upgradeToPro: string;
  activatePro: string;
  free: string;
  pro: string;
  regime: string;
  vatRate: string;
  incomeTaxRate: string;
  monthlyGoal: string;
  resetData: string;
  saveChanges: string;
  saved: string;
  close: string;
  settings: string;
  netBalance: string;
  incomeVsExpenses: string;
  grossIncome: string;
  operatingExpenses: string;
  deductible: string;
  freeMargin: string;
  postExpensesAndTax: string;
  recentMovements: string;
  viewAll: string;
  taxProjection: string;
  currentPeriodEst: string;
  totalTaxRes: string;
  categoryBreakdown: string;
  total: string;
  new: string;
  scan: string;
  freeModeActive: string;
  freeModeDesc: string;
  noTransactions: string;
  actions: string;
  delete: string;
  date: string;
  merchant: string;
  description: string;
  amount: string;
  category: string;
  movement: string;
  exportCSV: string;
  quickAddTitle: string;
  income: string;
  expense: string;
  deductibility: string;
  receipt: string;
  uploadReceipt: string;
  save: string;
  goalProgress: string;
  estimated: string;
  taxCalculationDisclaimer: string;
  receiptScannerTitle: string;
  receiptScannerSubtitle: string;
  selectPreset: string;
  clickOrDrag: string;
  scannerDisclaimer: string;
  quickAddButton: string;
  monetaryGoalUnit: string;
  resetConfirm: string;
  settingsDesc: string;
  deleteConfirm: string;
  merchantRequired: string;
  welcomeTitle: string;
  welcomeDesc: string;
  welcomeAdd: string;
}

export const TRANSLATIONS: Record<LanguageType, TranslationKeys> = {
  es: {
    appName: 'Fintack',
    dashboard: 'Dashboard',
    transactions: 'Historial',
    scanner: 'Escáner IA',
    tax: 'Impuestos',
    architecture: 'Centro de Control',
    greeting: 'Buenos días',
    currencySelector: 'Moneda Local',
    languageSelector: 'Idioma de la App',
    plan: 'Suscripción de la Cuenta',
    proPlan: 'Nivel PRO',
    freePlan: 'Nivel Gratuito',
    upgradeToPro: 'Probar Nivel PRO',
    activatePro: 'Activar PRO',
    free: 'Gratis',
    pro: 'PRO',
    regime: 'Régimen Tributario',
    vatRate: 'Tasa IVA (%)',
    incomeTaxRate: 'Tasa ISR/IRPF (%)',
    monthlyGoal: 'Meta Mensual de Ingresos',
    resetData: 'Restablecer Datos de Ejemplo',
    saveChanges: 'Guardar Cambios',
    saved: '¡Guardado!',
    close: 'Cerrar',
    settings: 'Configuración Fiscal & Plan',
    netBalance: 'Balance Neto Liquido',
    incomeVsExpenses: 'Ingresos vs Gastos',
    grossIncome: 'Ingresos Brutos',
    operatingExpenses: 'Gastos Operativos',
    deductible: 'deducibles',
    freeMargin: 'Margen Libre Real',
    postExpensesAndTax: 'Post-gastos y reserva',
    recentMovements: 'Últimos Movimientos',
    viewAll: 'Ver todo →',
    taxProjection: 'Proyección Tributaria',
    currentPeriodEst: 'Estimado Periodo Actual',
    totalTaxRes: 'Total Reserva Fiscal Est.',
    categoryBreakdown: 'Desglose de Gastos por Categoría',
    total: 'Total',
    new: 'Nuevo',
    scan: 'Escanear',
    freeModeActive: 'Modo Gratuito Activo',
    freeModeDesc: 'Desbloquea el análisis IA completo con el plan PRO.',
    noTransactions: 'No se encontraron movimientos.',
    actions: 'Acciones',
    delete: 'Eliminar',
    date: 'Fecha',
    merchant: 'Proveedor',
    description: 'Descripción',
    amount: 'Monto',
    category: 'Categoría',
    movement: 'Movimiento',
    exportCSV: 'Exportar CSV',
    quickAddTitle: 'Nuevo Registro',
    income: 'Ingreso',
    expense: 'Gasto',
    deductibility: 'Deducibilidad',
    receipt: 'Comprobante',
    uploadReceipt: 'Subir Comprobante',
    save: 'Guardar',
    goalProgress: 'de meta',
    estimated: 'ESTIMADO',
    taxCalculationDisclaimer: '* Cálculo aproximado basado en comprobantes registrados y tasa efectiva.',
    receiptScannerTitle: 'Escáner & Captura IA',
    receiptScannerSubtitle: 'Extrae automáticamente datos de tu ticket.',
    selectPreset: 'Seleccionar Demo Rápida',
    clickOrDrag: 'Haz clic para subir o arrastra un ticket aquí',
    scannerDisclaimer: 'Gemini OCR procesa el ticket de forma segura en el servidor.',
    quickAddButton: 'Nuevo Reg.',
    monetaryGoalUnit: 'Meta Mensual de Ingresos (Misma Moneda)',
    resetConfirm: '¿Restablecer datos de muestra del libro contable?',
    settingsDesc: 'Ajusta los parámetros para el cálculo tributario, moneda local e idioma de tu app.',
    deleteConfirm: '¿Estás seguro de que deseas eliminar esta transacción?',
    merchantRequired: 'El nombre del proveedor o cliente es obligatorio',
    welcomeTitle: 'Bienvenido a Fintack',
    welcomeDesc: 'Agrega tu primera transacción para comenzar a ver tu panorama fiscal',
    welcomeAdd: 'Agregar',
  },
  en: {
    appName: 'Fintack',
    dashboard: 'Dashboard',
    transactions: 'History',
    scanner: 'AI Scanner',
    tax: 'Taxes',
    architecture: 'Control Center',
    greeting: 'Good morning',
    currencySelector: 'Local Currency',
    languageSelector: 'App Language',
    plan: 'Account Subscription',
    proPlan: 'PRO Level',
    freePlan: 'Free Level',
    upgradeToPro: 'Try PRO Level',
    activatePro: 'Activate PRO',
    free: 'Free',
    pro: 'PRO',
    regime: 'Tax Regime',
    vatRate: 'VAT Rate (%)',
    incomeTaxRate: 'Income Tax Rate (%)',
    monthlyGoal: 'Monthly Income Goal',
    resetData: 'Reset Sample Data',
    saveChanges: 'Save Changes',
    saved: 'Saved!',
    close: 'Close',
    settings: 'Tax Settings & Plan',
    netBalance: 'Net Liquid Balance',
    incomeVsExpenses: 'Income vs Expenses',
    grossIncome: 'Gross Income',
    operatingExpenses: 'Operating Expenses',
    deductible: 'deductible',
    freeMargin: 'Real Free Margin',
    postExpensesAndTax: 'Post-expenses & reserve',
    recentMovements: 'Recent Transactions',
    viewAll: 'View all →',
    taxProjection: 'Tax Projection',
    currentPeriodEst: 'Current Period Estimate',
    totalTaxRes: 'Total Est. Tax Reserve',
    categoryBreakdown: 'Expenses Breakdown by Category',
    total: 'Total',
    new: 'New',
    scan: 'Scan',
    freeModeActive: 'Free Mode Active',
    freeModeDesc: 'Unlock full AI analysis with PRO plan.',
    noTransactions: 'No transactions found.',
    actions: 'Actions',
    delete: 'Delete',
    date: 'Date',
    merchant: 'Merchant',
    description: 'Description',
    amount: 'Amount',
    category: 'Category',
    movement: 'Movement',
    exportCSV: 'CSV',
    quickAddTitle: 'New Record',
    income: 'Income',
    expense: 'Expense',
    deductibility: 'Deductibility',
    receipt: 'Receipt',
    uploadReceipt: 'Upload Receipt',
    save: 'Save',
    goalProgress: 'of goal',
    estimated: 'ESTIMATED',
    taxCalculationDisclaimer: '* Approximate calculation based on registered receipts and effective rate.',
    receiptScannerTitle: 'AI Scanner & Capture',
    receiptScannerSubtitle: 'Automatically extract data from your receipt.',
    selectPreset: 'Select Quick Demo',
    clickOrDrag: 'Click to upload or drag a receipt here',
    scannerDisclaimer: 'Gemini OCR processes the receipt securely on the server.',
    quickAddButton: 'New Reg.',
    monetaryGoalUnit: 'Monthly Income Goal (Same Currency)',
    resetConfirm: 'Reset sample accounting book data?',
    settingsDesc: 'Adjust tax calculation parameters, local currency, and app language.',
    deleteConfirm: 'Are you sure you want to delete this transaction?',
    merchantRequired: 'The merchant or client name is required',
    welcomeTitle: 'Welcome to Fintack',
    welcomeDesc: 'Add your first transaction to start seeing your tax overview',
    welcomeAdd: 'Add',
  },
  pt: {
    appName: 'Fintack',
    dashboard: 'Painel',
    transactions: 'Histórico',
    scanner: 'Scanner IA',
    tax: 'Impostos',
    architecture: 'Centro de Controle',
    greeting: 'Bom dia',
    currencySelector: 'Moeda Local',
    languageSelector: 'Idioma do App',
    plan: 'Assinatura da Conta',
    proPlan: 'Nível PRO',
    freePlan: 'Nível Gratuito',
    upgradeToPro: 'Experimentar Nível PRO',
    activatePro: 'Ativar PRO',
    free: 'Grátis',
    pro: 'PRO',
    regime: 'Regime Tributário',
    vatRate: 'Taxa IVA (%)',
    incomeTaxRate: 'Taxa de Imposto (%)',
    monthlyGoal: 'Meta Mensal de Renda',
    resetData: 'Redefinir Dados de Exemplo',
    saveChanges: 'Salvar Alterações',
    saved: 'Salvo!',
    close: 'Fechar',
    settings: 'Configurações Fiscais e Plano',
    netBalance: 'Saldo Líquido',
    incomeVsExpenses: 'Receitas vs Despesas',
    grossIncome: 'Receitas Brutas',
    operatingExpenses: 'Despesas Operacionais',
    deductible: 'dedutíveis',
    freeMargin: 'Margem Livre Real',
    postExpensesAndTax: 'Pós-despesas e reserva',
    recentMovements: 'Últimos Movimentos',
    viewAll: 'Ver tudo →',
    taxProjection: 'Projeção de Impostos',
    currentPeriodEst: 'Estimado Período Atual',
    totalTaxRes: 'Total Reserva Fiscal Est.',
    categoryBreakdown: 'Detalhamento de Despesas por Categoria',
    total: 'Total',
    new: 'Novo',
    scan: 'Escanear',
    freeModeActive: 'Modo Gratuito Ativo',
    freeModeDesc: 'Desbloqueie a análise de IA completa com o plano PRO.',
    noTransactions: 'Nenhum movimento encontrado.',
    actions: 'Ações',
    delete: 'Excluir',
    date: 'Data',
    merchant: 'Estabelecimento',
    description: 'Descrição',
    amount: 'Valor',
    category: 'Categoria',
    movement: 'Movimento',
    exportCSV: 'CSV',
    quickAddTitle: 'Novo Registro',
    income: 'Receita',
    expense: 'Despesa',
    deductibility: 'Dedutibilidade',
    receipt: 'Comprovante',
    uploadReceipt: 'Enviar Comprovante',
    save: 'Salvar',
    goalProgress: 'da meta',
    estimated: 'ESTIMADO',
    taxCalculationDisclaimer: '* Cálculo aproximado baseado em comprovantes registrados e alíquota efetiva.',
    receiptScannerTitle: 'Scanner IA & Captura',
    receiptScannerSubtitle: 'Extraia dados do seu comprovante automaticamente.',
    selectPreset: 'Selecionar Demo Rápida',
    clickOrDrag: 'Clique para enviar ou arraste um comprovante aqui',
    scannerDisclaimer: 'O Gemini OCR processa o comprovante com segurança no servidor.',
    quickAddButton: 'Novo Reg.',
    monetaryGoalUnit: 'Meta Mensal de Receita (Mesma Moeda)',
    resetConfirm: 'Redefinir os dados de amostra do livro contábil?',
    settingsDesc: 'Ajuste os parâmetros para cálculo de impostos, moeda local e idioma do seu aplicativo.',
    deleteConfirm: 'Tem certeza de que deseja excluir esta transação?',
    merchantRequired: 'O nome do fornecedor ou cliente é obrigatório',
    welcomeTitle: 'Bem-vindo ao Fintack',
    welcomeDesc: 'Adicione sua primeira transação para começar a ver seu panorama fiscal',
    welcomeAdd: 'Adicionar',
  },
};

export interface CurrencyOption {
  code: string;
  symbol: string;
  name: string;
}

export const CURRENCY_OPTIONS: CurrencyOption[] = [
  { code: 'USD', symbol: '$', name: 'Dólar estadounidense (USD)' },
  { code: 'EUR', symbol: '€', name: 'Euro (EUR)' },
  { code: 'MXN', symbol: '$', name: 'Peso mexicano (MXN)' },
  { code: 'BRL', symbol: 'R$', name: 'Real brasileño (BRL)' },
  { code: 'ARS', symbol: '$', name: 'Peso argentino (ARS)' },
  { code: 'COP', symbol: '$', name: 'Peso colombiano (COP)' },
  { code: 'PEN', symbol: 'S/.', name: 'Sol peruano (PEN)' },
  { code: 'CLP', symbol: '$', name: 'Peso chileno (CLP)' },
  { code: 'GBP', symbol: '£', name: 'Libra esterlina (GBP)' },
  { code: 'JPY', symbol: '¥', name: 'Yen japonés (JPY)' },
];
