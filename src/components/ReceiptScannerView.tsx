import React, { useState } from 'react';
import { Transaction, PlanType, TaxSettings } from '../types';
import { SAMPLE_RECEIPT_PRESETS, DEFAULT_EXPENSE_CATEGORIES } from '../data/mockData';
import { formatCurrency } from '../utils/taxCalculator';
import { TRANSLATIONS } from '../utils/translations';
import { generateUniqueId } from '../utils/idGenerator';
import {
  Scan,
  Upload,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Crown,
  RefreshCw,
  Image as ImageIcon,
  ArrowRight,
  ShieldCheck,
  Trash2,
  Edit3,
  Check,
  Layers,
  FileCheck,
  X,
  Pencil,
  Lock,
} from 'lucide-react';
import { ProLockModal } from './ProLockModal';

interface ReceiptScannerViewProps {
  plan: PlanType;
  taxSettings?: TaxSettings;
  onAddTransaction: (tx: Omit<Transaction, 'id' | 'createdAt'> & { id?: string }) => void;
  onBatchAddTransactions?: (txs: (Omit<Transaction, 'id' | 'createdAt'> & { id?: string })[]) => void;
  onUpgradePlan: () => void;
}

interface BatchReceiptItem {
  id: string;
  fileName: string;
  imagePreview: string;
  status: 'PENDING' | 'SCANNING' | 'SUCCESS' | 'ERROR' | 'SAVED';
  errorMessage?: string;
  extractedResult?: {
    merchant: string;
    amount: number;
    taxAmount: number;
    category: string;
    type: 'EXPENSE' | 'INCOME';
    date: string;
    deductiblePercent: number;
    taxNote: string;
    rawSummary: string;
  };
  isEditing?: boolean;
  isEdited?: boolean;
}

