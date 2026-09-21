import { Transaction, TaxSettings, DeliverableDoc, BudgetSettings, SavingsGoalSettings } from '../types';

export const INITIAL_TRANSACTIONS: Transaction[] = [
  {
    id: 'tx-1',
    type: 'INCOME',
    amount: 2800,
    category: 'Honorarios / Proyecto',
    merchant: 'Acme Corp Studio',
    description: 'Pago 50% Rediseño de App Móvil',
    date: '2026-07-22',
    hasReceipt: true,
    receiptFileName: 'Factura_INV_2026_089.pdf',
    deductiblePercent: 0, // Incomes aren't "expenses deductible", but base for tax
    taxAmount: 448,
    taxNotes: 'Factura emitida con IVA 16% desglosado. Retención ISR 10% aplicada.',
    createdAt: '2026-07-22T10:00:00Z',
  },
  {
    id: 'tx-2',
    type: 'EXPENSE',
    amount: 45,
    category: 'Software/Suscripciones',
    merchant: 'Figma Inc',
    description: 'Suscripción Mensual Figma Professional',
    date: '2026-07-20',
    hasReceipt: true,
    receiptFileName: 'Recibo_Figma_Julio.pdf',
    deductiblePercent: 100,
    taxAmount: 7.2,
    taxNotes: '100% deducible como herramienta de trabajo directo de diseño.',
    createdAt: '2026-07-20T14:30:00Z',
  },
  {
    id: 'tx-3',
    type: 'EXPENSE',
    amount: 180,
    category: 'Espacio de Trabajo',
    merchant: 'WeWork Co-Working',
    description: 'Pase Flex Mensual Escritorio',
    date: '2026-07-18',
    hasReceipt: true,
    receiptFileName: 'Comprobante_WeWork_Jul2026.pdf',
    deductiblePercent: 100,
    taxAmount: 28.8,
    taxNotes: '100% Deducible de ISR e IVA acreditable.',
    createdAt: '2026-07-18T09:15:00Z',
  },
  {
    id: 'tx-4',
    type: 'INCOME',
    amount: 1200,
    category: 'Consultoría / Retainer',
    merchant: 'Fintech Startup XYZ',
    description: 'Retainer Asesoría UX Semanal',
    date: '2026-07-15',
    hasReceipt: true,
    receiptFileName: 'Factura_INV_2026_088.pdf',
    deductiblePercent: 0,
    taxAmount: 192,
    taxNotes: 'Ingreso acreditado en cuenta fiscal.',
    createdAt: '2026-07-15T16:00:00Z',
  },
  {
    id: 'tx-5',
    type: 'EXPENSE',
    amount: 89,
    category: 'Equipamiento',
    merchant: 'Apple Store Online',
    description: 'Cargador USB-C 140W MacBook Pro',
    date: '2026-07-12',
    hasReceipt: true,
    receiptFileName: 'Ticket_Apple_Cargador.pdf',
    deductiblePercent: 100,
    taxAmount: 14.24,
    taxNotes: 'Inversión en equipo de cómputo indispensable.',
    createdAt: '2026-07-12T11:20:00Z',
  },
  {
    id: 'tx-6',
    type: 'EXPENSE',
    amount: 65,
    category: 'Alimentación/Reuniones',
    merchant: 'Café Bistro Central',
    description: 'Almuerzo de trabajo con cliente Acme',
    date: '2026-07-10',
    hasReceipt: true,
    receiptFileName: 'Factura_Bistro_Jul10.pdf',
    deductiblePercent: 50,
    taxAmount: 5.2,
    taxNotes: 'Deducción al 50% por consumo en restaurante justificado con cliente.',
    createdAt: '2026-07-10T15:45:00Z',
  },
  {
    id: 'tx-7',
    type: 'EXPENSE',
    amount: 28,
    category: 'Transporte',
    merchant: 'Uber Rides',
    description: 'Traslado a reunión presencial de entregable',
    date: '2026-07-08',
    hasReceipt: false,
    deductiblePercent: 100,
    taxAmount: 4.48,
    taxNotes: 'Gasto de transportación indispensable para prestación del servicio.',
    createdAt: '2026-07-08T18:10:00Z',
  },
];

