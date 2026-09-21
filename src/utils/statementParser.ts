import { detectCategoryAndDeductibility, cleanMerchantName } from './statementCategorizer';
import { generateUniqueId } from './idGenerator';

export interface ParsedStatementTransaction {
  id: string;
  date: string;
  merchant: string;
  description: string;
  amount: number;
  type: 'EXPENSE' | 'INCOME';
  category: string;
  deductiblePercent: number;
  isDuplicate?: boolean;
  duplicateReason?: string;
  selected?: boolean;
}

// Normalize dates in formats like DD/MM/YYYY, MM/DD/YYYY, YYYY-MM-DD, DD-MM-YYYY
export function normalizeDate(dateStr: string): string {
  if (!dateStr) return new Date().toISOString().slice(0, 10);
  const trimmed = dateStr.trim();

  // Already YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return trimmed;
  }

  // DD/MM/YYYY or DD-MM-YYYY
  const dmyMatch = trimmed.match(/^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{2,4})/);
  if (dmyMatch) {
    let day = parseInt(dmyMatch[1], 10);
    let month = parseInt(dmyMatch[2], 10);
    let year = parseInt(dmyMatch[3], 10);
    if (year < 100) year += 2000;

    // Sanity swap if month > 12 and day <= 12
    if (month > 12 && day <= 12) {
      const temp = month;
      month = day;
      day = temp;
    }

    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${year}-${pad(month)}-${pad(day)}`;
  }

  // Try standard parse
  const parsed = new Date(trimmed);
  if (!isNaN(parsed.getTime())) {
    return parsed.toISOString().slice(0, 10);
  }

  return new Date().toISOString().slice(0, 10);
}

// Parse CSV text with automatic column detection (Date, Merchant/Description, Amount/Debit/Credit, Type)
export function parseCSVStatement(csvText: string): ParsedStatementTransaction[] {
  if (!csvText || typeof csvText !== 'string') return [];

  // Split into lines
  const lines = csvText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length === 0) return [];

  // Detect delimiter (, or ; or \t)
  const firstLine = lines[0];
  const commaCount = (firstLine.match(/,/g) || []).length;
  const semiCount = (firstLine.match(/;/g) || []).length;
  const tabCount = (firstLine.match(/\t/g) || []).length;

  let delimiter = ',';
  if (semiCount > commaCount && semiCount > tabCount) delimiter = ';';
  if (tabCount > commaCount && tabCount > semiCount) delimiter = '\t';

  // Function to split row handling quotes
  const splitRow = (rowStr: string): string[] => {
    const regex = new RegExp(
      `(?:^|${delimiter === '\t' ? '\\t' : delimiter})(?:"([^"]*(?:""[^"]*)*)"|([^"${delimiter === '\t' ? '\\t' : delimiter}]*))`,
      'g'
    );
    const result: string[] = [];
    let match;
    while ((match = regex.exec(rowStr)) !== null) {
      let val = match[1] !== undefined ? match[1].replace(/""/g, '"') : match[2];
      result.push((val || '').trim());
    }
    return result;
  };

  const rawRows = lines.map(splitRow);
  if (rawRows.length === 0) return [];

  // Find Header Row (look for words like fecha, date, monto, amount, concepto, descripcion, cargo, abono, debito, credito)
  let headerIndex = -1;
  let dateCol = -1;
  let descCol = -1;
  let amountCol = -1;
  let debitCol = -1;
  let creditCol = -1;
  let typeCol = -1;

  for (let r = 0; r < Math.min(10, rawRows.length); r++) {
    const row = rawRows[r].map((c) => c.toLowerCase());
    const dIdx = row.findIndex((c) => c.includes('fecha') || c.includes('date') || c.includes('dia') || c.includes('fec'));
    const amtIdx = row.findIndex((c) => c.includes('monto') || c.includes('amount') || c.includes('importe') || c.includes('total') || c.includes('valor'));
    const dscIdx = row.findIndex((c) => c.includes('concepto') || c.includes('descrip') || c.includes('comercio') || c.includes('merchant') || c.includes('detalle') || c.includes('establecimiento') || c.includes('beneficiario'));
    const debIdx = row.findIndex((c) => c.includes('cargo') || c.includes('debito') || c.includes('debit') || c.includes('egreso') || c.includes('gasto') || c.includes('salida'));
    const credIdx = row.findIndex((c) => c.includes('abono') || c.includes('credito') || c.includes('credit') || c.includes('ingreso') || c.includes('deposito') || c.includes('entrada'));

    if (dIdx !== -1 && (amtIdx !== -1 || debIdx !== -1 || credIdx !== -1 || dscIdx !== -1)) {
      headerIndex = r;
      dateCol = dIdx;
      descCol = dscIdx !== -1 ? dscIdx : 1;
      amountCol = amtIdx;
      debitCol = debIdx;
      creditCol = credIdx;
      typeCol = row.findIndex((c) => c.includes('tipo') || c.includes('type') || c.includes('naturaleza'));
      break;
    }
  }

  // Fallback column guessing if no explicit header
  if (headerIndex === -1) {
    headerIndex = 0;
    // Guess columns based on data types in first data row
    const testRow = rawRows[0];
    dateCol = testRow.findIndex((c) => /\d{1,4}[/\-.]\d{1,2}[/\-.]\d{1,4}/.test(c));
    if (dateCol === -1) dateCol = 0;

    // Find numeric column for amount
    const numIndices = testRow
      .map((c, idx) => ({ idx, isNum: /^[-+]?\$?\s*[\d,.]+(\.\d{1,2})?$/.test(c.replace(/[$€\s]/g, '')) }))
      .filter((item) => item.isNum && item.idx !== dateCol);

    if (numIndices.length > 0) {
      amountCol = numIndices[numIndices.length - 1].idx;
    } else {
      amountCol = testRow.length > 2 ? testRow.length - 1 : 2;
    }

    descCol = dateCol === 0 ? 1 : 0;
  }

  const parsedTransactions: ParsedStatementTransaction[] = [];
  const startRow = headerIndex + 1;

  for (let i = startRow; i < rawRows.length; i++) {
    const row = rawRows[i];
    if (row.length < 2) continue;

    const rawDate = row[dateCol] || '';
    if (!rawDate || !/\d/.test(rawDate)) continue;

    const cleanDate = normalizeDate(rawDate);
    const rawDesc = row[descCol] || 'Movimiento Bancario';
    const merchant = cleanMerchantName(rawDesc);

    let amount = 0;
    let type: 'EXPENSE' | 'INCOME' = 'EXPENSE';

    if (debitCol !== -1 && row[debitCol] && parseFloat(row[debitCol].replace(/[^0-9.-]/g, '')) > 0) {
      amount = Math.abs(parseFloat(row[debitCol].replace(/[^0-9.-]/g, '')));
      type = 'EXPENSE';
    } else if (creditCol !== -1 && row[creditCol] && parseFloat(row[creditCol].replace(/[^0-9.-]/g, '')) > 0) {
      amount = Math.abs(parseFloat(row[creditCol].replace(/[^0-9.-]/g, '')));
      type = 'INCOME';
    } else if (amountCol !== -1 && row[amountCol]) {
      const rawAmtStr = row[amountCol].replace(/[$€\s]/g, '').trim();
      const isNegative = rawAmtStr.startsWith('-') || rawAmtStr.includes('(') || rawAmtStr.toLowerCase().includes('cr');
      const numVal = parseFloat(rawAmtStr.replace(/[^0-9.]/g, ''));
      if (!isNaN(numVal) && numVal > 0) {
        amount = numVal;
        // In bank statements, negative or cargos are expenses, positive or credits are income (or viceversa depending on statement)
        if (typeCol !== -1 && row[typeCol]) {
          const typeStr = row[typeCol].toLowerCase();
          if (typeStr.includes('ing') || typeStr.includes('cred') || typeStr.includes('abo') || typeStr.includes('dep')) {
            type = 'INCOME';
          } else {
            type = 'EXPENSE';
          }
        } else {
          type = isNegative ? 'EXPENSE' : 'EXPENSE'; // Default expenses for bank purchases
        }
      }
    }

    if (amount <= 0) continue;

    // Automatic categorization
    const autoCat = detectCategoryAndDeductibility(rawDesc + ' ' + merchant, type);

    parsedTransactions.push({
      id: generateUniqueId('statement-tx'),
      date: cleanDate,
      merchant,
      description: rawDesc,
      amount,
      type: autoCat.type,
      category: autoCat.category,
      deductiblePercent: autoCat.deductiblePercent,
      selected: true,
    });
  }

  return parsedTransactions;
}

// Duplicate Detection against existing DB transactions
export function detectStatementDuplicates(
  incoming: ParsedStatementTransaction[],
  existing: Array<{ id?: string; date: string; amount: number; merchant: string }>
): {
  itemsWithDuplicates: ParsedStatementTransaction[];
  duplicateCount: number;
  newCount: number;
} {
  let duplicateCount = 0;

  const itemsWithDuplicates = incoming.map((item) => {
    const normIncomingMerchant = item.merchant.toLowerCase().replace(/\s+/g, '');
    const isDup = existing.some((ex) => {
      // Direct ID collision check
      if (ex.id && item.id && ex.id === item.id) return true;

      const normExMerchant = ex.merchant.toLowerCase().replace(/\s+/g, '');
      const sameDate = ex.date === item.date;
      const sameAmount = Math.abs(ex.amount - item.amount) < 0.01;
      const sameMerchant =
        normExMerchant.includes(normIncomingMerchant) ||
        normIncomingMerchant.includes(normExMerchant) ||
        item.description.toLowerCase().includes(normExMerchant);

      return sameDate && sameAmount && sameMerchant;
    });

    if (isDup) {
      duplicateCount++;
      return {
        ...item,
        isDuplicate: true,
        duplicateReason: 'Misma fecha, monto y comercio ya registrado',
        selected: false, // by default do not select duplicates
      };
    }

    return {
      ...item,
      isDuplicate: false,
      selected: true,
    };
  });

  return {
    itemsWithDuplicates,
    duplicateCount,
    newCount: incoming.length - duplicateCount,
  };
}