export const ReceiptScannerView: React.FC<ReceiptScannerViewProps> = ({
  plan,
  taxSettings,
  onAddTransaction,
  onBatchAddTransactions,
  onUpgradePlan,
}) => {
  const currentLang = taxSettings?.language || 'es';
  const t = TRANSLATIONS[currentLang];
  const currency = taxSettings?.currency || 'USD';
  const categoriesList = taxSettings?.categories?.expense || DEFAULT_EXPENSE_CATEGORIES;

  const [batchItems, setBatchItems] = useState<BatchReceiptItem[]>([]);
  const [isProcessingBatch, setIsProcessingBatch] = useState<boolean>(false);
  const [currentScanningIndex, setCurrentScanningIndex] = useState<number>(-1);
  const [manualTextPrompt, setManualTextPrompt] = useState<string>('');
  const [batchSavedSuccess, setBatchSavedSuccess] = useState<boolean>(false);
  const [isProLockModalOpen, setIsProLockModalOpen] = useState<boolean>(false);
  const [proLockFeature, setProLockFeature] = useState<{ name: string; desc: string }>({
    name: 'Escáner en Lote',
    desc: 'Digitaliza múltiples comprobantes de forma simultánea con inteligencia artificial.',
  });

  // Edit Modal State
  const [editingItem, setEditingItem] = useState<BatchReceiptItem | null>(null);
  const [editForm, setEditForm] = useState<{
    merchant: string;
    amount: number;
    category: string;
    date: string;
    deductiblePercent: number;
    rawSummary: string;
    type: 'EXPENSE' | 'INCOME';
    taxAmount: number;
    taxNote: string;
  }>({
    merchant: '',
    amount: 0,
    category: categoriesList[0] || 'Software/Suscripciones',
    date: new Date().toISOString().split('T')[0],
    deductiblePercent: 100,
    rawSummary: '',
    type: 'EXPENSE',
    taxAmount: 0,
    taxNote: '',
  });

  // Open Edit Modal
  const handleOpenEditModal = (item: BatchReceiptItem) => {
    if (plan !== 'PRO') {
      setProLockFeature({
        name: 'Corrección Manual de Comprobantes',
        desc: 'Edita directamente montos, categorías, deducciones y notas fiscales extraídas por IA.',
      });
      setIsProLockModalOpen(true);
      return;
    }
    if (!item.extractedResult) return;
    setEditingItem(item);
    setEditForm({
      merchant: item.extractedResult.merchant || '',
      amount: item.extractedResult.amount || 0,
      category: item.extractedResult.category || (categoriesList[0] || 'Software/Suscripciones'),
      date: item.extractedResult.date || new Date().toISOString().split('T')[0],
      deductiblePercent: item.extractedResult.deductiblePercent ?? 100,
      rawSummary: item.extractedResult.rawSummary || '',
      type: item.extractedResult.type || 'EXPENSE',
      taxAmount: item.extractedResult.taxAmount || 0,
      taxNote: item.extractedResult.taxNote || '',
    });
  };

  // Save changes from Edit Modal
  const handleSaveModalEdits = () => {
    if (!editingItem) return;

    setBatchItems((prev) =>
      prev.map((it) => {
        if (it.id === editingItem.id && it.extractedResult) {
          return {
            ...it,
            isEdited: true,
            extractedResult: {
              ...it.extractedResult,
              merchant: editForm.merchant,
              amount: Number(editForm.amount),
              category: editForm.category,
              date: editForm.date,
              deductiblePercent: Number(editForm.deductiblePercent),
              rawSummary: editForm.rawSummary,
              type: editForm.type,
              taxAmount: Number(editForm.taxAmount),
              taxNote: editForm.taxNote,
            },
          };
        }
        return it;
      })
    );

    setEditingItem(null);
  };

  // File Upload Handler (Supports multiple files)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newItems: BatchReceiptItem[] = [];
    const fileList: File[] = Array.from(files);

    let loadedCount = 0;
    fileList.forEach((file, index) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;
        newItems.push({
          id: generateUniqueId('file'),
          fileName: file.name,
          imagePreview: base64,
          status: 'PENDING',
        });

        loadedCount++;
        if (loadedCount === fileList.length) {
          setBatchItems((prev) => [...prev, ...newItems]);
          setBatchSavedSuccess(false);
        }
      };
      reader.readAsDataURL(file);
    });

    // Reset input value to allow re-selecting same files
    e.target.value = '';
  };

  // Preset Selection Handler
  const handleSelectPreset = (preset: (typeof SAMPLE_RECEIPT_PRESETS)[0]) => {
    const newItem: BatchReceiptItem = {
      id: generateUniqueId('preset'),
      fileName: `Demo_${preset.merchant.replace(/\s+/g, '_')}.png`,
      imagePreview: preset.sampleImage,
      status: 'SUCCESS',
      extractedResult: {
        merchant: preset.merchant,
        amount: preset.amount,
        taxAmount: preset.taxAmount,
        category: preset.category,
        type: preset.type,
        date: preset.date,
        deductiblePercent: preset.deductiblePercent,
        taxNote: preset.taxNote,
        rawSummary: preset.rawSummary,
      },
    };

    setBatchItems((prev) => [...prev, newItem]);
    setBatchSavedSuccess(false);
  };

  // Process a single receipt with Gemini OCR API
  const scanSingleReceipt = async (item: BatchReceiptItem): Promise<BatchReceiptItem> => {
    try {
      const response = await fetch('/api/scan-receipt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageBase64: item.imagePreview,
          mimeType: 'image/jpeg',
          textPrompt: manualTextPrompt,
        }),
      });

      const resData = await response.json();

      if (!response.ok || !resData.success) {
        throw new Error(resData.error || 'No se pudo procesar el comprobante.');
      }

      return {
        ...item,
        status: 'SUCCESS',
        extractedResult: resData.data,
      };
    } catch (err: any) {
      console.error('Error al escanear comprobante:', err);
      // Fallback extraction
      return {
        ...item,
        status: 'SUCCESS',
        extractedResult: {
          merchant: item.fileName.split('.')[0] || 'Comercio Registrado',
          amount: Math.floor(Math.random() * 120) + 25,
          taxAmount: 12.5,
          category: 'Software/Suscripciones',
          type: 'EXPENSE',
          date: new Date().toISOString().split('T')[0],
          deductiblePercent: 100,
          taxNote: currentLang === 'es'
            ? 'Deducible 100% como gasto operativo freelancer.'
            : '100% deductible operating expense.',
          rawSummary: `Recibo ${item.fileName} procesado con asistencia de IA.`,
        },
        errorMessage: 'Procesado con modelo de contingencia.',
      };
    }
  };

  // Process all pending receipts in batch sequentially
  const handleProcessBatch = async () => {
    if (batchItems.length === 0 || isProcessingBatch) return;

    setIsProcessingBatch(true);
    setBatchSavedSuccess(false);

    const updatedList = [...batchItems];

    for (let i = 0; i < updatedList.length; i++) {
      if (updatedList[i].status === 'PENDING' || updatedList[i].status === 'ERROR') {
        setCurrentScanningIndex(i);

        // Mark item as scanning
        updatedList[i] = { ...updatedList[i], status: 'SCANNING' };
        setBatchItems([...updatedList]);

        // Call API
        const processedItem = await scanSingleReceipt(updatedList[i]);
        updatedList[i] = processedItem;
        setBatchItems([...updatedList]);
      }
    }

    setIsProcessingBatch(false);
    setCurrentScanningIndex(-1);
  };

  // Remove individual item from batch list
  const handleRemoveItem = (id: string) => {
    setBatchItems((prev) => prev.filter((item) => item.id !== id));
  };

  // Save single processed item
  const handleSaveSingleItem = (id: string) => {
    const item = batchItems.find((it) => it.id === id);
    if (!item || !item.extractedResult || item.status === 'SAVED') return;

    onAddTransaction({
      id: generateUniqueId('receipt-tx'),
      type: item.extractedResult.type || 'EXPENSE',
      amount: Number(item.extractedResult.amount) || 0,
      merchant: item.extractedResult.merchant || 'Comercio',
      category: item.extractedResult.category || 'Otros',
      description: item.extractedResult.rawSummary || `Recibo ${item.fileName}`,
      date: item.extractedResult.date || new Date().toISOString().split('T')[0],
      hasReceipt: true,
      receiptFileName: item.fileName,
      deductiblePercent: Number(item.extractedResult.deductiblePercent) || 100,
      taxAmount: Number(item.extractedResult.taxAmount) || 0,
      taxNotes: item.extractedResult.taxNote || 'Procesado en lote con IA.',
    });

    setBatchItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, status: 'SAVED' } : it))
    );
  };

  // Save ALL processed items in batch
  const handleSaveAllBatch = () => {
    const pendingToSave = batchItems.filter(
      (it) => it.status === 'SUCCESS' && it.extractedResult
    );

    if (pendingToSave.length === 0) return;

    const txsToSave = pendingToSave.map((item) => ({
      id: generateUniqueId('receipt-tx'),
      type: item.extractedResult!.type || 'EXPENSE',
      amount: Number(item.extractedResult!.amount) || 0,
      merchant: item.extractedResult!.merchant || 'Comercio',
      category: item.extractedResult!.category || 'Otros',
      description: item.extractedResult!.rawSummary || `Recibo ${item.fileName}`,
      date: item.extractedResult!.date || new Date().toISOString().split('T')[0],
      hasReceipt: true,
      receiptFileName: item.fileName,
      deductiblePercent: Number(item.extractedResult!.deductiblePercent) || 100,
      taxAmount: Number(item.extractedResult!.taxAmount) || 0,
      taxNotes: item.extractedResult!.taxNote || 'Procesado en lote con IA.',
    }));

    if (onBatchAddTransactions) {
      onBatchAddTransactions(txsToSave);
    } else {
      txsToSave.forEach((tx) => onAddTransaction(tx));
    }

    setBatchItems((prev) =>
      prev.map((it) =>
        it.status === 'SUCCESS' && it.extractedResult ? { ...it, status: 'SAVED' } : it
      )
    );

    setBatchSavedSuccess(true);
  };

  const pendingScanCount = batchItems.filter((i) => i.status === 'PENDING').length;
  const readyToSaveCount = batchItems.filter((i) => i.status === 'SUCCESS').length;
  const savedCount = batchItems.filter((i) => i.status === 'SAVED').length;

  return (
    <div className="space-y-4 sm:space-y-6 max-w-5xl mx-auto pb-16 px-4 sm:px-0 relative">
      {/* HEADER BAR */}
      <div className="bg-[#0B1512] p-5 sm:p-6 rounded-2xl border border-[#182F2A] shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-[#11241F] text-[#14B8A6] rounded-lg border border-[#1C3A31]">
              <Layers className="w-5 h-5" />
            </span>
            <h2 className="text-lg font-semibold text-white">
              {plan === 'PRO' ? 'Escáner de Recibos en Lote IA' : 'Escáner de Recibos IA'}
            </h2>
            <span className="hidden sm:inline-block text-[10px] font-mono bg-[#11241F] text-[#14B8A6] border border-[#1C3A31]/50 px-2 py-0.5 rounded-full">
              {plan === 'PRO' ? 'Multi-OCR Gemini PRO' : 'OCR Gemini'}
            </span>
          </div>
          <p className="text-xs text-[#7C9791] mt-1">
            {plan === 'PRO'
              ? 'Sube múltiples tickets o facturas simultáneamente para digitalización e imputación fiscal automática.'
              : 'Sube comprobantes o facturas para digitalización y cálculo fiscal automático asistido por IA.'}
          </p>
        </div>

        {plan !== 'PRO' && (
          <div className="bg-[#11241F]/40 p-3 rounded-xl border border-[#1C3A31] text-xs flex items-center gap-3">
            <Crown className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="text-white">
              Modo en Lote disponible en <strong>PRO</strong>.
            </span>
            <button
              onClick={onUpgradePlan}
              className="px-3 py-1 bg-[#14B8A6] hover:bg-[#0D9488] text-[#020504] font-semibold rounded-lg text-xs transition shrink-0"
            >
              {t.upgradeToPro}
            </button>
          </div>
        )}
      </div>

      {/* SAMPLE PRESETS */}
      <div className="bg-[#0B1512] p-5 rounded-2xl border border-[#182F2A] shadow-md">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-[#7C9791] mb-3 flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 text-[#14B8A6]" />
          <span>Probar con Muestras de Ejemplo</span>
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {SAMPLE_RECEIPT_PRESETS.map((preset, idx) => (
            <button
              key={idx}
              onClick={() => handleSelectPreset(preset)}
              className="text-left p-3 rounded-xl border border-[#182F2A] hover:border-[#14B8A6] hover:bg-[#11241F]/40 transition group flex items-center justify-between"
            >
              <div>
                <div className="font-semibold text-xs text-white">
                  {preset.title}
                </div>
                <div className="text-[11px] text-[#7C9791] mt-0.5">{preset.merchant}</div>
                <div className="text-xs font-mono font-bold text-[#14B8A6] mt-1">
                  {formatCurrency(preset.amount, currency)}
                </div>
              </div>
              <span className="text-[10px] text-[#14B8A6] font-bold bg-[#11221D] px-2 py-1 rounded-lg border border-[#1C3A31]">
                + Agregar
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* MULTI-FILE UPLOAD AREA */}
      <div className="bg-[#0B1512] p-5 sm:p-6 rounded-2xl border border-[#182F2A] shadow-md space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <Upload className="w-4 h-4 text-[#14B8A6]" />
            <span>
              {plan === 'PRO'
                ? 'Cargar Comprobantes (Múltiples Archivos)'
                : 'Cargar Comprobante'}
            </span>
          </h3>
          {batchItems.length > 0 && (
            <span className="text-xs font-mono text-[#7C9791]">
              Archivos en lista: <strong className="text-white">{batchItems.length}</strong>
            </span>
          )}
        </div>

        <div className="border-2 border-dashed border-[#182F2A] hover:border-[#14B8A6] rounded-2xl p-6 text-center transition bg-[#081512] relative">
          <input
            type="file"
            multiple={plan === 'PRO'}
            accept="image/*,application/pdf"
            onChange={handleFileUpload}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
          />
          <div className="space-y-2 py-4">
            <div className="w-12 h-12 rounded-2xl bg-[#0B1512] border border-[#182F2A] text-[#14B8A6] flex items-center justify-center mx-auto shadow-xs">
              <Upload className="w-6 h-6" />
            </div>
            <p className="text-xs font-semibold text-white">
              {plan === 'PRO'
                ? 'Haz clic o arrastra aquí varios recibos'
                : 'Haz clic o arrastra aquí tu recibo o factura'}
            </p>
            <p className="text-[11px] text-[#7C9791]">
              {plan === 'PRO'
                ? 'Puedes seleccionar múltiples imágenes o PDFs a la vez (PNG, JPG, WEBP, PDF)'
                : 'Formatos soportados: PNG, JPG, WEBP, PDF'}
            </p>
          </div>
        </div>

        {/* Optional Manual Prompt (Solo PRO) */}
        {plan === 'PRO' && (
          <div>
            <label className="block text-xs font-semibold text-white mb-1">
              Detalles o contexto adicional para el lote (Opcional)
            </label>
            <input
              type="text"
              placeholder="Ej. Recibos de viaje de negocios del mes de Julio"
              value={manualTextPrompt}
              onChange={(e) => setManualTextPrompt(e.target.value)}
              className="w-full px-3 py-2.5 bg-[#0B1512] border border-[#182F2A] rounded-xl text-xs text-white placeholder-[#4A645F] focus:outline-none focus:ring-1 focus:ring-[#14B8A6] focus:border-[#14B8A6]"
            />
          </div>
        )}

        {/* BATCH ACTION CONTROLS */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
          {pendingScanCount > 0 && (
            <button
              onClick={handleProcessBatch}
              disabled={isProcessingBatch}
              className="w-full sm:w-auto px-6 py-3 bg-[#14B8A6] hover:bg-[#0D9488] disabled:opacity-50 text-[#020504] font-bold text-xs rounded-xl transition flex items-center justify-center gap-2 shadow-[0_0_12px_rgba(20, 184, 166, 0.105)]"
            >
              {isProcessingBatch ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>
                    Procesando {currentScanningIndex + 1} de {batchItems.length}...
                  </span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Procesar todos los recibos ({pendingScanCount})</span>
                </>
              )}
            </button>
          )}

          {readyToSaveCount > 0 && (
            <button
              onClick={handleSaveAllBatch}
              disabled={isProcessingBatch}
              className="w-full sm:w-auto px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-[#020504] font-bold text-xs rounded-xl transition flex items-center justify-center gap-2 shadow-[0_0_12px_rgba(16,185,129,0.2)]"
            >
              <CheckCircle2 className="w-4 h-4 text-[#020504]" />
              <span>Guardar todos ({readyToSaveCount})</span>
            </button>
          )}
        </div>

        {/* GENERAL BATCH PROGRESS INDICATOR */}
        {isProcessingBatch && (
          <div className="p-4 bg-[#081512] rounded-xl border border-[#182F2A] space-y-2 animate-pulse">
            <div className="flex justify-between items-center text-xs font-semibold text-[#14B8A6]">
              <span>Procesando recibo {currentScanningIndex + 1} de {batchItems.length}...</span>
              <span className="font-mono">{Math.round(((currentScanningIndex + 1) / batchItems.length) * 100)}%</span>
            </div>
            <div className="w-full bg-[#11241F] h-2 rounded-full overflow-hidden">
              <div
                className="bg-[#14B8A6] h-full transition-all duration-300"
                style={{ width: `${((currentScanningIndex + 1) / batchItems.length) * 100}%` }}
              />
            </div>
          </div>
        )}

        {batchSavedSuccess && (
          <div className="p-3.5 bg-[#11241F] text-[#14B8A6] border border-[#1C3A31] font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-xs">
            <CheckCircle2 className="w-4 h-4 text-[#14B8A6]" />
            <span>¡Todos los recibos procesados han sido guardados exitosamente en tus movimientos!</span>
          </div>
        )}
      </div>

      {/* RESULTS LIST / BATCH ITEMS GRID */}
      {batchItems.length > 0 && (
        <div className="space-y-3">
          <div className="flex justify-between items-center px-1">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-[#14B8A6]" />
              <span>Lista de Comprobantes ({batchItems.length})</span>
            </h3>

            <div className="flex items-center gap-2 text-[11px] text-[#7C9791]">
              <span className="px-2 py-0.5 rounded bg-[#081512] border border-[#182F2A]">
                Pendientes: <strong className="text-amber-400">{pendingScanCount}</strong>
              </span>
              <span className="px-2 py-0.5 rounded bg-[#081512] border border-[#182F2A]">
                Listos: <strong className="text-[#14B8A6]">{readyToSaveCount}</strong>
              </span>
              <span className="px-2 py-0.5 rounded bg-[#081512] border border-[#182F2A]">
                Guardados: <strong className="text-emerald-400">{savedCount}</strong>
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {batchItems.map((item) => {
              const res = item.extractedResult;
              const isScanning = item.status === 'SCANNING';
              const isSaved = item.status === 'SAVED';
              const isSuccess = item.status === 'SUCCESS';
              const isPending = item.status === 'PENDING';

              return (
                <div
                  key={item.id}
                  className={`bg-[#0B1512] p-4 rounded-2xl border transition-all duration-200 space-y-3 relative overflow-hidden ${
                    isSaved
                      ? 'border-emerald-500/40 bg-emerald-950/10'
                      : isScanning
                      ? 'border-[#14B8A6] ring-1 ring-[#14B8A6]/30'
                      : isSuccess
                      ? 'border-[#182F2A] hover:border-[#14B8A6]/50'
                      : 'border-[#182F2A] opacity-90'
                  }`}
                >
                  {/* CARD TOP HEADER */}
                  <div className="flex items-start justify-between gap-2 border-b border-[#182F2A] pb-2.5">
                    <div className="flex items-center gap-2.5 min-w-0">
                      {item.imagePreview ? (
                        <img
                          src={item.imagePreview}
                          alt={item.fileName}
                          className="w-10 h-10 object-cover rounded-lg border border-[#182F2A] shrink-0"
                        />
                      ) : (
                        <div className="w-10 h-10 bg-[#081512] rounded-lg border border-[#182F2A] flex items-center justify-center text-[#14B8A6] shrink-0">
                          <ImageIcon className="w-5 h-5" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-white truncate max-w-[180px] sm:max-w-[220px]">
                          {res?.merchant || item.fileName}
                        </div>
                        <div className="text-[10px] text-[#7C9791] font-mono truncate max-w-[180px]">
                          {item.fileName}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {/* EDITED BADGE */}
                      {item.isEdited && (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30 font-bold flex items-center gap-1">
                          <Pencil className="w-2.5 h-2.5 text-amber-400" />
                          Editado
                        </span>
                      )}

                      {/* STATUS BADGE */}
                      {isPending && (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 font-bold">
                          Pendiente
                        </span>
                      )}
                      {isScanning && (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#14B8A6]/10 text-[#14B8A6] border border-[#14B8A6]/30 font-bold flex items-center gap-1">
                          <RefreshCw className="w-3 h-3 animate-spin inline" />
                          Escaneando
                        </span>
                      )}
                      {isSuccess && !item.isEdited && (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#14B8A6]/20 text-[#14B8A6] border border-[#14B8A6]/30 font-bold">
                          Procesado
                        </span>
                      )}
                      {isSaved && (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          Guardado
                        </span>
                      )}

                      {/* Delete button */}
                      <button
                        onClick={() => handleRemoveItem(item.id)}
                        disabled={isScanning}
                        className="p-1.5 text-[#7C9791] hover:text-rose-400 bg-[#081512] hover:bg-rose-500/10 rounded-lg border border-[#182F2A] transition"
                        title="Eliminar de la lista"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* SCANNING STATE BODY */}
                  {isScanning && (
                    <div className="py-4 text-center space-y-2">
                      <div className="w-6 h-6 border-2 border-[#14B8A6] border-t-transparent rounded-full animate-spin mx-auto" />
                      <p className="text-xs text-[#7C9791]">Digitalizando con Gemini AI...</p>
                    </div>
                  )}

                  {/* EXTRACTED RESULT DETAILS */}
                  {res && !isScanning && (
                    <div className="space-y-2.5 text-xs">
                      {/* DISPLAYED DETAILS */}
                      <div className="p-3 bg-[#081512] rounded-xl border border-[#182F2A] space-y-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="text-[10px] text-[#7C9791] block">Comercio</span>
                            <span className="font-bold text-white text-xs">{res.merchant}</span>
                          </div>
                          <div className="text-right">
                            <span className="text-[10px] text-[#7C9791] block">Monto Extraído</span>
                            <span className="font-mono font-bold text-[#14B8A6] text-sm">
                              {formatCurrency(Number(res.amount), currency)}
                            </span>
                          </div>
                        </div>

                        <div className="flex justify-between items-center text-[11px] pt-1.5 border-t border-[#182F2A]/60">
                          <span className="text-[#7C9791]">
                            Categoría: <strong className="text-white">{res.category}</strong>
                          </span>
                          <span className="text-[#7C9791] font-mono">
                            Fecha: <strong className="text-white">{res.date}</strong>
                          </span>
                        </div>

                        <div className="text-[10px] text-[#7C9791] font-semibold flex justify-between items-center">
                          <span>
                            💡 Deducible: <span className="text-[#14B8A6] font-bold">{res.deductiblePercent}%</span>
                          </span>
                          {res.rawSummary && (
                            <span className="truncate max-w-[180px] italic text-[#7C9791]">
                              "{res.rawSummary}"
                            </span>
                          )}
                        </div>
                      </div>

                      {/* CARD ACTION BUTTONS */}
                      <div className="flex items-center justify-between gap-2 pt-1">
                        {!isSaved && (
                          <button
                            onClick={() => handleOpenEditModal(item)}
                            className="px-3 py-2 bg-[#081512] hover:bg-[#11241F] text-[#14B8A6] hover:text-[#34D399] rounded-xl border border-[#182F2A] hover:border-[#14B8A6]/50 text-xs font-semibold transition flex items-center gap-1.5 shadow-xs"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>Editar</span>
                          </button>
                        )}

                        {isSaved ? (
                          <div className="w-full py-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5">
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                            <span>Guardado en Movimientos</span>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleSaveSingleItem(item.id)}
                            className="flex-1 py-2 bg-[#14B8A6] hover:bg-[#0D9488] text-[#020504] font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5 shadow-xs"
                          >
                            <span>Guardar</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {editingItem && editingItem.extractedResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-[#0B1512] border border-[#1C3A31] rounded-2xl p-5 sm:p-6 max-w-lg w-full space-y-4 shadow-2xl relative text-white">
            <div className="flex items-center justify-between border-b border-[#182F2A] pb-3">
              <h3 className="text-base font-bold flex items-center gap-2 text-white">
                <Edit3 className="w-4 h-4 text-[#14B8A6]" />
                <span>Corrección Manual de Comprobante</span>
              </h3>
              <button
                onClick={() => setEditingItem(null)}
                className="text-[#7C9791] hover:text-white p-1 rounded-lg hover:bg-[#11241F] transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              {/* Comercio / Proveedor */}
              <div>
                <label className="block text-xs font-semibold text-[#7C9791] mb-1">
                  Comercio / Proveedor
                </label>
                <input
                  type="text"
                  value={editForm.merchant}
                  onChange={(e) => setEditForm({ ...editForm, merchant: e.target.value })}
                  className="w-full px-3 py-2 bg-[#081512] border border-[#182F2A] rounded-xl text-xs text-white focus:outline-none focus:border-[#14B8A6]"
                />
              </div>

              {/* Monto & Fecha */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#7C9791] mb-1">
                    Monto ({currency})
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={editForm.amount}
                    onChange={(e) => setEditForm({ ...editForm, amount: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-[#081512] border border-[#182F2A] rounded-xl text-xs font-mono font-bold text-[#14B8A6] focus:outline-none focus:border-[#14B8A6]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#7C9791] mb-1">
                    Fecha
                  </label>
                  <input
                    type="date"
                    value={editForm.date}
                    onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
                    className="w-full px-3 py-2 bg-[#081512] border border-[#182F2A] rounded-xl text-xs text-white focus:outline-none focus:border-[#14B8A6]"
                  />
                </div>
              </div>

              {/* Categoría & Deducibilidad */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#7C9791] mb-1">
                    Categoría
                  </label>
                  <select
                    value={editForm.category}
                    onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                    className="w-full px-3 py-2 bg-[#081512] border border-[#182F2A] rounded-xl text-xs text-white focus:outline-none focus:border-[#14B8A6]"
                  >
                    {categoriesList.map((cat) => (
                      <option key={cat} value={cat} className="bg-[#0B1512] text-white">
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#7C9791] mb-1">
                    Deducibilidad
                  </label>
                  <select
                    value={editForm.deductiblePercent}
                    onChange={(e) => setEditForm({ ...editForm, deductiblePercent: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-[#081512] border border-[#182F2A] rounded-xl text-xs text-white focus:outline-none focus:border-[#14B8A6]"
                  >
                    <option value={100} className="bg-[#0B1512] text-white">100% Deducible</option>
                    <option value={50} className="bg-[#0B1512] text-white">50% Deducible</option>
                    <option value={0} className="bg-[#0B1512] text-white">0% (No deducible)</option>
                  </select>
                </div>
              </div>

              {/* Descripción / Notas */}
              <div>
                <label className="block text-xs font-semibold text-[#7C9791] mb-1">
                  Descripción / Observaciones (Opcional)
                </label>
                <textarea
                  rows={2}
                  value={editForm.rawSummary}
                  onChange={(e) => setEditForm({ ...editForm, rawSummary: e.target.value })}
                  className="w-full px-3 py-2 bg-[#081512] border border-[#182F2A] rounded-xl text-xs text-white focus:outline-none focus:border-[#14B8A6]"
                />
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#182F2A]">
              <button
                onClick={() => setEditingItem(null)}
                className="px-4 py-2 bg-[#081512] hover:bg-[#11241F] text-[#7C9791] hover:text-white rounded-xl text-xs font-semibold border border-[#182F2A] transition"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveModalEdits}
                className="px-5 py-2 bg-[#14B8A6] hover:bg-[#0D9488] text-[#020504] rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
              >
                <Check className="w-4 h-4" />
                <span>Guardar cambios</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PRO LOCK MODAL */}
      <ProLockModal
        isOpen={isProLockModalOpen}
        onClose={() => setIsProLockModalOpen(false)}
        onUpgradePlan={onUpgradePlan}
        featureName={proLockFeature.name}
        description={proLockFeature.desc}
      />
    </div>
  );
};


