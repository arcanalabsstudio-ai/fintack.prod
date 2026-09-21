import React, { useState, useEffect } from 'react';
import { Transaction, TransactionType, TaxSettings } from '../types';
import { DEFAULT_EXPENSE_CATEGORIES, DEFAULT_INCOME_CATEGORIES } from '../data/mockData';
import { TRANSLATIONS } from '../utils/translations';
import { X, CheckCircle2, Save, ArrowLeft } from 'lucide-react';

interface EditTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: Transaction | null;
  taxSettings?: TaxSettings;
  onUpdateTransaction: (updatedTx: Transaction) => void;
}

export const EditTransactionModal: React.FC<EditTransactionModalProps> = ({
  isOpen,
  onClose,
  transaction,
  taxSettings,
  onUpdateTransaction,
}) => {
  const currentLang = taxSettings?.language || 'es';
  const t = TRANSLATIONS[currentLang];
  const currency = taxSettings?.currency || 'USD';

  const categoriesExpense = taxSettings?.categories?.expense || DEFAULT_EXPENSE_CATEGORIES;
  const categoriesIncome = taxSettings?.categories?.income || DEFAULT_INCOME_CATEGORIES;

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
  const [amountError, setAmountError] = useState<string>('');

  // Populate form with existing transaction values
  useEffect(() => {
    if (isOpen && transaction) {
      setType(transaction.type);
      setAmount(String(transaction.amount));
      setMerchant(transaction.merchant || '');
      setCategory(transaction.category || (transaction.type === 'EXPENSE' ? (categoriesExpense[0] || 'Software/Suscripciones') : (categoriesIncome[0] || 'Honorarios / Proyecto')));
      setDescription(transaction.description || '');
      setDeductiblePercent(transaction.deductiblePercent ?? (transaction.type === 'EXPENSE' ? 100 : 0));
      setDate(transaction.date || new Date().toISOString().split('T')[0]);
      setHasReceipt(!!transaction.hasReceipt);
      setReceiptFileName(transaction.receiptFileName || '');
      setMerchantError('');
      setAmountError('');
    }
  }, [isOpen, transaction, categoriesExpense, categoriesIncome]);

  if (!isOpen || !transaction) return null;

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
    let hasError = false;

    if (!merchant.trim()) {
      setMerchantError(t.merchantRequired || 'El nombre del cliente/comercio es requerido');
      hasError = true;
    } else {
      setMerchantError('');
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setAmountError('Ingresa un monto válido mayor a 0');
      hasError = true;
    } else {
      setAmountError('');
    }

    if (hasError) return;

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

    const taxAmount = calculateTaxAmount(parsedAmount, type);

    const updatedTx: Transaction = {
      ...transaction,
      type,
      amount: parsedAmount,
      merchant: merchant.trim(),
      category,
      description: description.trim() || merchant.trim(),
      date,
      hasReceipt,
      receiptFileName: receiptFileName || undefined,
      deductiblePercent: type === 'EXPENSE' ? deductiblePercent : 0,
      taxAmount,
      taxNotes: type === 'EXPENSE' ? defaultNotes : incomeNotes,
    };

    onUpdateTransaction(updatedTx);
    onClose();
  };

  const availableCategories = type === 'EXPENSE' ? categoriesExpense : categoriesIncome;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-[#0B1512] rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-[#182F2A] relative animate-in fade-in zoom-in-95 duration-200 my-auto max-h-[92vh] overflow-y-auto text-white">
        {/* Header & Close */}
        <div className="flex items-center justify-between pb-4 border-b border-[#182F2A] mb-5">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-[#11241F] text-[#14B8A6] rounded-xl border border-[#1C3A31]">
              <Save className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Editar Transacción</h3>
              <p className="text-xs text-[#7C9791]">Modifica los detalles del registro financiero</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[#7C9791] hover:text-[#14B8A6] p-1.5 rounded-xl hover:bg-[#11241F] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Type Switcher */}
          <div>
            <label className="text-xs font-semibold text-[#7C9791] block mb-2 uppercase tracking-wider">
              Tipo de Movimiento
            </label>
            <div className="grid grid-cols-2 gap-2 p-1 bg-[#121212] rounded-xl border border-[#2A2A2A]">
              <button
                type="button"
                onClick={() => {
                  setType('EXPENSE');
                  setCategory(categoriesExpense[0] || 'Software/Suscripciones');
                }}
                className={`py-2 rounded-lg text-xs font-bold transition ${
                  type === 'EXPENSE'
                    ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                    : 'text-[#7C9791] hover:text-white'
                }`}
              >
                Gasto / Deducción
              </button>
              <button
                type="button"
                onClick={() => {
                  setType('INCOME');
                  setCategory(categoriesIncome[0] || 'Honorarios / Proyecto');
                }}
                className={`py-2 rounded-lg text-xs font-bold transition ${
                  type === 'INCOME'
                    ? 'bg-emerald-500/20 text-[#14B8A6] border border-emerald-500/30'
                    : 'text-[#7C9791] hover:text-white'
                }`}
              >
                Ingreso Brutal
              </button>
            </div>
          </div>

          {/* Amount & Currency */}
          <div>
            <label className="text-xs font-semibold text-[#7C9791] block mb-1">
              Monto ({currency}) *
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#7C9791] font-mono font-bold">
                $
              </span>
              <input
                type="number"
                step="0.01"
                min="0"
                value={amount}
                onChange={(e) => {
                  setAmount(e.target.value);
                  setAmountError('');
                }}
                placeholder="0.00"
                className="w-full bg-[#121212] border border-[#2A2A2A] focus:border-[#14B8A6] rounded-xl pl-8 pr-4 py-2.5 text-white font-mono text-base font-bold outline-none transition"
              />
            </div>
            {amountError && <p className="text-xs text-rose-400 mt-1">{amountError}</p>}
          </div>

          {/* Merchant / Vendor / Client */}
          <div>
            <label className="text-xs font-semibold text-[#7C9791] block mb-1">
              {type === 'EXPENSE' ? 'Comercio / Proveedor *' : 'Cliente / Empresa *'}
            </label>
            <input
              type="text"
              value={merchant}
              onChange={(e) => {
                setMerchant(e.target.value);
                setMerchantError('');
              }}
              placeholder={type === 'EXPENSE' ? 'ej. Adobe, AWS, Starbucks' : 'ej. Cliente Acme Corp'}
              className="w-full bg-[#121212] border border-[#2A2A2A] focus:border-[#14B8A6] rounded-xl px-3.5 py-2 text-sm text-white outline-none transition"
            />
            {merchantError && <p className="text-xs text-rose-400 mt-1">{merchantError}</p>}
          </div>

          {/* Category & Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-[#7C9791] block mb-1">Categoría</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-[#121212] border border-[#2A2A2A] focus:border-[#14B8A6] rounded-xl px-3.5 py-2 text-sm text-white outline-none transition"
              >
                {availableCategories.map((cat) => (
                  <option key={cat} value={cat} className="bg-[#121212] text-white">
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-[#7C9791] block mb-1">Fecha</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-[#121212] border border-[#2A2A2A] focus:border-[#14B8A6] rounded-xl px-3.5 py-2 text-sm text-white outline-none transition font-mono"
              />
            </div>
          </div>

          {/* Description / Notes */}
          <div>
            <label className="text-xs font-semibold text-[#7C9791] block mb-1">Descripción / Concepto</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detalle del concepto o servicio"
              className="w-full bg-[#121212] border border-[#2A2A2A] focus:border-[#14B8A6] rounded-xl px-3.5 py-2 text-sm text-white outline-none transition"
            />
          </div>

          {/* Deductibility Level (Expenses only) */}
          {type === 'EXPENSE' && (
            <div>
              <label className="text-xs font-semibold text-[#7C9791] block mb-2">
                Nivel de Deducibilidad
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[100, 50, 0].map((pct) => (
                  <button
                    key={pct}
                    type="button"
                    onClick={() => setDeductiblePercent(pct)}
                    className={`py-2 px-2 rounded-xl text-xs font-bold border transition ${
                      deductiblePercent === pct
                        ? 'bg-[#11241F] text-[#14B8A6] border-[#14B8A6]'
                        : 'bg-[#121212] text-[#7C9791] border-[#2A2A2A] hover:text-white'
                    }`}
                  >
                    {pct}% Deducible
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Buttons: Cancel & Save */}
          <div className="flex items-center gap-3 pt-4 border-t border-[#182F2A]">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 bg-[#121212] hover:bg-[#1A1A1A] text-white text-xs font-semibold rounded-xl border border-[#2A2A2A] transition"
            >
              Cancelar
            </button>

            <button
              type="submit"
              className="flex-1 py-2.5 bg-[#14B8A6] hover:bg-[#0D9488] text-[#050B09] text-xs font-bold rounded-xl transition shadow-lg shadow-[#14B8A6]/10 flex items-center justify-center gap-1.5"
            >
              <Save className="w-4 h-4" />
              <span>Guardar Cambios</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
