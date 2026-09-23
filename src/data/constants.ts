import { TaxSettings, DeliverableDoc, BudgetSettings, SavingsGoalSettings } from '../types';

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
# WIREFRAME ASCII DE BAJA FIDELIDAD: FLUJO PRINCIPAL DASHBOARD
┌─────────────────────────────────────────────────────────────┐
│ FINTACK LEDGER                  [EN VIVO] [USD/EUR] [Ajustes]│
├─────────────────────────────────────────────────────────────┤
│  BALANCE NETO DISPONIBLE                                    │
│  $ 0.00                                                     │
│  Ingresos: $ 0.00       | Gastos: $ 0.00                    │
├─────────────────────────────────────────────────────────────┤
│  ESTIMACIÓN DE IMPUESTOS (RÉGIMEN ACTUAL)                    │
│  ISR: $ 0.00            | IVA Neto: $ 0.00                  │
│  Total Provisión Fiscal: $ 0.00                             │
├─────────────────────────────────────────────────────────────┤
│  ACCIONES RÁPIDAS FLOATING (BOTTOM)                         │
│  [  📷 Escanear Recibo IA  ]    [  + Nuevo Movimiento  ]   │
└─────────────────────────────────────────────────────────────┘
`,
  dataFlowMarkdown: `
# FLUJO DE DATOS: CAPTURA DE RECIBO HASTA CÁLCULO DE IMPUESTOS

1. CAPTURA Y CARGA (CLIENTE)
   - El usuario toma foto o sube un PDF/imagen del comprobante desde la App.
   - O bien selecciona el modo "Registro Rápido en 2 Pasos".

2. PROCESAMIENTO IA CON GEMINI
   - La imagen se envía vía \`POST /api/scan-receipt\` codificada en base64.
   - El modelo analiza la estructura del documento y extrae proveedor, total, IVA y deducibilidad.

3. ALMACENAMIENTO Y ASOCIACIÓN LOCAL / CLOUD
   - El objeto \`Transaction\` se guarda con su metadato fiscal (\`deductiblePercent\`, \`taxNotes\`).
   - El comprobante queda ligado al ID del movimiento.

4. MOTOR DE CÁLCULO TRIBUTARIO
   - Ingresos Brutos = Σ (Movimientos tipo INCOME)
   - Gastos Totales = Σ (Movimientos tipo EXPENSE)
   - Base Gravable = Max(0, Ingresos Brutos - Gastos Deducibles)
   - Impuesto Directo = Base Gravable × TasaRégimen%
   - Margen Disponible = Ingresos Brutos - Gastos Totales - Impuesto Proyectado.
`,
  visualSpecs: {
    colorPalette: [
      { name: 'Graphite Canvas (Dark Base)', hex: '#0F172A', usage: 'Fondos principales, tarjetas de contraste y tipografía principal en modo claro' },
      { name: 'Off-White Pure Surface', hex: '#F8FAFC', usage: 'Superficie de aplicación minimalista y fondo móvil' },
      { name: 'Emerald Accent (Positivo)', hex: '#059669', usage: 'Indicador de ingresos, ahorro tributario y margen saludable' },
      { name: 'Slate Neutral Border', hex: '#E2E8F0', usage: 'Líneas finas de separación (1px border), tarjetas sin sombra cargada' },
      { name: 'Amber Soft Tax Alert', hex: '#D97706', usage: 'Alertas de reserva fiscal e impuestos pendientes' },
      { name: 'Rose Expense Accent', hex: '#E11D48', usage: 'Gastos y alertas de deducción' },
    ],
    typography: [
      { role: 'Display Headings', family: 'Plus Jakarta Sans / System Sans', size: '24px - 28px', weight: '700 Bold' },
      { role: 'Section Titles', family: 'Plus Jakarta Sans', size: '16px - 18px', weight: '600 SemiBold' },
      { role: 'Body Text', family: 'Inter / System Sans', size: '14px - 15px', weight: '400 Regular' },
      { role: 'Micro Labels & Badges', family: 'JetBrains Mono / System Mono', size: '11px - 12px', weight: '500 Medium' },
    ],
    components: [
      { name: 'Cards', spec: 'Bordes finos 1px (#182F2A), esquina suave (16px), sin sombreados estridentes.' },
      { name: 'Pills/Badges', spec: 'Padding horizontal 2x vertical, texto sin salto de línea (white-space: nowrap).' },
      { name: 'Inputs', spec: 'Alto contraste, focus ring esmeralda/grafito tenue, etiquetas claras arriba del campo.' },
      { name: 'Quick Floating Action', spec: 'Botón flotante con 2 accesos rápidos: Escáner IA y Captura Manual.' },
    ],
  },
};
