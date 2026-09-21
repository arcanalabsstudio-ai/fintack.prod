import React, { useState, useEffect } from 'react';
import { Transaction, TransactionType, TaxSettings } from '../types';
import { DEFAULT_EXPENSE_CATEGORIES, DEFAULT_INCOME_CATEGORIES } from '../data/mockData';
import { TRANSLATIONS } from '../utils/translations';
import { X, ArrowRight, ArrowLeft, CheckCircle2, Upload, Scan, Receipt } from 'lucide-react';

interface QuickAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  taxSettings?: TaxSettings;
  onAddTransaction: (tx: Omit<Transaction, 'id' | 'createdAt'>) => void;
  onOpenScanner: () => void;
}

export const QuickAddModal: React.FC<QuickAddModalProps> = ({
  isOpen,
  onClose,
  taxSettings,
  onAddTransaction,
  onOpenScanner,
}) => {
  const currentLang = taxSettings?.language || 'es';
  const t = TRANSLATIONS[currentLang];
  const currency = taxSettings?.currency || 'USD';

  const categoriesExpense = taxSettings?.categories?.expense || DEFAULT_EXPENSE_CATEGORIES;
  const categoriesIncome = taxSettings?.categories?.income || DEFAULT_INCOME_CATEGORIES;

  const [step, setStep] = useState<1 | 2>(1);
  const [type, setType] = useState<TransactionType>('EXPENSE');
  const [amount, setAmount] = useState<string>('');
  const [merchant, setMerchant] = useState<string>('');
  const [category, setCategory] = useState<string>(categoriesExpense[0] || 'Software/Suscripciones');
  const [description, setDescription] = useState<string>('');
  const [deductiblePercent, setDeductiblePercent] = useState<number>(100);
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [hasReceipt, setHasReceipt] = useState<boolean>(false);
  const [receiptFileName, setReceiptFileName] = useState<string>('');
  const [merchantError, setMerchantError] = useState<string>('');

  // Sync category on open or type change
  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setAmount('');
      setMerchant('');
      setMerchantError('');
      setDescription('');
      setHasReceipt(false);
      setReceiptFileName('');
      setCategory(type === 'EXPENSE' ? (categoriesExpense[0] || 'Software/Suscripciones') : (categoriesIncome[0] || 'Honorarios / Proyecto'));
    }
  }, [isOpen, type, categoriesExpense, categoriesIncome]);

  if (!isOpen) return null;

  const handleNext = () => {
    if (!amount || parseFloat(amount) <= 0) return;
    setStep(2);
  };

  const handleBack = () => {
    setStep(1);
  };

  const calculateTaxAmount = (numAmount: number, txType: TransactionType): number => {
    const vatRate = taxSettings?.vatRate ?? 16;
    const incomeTaxRate = taxSettings?.incomeTaxRate ?? 2;
    if (txType === 'EXPENSE') {
      return (numAmount * vatRate) / 100;
    } else {
      return (numAmount * incomeTaxRate) / 100;
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!merchant.trim()) {
      setMerchantError(t.merchantRequired);
      return;
    }
    if (!amount) return;

    const defaultNotes = currentLang === 'es' 
      ? `Gasto registrado con ${deductiblePercent}% de deducibilidad contemplada.`
      : currentLang === 'en'
      ? `Expense registered with ${deductiblePercent}% deductibility.`
      : `Despesa registrada com ${deductiblePercent}% de dedutibilidade.`;

    const incomeNotes = currentLang === 'es'
      ? 'Ingreso acumulable para pago de impuestos.'
      : currentLang === 'en'
      ? 'Accumulated taxable income.'
      : 'Receita tributável acumulada.';

    const parsedAmount = parseFloat(amount);
    const taxAmount = calculateTaxAmount(parsedAmount, type);

    onAddTransaction({
      type,
      amount: parsedAmount,
      merchant: merchant.trim(),
      category: category,
      description: description.trim() || merchant.trim(),
      date,
      hasReceipt,
      receiptFileName: receiptFileName || undefined,
      deductiblePercent: type === 'EXPENSE' ? deductiblePercent : 0,
      taxAmount,
      taxNotes: type === 'EXPENSE' ? defaultNotes : incomeNotes,
    });

    onClose();
  };

  const getDeductibilityDesc = () => {
    if (deductiblePercent === 100) {
      if (currentLang === 'es') return '100%: Gasto de operación 100% deducible.';
      if (currentLang === 'en') return '100%: 100% deductible operating expense.';
      return '100%: Despesa operacional 100% dedutível.';
    }
    if (deductiblePercent === 50) {
      if (currentLang === 'es') return '50%: Gasto mixto (ej. restaurante o transporte compartido).';
      if (currentLang === 'en') return '50%: Mixed expense (e.g., restaurant or shared ride).';
      return '50%: Despesa mista (ex. restaurante ou transporte compartilhado).';
    }
    if (currentLang === 'es') return '0%: Gasto personal no deducible.';
    if (currentLang === 'en') return '0%: Non-deductible personal expense.';
    return '0%: Despesa pessoal não dedutível.';
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-[#0B1512] rounded-2xl max-w-md w-full p-6 shadow-xl border border-[#182F2A] relative animate-in fade-in zoom-in-95 duration-200 my-auto max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[#7C9791] hover:text-[#14B8A6] p-1 rounded-lg hover:bg-[#11241F] transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header indicator */}
        <div className="flex items-center gap-2 mb-6">
          <div className="w-8 h-8 rounded-xl bg-[#11241F] text-[#14B8A6] font-bold flex items-center justify-center text-xs border border-[#1C3A31]">
            {step}/2
          </div>
          <div>
            <h3 className="font-semibold text-white text-base">
              {step === 1 
                ? (currentLang === 'es' ? 'Paso 1: Monto y Tipo' : currentLang === 'en' ? 'Step 1: Amount & Type' : 'Passo 1: Valor e Tipo')
                : (currentLang === 'es' ? 'Paso 2: Categoría y Detalle' : currentLang === 'en' ? 'Step 2: Category & Detail' : 'Passo 2: Categoria e Detalhes')}
            </h3>
            <p className="text-xs text-[#7C9791]">
              {step === 1 
                ? (currentLang === 'es' ? 'Ingreso ultra-rápido en 2 pasos' : currentLang === 'en' ? 'Ultra-fast 2-step entry' : 'Entrada ultra-rápida em 2 etapas')
                : (currentLang === 'es' ? 'Asigna la categoría fiscal' : currentLang === 'en' ? 'Assign tax category' : 'Atribuir categoria fiscal')}
            </p>
          </div>
        </div>

        {/* STEP 1: AMOUNT & TYPE */}
        {step === 1 && (
          <div className="space-y-6">
            {/* Type selector pills */}
            <div className="grid grid-cols-2 gap-3 p-1 bg-[#081512] rounded-xl border border-[#182F2A]">
              <button
                type="button"
                onClick={() => {
                  setType('EXPENSE');
                  setCategory('Software/Suscripciones');
                }}
                className={`py-2 rounded-lg text-xs font-semibold transition flex items-center justify-center gap-1.5 ${
                  type === 'EXPENSE'
                    ? 'bg-rose-500/10 text-rose-400 border border-rose-500/15 shadow-sm'
                    : 'text-[#7C9791] hover:text-white'
                }`}
              >
                <span>{t.expense} (- {currency})</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setType('INCOME');
                  setCategory('Honorarios / Proyecto');
                }}
                className={`py-2 rounded-lg text-xs font-semibold transition flex items-center justify-center gap-1.5 ${
                  type === 'INCOME'
                    ? 'bg-[#11241F] text-[#14B8A6] border border-[#1C3A31] shadow-sm'
                    : 'text-[#7C9791] hover:text-white'
                }`}
              >
                <span>{t.income} (+ {currency})</span>
              </button>
            </div>

            {/* Big Amount Input */}
            <div>
              <label className="block text-xs font-semibold text-[#7C9791] uppercase tracking-wider mb-2">
                {currentLang === 'es' ? `Monto del Movimiento (${currency})` : currentLang === 'en' ? `Transaction Amount (${currency})` : `Valor do Movimento (${currency})`}
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-[#7C9791]">
                  {currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : currency === 'JPY' ? '¥' : '$'}
                </span>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  autoFocus
                  className="w-full pl-9 pr-4 py-3 bg-[#081512] border border-[#182F2A] rounded-xl text-3xl font-mono font-bold text-white focus:outline-none focus:ring-1 focus:ring-[#14B8A6] focus:bg-[#081512]"
                />
              </div>
            </div>

            {/* Quick Scanner Shortcut */}
            <div className="p-3 bg-[#11241F]/40 border border-[#1C3A31]/70 rounded-xl flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-[#14B8A6]">
                <Scan className="w-4 h-4 text-[#14B8A6]" />
                <span className="font-semibold">{currentLang === 'es' ? '¿Tienes el ticket o factura?' : currentLang === 'en' ? 'Do you have the receipt?' : 'Você tem o comprovante?'}</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenScanner();
                }}
                className="font-bold text-[#14B8A6] hover:text-[#0D9488] hover:underline"
              >
                {currentLang === 'es' ? 'Escanear con IA →' : currentLang === 'en' ? 'Scan with AI →' : 'Escanear com IA →'}
              </button>
            </div>

            <button
              type="button"
              disabled={!amount || parseFloat(amount) <= 0}
              onClick={handleNext}
              className="w-full py-3 bg-[#14B8A6] hover:bg-[#0D9488] disabled:opacity-30 text-[#020504] font-bold text-xs rounded-xl transition flex items-center justify-center gap-2 shadow-[0_0_12px_rgba(20, 184, 166, 0.105)]"
            >
              <span>{currentLang === 'es' ? 'Continuar' : currentLang === 'en' ? 'Continue' : 'Continuar'}</span>
              <ArrowRight className="w-4 h-4 text-[#020504]" />
            </button>
          </div>
        )}

        {/* STEP 2: CATEGORY & MERCHANT & TAX DEDUCTIBILITY */}
        {step === 2 && (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Merchant / Vendor */}
            <div>
              <label className="block text-xs font-semibold text-white mb-1">
                {type === 'EXPENSE' ? t.merchant : (currentLang === 'es' ? 'Cliente / Emisor' : currentLang === 'en' ? 'Client / Issuer' : 'Cliente / Emissor')}
              </label>
              <input
                type="text"
                placeholder={type === 'EXPENSE' ? 'e.g. Figma, WeWork' : 'e.g. Acme Corp'}
                value={merchant}
                onChange={(e) => {
                  setMerchant(e.target.value);
                  if (e.target.value.trim()) {
                    setMerchantError('');
                  }
                }}
                className={`w-full px-3.5 py-2.5 bg-[#081512] rounded-xl text-xs font-semibold text-white focus:outline-none focus:ring-1 focus:ring-[#14B8A6] focus:bg-[#081512] transition ${
                  merchantError
                    ? 'border border-rose-500 focus:ring-rose-500'
                    : 'border border-[#182F2A]'
                }`}
              />
              {merchantError && (
                <p className="text-rose-500 text-[11px] mt-1 font-semibold">
                  {merchantError}
                </p>
              )}
            </div>

            {/* Category Grid */}
            <div>
              <label className="block text-xs font-semibold text-white mb-1">{t.category}</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#081512] border border-[#182F2A] rounded-xl text-xs font-semibold text-white focus:outline-none focus:ring-1 focus:ring-[#14B8A6]"
              >
                {(type === 'EXPENSE' ? categoriesExpense : categoriesIncome).map((cat) => (
                  <option key={cat} value={cat} className="bg-[#0B1512]">
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Deductibility Slider (Expense only) */}
            {type === 'EXPENSE' && (
              <div className="bg-[#11241F]/20 p-3 rounded-xl border border-[#1C3A31] space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-white">{currentLang === 'es' ? 'Estimación de Deducibilidad' : currentLang === 'en' ? 'Deductibility Estimation' : 'Estimativa de Dedutibilidade'}</span>
                  <span className="font-mono font-bold text-[#14B8A6]">{deductiblePercent}% {currentLang === 'es' ? 'Deducible' : currentLang === 'en' ? 'Deductible' : 'Dedutível'}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="25"
                  value={deductiblePercent}
                  onChange={(e) => setDeductiblePercent(Number(e.target.value))}
                  className="w-full accent-[#14B8A6]"
                />
                <p className="text-[11px] text-[#7C9791] font-semibold">
                  {getDeductibilityDesc()}
                </p>
              </div>
            )}

            {/* Date */}
            <div>
              <label className="block text-xs font-semibold text-white mb-1">{t.date}</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3.5 py-2 bg-[#081512] border border-[#182F2A] rounded-xl text-xs font-mono text-white focus:outline-none focus:ring-1 focus:ring-[#14B8A6]"
              />
            </div>

            {/* Receipt Attachment Toggle */}
            <div className="flex items-center justify-between p-3 bg-[#11241F]/20 border border-[#1C3A31] rounded-xl">
              <div className="flex items-center gap-2 text-xs">
                <Receipt className="w-4 h-4 text-[#7C9791]" />
                <span className="font-semibold text-white">{t.uploadReceipt}</span>
              </div>
              <input
                type="checkbox"
                checked={hasReceipt}
                onChange={(e) => {
                  setHasReceipt(e.target.checked);
                  if (e.target.checked && !receiptFileName) {
                    setReceiptFileName(`Comprobante_${merchant || 'Recibo'}.pdf`);
                  }
                }}
                className="w-4 h-4 accent-[#14B8A6] rounded bg-[#081512]"
              />
            </div>

            {/* Buttons */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={handleBack}
                className="w-1/3 py-2.5 bg-[#0B1512] border border-[#182F2A] hover:bg-[#11241F] text-white font-semibold text-xs rounded-xl transition flex items-center justify-center gap-1"
              >
                <ArrowLeft className="w-3.5 h-3.5 text-white" />
                <span>{currentLang === 'es' ? 'Atrás' : currentLang === 'en' ? 'Back' : 'Voltar'}</span>
              </button>

              <button
                type="submit"
                className="w-2/3 py-2.5 bg-[#14B8A6] hover:bg-[#0D9488] text-[#020504] font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5 shadow-[0_0_12px_rgba(20, 184, 166, 0.105)]"
              >
                <CheckCircle2 className="w-4 h-4 text-[#020504]" />
                <span>{currentLang === 'es' ? 'Guardar' : currentLang === 'en' ? 'Save' : 'Salvar'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