export const DEFAULT_EXPENSE_CATEGORIES = [
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

export const DEFAULT_INCOME_CATEGORIES = [
  'Honorarios / Proyecto',
  'Consultoría / Retainer',
  'Venta de Productos / Kits',
  'Regalías / Cursos',
  'Otros Ingresos',
];

export const DEFAULT_BUDGET_SETTINGS: BudgetSettings = {
  enabled: true,
  totalMonthlyLimit: 1200,
  categoryLimits: {
    'Software/Suscripciones': 300,
    'Espacio de Trabajo': 500,
    'Equipamiento': 200,
    'Alimentación/Reuniones': 100,
    'Transporte': 80,
    'Honorarios Profesionales': 0,
    'Servicios Públicos': 0,
    'Marketing y Publicidad': 0,
    'Otros Gastos': 150,
  },
};

export const DEFAULT_SAVINGS_GOAL: SavingsGoalSettings = {
  enabled: true,
  name: 'Fondo de Emergencia',
  targetAmount: 5000,
  targetDate: '2026-12-31',
  calculationPeriod: 'MONTH',
};

export const DEFAULT_TAX_SETTINGS: TaxSettings = {
  regime: 'RESICO / Régimen Simplificado (México - 2.0% ISR)',
  vatRate: 16,
  incomeTaxRate: 2,
  estimatedMonthlyIncomeGoal: 5000,
  currency: 'USD',
  language: 'es',
  plan: 'PRO',
  budgetSettings: DEFAULT_BUDGET_SETTINGS,
  savingsGoal: DEFAULT_SAVINGS_GOAL,
  categories: {
    expense: DEFAULT_EXPENSE_CATEGORIES,
    income: DEFAULT_INCOME_CATEGORIES,
  },
};

export const SAMPLE_RECEIPT_PRESETS = [
  {
    title: 'Recibo Figma Pro ($45 USD)',
    merchant: 'Figma Inc.',
    amount: 45.0,
    taxAmount: 7.2,
    category: 'Software/Suscripciones',
    type: 'EXPENSE' as const,
    date: '2026-07-25',
    deductiblePercent: 100,
    taxNote: '100% Deducible por ser software directo de diseño profesional.',
    rawSummary: 'Factura mensual Figma Pro SaaS',
    sampleImage: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=400&q=80',
  },
  {
    title: 'Factura Co-Working ($180 USD)',
    merchant: 'WeWork Coworking Space',
    amount: 180.0,
    taxAmount: 28.8,
    category: 'Espacio de Trabajo',
    type: 'EXPENSE' as const,
    date: '2026-07-24',
    deductiblePercent: 100,
    taxNote: 'Deducible 100% como gasto operativo de espacio de trabajo.',
    rawSummary: 'Factura arrendamiento escritorio flex',
    sampleImage: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=400&q=80',
  },
  {
    title: 'Cobro Honorarios Cliente ($1,500 USD)',
    merchant: 'Cliente Global Tech Solutions',
    amount: 1500.0,
    taxAmount: 240.0,
    category: 'Honorarios / Proyecto',
    type: 'INCOME' as const,
    date: '2026-07-26',
    deductiblePercent: 0,
    taxNote: 'Ingreso sujeto a pago de ISR mensual y acreditamiento IVA.',
    rawSummary: 'Factura emitida por desarrollo frontend',
    sampleImage: 'https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&w=400&q=80',
  },
];

export const TECHNICAL_DELIVERABLES_DOC: DeliverableDoc = {
  hierarchy: {
    title: 'Estructura de Navegación y Jerarquía de Pantallas',
    description: 'Arquitectura mobile-first optimizada para interacción rápida a una sola mano, minimalismo visual y nula fricción.',
    screens: [
      {
        name: 'Dashboard (Pantalla Principal)',
        tag: 'Home / Vista Unificada',
        description: 'Vistas ejecutivas de balance mensual/semanal, semáforo de margen disponible, desglose visual de gastos y widget de estimación tributaria.',
        access: 'FREE',
      },
      {
        name: 'Registro Rápido (Modal 2 Pasos)',
        tag: 'Quick Add (+)',
        description: 'Ingreso ultrasimplificado: Paso 1 (Monto + Tipo) -> Paso 2 (Categoría + Escáner opcional). Cero campos innecesarios.',
        access: 'FREE',
      },
      {
        name: 'Escáner Inteligente IA (Comprobantes)',
        tag: 'OCR & AI Vision',
        description: 'Digitalización mediante cámara o archivo con extracción automática con Gemini AI de proveedor, total, IVA y tasa de deducibilidad.',
        access: 'PREMIUM',
      },
      {
        name: 'Módulo Estimación Tributaria',
        tag: 'Tax Center',
        description: 'Calculadora de impuestos en tiempo real, desglose IVA/ISR por régimen tributario y recomendaciones inteligentes de ahorro fiscal.',
        access: 'PREMIUM',
      },
      {
        name: 'Historial & Exportador de Reportes',
        tag: 'Transactions & Reports',
        description: 'Filtros avanzados de movimientos, vista previa de comprobantes adjuntos y exportación contable en CSV / PDF.',
        access: 'FREE',
      },
      {
        name: 'Configuración & Plan Freemium',
        tag: 'Settings & Premium',
        description: 'Ajuste de régimen fiscal, porcentajes de impuestos, metas financieras y gestión del plan de suscripción.',
        access: 'FREE',
      },
    ],
  },
  wireframeMarkdown: `
# WIREFRAME DESCRIPTIVO DE LA PANTALLA PRINCIPAL (DASHBOARD)

┌─────────────────────────────────────────────────────────────┐
│ [≡] FINTACK                                 [Plan: GRATUITO]│
│     Asistente Financiero Freelance                          │
├─────────────────────────────────────────────────────────────┤
│  BALANCE DEL MES (JULIO 2026)                               │
│  ──────────────────────────────────────────                 │
│  Balance Neto Disponible                                    │
│  $ 2,867.00 USD                       [+ 14% vs mes ant.]  │
│                                                             │
│  ┌──────────────────────┬────────────────────────────────┐  │
│  │ Ingresos: $ 4,000.00 │ Gastos: $ 383.00               │  │
│  └──────────────────────┴────────────────────────────────┘  │
│  │ Reserva Impuestos Est.: $ 750.00 (26.2%)              │  │
├─────────────────────────────────────────────────────────────┤
│  PROYECCIÓN TRIBUTARIA ESTIMADA                         [PRO]│
│  ┌───────────────────────────────────────────────────────┐  │
│  │ Est. Impuestos a Pagar: $ 750.00                       │  │
│  │ Ahorro Potencial con Deducciones: $ 120.00             │  │
│  │ 💡 "Registra tu recibo de internet para deducir un 15%│  │
│  │    adicional este mes."                               │  │
│  └───────────────────────────────────────────────────────┘  │
├─────────────────────────────────────────────────────────────┤
│  GASTOS POR CATEGORÍA                                       │
│  [Espacio Trabajo 47%]  [Equipamiento 23%]  [Software 12%]   │
│  █████████████████████████████░░░░░░░░░░░░░░░░░░░░░░░       │
├─────────────────────────────────────────────────────────────┤
│  ÚLTIMOS MOVIMIENTOS                                [Ver todo]│
│  [📄] Figma Professional          -$ 45.00  | 100% Deducible │
│  [📄] WeWork Co-Working           -$ 180.00 | 100% Deducible │
│  [💰] Acme Corp (Honorarios)      +$ 2,800  | Ingreso Fact. │
├─────────────────────────────────────────────────────────────┤
│  ACCIONES RÁPIDAS FLOATING (BOTTOM)                         │
│  [  📷 Escanear Recibo IA  ]    [  + Nuevo Movimiento  ]   │
└─────────────────────────────────────────────────────────────┘
`,
  dataFlowMarkdown: `
# FLUJO DE DATOS BÁSICO: CAPTURA DE RECIBO HASTA CÁLCULO DE IMPUESTOS

1. CAPTURA Y CARGA (CLIENTE)
   - El usuario toma foto o sube un PDF/imagen del comprobante desde la App.
   - O bien selecciona el modo "Registro Rápido en 2 Pasos".

2. PROCESAMIENTO IA CON GEMINI (BACKEND EXPRES / GEMINI 3.6 FLASH)
   - La imagen se envía vía \`POST /api/scan-receipt\` codificada en base64.
   - El modelo analiza la estructura del documento y extrae:
     * Nombre del emisor/proveedor
     * Monto total
     * Desglose de IVA / impuestos locales
     * Categoría operativa sugerida
     * % de Deducibilidad estimado según normativa freelance.

3. ALMACENAMIENTO Y ASOCIACIÓN LOCAL / CLOUD
   - El objeto \`Transaction\` se guarda con su metadato fiscal (\`deductiblePercent\`, \`taxNotes\`).
   - El comprobante queda ligado al ID del movimiento.

4. MOTOR DE CÁLCULO TRIBUTARIO (TAX CALCULATOR ENGINE)
   - Ingresos Brutos = Σ (Movimientos tipo INCOME)
   - Gastos Totales = Σ (Movimientos tipo EXPENSE)
   - Gastos Deducibles = Σ (Gasto_i × DeduciblePercent_i)
   - Base Gravable Neto = Max(0, Ingresos Brutos - Gastos Deducibles)
   - Impuesto Directo (ISR/IRPF) = Base Gravable × TasaRégimen%
   - IVA por Pagar = (IVA Cobrado) - (IVA Pagado de Gastos Deducibles)
   - Margen Disponible Real = Ingresos Brutos - Gastos Totales - Impuesto Proyectado.

5. RETROALIMENTACIÓN UI & RECOMENDACIONES
   - El Dashboard actualiza instantáneamente el velocímetro de margen y la proyección de reserva fiscal.
   - Gemini genera un diagnóstico con consejos de optimización fiscal para el trabajador independiente.
`,
  visualSpecs: {
    colorPalette: [
      { name: 'Graphite Canvas (Dark Base)', hex: '#0F172A', usage: 'Fondos principales, tarjetas de contraste y tipografía primaria en modo claro' },
      { name: 'Off-White Pure Surface', hex: '#F8FAFC', usage: 'Superficie de aplicación minimalista y fondo móvil' },
      { name: 'Emerald Emerald Accent (Positivo)', hex: '#059669', usage: 'Indicador de ingresos, ahorro tributario y margen saludable' },
      { name: 'Slate Neutral Border', hex: '#E2E8F0', usage: 'Líneas finas de separación (1px border), tarjetas sin sombra cargada' },
      { name: 'Amber Soft Tax Alert', hex: '#D97706', usage: 'Alertas de reserva fiscal e impuestos pendientes' },
      { name: 'Rose Expense Accent', hex: '#E11D48', usage: 'Gastos y alertas de deducción incompleta' },
    ],
    typography: [
      { role: 'Display Headings', family: 'Plus Jakarta Sans / System Sans', size: '24px - 28px', weight: '700 Bold' },
      { role: 'Section Titles', family: 'Plus Jakarta Sans', size: '16px - 18px', weight: '600 SemiBold' },
      { role: 'Body Text', family: 'Inter / System Sans', size: '14px - 15px', weight: '400 Regular' },
      { role: 'Micro Labels & Badges', family: 'JetBrains Mono / System Mono', size: '11px - 12px', weight: '500 Medium' },
    ],
    components: [
      { name: 'Cards', spec: 'Bordes finos 1px (#E2E8F0), esquina suave (12px), sin sombreados estridentes.' },
      { name: 'Pills/Badges', spec: 'Padding horizontal 2x vertical, texto sin salto de línea (white-space: nowrap).' },
      { name: 'Inputs', spec: 'Alto contraste, focus ring esmeralda/grafito tenue, etiquetas claras arriba del campo.' },
      { name: 'Quick Floating Action', spec: 'Botón flotante con 2 accesos rápidos: Escáner IA y Captura Manual.' },
    ],
  },
};
