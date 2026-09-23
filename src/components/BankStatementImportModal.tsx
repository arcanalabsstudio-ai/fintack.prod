import React, { useState, useRef } from 'react';
import {
  X,
  UploadCloud,
  FileSpreadsheet,
  FileText,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  RefreshCw,
  Trash2,
  Check,
  Tag,
  Calendar,
  DollarSign,
  Info,
  Sliders,
  Eye,
  Layers,
} from 'lucide-react';
import { Transaction, TaxSettings } from '../types';
import { formatCurrency } from '../utils/taxCalculator';
import { generateUniqueId } from '../utils/idGenerator';
import {
  parseCSVStatement,
  detectStatementDuplicates,
  ParsedStatementTransaction,
} from '../utils/statementParser';
import { detectCategoryAndDeductibility } from '../utils/statementCategorizer';

export interface StatementAIInsights {
  columnsIdentified?: {
    dateColumn?: string;
    descriptionColumn?: string;
    amountColumn?: string;
    categoryColumn?: string;
    notes?: string;
  };
  datesCorrectedCount: number;
  europeanAmountsConvertedCount: number;
  categorizedCount: number;
  summaryNotes: string;
}

interface BankStatementImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  existingTransactions: Transaction[];
  onImportCompleted: (
    importedTransactions: (Omit<Transaction, 'createdAt'> & { id: string })[],
    aiInsights?: StatementAIInsights | null
  ) => void;
  taxSettings: TaxSettings;
}

type ImportStep = 'UPLOAD' | 'PREVIEW_CONFIRM' | 'IMPORTING' | 'SUMMARY';

