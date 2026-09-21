// Smart categorization dictionary & rules for financial transactions
export interface CategoryRule {
  keywords: string[];
  category: string;
  type: 'EXPENSE' | 'INCOME';
  deductiblePercent: number;
}

export const AUTO_CATEGORY_RULES: CategoryRule[] = [
  // Technology / Software
  {
    keywords: [
      'figma', 'adobe', 'canva', 'github', 'gitlab', 'jetbrains', 'aws', 'amazon web services',
      'google cloud', 'gcp', 'azure', 'vercel', 'netlify', 'digitalocean', 'heroku', 'chatgpt',
      'openai', 'anthropic', 'midjourney', 'slack', 'zoom', 'notion', 'linear', 'jira', 'atlassian',
      'dropbox', 'google drive', 'microsoft 365', 'office 365', 'hostinger', 'godaddy', 'namecheap',
      'apple developer', 'cursor', 'mongodb', 'supabase', 'mailchimp', 'hubspot', 'loom'
    ],
    category: 'Software & Suscripciones',
    type: 'EXPENSE',
    deductiblePercent: 100,
  },
  // Hardware & Office
  {
    keywords: [
      'apple store', 'dell', 'lenovo', 'hp store', 'office depot', 'officemax', 'lumen',
      'best buy', 'amazon mx', 'amazon.com', 'mercadolibre', 'steren', 'logitech', 'ikea',
      'papeleria', 'computadora', 'teclado', 'monitor', 'laptop'
    ],
    category: 'Equipo & Oficina',
    type: 'EXPENSE',
    deductiblePercent: 100,
  },
  // Transport & Travel
  {
    keywords: [
      'uber', 'didi', 'cabify', 'taxi', 'lyft', 'aeromexico', 'volaris', 'vivaaerobus', 'iberia',
      'avianca', 'latam', 'american airlines', 'united airlines', 'airbnb', 'hotel', 'booking.com',
      'expedia', 'gasolinera', 'pemex', 'shell', 'bp gas', 'oxxo gas', 'estacionamiento', 'peaje', 'tag pase'
    ],
    category: 'Transporte & Viajes',
    type: 'EXPENSE',
    deductiblePercent: 50,
  },
  // Food & Client Meals
  {
    keywords: [
      'starbucks', 'restaurante', 'restaurant', 'cafe', 'coffee', 'rappi', 'ubereats', 'didi food',
      'vips', 'toks', 'sanborns', 'alsea', 'mcdonalds', 'burger king', 'dominos', 'italiannis',
      'chilis', 'bistro', 'panaderia', 'pasteleria'
    ],
    category: 'Comidas & Clientes',
    type: 'EXPENSE',
    deductiblePercent: 50,
  },
  // Telecommunications & Utilities
  {
    keywords: [
      'telmex', 'totalplay', 'izzy', 'megacable', 'att', 'at&t', 'telcel', 'movistar', 'vodafone',
      'cfe', 'luz', 'agua', 'internet', 'fibra optica'
    ],
    category: 'Servicios & Internet',
    type: 'EXPENSE',
    deductiblePercent: 100,
  },
  // Marketing & Advertising
  {
    keywords: [
      'facebook ads', 'meta ads', 'google ads', 'adwords', 'tiktok ads', 'linkedin ads',
      'twitter ads', 'x ads', 'instagram ads', 'marketing', 'publicidad'
    ],
    category: 'Marketing & Publicidad',
    type: 'EXPENSE',
    deductiblePercent: 100,
  },
  // Education & Books
  {
    keywords: [
      'udemy', 'coursera', 'platzi', 'domestika', 'edx', 'oreilly', 'packt', 'kindle books',
      'libro', 'curso', 'workshop', 'masterclass', 'educacion'
    ],
    category: 'Educación & Cursos',
    type: 'EXPENSE',
    deductiblePercent: 100,
  },
  // Taxes, Accounting & Banking Fees
  {
    keywords: [
      'sat', 'hacienda', 'aeat', 'irs', 'impuesto', 'comision bancaria', 'comision por manejo',
      'cuota mensual banco', 'interes tarjeta', 'contador', 'auditoria'
    ],
    category: 'Impuestos & Comisiones',
    type: 'EXPENSE',
    deductiblePercent: 100,
  },
  // Income / Clients
  {
    keywords: [
      'honorarios', 'factura cliente', 'pago cliente', 'transferencia spei recibida', 'deposito',
      'stripe payout', 'paypal transfer', 'upwork', 'fiverr', 'toptal', 'remoto', 'nomina', 'sueldo',
      'ingreso por servicios', 'consultoria', 'desarrollo software', 'diseno grafico'
    ],
    category: 'Ingresos por Servicios',
    type: 'INCOME',
    deductiblePercent: 0,
  },
];

export function detectCategoryAndDeductibility(
  descriptionOrMerchant: string,
  detectedType: 'EXPENSE' | 'INCOME' = 'EXPENSE'
): { category: string; deductiblePercent: number; type: 'EXPENSE' | 'INCOME' } {
  const text = (descriptionOrMerchant || '').toLowerCase();

  for (const rule of AUTO_CATEGORY_RULES) {
    if (rule.keywords.some((keyword) => text.includes(keyword))) {
      return {
        category: rule.category,
        deductiblePercent: rule.deductiblePercent,
        type: rule.type || detectedType,
      };
    }
  }

  // Fallback
  return {
    category: detectedType === 'INCOME' ? 'Otros Ingresos' : 'Otros Gastos',
    deductiblePercent: detectedType === 'INCOME' ? 0 : 100,
    type: detectedType,
  };
}

// Clean and normalize text
export function cleanMerchantName(rawText: string): string {
  if (!rawText) return 'Movimiento Bancario';
  let cleaned = rawText
    .replace(/^(\d{2,4}[-/]\d{2}[-/]\d{2,4}\s*)/, '') // remove leading dates
    .replace(/(SPEI|TRANSF|TRANSFERENCIA|CARGO|COMPRA|DEBITO|CREDITO|PAGO EN|PAGO|RETIRO|DEPOSITO)\s+/gi, '')
    .replace(/\s+(S\.?A\.? DE C\.?V\.?|S\.?L\.?|LLC|INC\.?|CORP\.?|SA|SL)/gi, '')
    .replace(/[*#_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (cleaned.length < 2) return rawText.trim() || 'Movimiento';
  // Capitalize properly
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}
