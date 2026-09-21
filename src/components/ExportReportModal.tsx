import React, { useState, useMemo } from 'react';
import { Transaction, TaxSettings } from '../types';
import { calculateTaxEstimate, getCategoryBreakdown, formatCurrency } from '../utils/taxCalculator';
import { TRANSLATIONS } from '../utils/translations';
import { X, FileSpreadsheet, FileText, Calendar, Filter, Download, CheckCircle2, AlertCircle, FileCode } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

export type ExportPeriodOption = 'THIS_MONTH' | 'LAST_3_MONTHS' | 'LAST_6_MONTHS' | 'THIS_YEAR' | 'ALL' | 'CUSTOM';

// Helper para rasterizar el isotipo triangular oficial y la tipografía FINTACK con degradado teal a blanco
const generateFintackBrandHeaderImage = async (): Promise<string> => {
  return new Promise((resolve) => {
    try {
      const canvas = document.createElement('canvas');
      const scale = 3;
      const width = 360;
      const height = 90;
      canvas.width = width * scale;
      canvas.height = height * scale;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve('');
        return;
      }
      ctx.scale(scale, scale);

      // Isotipo triangular exacto del Header / Splash Screen
      const svgString = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="31 41 120.5 105" width="60" height="52">
        <defs>
          <linearGradient id="g1" x1="72.167" y1="116.299" x2="148.16" y2="53" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stop-color="#008c68" />
            <stop offset="100%" stop-color="#00f5b6" />
          </linearGradient>
          <radialGradient id="g2" cx="122.85" cy="115.35" r="7.05" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stop-color="#ffffff" />
            <stop offset="100%" stop-color="#a7f3d0" />
          </radialGradient>
        </defs>
        <path fill="url(#g1)" stroke="#004d38" stroke-width="1.6" d="M 91.499998,44.1 34.026839,143.64643 H 148.5 l -9.57642,-16.58684 H 102 L 120.61881,94.81086 110.59998,77.457743 82.015863,126.96689 H 63.3 l 38.1328,-66.047952 z" />
        <circle fill="url(#g2)" stroke="#004d38" stroke-width="0.8" cx="122.85" cy="115.35" r="7.05" />
      </svg>`;

      const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(svgBlob);
      const img = new Image();

      const drawRemaining = () => {
        // Nombre FINTACK con degradado de verde teal a blanco
        const textGrad = ctx.createLinearGradient(70, 0, 245, 0);
        textGrad.addColorStop(0, '#14B8A6');
        textGrad.addColorStop(0.55, '#99F6E4');
        textGrad.addColorStop(1, '#FFFFFF');

        // text-xl (20px) font-black (900) Plus Jakarta Sans
        ctx.font = '900 22px "Plus Jakarta Sans", sans-serif';
        ctx.fillStyle = textGrad;
        ctx.textBaseline = 'alphabetic';

        // Tracking espaciado tracking-widest (uppercase)
        const brandText = 'FINTACK';
        let curX = 72;
        const letterSpacing = 4.8;
        for (let i = 0; i < brandText.length; i++) {
          const char = brandText[i];
          ctx.fillText(char, curX, 39);
          curX += ctx.measureText(char).width + letterSpacing;
        }

        // Subtítulo "Smart Tax Ledger" en text-[8px] (9px en canvas) font-light (300) Plus Jakarta Sans
        ctx.font = '300 9px "Plus Jakarta Sans", sans-serif';
        ctx.fillStyle = '#7C9791';
        const subText = 'SMART TAX LEDGER';
        let subX = 73;
        const subSpacing = 2.4; // tracking-[0.25em]
        for (let i = 0; i < subText.length; i++) {
          const char = subText[i];
          ctx.fillText(char, subX, 58);
          subX += ctx.measureText(char).width + subSpacing;
        }

        try {
          const dataUrl = canvas.toDataURL('image/png');
          resolve(dataUrl);
        } catch {
          resolve('');
        }
      };

      img.onload = () => {
        ctx.drawImage(img, 0, 16, 62, 54);
        URL.revokeObjectURL(url);
        drawRemaining();
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        drawRemaining();
      };
      img.src = url;
    } catch {
      resolve('');
    }
  });
};

interface ExportReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactions: Transaction[];
  taxSettings: TaxSettings;
  defaultPeriod?: ExportPeriodOption;
}

export const ExportReportModal: React.FC<ExportReportModalProps> = ({
  isOpen,
  onClose,
  transactions,
  taxSettings,
  defaultPeriod = 'THIS_MONTH',
}) => {
  const currentLang = taxSettings.language || 'es';
  const t = TRANSLATIONS[currentLang] || TRANSLATIONS['es'];
  const currency = taxSettings.currency || 'USD';

  const [period, setPeriod] = useState<ExportPeriodOption>(defaultPeriod);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Filter transactions based on selected period
  const filteredTransactions = useMemo(() => {
    if (!Array.isArray(transactions)) return [];

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    return transactions.filter((tx) => {
      if (!tx.date) return false;
      const txDate = new Date(tx.date);

      switch (period) {
        case 'THIS_MONTH': {
          return txDate.getFullYear() === currentYear && txDate.getMonth() === currentMonth;
        }
        case 'LAST_3_MONTHS': {
          const threeMonthsAgo = new Date(currentYear, currentMonth - 2, 1);
          return txDate >= threeMonthsAgo;
        }
        case 'LAST_6_MONTHS': {
          const sixMonthsAgo = new Date(currentYear, currentMonth - 5, 1);
          return txDate >= sixMonthsAgo;
        }
        case 'THIS_YEAR': {
          return txDate.getFullYear() === currentYear;
        }
        case 'CUSTOM': {
          if (startDate && tx.date < startDate) return false;
          if (endDate && tx.date > endDate) return false;
          return true;
        }
        case 'ALL':
        default:
          return true;
      }
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, period, startDate, endDate]);

  const taxEstimate = calculateTaxEstimate(filteredTransactions, taxSettings);
  const expenseCategories = getCategoryBreakdown(filteredTransactions, 'EXPENSE');

  const getPeriodLabel = () => {
    switch (period) {
      case 'THIS_MONTH':
        return 'Mes actual';
      case 'LAST_3_MONTHS':
        return 'Últimos 3 meses';
      case 'LAST_6_MONTHS':
        return 'Últimos 6 meses';
      case 'THIS_YEAR':
        return 'Año actual';
      case 'CUSTOM':
        return startDate || endDate ? `${startDate || 'Inicio'} a ${endDate || 'Hoy'}` : 'Personalizado';
      case 'ALL':
      default:
        return 'Todo el historial';
    }
  };

  const showNotification = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => {
      setSuccessToast(null);
    }, 3500);
  };

  // Export to Excel
  const handleExportExcel = () => {
    setIsExporting(true);
    try {
      const today = new Date();
      const pad = (n: number) => String(n).padStart(2, '0');
      const formattedDate = `${pad(today.getDate())}/${pad(today.getMonth() + 1)}/${today.getFullYear()}`;
      const userName = taxSettings.username?.trim() || 'Usuario Fintack';
      const periodLabel = getPeriodLabel();

      const headerAoa = [
        ['FINTACK', 'Smart Tax Ledger'],
        [`Generado el ${formattedDate}`],
        [`Contribuyente: ${userName}`, `Período: ${periodLabel}`],
        ['Reporte generado automáticamente por Fintack • v1.0.0 / 2026'],
        [], // Fila en blanco
      ];

      const rows = filteredTransactions.map((t) => ({
        Fecha: t.date,
        Tipo: t.type === 'INCOME' ? 'Ingreso' : 'Gasto',
        Categoría: t.category || 'Sin categoría',
        Comercio: t.merchant || '',
        Descripción: t.description || '',
        Monto: t.amount,
        'Deducible (%)': `${t.deductiblePercent}%`,
        'Monto Deducible': ((t.amount * t.deductiblePercent) / 100).toFixed(2),
        'Impuesto Estimado': t.taxAmount || 0,
      }));

      const worksheet = XLSX.utils.aoa_to_sheet(headerAoa);
      XLSX.utils.sheet_add_json(worksheet, rows, { origin: 'A6' });

      // Widths
      worksheet['!cols'] = [
        { wch: 14 }, // Fecha
        { wch: 12 }, // Tipo
        { wch: 24 }, // Categoria
        { wch: 24 }, // Comercio
        { wch: 32 }, // Descripcion
        { wch: 14 }, // Monto
        { wch: 14 }, // Deducible
        { wch: 16 }, // Monto deducible
        { wch: 18 }, // Impuesto
      ];

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Transacciones');

      const periodClean = periodLabel.replace(/\s+/g, '_');
      XLSX.writeFile(workbook, `Fintack_Reporte_${periodClean}_${today.toISOString().split('T')[0]}.xlsx`);

      showNotification('✅ Archivo Excel descargado exitosamente');
    } catch (error) {
      console.error('Error exporting Excel:', error);
      alert('Ocurrió un error al generar el archivo Excel.');
    } finally {
      setIsExporting(false);
    }
  };

  // Export to CSV con membrete oficial Fintack
  const handleExportCSV = () => {
    setIsExporting(true);
    try {
      const today = new Date();
      const pad = (n: number) => String(n).padStart(2, '0');
      const formattedDate = `${pad(today.getDate())}/${pad(today.getMonth() + 1)}/${today.getFullYear()}`;
      const userName = taxSettings.username?.trim() || 'Usuario Fintack';
      const periodLabel = getPeriodLabel();

      const metadataLines = [
        '# ==========================================================================',
        '# FINTACK - Smart Tax Ledger',
        `# Generado el ${formattedDate}`,
        `# Contribuyente: ${userName}`,
        `# Período: ${periodLabel}`,
        `# Moneda: ${currency}`,
        '# Reporte generado automáticamente por Fintack • v1.0.0 / 2026',
        '# ==========================================================================',
        '',
      ];

      const headers = [
        'Fecha',
        'Tipo',
        'Categoría',
        'Comercio',
        'Descripción',
        'Monto',
        'Deducible (%)',
        'Monto Deducible',
        'Impuesto Estimado',
      ];

      const rows = filteredTransactions.map((t) => [
        t.date || '',
        t.type === 'INCOME' ? 'Ingreso' : 'Gasto',
        t.category || 'Sin categoría',
        t.merchant || '',
        t.description || '',
        t.amount,
        `${t.deductiblePercent}%`,
        ((t.amount * t.deductiblePercent) / 100).toFixed(2),
        t.taxAmount || 0,
      ]);

      const csvContent =
        'data:text/csv;charset=utf-8,\uFEFF' +
        metadataLines.join('\n') +
        [
          headers.map((h) => `"${h}"`).join(','),
          ...rows.map((r) => r.map((val) => `"${String(val).replace(/"/g, '""')}"`).join(',')),
        ].join('\n') +
        '\n\n# Reporte generado automáticamente por Fintack • v1.0.0 / 2026\n';

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      const periodClean = periodLabel.replace(/\s+/g, '_');
      link.setAttribute('download', `Fintack_Reporte_${periodClean}_${today.toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      showNotification('✅ Archivo CSV descargado exitosamente');
    } catch (error) {
      console.error('Error exporting CSV:', error);
      alert('Ocurrió un error al generar el archivo CSV.');
    } finally {
      setIsExporting(false);
    }
  };

  // Export to PDF con nuevo logotipo, degradado y membrete Fintack
  const handleExportPDF = async () => {
    setIsExporting(true);
    try {
      const doc = new jsPDF();
      const userName = taxSettings.username?.trim() || 'Usuario Fintack';
      const regime = taxSettings.regime || 'Régimen Simplificado de Confianza (RESICO)';
      const periodLabel = getPeriodLabel();

      // Palette Constants
      const PRIMARY_DARK = [11, 21, 18]; // #0B1512
      const EMERALD = [16, 185, 129]; // #10B981
      const EMERALD_LIGHT = [0, 245, 182]; // #00F5B6
      const TEXT_MAIN = [15, 23, 42]; // #0F172A
      const TEXT_MUTED = [100, 116, 139]; // #64748B
      const BG_LIGHT = [248, 250, 252]; // #F8FAFC
      const BORDER_COLOR = [226, 232, 240]; // #E2E8F0

      // 1. TOP HEADER BANNER (Fondo Oscuro Fintack)
      doc.setFillColor(PRIMARY_DARK[0], PRIMARY_DARK[1], PRIMARY_DARK[2]);
      doc.rect(0, 0, 210, 40, 'F');

      // Accent Emerald Line
      doc.setFillColor(EMERALD_LIGHT[0], EMERALD_LIGHT[1], EMERALD_LIGHT[2]);
      doc.rect(0, 40, 210, 2, 'F');

      // Rasterizar e insertar logotipo triangular oficial + degradado FINTACK + Subtítulo "Smart Tax Ledger"
      try {
        const brandLogoDataUrl = await generateFintackBrandHeaderImage();
        if (brandLogoDataUrl) {
          doc.addImage(brandLogoDataUrl, 'PNG', 14, 6.5, 76, 19);
        } else {
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(22);
          doc.setTextColor(EMERALD_LIGHT[0], EMERALD_LIGHT[1], EMERALD_LIGHT[2]);
          doc.text('FINTACK', 14, 21);

          doc.setFont('courier', 'bold');
          doc.setFontSize(8.5);
          doc.setTextColor(124, 151, 145);
          doc.text('SMART TAX LEDGER', 14, 27);
        }
      } catch {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(22);
        doc.setTextColor(EMERALD_LIGHT[0], EMERALD_LIGHT[1], EMERALD_LIGHT[2]);
        doc.text('FINTACK', 14, 21);

        doc.setFont('courier', 'bold');
        doc.setFontSize(8.5);
        doc.setTextColor(124, 151, 145);
        doc.text('SMART TAX LEDGER', 14, 27);
      }

      // Top Right User Metadata con Fecha de Generación
      const today = new Date();
      const pad = (n: number) => String(n).padStart(2, '0');
      const formattedDate = `${pad(today.getDate())}/${pad(today.getMonth() + 1)}/${today.getFullYear()}`;

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(EMERALD_LIGHT[0], EMERALD_LIGHT[1], EMERALD_LIGHT[2]);
      doc.text(`Generado el ${formattedDate}`, 196, 14, { align: 'right' });

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(240, 245, 245);
      doc.text(`Contribuyente: ${userName}`, 196, 20.5, { align: 'right' });
      doc.text(`Régimen: ${regime.split('(')[0].trim()}`, 196, 26.5, { align: 'right' });
      doc.text(`Período: ${periodLabel}`, 196, 32.5, { align: 'right' });

      // 2. RESUMEN EJECUTIVO (KPI CARDS)
      let y = 50;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(TEXT_MAIN[0], TEXT_MAIN[1], TEXT_MAIN[2]);
      doc.text('1. Resumen Ejecutivo de Flujo de Caja', 14, y);

      y += 6;

      const cardWidth = 43.5;
      const cardHeight = 25;
      const gap = 3.5;
      const startX = 14;

      const netBalance = taxEstimate.grossIncome - taxEstimate.totalExpenses;
      const taxRate = taxEstimate.effectiveRate || 0;

      const metrics = [
        { label: 'INGRESOS TOTALES', value: formatCurrency(taxEstimate.grossIncome, currency), color: [16, 185, 129], sub: '100% de la facturación' },
        { label: 'GASTOS TOTALES', value: formatCurrency(taxEstimate.totalExpenses, currency), color: [239, 68, 68], sub: `${taxEstimate.grossIncome > 0 ? Math.round((taxEstimate.totalExpenses / taxEstimate.grossIncome) * 100) : 0}% de ingresos` },
        { label: 'SALDO NETO', value: formatCurrency(netBalance, currency), color: netBalance >= 0 ? [37, 99, 235] : [239, 68, 68], sub: 'Margen neto acumulado' },
        { label: 'IMPUESTOS EST.', value: formatCurrency(taxEstimate.totalEstimatedTax, currency), color: [217, 119, 6], sub: `Tasa est. (${taxRate.toFixed(1)}%)` },
      ];

      metrics.forEach((m, idx) => {
        const cx = startX + idx * (cardWidth + gap);
        doc.setFillColor(BG_LIGHT[0], BG_LIGHT[1], BG_LIGHT[2]);
        doc.setDrawColor(BORDER_COLOR[0], BORDER_COLOR[1], BORDER_COLOR[2]);
        doc.roundedRect(cx, y, cardWidth, cardHeight, 2.5, 2.5, 'FD');

        // Top Accent Bar
        doc.setFillColor(m.color[0], m.color[1], m.color[2]);
        doc.rect(cx, y, cardWidth, 2.5, 'F');

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(6.5);
        doc.setTextColor(TEXT_MUTED[0], TEXT_MUTED[1], TEXT_MUTED[2]);
        doc.text(m.label, cx + 4, y + 8);

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9.5);
        doc.setTextColor(TEXT_MAIN[0], TEXT_MAIN[1], TEXT_MAIN[2]);
        doc.text(m.value, cx + 4, y + 16);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(6.5);
        doc.setTextColor(100, 116, 139);
        doc.text(m.sub, cx + 4, y + 21.5);
      });

      y += cardHeight + 10;

      // 3. GRÁFICOS Y REPRESENTACIÓN VISUAL
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(TEXT_MAIN[0], TEXT_MAIN[1], TEXT_MAIN[2]);
      doc.text('2. Análisis de Distribución y Deducibilidad', 14, y);

      y += 6;

      // Left Box: Distribución por Categorías
      const boxW = 89;
      const boxH = 46;

      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(BORDER_COLOR[0], BORDER_COLOR[1], BORDER_COLOR[2]);
      doc.roundedRect(14, y, boxW, boxH, 2, 2, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(PRIMARY_DARK[0], PRIMARY_DARK[1], PRIMARY_DARK[2]);
      doc.text('Top Categorías de Gasto', 18, y + 7);

      let catY = y + 13;
      const topCategories = expenseCategories.slice(0, 4);

      if (topCategories.length === 0) {
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(8);
        doc.setTextColor(TEXT_MUTED[0], TEXT_MUTED[1], TEXT_MUTED[2]);
        doc.text('Sin registros de gastos en este período', 18, catY + 10);
      } else {
        topCategories.forEach((cat) => {
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(7.5);
          doc.setTextColor(TEXT_MAIN[0], TEXT_MAIN[1], TEXT_MAIN[2]);
          const catName = cat.category.length > 18 ? cat.category.substring(0, 18) + '...' : cat.category;
          doc.text(catName, 18, catY + 3);

          doc.setFont('helvetica', 'normal');
          doc.setTextColor(TEXT_MUTED[0], TEXT_MUTED[1], TEXT_MUTED[2]);
          doc.text(`${cat.percentage}%`, 62, catY + 3, { align: 'right' });

          doc.setFont('helvetica', 'bold');
          doc.setTextColor(TEXT_MAIN[0], TEXT_MAIN[1], TEXT_MAIN[2]);
          doc.text(formatCurrency(cat.amount, currency), 98, catY + 3, { align: 'right' });

          // Progress Bar Background
          doc.setFillColor(241, 245, 249);
          doc.rect(18, catY + 4.5, 80, 2.5, 'F');

          // Progress Bar Fill
          doc.setFillColor(EMERALD[0], EMERALD[1], EMERALD[2]);
          doc.rect(18, catY + 4.5, Math.max(1, (80 * cat.percentage) / 100), 2.5, 'F');

          catY += 8;
        });
      }

      // Right Box: Resumen Fiscal y Deducibilidad
      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(BORDER_COLOR[0], BORDER_COLOR[1], BORDER_COLOR[2]);
      doc.roundedRect(107, y, boxW, boxH, 2, 2, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(PRIMARY_DARK[0], PRIMARY_DARK[1], PRIMARY_DARK[2]);
      doc.text('Eficiencia Fiscal y Deducibilidad', 111, y + 7);

      const totalDeductibleAmount = filteredTransactions
        .filter((t) => t.type === 'EXPENSE')
        .reduce((sum, t) => sum + (t.amount * (t.deductiblePercent || 0)) / 100, 0);

      const deductiblePercentRatio = taxEstimate.totalExpenses > 0
        ? Math.round((totalDeductibleAmount / taxEstimate.totalExpenses) * 100)
        : 0;

      let rightY = y + 14;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(TEXT_MUTED[0], TEXT_MUTED[1], TEXT_MUTED[2]);
      doc.text('Monto Deducible Estimado:', 111, rightY);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(EMERALD[0], EMERALD[1], EMERALD[2]);
      doc.text(formatCurrency(totalDeductibleAmount, currency), 191, rightY, { align: 'right' });

      rightY += 7;
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(TEXT_MUTED[0], TEXT_MUTED[1], TEXT_MUTED[2]);
      doc.text('Ratio Deducible vs Total Gastos:', 111, rightY);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(TEXT_MAIN[0], TEXT_MAIN[1], TEXT_MAIN[2]);
      doc.text(`${deductiblePercentRatio}%`, 191, rightY, { align: 'right' });

      rightY += 6;
      // Deducible visual bar
      doc.setFillColor(241, 245, 249);
      doc.rect(111, rightY, 80, 4, 'F');

      doc.setFillColor(EMERALD[0], EMERALD[1], EMERALD[2]);
      doc.rect(111, rightY, Math.max(1, (80 * deductiblePercentRatio) / 100), 4, 'F');

      rightY += 9;
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(7);
      doc.setTextColor(TEXT_MUTED[0], TEXT_MUTED[1], TEXT_MUTED[2]);
      doc.text('* Mantén tus comprobantes fiscales y facturas respaldadas.', 111, rightY);

      y += boxH + 10;

      // 4. TABLA DETALLADA DE TRANSACCIONES
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(TEXT_MAIN[0], TEXT_MAIN[1], TEXT_MAIN[2]);
      doc.text(`3. Detalle de Transacciones (${filteredTransactions.length} registros)`, 14, y);

      y += 4;

      const tableRows = filteredTransactions.map((tx) => [
        tx.date || '',
        tx.type === 'INCOME' ? 'INGRESO' : 'GASTO',
        tx.category || 'Sin categoría',
        tx.merchant || tx.description || '-',
        formatCurrency(tx.amount, currency),
        tx.type === 'EXPENSE' ? `${tx.deductiblePercent}%` : 'N/A',
      ]);

      autoTable(doc, {
        startY: y,
        head: [['FECHA', 'TIPO', 'CATEGORÍA', 'COMERCIO / DESCRIPCIÓN', 'MONTO', 'DEDUCIBLE']],
        body: tableRows,
        headStyles: {
          fillColor: PRIMARY_DARK as [number, number, number],
          textColor: EMERALD_LIGHT as [number, number, number],
          fontSize: 7.5,
          fontStyle: 'bold',
          halign: 'left',
          cellPadding: 3,
        },
        bodyStyles: {
          fontSize: 7.5,
          textColor: [51, 65, 85],
          cellPadding: 2.8,
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252],
        },
        columnStyles: {
          0: { cellWidth: 22 }, // Fecha
          1: { cellWidth: 20, fontStyle: 'bold' }, // Tipo
          2: { cellWidth: 38 }, // Categoria
          3: { cellWidth: 58 }, // Comercio
          4: { cellWidth: 26, halign: 'right', fontStyle: 'bold' }, // Monto
          5: { cellWidth: 18, halign: 'center' }, // Deducible
        },
        didParseCell: (data) => {
          if (data.section === 'body' && data.column.index === 1) {
            const raw = String(data.cell.raw);
            if (raw === 'INGRESO') {
              data.cell.styles.textColor = [16, 185, 129];
            } else {
              data.cell.styles.textColor = [239, 68, 68];
            }
          }
        },
        margin: { left: 14, right: 14, bottom: 20 },
      });

      // 5. FOOTER EN TODAS LAS PÁGINAS
      const totalPages = doc.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);

        // Divider
        doc.setDrawColor(BORDER_COLOR[0], BORDER_COLOR[1], BORDER_COLOR[2]);
        doc.line(14, 282, 196, 282);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(TEXT_MUTED[0], TEXT_MUTED[1], TEXT_MUTED[2]);
        doc.text('Reporte generado automáticamente por Fintack • v1.0.0 / 2026', 14, 287);
        doc.text(`Página ${i} de ${totalPages}`, 196, 287, { align: 'right' });
      }

      const periodClean = periodLabel.replace(/\s+/g, '_');
      doc.save(`Fintack_Reporte_${periodClean}.pdf`);

      showNotification('✅ Reporte PDF generado y descargado exitosamente');
    } catch (error) {
      console.error('Error exporting PDF:', error);
      alert('Ocurrió un error al generar el archivo PDF.');
    } finally {
      setIsExporting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      {/* Toast Notification */}
      {successToast && (
        <div className="fixed top-6 right-6 z-50 bg-[#0B1512] border border-[#14B8A6]/40 text-[#14B8A6] px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2 text-sm font-medium animate-in slide-in-from-top duration-300">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>{successToast}</span>
        </div>
      )}

      <div className="bg-[#0B1512] border border-[#182F2A] rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-[#182F2A] flex items-center justify-between bg-[#08120F]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-[#11241F] rounded-xl border border-[#1C3A31] text-[#14B8A6]">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Exportar Reporte Financiero</h3>
              <p className="text-xs text-[#7C9791]">Descarga un resumen ejecutivo de tus finanzas en PDF o Excel</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#7C9791] hover:text-white rounded-lg hover:bg-[#11241F] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 overflow-y-auto">
          {/* Step 1: Select Period */}
          <div>
            <label className="text-xs font-semibold text-[#7C9791] uppercase tracking-wider block mb-2.5 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-[#14B8A6]" />
              <span>1. Selecciona el período del reporte</span>
            </label>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {[
                { id: 'THIS_MONTH', label: 'Mes actual' },
                { id: 'LAST_3_MONTHS', label: 'Últimos 3 meses' },
                { id: 'LAST_6_MONTHS', label: 'Últimos 6 meses' },
                { id: 'THIS_YEAR', label: 'Año actual' },
                { id: 'ALL', label: 'Todo el historial' },
                { id: 'CUSTOM', label: 'Personalizado' },
              ].map((opt) => {
                const isSelected = period === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setPeriod(opt.id as ExportPeriodOption)}
                    className={`px-3 py-2.5 rounded-xl text-xs font-semibold border transition text-center ${
                      isSelected
                        ? 'bg-[#11241F] border-[#14B8A6] text-[#14B8A6] shadow-sm'
                        : 'bg-[#08120F] border-[#182F2A] text-[#9CA3AF] hover:text-white hover:border-[#22443C]'
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>

            {/* Custom Date Inputs */}
            {period === 'CUSTOM' && (
              <div className="mt-3 p-3 bg-[#08120F] border border-[#182F2A] rounded-xl grid grid-cols-2 gap-3 animate-in fade-in duration-150">
                <div>
                  <label className="text-[11px] font-medium text-[#7C9791] block mb-1">Fecha inicio</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full bg-[#0B1512] border border-[#182F2A] rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#14B8A6]"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-[#7C9791] block mb-1">Fecha fin</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full bg-[#0B1512] border border-[#182F2A] rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#14B8A6]"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Step 2: Summary Preview */}
          <div className="p-4 bg-[#08120F] border border-[#182F2A] rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#7C9791] uppercase tracking-wider">
                Resumen del Período ({getPeriodLabel()})
              </span>
              <span className="text-xs font-medium text-[#14B8A6] bg-[#14B8A6]/10 px-2 py-0.5 rounded-full border border-[#14B8A6]/20">
                {filteredTransactions.length} transacciones
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-1 border-t border-[#182F2A]/60">
              <div>
                <span className="text-[10px] text-[#7C9791] block">Ingresos</span>
                <span className="text-xs font-semibold text-emerald-400">
                  {formatCurrency(taxEstimate.grossIncome, currency)}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-[#7C9791] block">Gastos</span>
                <span className="text-xs font-semibold text-rose-400">
                  {formatCurrency(taxEstimate.totalExpenses, currency)}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-[#7C9791] block">Saldo Neto</span>
                <span className="text-xs font-semibold text-white">
                  {formatCurrency(taxEstimate.grossIncome - taxEstimate.totalExpenses, currency)}
                </span>
              </div>
            </div>
          </div>

          {/* Step 3: Export Format Buttons */}
          <div className="space-y-2.5">
            <label className="text-xs font-semibold text-[#7C9791] uppercase tracking-wider block">
              2. Elige el formato de descarga
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* PDF Button */}
              <button
                type="button"
                id="btn-export-pdf"
                onClick={handleExportPDF}
                disabled={isExporting || filteredTransactions.length === 0}
                className="p-3.5 bg-[#11241F] hover:bg-[#163029] disabled:opacity-50 border border-[#14B8A6]/40 hover:border-[#14B8A6] text-white rounded-xl transition flex flex-col items-start gap-2.5 text-left group cursor-pointer shadow-sm"
              >
                <div className="flex items-center gap-2.5 w-full">
                  <div className="p-2.5 bg-[#0B1512] text-[#14B8A6] rounded-xl border border-[#182F2A] group-hover:scale-105 transition shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                  <h4 className="text-xs font-bold text-white group-hover:text-[#14B8A6] transition">
                    Reporte PDF
                  </h4>
                </div>
                <p className="text-[10px] text-[#7C9791] leading-tight">
                  Membrete oficial, resumen ejecutivo, gráficos y desglose fiscal
                </p>
              </button>

              {/* CSV Button */}
              <button
                type="button"
                id="btn-export-csv"
                onClick={handleExportCSV}
                disabled={isExporting || filteredTransactions.length === 0}
                className="p-3.5 bg-[#08120F] hover:bg-[#11241F] disabled:opacity-50 border border-[#182F2A] hover:border-[#14B8A6]/50 text-white rounded-xl transition flex flex-col items-start gap-2.5 text-left group cursor-pointer shadow-sm"
              >
                <div className="flex items-center gap-2.5 w-full">
                  <div className="p-2.5 bg-[#0B1512] text-teal-300 rounded-xl border border-[#182F2A] group-hover:scale-105 transition shrink-0">
                    <FileCode className="w-5 h-5" />
                  </div>
                  <h4 className="text-xs font-bold text-white group-hover:text-teal-300 transition">
                    Archivo CSV
                  </h4>
                </div>
                <p className="text-[10px] text-[#7C9791] leading-tight">
                  Valores separados por comas con membrete de control Fintack
                </p>
              </button>

              {/* Excel Button */}
              <button
                type="button"
                id="btn-export-excel"
                onClick={handleExportExcel}
                disabled={isExporting || filteredTransactions.length === 0}
                className="p-3.5 bg-[#08120F] hover:bg-[#11241F] disabled:opacity-50 border border-[#182F2A] hover:border-emerald-500/50 text-white rounded-xl transition flex flex-col items-start gap-2.5 text-left group cursor-pointer shadow-sm"
              >
                <div className="flex items-center gap-2.5 w-full">
                  <div className="p-2.5 bg-[#0B1512] text-emerald-400 rounded-xl border border-[#182F2A] group-hover:scale-105 transition shrink-0">
                    <FileSpreadsheet className="w-5 h-5" />
                  </div>
                  <h4 className="text-xs font-bold text-white group-hover:text-emerald-400 transition">
                    Excel (.xlsx)
                  </h4>
                </div>
                <p className="text-[10px] text-[#7C9791] leading-tight">
                  Planilla de cálculo estructurada con encabezado y metadatos
                </p>
              </button>
            </div>

            {filteredTransactions.length === 0 && (
              <p className="text-xs text-amber-400 flex items-center gap-1.5 pt-1">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>No hay transacciones registradas en el período seleccionado.</span>
              </p>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-[#182F2A] bg-[#08120F] flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-[#11241F] hover:bg-[#163029] text-[#9CA3AF] hover:text-white text-xs font-semibold rounded-xl border border-[#182F2A] transition"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