export const BankStatementImportModal: React.FC<BankStatementImportModalProps> = ({
  isOpen,
  onClose,
  existingTransactions,
  onImportCompleted,
  taxSettings,
}) => {
  const [step, setStep] = useState<ImportStep>('UPLOAD');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileType, setFileType] = useState<'CSV' | 'PDF' | null>(null);
  const [isProcessingFile, setIsProcessingFile] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [aiInsights, setAiInsights] = useState<StatementAIInsights | null>(null);

  // Parsed Items
  const [parsedItems, setParsedItems] = useState<ParsedStatementTransaction[]>([]);
  const [duplicateCount, setDuplicateCount] = useState<number>(0);
  const [importProgress, setImportProgress] = useState<{ current: number; total: number }>({ current: 0, total: 0 });
  const [importSummary, setImportSummary] = useState<{ imported: number; skippedDuplicates: number }>({
    imported: 0,
    skippedDuplicates: 0,
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const currency = taxSettings.currency || 'USD';

  if (!isOpen) return null;

  const handleReset = () => {
    setStep('UPLOAD');
    setSelectedFile(null);
    setFileType(null);
    setIsProcessingFile(false);
    setErrorMessage(null);
    setAiInsights(null);
    setParsedItems([]);
    setDuplicateCount(0);
    setImportProgress({ current: 0, total: 0 });
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  // 1. Process Selected File (CSV or PDF)
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await processFile(file);
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    await processFile(file);
  };

  const processFile = async (file: File) => {
    setSelectedFile(file);
    setErrorMessage(null);
    setIsProcessingFile(true);
    setAiInsights(null);

    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    const isCsv =
      file.type === 'text/csv' ||
      file.name.toLowerCase().endsWith('.csv') ||
      file.type === 'application/vnd.ms-excel' ||
      file.type === 'text/plain';

    if (!isPdf && !isCsv) {
      setIsProcessingFile(false);
      setErrorMessage('Formato no soportado. Por favor sube un archivo CSV o PDF de tu banco.');
      return;
    }

    if (isCsv) {
      setFileType('CSV');
      try {
        const text = await file.text();

        // 1. Send CSV to Gemini endpoint for intelligent column deduction, error correction & contextual categorization
        let parsedSuccess = false;
        try {
          const res = await fetch('/api/parse-statement-csv', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ csvText: text }),
          });

          const data = await res.json();
          if (res.ok && data.success && Array.isArray(data.transactions) && data.transactions.length > 0) {
            const rawList = data.transactions;
            const structured: ParsedStatementTransaction[] = rawList.map((item: any) => ({
              id: generateUniqueId('csv-tx'),
              date: item.date || new Date().toISOString().slice(0, 10),
              merchant: item.merchant || 'Comercio / Pagador',
              description: item.description || item.merchant || 'Movimiento Bancario',
              amount: Math.abs(Number(item.amount) || 0),
              type: item.type === 'INCOME' ? 'INCOME' : 'EXPENSE',
              category: item.category || (item.type === 'INCOME' ? 'Otros Ingresos' : 'Otros Gastos'),
              deductiblePercent:
                typeof item.deductiblePercent === 'number'
                  ? item.deductiblePercent
                  : item.type === 'INCOME'
                  ? 0
                  : 100,
              selected: true,
            }));

            setAiInsights(
              data.aiInsights || {
                datesCorrectedCount: 0,
                europeanAmountsConvertedCount: 0,
                categorizedCount: structured.length,
                summaryNotes: `Gemini interpretó ${structured.length} movimientos del archivo CSV.`,
              }
            );

            const dupResult = detectStatementDuplicates(structured, existingTransactions);
            setParsedItems(dupResult.itemsWithDuplicates);
            setDuplicateCount(dupResult.duplicateCount);
            setIsProcessingFile(false);
            setStep('PREVIEW_CONFIRM');
            parsedSuccess = true;
          }
        } catch (apiErr) {
          console.warn('Fallo en endpoint Gemini CSV, usando parser local de respaldo:', apiErr);
        }

        if (!parsedSuccess) {
          // Fallback to local parser
          const rawParsed = parseCSVStatement(text);
          if (rawParsed.length === 0) {
            setIsProcessingFile(false);
            setErrorMessage(
              'No se pudieron detectar movimientos válidos en el archivo CSV. Revisa el formato e intenta nuevamente.'
            );
            return;
          }

          setAiInsights({
            datesCorrectedCount: 0,
            europeanAmountsConvertedCount: 0,
            categorizedCount: rawParsed.length,
            summaryNotes: `Se interpretaron y categorizaron ${rawParsed.length} movimientos de tu extracto.`,
          });

          const dupResult = detectStatementDuplicates(rawParsed, existingTransactions);
          setParsedItems(dupResult.itemsWithDuplicates);
          setDuplicateCount(dupResult.duplicateCount);
          setIsProcessingFile(false);
          setStep('PREVIEW_CONFIRM');
        }
      } catch (err: any) {
        setIsProcessingFile(false);
        setErrorMessage('Error al leer el archivo CSV: ' + (err.message || 'Error desconocido'));
      }
    } else if (isPdf) {
      setFileType('PDF');
      try {
        // Read as base64 and send to server AI extraction endpoint
        const reader = new FileReader();
        reader.onload = async () => {
          try {
            const base64Data = reader.result as string;
            const res = await fetch('/api/parse-statement-pdf', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ pdfBase64: base64Data }),
            });

            const data = await res.json();

            if (!res.ok || !data.success) {
              setIsProcessingFile(false);
              setErrorMessage(data.error || 'El PDF no tiene un formato reconocible. Usa el formato CSV.');
              return;
            }

            const rawList = data.transactions || [];
            if (rawList.length === 0) {
              setIsProcessingFile(false);
              setErrorMessage('El PDF no tiene un formato reconocible. Usa el formato CSV.');
              return;
            }

            // Convert to ParsedStatementTransaction items with Gemini contextual categorization
            const structured: ParsedStatementTransaction[] = rawList.map((item: any) => ({
              id: generateUniqueId('pdf-tx'),
              date: item.date || new Date().toISOString().slice(0, 10),
              merchant: item.merchant || 'Comercio / Pagador',
              description: item.description || item.merchant || 'Movimiento Bancario',
              amount: Math.abs(Number(item.amount) || 0),
              type: item.type === 'INCOME' ? 'INCOME' : 'EXPENSE',
              category: item.category || (item.type === 'INCOME' ? 'Otros Ingresos' : 'Otros Gastos'),
              deductiblePercent:
                typeof item.deductiblePercent === 'number'
                  ? item.deductiblePercent
                  : item.type === 'INCOME'
                  ? 0
                  : 100,
              selected: true,
            }));

            setAiInsights(
              data.aiInsights || {
                datesCorrectedCount: 0,
                europeanAmountsConvertedCount: 0,
                categorizedCount: structured.length,
                summaryNotes: `Gemini procesó la tabla de movimientos del PDF y categorizó ${structured.length} transacciones.`,
              }
            );

            const dupResult = detectStatementDuplicates(structured, existingTransactions);
            setParsedItems(dupResult.itemsWithDuplicates);
            setDuplicateCount(dupResult.duplicateCount);
            setIsProcessingFile(false);
            setStep('PREVIEW_CONFIRM');
          } catch (pdfErr: any) {
            setIsProcessingFile(false);
            setErrorMessage('El PDF no tiene un formato reconocible. Usa el formato CSV.');
          }
        };

        reader.onerror = () => {
          setIsProcessingFile(false);
          setErrorMessage('Error al leer el archivo PDF localmente.');
        };

        reader.readAsDataURL(file);
      } catch (err: any) {
        setIsProcessingFile(false);
        setErrorMessage('El PDF no tiene un formato reconocible. Usa el formato CSV.');
      }
    }
  };

  // Toggle item selection
  const handleToggleSelect = (id: string) => {
    setParsedItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, selected: !item.selected } : item))
    );
  };

  // Select all / Deselect all
  const handleSelectAll = (select: boolean) => {
    setParsedItems((prev) => prev.map((item) => ({ ...item, selected: select })));
  };

  // Import only new (skip duplicates)
  const handleSelectOnlyNew = () => {
    setParsedItems((prev) =>
      prev.map((item) => ({
        ...item,
        selected: !item.isDuplicate,
      }))
    );
  };

  // Edit item category inline
  const handleChangeCategory = (id: string, newCategory: string) => {
    setParsedItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, category: newCategory } : item))
    );
  };

  // Edit item deductible percent inline
  const handleChangeDeductible = (id: string, newPercent: number) => {
    setParsedItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, deductiblePercent: newPercent } : item))
    );
  };

  // 2. Confirm and Execute Import
  const handleConfirmImport = async () => {
    const itemsToImport = parsedItems.filter((i) => i.selected);

    if (itemsToImport.length === 0) {
      alert('Por favor selecciona al menos un movimiento para importar.');
      return;
    }

    setStep('IMPORTING');
    setImportProgress({ current: 0, total: itemsToImport.length });

    // Simulate animated batch progress for great UX feedback
    const batchSize = Math.max(1, Math.floor(itemsToImport.length / 10));
    let processed = 0;

    const interval = setInterval(() => {
      processed += batchSize;
      if (processed >= itemsToImport.length) {
        processed = itemsToImport.length;
        clearInterval(interval);

        // Convert to application transactions with strictly unique validated IDs
        const existingTxIds = new Set(existingTransactions.map((tx) => tx.id));
        const newTransactions: (Omit<Transaction, 'createdAt'> & { id: string })[] = [];

        for (const item of itemsToImport) {
          let finalId = item.id;
          if (!finalId || existingTxIds.has(finalId)) {
            finalId = generateUniqueId('imported-tx');
          }
          existingTxIds.add(finalId);

          newTransactions.push({
            id: finalId,
            type: item.type,
            amount: item.amount,
            category: item.category || (item.type === 'INCOME' ? 'Otros Ingresos' : 'Otros Gastos'),
            date: item.date,
            merchant: item.merchant,
            description: item.description,
            hasReceipt: false,
            deductiblePercent: item.deductiblePercent,
            taxAmount:
              item.type === 'EXPENSE'
                ? (item.amount * (taxSettings.vatRate / 100) * (item.deductiblePercent / 100))
                : (item.amount * (taxSettings.incomeTaxRate / 100)),
          });
        }

        onImportCompleted(newTransactions, aiInsights);

        const skipped = parsedItems.length - itemsToImport.length;
        setImportSummary({
          imported: itemsToImport.length,
          skippedDuplicates: skipped,
        });

        setTimeout(() => {
          setStep('SUMMARY');
        }, 400);
      } else {
        setImportProgress({ current: processed, total: itemsToImport.length });
      }
    }, 60);
  };

  // Reject / Cancel Import
  const handleRejectImport = () => {
    setErrorMessage('Importación cancelada por el usuario. No se guardó ningún movimiento.');
    setParsedItems([]);
    setStep('UPLOAD');
  };

  const selectedCount = parsedItems.filter((i) => i.selected).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-[#020504]/80 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        id="bank-statement-import-modal"
        className="w-full max-w-3xl max-h-[90vh] bg-[#081512] border border-[#182F2A] rounded-3xl shadow-2xl flex flex-col overflow-hidden relative"
      >
        {/* Glow accent */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#14B8A6]/5 rounded-full blur-3xl pointer-events-none" />

        {/* 1. MODAL HEADER */}
        <div className="p-5 sm:p-6 border-b border-[#182F2A] bg-[#0B1512]/90 flex items-center justify-between shrink-0 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#11241F] to-[#163029] border border-[#14B8A6]/40 flex items-center justify-center shadow-xs">
              <FileSpreadsheet className="w-6 h-6 text-[#14B8A6]" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                Importador Inteligente de Extractos
                <span className="text-[10px] bg-[#11241F] text-[#14B8A6] font-mono font-bold px-2 py-0.5 rounded-full border border-[#14B8A6]/20">
                  CSV / PDF con Gemini
                </span>
              </h3>
              <p className="text-xs text-[#7C9791] mt-0.5">
                Interpretación de columnas, corrección de formatos y categorización contextual con IA
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            className="p-2 text-[#7C9791] hover:text-white hover:bg-[#11241F] rounded-xl transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 2. MODAL BODY BY STEP */}
        <div className="flex-1 p-5 sm:p-6 overflow-y-auto space-y-5">
          {/* STEP 1: FILE UPLOAD ZONE */}
          {step === 'UPLOAD' && (
            <div className="space-y-5">
              {errorMessage && (
                <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl flex items-start gap-3 text-xs text-rose-300 animate-in fade-in duration-150">
                  <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-semibold text-rose-200">Atención al importar:</p>
                    <p>{errorMessage}</p>
                  </div>
                </div>
              )}

              {/* Drag & Drop Card */}
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-3xl p-8 sm:p-10 text-center transition cursor-pointer flex flex-col items-center justify-center gap-4 ${
                  isProcessingFile
                    ? 'border-[#14B8A6] bg-[#0B1512]/90 opacity-80'
                    : 'border-[#182F2A] hover:border-[#14B8A6]/60 bg-[#0B1512]/50 hover:bg-[#0B1512]'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.pdf,text/csv,application/pdf"
                  onChange={handleFileChange}
                  className="hidden"
                />

                {isProcessingFile ? (
                  <div className="flex flex-col items-center gap-3">
                    <RefreshCw className="w-10 h-10 text-[#14B8A6] animate-spin" />
                    <p className="text-sm font-semibold text-white">Interpretando extracto bancario con Gemini...</p>
                    <p className="text-xs text-[#7C9791] max-w-sm">
                      Deduciendo columnas, normalizando fechas e importes, y categorizando movimientos con contexto
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="w-16 h-16 rounded-3xl bg-[#11241F] border border-[#182F2A] flex items-center justify-center shadow-inner group">
                      <UploadCloud className="w-8 h-8 text-[#14B8A6] group-hover:scale-110 transition-transform" />
                    </div>

                    <div className="space-y-1.5 max-w-md">
                      <p className="text-sm font-bold text-white">
                        Arrastra y suelta tu extracto bancario aquí
                      </p>
                      <p className="text-xs text-[#7C9791]">
                        o <span className="text-[#14B8A6] font-semibold underline">haz clic para explorar</span> en tu dispositivo
                      </p>
                    </div>

                    <div className="flex items-center justify-center gap-3 pt-2">
                      <span className="flex items-center gap-1.5 text-xs text-[#7C9791] bg-[#081512] px-3 py-1.5 rounded-xl border border-[#182F2A]">
                        <FileSpreadsheet className="w-3.5 h-3.5 text-[#14B8A6]" />
                        Extracto en CSV
                      </span>
                      <span className="flex items-center gap-1.5 text-xs text-[#7C9791] bg-[#081512] px-3 py-1.5 rounded-xl border border-[#182F2A]">
                        <FileText className="w-3.5 h-3.5 text-amber-400" />
                        Extracto en PDF (Texto)
                      </span>
                    </div>
                  </>
                )}
              </div>

              {/* Instructions / Features cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3.5 bg-[#0B1512] border border-[#182F2A] rounded-2xl space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-white">
                    <Sparkles className="w-3.5 h-3.5 text-[#14B8A6]" />
                    Categorización Contextual
                  </div>
                  <p className="text-[11px] text-[#7C9791] leading-relaxed">
                    Gemini analiza la descripción bancaria para asignar la categoría y deducibilidad precisa.
                  </p>
                </div>

                <div className="p-3.5 bg-[#0B1512] border border-[#182F2A] rounded-2xl space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-white">
                    <Sliders className="w-3.5 h-3.5 text-indigo-400" />
                    Limpieza & Corrección
                  </div>
                  <p className="text-[11px] text-[#7C9791] leading-relaxed">
                    Estandariza fechas variadas a formato ISO y convierte importes europeos (1.234,56).
                  </p>
                </div>

                <div className="p-3.5 bg-[#0B1512] border border-[#182F2A] rounded-2xl space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-white">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    Control de Duplicados
                  </div>
                  <p className="text-[11px] text-[#7C9791] leading-relaxed">
                    Compara con tus transacciones previas para evitar registrar el mismo gasto dos veces.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: PREVIEW AND CONFIRM */}
          {step === 'PREVIEW_CONFIRM' && (
            <div className="space-y-4">
              {/* Top Banner: File Info & Duplicates Notice */}
              <div className="p-4 bg-[#0B1512] border border-[#182F2A] rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#11241F] border border-[#14B8A6]/30 flex items-center justify-center shrink-0">
                    {fileType === 'PDF' ? (
                      <FileText className="w-5 h-5 text-amber-400" />
                    ) : (
                      <FileSpreadsheet className="w-5 h-5 text-[#14B8A6]" />
                    )}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white truncate max-w-xs sm:max-w-md">
                      {selectedFile?.name || 'Extracto bancario'}
                    </h4>
                    <p className="text-[11px] text-[#7C9791]">
                      Se detectaron <span className="text-white font-semibold">{parsedItems.length}</span> movimientos en total
                    </p>
                  </div>
                </div>

                {/* Duplicates notice */}
                {duplicateCount > 0 && (
                  <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 px-3 py-1.5 rounded-xl text-xs text-amber-300">
                    <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>
                      {duplicateCount} {duplicateCount === 1 ? 'duplicado detectado' : 'duplicados detectados'}
                    </span>
                    <button
                      type="button"
                      onClick={handleSelectOnlyNew}
                      className="ml-1 text-[11px] bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 px-2 py-0.5 rounded font-medium transition cursor-pointer"
                    >
                      Importar solo nuevos
                    </button>
                  </div>
                )}
              </div>

              {/* Gemini AI Insights Banner in Preview */}
              {aiInsights && (
                <div className="p-3.5 bg-gradient-to-r from-[#11241F] to-[#081512] border border-[#14B8A6]/30 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-[#14B8A6]" />
                      <span className="text-xs font-bold text-white">Interpretación Inteligente por Gemini</span>
                    </div>
                    <span className="text-[10px] bg-[#14B8A6]/20 text-[#14B8A6] px-2 py-0.5 rounded-full font-semibold border border-[#14B8A6]/30">
                      IA Activa
                    </span>
                  </div>

                  <p className="text-xs text-[#9ECBC2] leading-relaxed">
                    {aiInsights.summaryNotes}
                  </p>

                  <div className="flex flex-wrap items-center gap-2 pt-1 text-[10px]">
                    <span className="bg-[#0B1512] px-2.5 py-1 rounded-lg border border-[#182F2A] text-white flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-[#14B8A6]" />
                      {aiInsights.datesCorrectedCount} fechas estandarizadas
                    </span>
                    <span className="bg-[#0B1512] px-2.5 py-1 rounded-lg border border-[#182F2A] text-white flex items-center gap-1">
                      <DollarSign className="w-3 h-3 text-amber-400" />
                      {aiInsights.europeanAmountsConvertedCount} importes normalizados
                    </span>
                    <span className="bg-[#0B1512] px-2.5 py-1 rounded-lg border border-[#182F2A] text-white flex items-center gap-1">
                      <Tag className="w-3 h-3 text-indigo-400" />
                      {aiInsights.categorizedCount} clasificados con contexto
                    </span>
                    {aiInsights.columnsIdentified?.notes && (
                      <span className="bg-[#0B1512] px-2.5 py-1 rounded-lg border border-[#182F2A] text-[#7C9791]">
                        🔍 {aiInsights.columnsIdentified.notes}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Preview Question Prompt Card */}
              <div className="p-4 bg-gradient-to-r from-[#11241F] to-[#0B1512] border border-[#14B8A6]/30 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
                <div className="space-y-0.5">
                  <p className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-[#14B8A6]" />
                    ¿Estos datos son correctos?
                  </p>
                  <p className="text-[11px] text-[#7C9791]">
                    Revisa la muestra previa (primeros 10 de {parsedItems.length} movimientos) antes de confirmar.
                  </p>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={handleRejectImport}
                    className="flex-1 sm:flex-none px-3.5 py-2 bg-[#081512] hover:bg-[#11241F] border border-[#182F2A] hover:border-rose-500/40 text-[#7C9791] hover:text-rose-300 text-xs font-semibold rounded-xl transition cursor-pointer"
                  >
                    No, cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmImport}
                    disabled={selectedCount === 0}
                    className="flex-1 sm:flex-none px-4 py-2 bg-[#14B8A6] hover:bg-[#0D9488] disabled:opacity-50 text-[#020504] text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <Check className="w-4 h-4 stroke-[3]" />
                    <span>Sí, importar ({selectedCount})</span>
                  </button>
                </div>
              </div>

              {/* Table / List of Preview Items (First 10 Preview) */}
              <div className="border border-[#182F2A] rounded-2xl overflow-hidden bg-[#0B1512]">
                <div className="px-4 py-2.5 bg-[#06100E] border-b border-[#182F2A] flex items-center justify-between text-xs text-[#7C9791]">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-white">Vista Previa (Primeros 10 movimientos)</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => handleSelectAll(true)}
                      className="hover:text-white transition cursor-pointer underline text-[11px]"
                    >
                      Marcar todos
                    </button>
                    <span>·</span>
                    <button
                      type="button"
                      onClick={() => handleSelectAll(false)}
                      className="hover:text-white transition cursor-pointer underline text-[11px]"
                    >
                      Desmarcar
                    </button>
                  </div>
                </div>

                <div className="divide-y divide-[#182F2A] max-h-[320px] overflow-y-auto">
                  {parsedItems.slice(0, 10).map((item) => (
                    <div
                      key={item.id}
                      className={`p-3 sm:px-4 sm:py-3 flex items-center justify-between gap-3 text-xs transition ${
                        item.selected ? 'bg-[#0B1512]' : 'bg-[#081512]/60 opacity-60'
                      }`}
                    >
                      {/* Checkbox & Merchant/Desc */}
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <input
                          type="checkbox"
                          checked={item.selected}
                          onChange={() => handleToggleSelect(item.id)}
                          className="w-4 h-4 rounded accent-[#14B8A6] cursor-pointer shrink-0"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-white truncate max-w-[180px] sm:max-w-[240px]">
                              {item.merchant}
                            </span>
                            {item.isDuplicate && (
                              <span className="text-[9px] bg-amber-500/15 text-amber-400 font-bold px-1.5 py-0.5 rounded border border-amber-500/30 shrink-0">
                                Duplicado
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-[#7C9791] truncate">{item.description}</p>
                        </div>
                      </div>

                      {/* Date & Category Pill with Sparkle */}
                      <div className="hidden sm:flex flex-col items-end gap-0.5 shrink-0">
                        <span className="text-[11px] text-[#7C9791] font-mono">{item.date}</span>
                        <span className="text-[10px] bg-[#11241F] text-[#14B8A6] px-2 py-0.5 rounded-full border border-[#14B8A6]/20 flex items-center gap-1 truncate max-w-[150px]">
                          <Sparkles className="w-2.5 h-2.5 text-[#14B8A6] shrink-0" />
                          <span className="truncate">{item.category}</span>
                        </span>
                      </div>

                      {/* Amount & Type */}
                      <div className="text-right shrink-0">
                        <div
                          className={`font-mono font-bold text-xs ${
                            item.type === 'INCOME' ? 'text-emerald-400' : 'text-white'
                          }`}
                        >
                          {item.type === 'INCOME' ? '+' : '-'}
                          {formatCurrency(item.amount, currency)}
                        </div>
                        <span className="text-[10px] text-[#7C9791]">
                          {item.type === 'INCOME' ? 'Ingreso' : `${item.deductiblePercent}% deducible`}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {parsedItems.length > 10 && (
                  <div className="p-2.5 bg-[#06100E] border-t border-[#182F2A] text-center text-[11px] text-[#7C9791]">
                    + {parsedItems.length - 10} movimientos adicionales listos para importarse al confirmar.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 3: IMPORTING PROGRESS */}
          {step === 'IMPORTING' && (
            <div className="py-12 px-4 flex flex-col items-center justify-center text-center space-y-5">
              <div className="relative">
                <div className="w-16 h-16 rounded-3xl bg-[#11241F] border border-[#14B8A6]/40 flex items-center justify-center shadow-lg">
                  <RefreshCw className="w-8 h-8 text-[#14B8A6] animate-spin" />
                </div>
              </div>

              <div className="space-y-1.5">
                <h4 className="text-base font-bold text-white">Importando movimientos...</h4>
                <p className="text-xs text-[#7C9791]">
                  Importando movimiento <span className="text-white font-semibold">{importProgress.current}</span> de{' '}
                  <span className="text-white font-semibold">{importProgress.total}</span>
                </p>
              </div>

              {/* Progress bar */}
              <div className="w-full max-w-md bg-[#11241F] h-2.5 rounded-full overflow-hidden border border-[#182F2A]">
                <div
                  className="bg-[#14B8A6] h-full transition-all duration-150 rounded-full"
                  style={{
                    width: `${Math.min(
                      100,
                      Math.round((importProgress.current / (importProgress.total || 1)) * 100)
                    )}%`,
                  }}
                />
              </div>
            </div>
          )}

          {/* STEP 4: SUMMARY & GEMINI FEEDBACK */}
          {step === 'SUMMARY' && (
            <div className="py-6 px-4 flex flex-col items-center justify-center text-center space-y-5 animate-in zoom-in-95 duration-200">
              <div className="w-16 h-16 rounded-3xl bg-emerald-500/15 border border-emerald-500/40 flex items-center justify-center shadow-lg">
                <CheckCircle2 className="w-8 h-8 text-emerald-400" />
              </div>

              <div className="space-y-1.5 max-w-md">
                <h4 className="text-lg font-bold text-white">¡Importación completada con éxito!</h4>
                <p className="text-xs text-[#7C9791] leading-relaxed">
                  Se importaron <span className="text-white font-bold">{importSummary.imported} movimientos</span> correctamente.
                  {importSummary.skippedDuplicates > 0 && (
                    <>
                      {' '}
                      <span className="text-amber-300 font-medium">
                        {importSummary.skippedDuplicates} movimientos duplicados
                      </span>{' '}
                      fueron omitidos para mantener tu contabilidad limpia.
                    </>
                  )}
                </p>
              </div>

              {/* Gemini Feedback Summary Card (Instruction #5) */}
              {aiInsights && (
                <div className="w-full max-w-lg bg-[#06100E] border border-[#14B8A6]/30 rounded-2xl p-4 text-left space-y-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#14B8A6]" />
                    <h5 className="text-xs font-bold text-white uppercase tracking-wider">
                      Resumen de mejoras aplicadas por Gemini
                    </h5>
                  </div>

                  <p className="text-xs text-[#9ECBC2] italic bg-[#11241F]/80 p-2.5 rounded-xl border border-[#182F2A]">
                    "{aiInsights.summaryNotes}"
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                    <div className="p-2.5 bg-[#081512] rounded-xl border border-[#182F2A] flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-[#14B8A6] shrink-0" />
                      <span className="text-[#C5D7D3]">
                        <strong className="text-white">{aiInsights.datesCorrectedCount}</strong> fechas corregidas
                      </span>
                    </div>

                    <div className="p-2.5 bg-[#081512] rounded-xl border border-[#182F2A] flex items-center gap-2">
                      <DollarSign className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span className="text-[#C5D7D3]">
                        <strong className="text-white">{aiInsights.europeanAmountsConvertedCount}</strong> montos normalizados
                      </span>
                    </div>

                    <div className="p-2.5 bg-[#081512] rounded-xl border border-[#182F2A] flex items-center gap-2 sm:col-span-2">
                      <Tag className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                      <span className="text-[#C5D7D3]">
                        <strong className="text-white">{aiInsights.categorizedCount}</strong> movimientos categorizados contextualmente
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-6 py-2.5 bg-[#14B8A6] hover:bg-[#0D9488] text-[#020504] font-bold text-xs rounded-xl transition shadow-md cursor-pointer"
                >
                  Ver Movimientos en Historial
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
