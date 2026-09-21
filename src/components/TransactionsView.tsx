import React, { useState } from 'react';
import { Transaction, PlanType, TaxSettings } from '../types';
import { calculateTaxEstimate, formatCurrency } from '../utils/taxCalculator';
import { TRANSLATIONS } from '../utils/translations';
import { Search, Filter, Download, Trash2, Pencil, FileCheck, Info, FileSpreadsheet, Plus, Crown, CheckCircle2, X, SlidersHorizontal, ChevronDown, ChevronUp, Lock } from 'lucide-react';
import { EditTransactionModal } from './EditTransactionModal';
import { ExportReportModal } from './ExportReportModal';
import { ProLockModal } from './ProLockModal';
import { BankStatementImportModal } from './BankStatementImportModal';

interface TransactionsViewProps {
  transactions: Transaction[];
  taxSettings: TaxSettings;
  onDeleteTransaction: (id: string) => void;
  onUpdateTransaction?: (updatedTx: Transaction) => void;
  onAddTransaction?: (newTx: Omit<Transaction, 'id' | 'createdAt'> & { id?: string }) => void;
  onBatchAddTransactions?: (newTxs: (Omit<Transaction, 'id' | 'createdAt'> & { id?: string })[]) => void;
  onOpenQuickAdd: () => void;
  plan: PlanType;
  onUpgradePlan: () => void;
}

export const TransactionsView: React.FC<TransactionsViewProps> = ({
  transactions,
  taxSettings,
  onDeleteTransaction,
  onUpdateTransaction,
  onAddTransaction,
  onBatchAddTransactions,
  onOpenQuickAdd,
  plan,
  onUpgradePlan,
}) => {
  const currentLang = taxSettings.language || 'es';
  const t = TRANSLATIONS[currentLang];
  const currency = taxSettings.currency || 'USD';

  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterType, setFilterType] = useState<'ALL' | 'INCOME' | 'EXPENSE'>('ALL');
  const [filterCategory, setFilterCategory] = useState<string>('ALL');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [minAmount, setMinAmount] = useState<string>('');
  const [maxAmount, setMaxAmount] = useState<string>('');
  const [isFiltersOpen, setIsFiltersOpen] = useState<boolean>(false);

  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState<boolean>(false);
  const [isProLockModalOpen, setIsProLockModalOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const handleSaveEditedTx = (updatedTx: Transaction) => {
    if (onUpdateTransaction) {
      onUpdateTransaction(updatedTx);
    }
    setEditingTx(null);
    showToast(currentLang === 'en' ? 'Transaction updated successfully' : 'Transacción actualizada correctamente');
  };

  // Unique categories for filtering
  const categories = Array.from(
    new Set([
      ...(taxSettings.categories?.expense || []),
      ...(taxSettings.categories?.income || []),
      ...transactions.map((t) => t.category).filter(Boolean),
    ])
  );

  const handleDelete = (id: string) => {
    if (window.confirm(t.deleteConfirm)) {
      onDeleteTransaction(id);
    }
  };

  const hasActiveFilters =
    searchTerm.trim() !== '' ||
    filterType !== 'ALL' ||
    filterCategory !== 'ALL' ||
    startDate !== '' ||
    endDate !== '' ||
    minAmount !== '' ||
    maxAmount !== '';

  const handleClearFilters = () => {
    setSearchTerm('');
    setFilterType('ALL');
    setFilterCategory('ALL');
    setStartDate('');
    setEndDate('');
    setMinAmount('');
    setMaxAmount('');
  };

  const filtered = transactions.filter((tx) => {
    const searchLower = searchTerm.toLowerCase().trim();
    const matchesSearch =
      !searchLower ||
      tx.merchant.toLowerCase().includes(searchLower) ||
      tx.description.toLowerCase().includes(searchLower) ||
      tx.category.toLowerCase().includes(searchLower);

    const matchesType = filterType === 'ALL' || tx.type === filterType;
    const matchesCategory = filterCategory === 'ALL' || tx.category === filterCategory;

    const matchesStartDate = !startDate || tx.date >= startDate;
    const matchesEndDate = !endDate || tx.date <= endDate;

    const numMin = minAmount !== '' ? parseFloat(minAmount) : null;
    const numMax = maxAmount !== '' ? parseFloat(maxAmount) : null;

    const matchesMinAmount = numMin === null || isNaN(numMin) || tx.amount >= numMin;
    const matchesMaxAmount = numMax === null || isNaN(numMax) || tx.amount <= numMax;

    return (
      matchesSearch &&
      matchesType &&
      matchesCategory &&
      matchesStartDate &&
      matchesEndDate &&
      matchesMinAmount &&
      matchesMaxAmount
    );
  });

  const handleExportCSV = () => {
    if (plan === 'FREE') {
      onUpgradePlan();
      return;
    }

    const today = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const formattedDate = `${pad(today.getDate())}/${pad(today.getMonth() + 1)}/${today.getFullYear()}`;

    // Membrete oficial Fintack
    const metadataLines = [
      '# ==========================================================================',
      '# FINTACK - Smart Tax Ledger',
      `# Generado el ${formattedDate}`,
      `# Total registros: ${filtered.length}`,
      '# Reporte generado automáticamente por Fintack • v1.0.0 / 2026',
      '# ==========================================================================',
      '',
    ];

    // Standard CSV compilation
    const headers = ['ID', 'Tipo', 'Proveedor/Cliente', 'Monto', 'Categoria', 'Fecha', 'Deducible %', 'Impuesto Est.'];
    const rows = filtered.map((tx) => [
      tx.id,
      tx.type === 'INCOME' ? 'Ingreso' : 'Gasto',
      tx.merchant,
      tx.amount,
      tx.category,
      tx.date,
      `${tx.deductiblePercent}%`,
      tx.taxAmount || 0,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      metadataLines.join('\n') +
      [headers.join(','), ...rows.map((e) => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))].join('\n') +
      '\n\n# Reporte generado automáticamente por Fintack • v1.0.0 / 2026\n';

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Fintack_Reporte_Movimientos_${today.toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getFilterTypeLabel = (type: 'ALL' | 'INCOME' | 'EXPENSE') => {
    if (type === 'ALL') {
      if (currentLang === 'es') return 'Todos';
      if (currentLang === 'en') return 'All';
      return 'Todos';
    }
    if (type === 'INCOME') {
      if (currentLang === 'es') return 'Ingresos';
      if (currentLang === 'en') return 'Income';
      return 'Receitas';
    }
    if (type === 'EXPENSE') {
      if (currentLang === 'es') return 'Gastos';
      if (currentLang === 'en') return 'Expenses';
      return 'Despesas';
    }
    return '';
  };

  const getSearchPlaceholder = () => {
    if (currentLang === 'es') return 'Buscar por concepto, cliente o comercio...';
    if (currentLang === 'en') return 'Search by concept, client or vendor...';
    return 'Buscar por conceito, cliente ou fornecedor...';
  };

  const getAllCategoriesLabel = () => {
    if (currentLang === 'es') return 'Todas las Categorías';
    if (currentLang === 'en') return 'All Categories';
    return 'Todas as Categorias';
  };

  const getDeductibleLabel = (percent: number) => {
    if (currentLang === 'es') return `${percent}% Deducible`;
    if (currentLang === 'en') return `${percent}% Deductible`;
    return `${percent}% Dedutível`;
  };

  const getBaseIncomeLabel = () => {
    if (currentLang === 'es') return 'Ingreso Base';
    if (currentLang === 'en') return 'Base Income';
    return 'Receita Base';
  };

  const getNoResultsMessage = () => {
    if (currentLang === 'es') return 'No se encontraron movimientos con esos filtros';
    if (currentLang === 'en') return 'No transactions found matching these filters';
    return 'Nenhum movimento encontrado com estes filtros';
  };

  return (
    <div className="space-y-4 sm:space-y-6 max-w-5xl mx-auto pb-16 px-4 sm:px-0">
      {/* HEADER & ACTIONS */}
      <div className="bg-[#0B1512] p-5 sm:p-6 rounded-2xl border border-[#182F2A] shadow-md flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-white">{t.transactions}</h2>
          <p className="text-xs text-[#7C9791] mt-0.5">
            {filtered.length} {currentLang === 'es' ? 'registro(s)' : currentLang === 'en' ? 'record(s)' : 'registro(s)'}
            {hasActiveFilters && ` (filtrado de ${transactions.length})`}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {/* Botón Importar Extracto Bancario */}
          <button
            type="button"
            onClick={() => setIsImportModalOpen(true)}
            className="flex-1 sm:flex-none px-4 py-2.5 bg-[#14B8A6] hover:bg-[#0D9488] text-[#020504] font-bold text-xs rounded-xl transition flex items-center justify-center gap-2 shadow-xs group cursor-pointer"
            title="Importar extracto en CSV o PDF"
          >
            <FileSpreadsheet className="w-4 h-4 transition group-hover:scale-110" />
            <span>Importar extracto</span>
          </button>

          {plan === 'PRO' ? (
            <button
              type="button"
              onClick={() => setIsExportModalOpen(true)}
              className="flex-1 sm:flex-none px-4 py-2.5 bg-[#11241F] hover:bg-[#163029] border border-[#14B8A6]/40 text-[#14B8A6] font-semibold text-xs rounded-xl transition flex items-center justify-center gap-2 shadow-xs group cursor-pointer"
            >
              <Download className="w-4 h-4 transition group-hover:scale-110" />
              <span>Exportar Reporte</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setIsProLockModalOpen(true)}
              className="flex-1 sm:flex-none px-3.5 py-2.5 bg-[#11241F] hover:bg-[#163029] border border-[#182F2A] hover:border-amber-500/40 text-[#7C9791] hover:text-white font-semibold text-xs rounded-xl transition flex items-center justify-center gap-2 shadow-xs group cursor-pointer"
              title="Función PRO bloqueada"
            >
              <Lock className="w-4 h-4 text-amber-400" />
              <span>Exportar Reporte</span>
              <span className="text-[9px] bg-amber-500/15 text-amber-400 font-bold px-1.5 py-0.5 rounded border border-amber-500/30">PRO</span>
            </button>
          )}
        </div>
      </div>

      {/* SEARCH BAR & TOGGLE ADVANCED FILTERS */}
      <div className="bg-[#0B1512] p-3 sm:p-4 rounded-2xl border border-[#182F2A] shadow-md space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#7C9791] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={getSearchPlaceholder()}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-[#121212] border border-[#2A2A2A] rounded-xl text-xs font-semibold text-white placeholder-[#4A645F] focus:outline-none focus:ring-1 focus:ring-[#14B8A6] focus:border-[#14B8A6]"
            />
          </div>

          {/* Toggle Button for Filters (Oculto en modo Lite) */}
          {plan !== 'LITE' && (
            <button
              onClick={() => setIsFiltersOpen((prev) => !prev)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition flex items-center justify-center gap-2 shrink-0 ${
                isFiltersOpen || hasActiveFilters
                  ? 'bg-[#11241F] text-[#14B8A6] border-[#14B8A6]'
                  : 'bg-[#121212] text-[#7C9791] border-[#2A2A2A] hover:text-white hover:border-[#182F2A]'
              }`}
            >
              <SlidersHorizontal className="w-4 h-4 text-[#14B8A6]" />
              <span>Filtros Avanzados</span>
              {hasActiveFilters && (
                <span className="w-2 h-2 rounded-full bg-[#14B8A6] animate-pulse"></span>
              )}
              {isFiltersOpen ? <ChevronUp className="w-4 h-4 text-[#14B8A6]" /> : <ChevronDown className="w-4 h-4 text-[#7C9791]" />}
            </button>
          )}
        </div>

        {/* DROPDOWN FILTER PANEL */}
        {plan !== 'LITE' && isFiltersOpen && (
          <div className="pt-3 border-t border-[#182F2A] space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-semibold text-[#7C9791] uppercase tracking-wider">
                Filtros Activos
              </span>

              {hasActiveFilters && (
                <button
                  onClick={handleClearFilters}
                  className="px-3 py-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-semibold rounded-lg border border-rose-500/20 transition flex items-center gap-1"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Limpiar Filtros</span>
                </button>
              )}
            </div>

            {/* Row 1: Movement Type & Category */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Movement Type */}
              <div>
                <label className="text-[10px] font-semibold text-[#7C9791] uppercase tracking-wider block mb-1">
                  Tipo de Movimiento
                </label>
                <div className="flex items-center bg-[#121212] p-1 rounded-xl border border-[#2A2A2A]">
                  <button
                    type="button"
                    onClick={() => setFilterType('ALL')}
                    className={`flex-1 py-1 text-xs font-semibold rounded-lg transition ${
                      filterType === 'ALL'
                        ? 'bg-[#1C3A31] text-white shadow-xs'
                        : 'text-[#7C9791] hover:text-white'
                    }`}
                  >
                    {getFilterTypeLabel('ALL')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilterType('INCOME')}
                    className={`flex-1 py-1 text-xs font-bold rounded-lg transition ${
                      filterType === 'INCOME'
                        ? 'bg-[#14B8A6] text-[#020504] shadow-xs'
                        : 'text-[#7C9791] hover:text-white'
                    }`}
                  >
                    {getFilterTypeLabel('INCOME')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilterType('EXPENSE')}
                    className={`flex-1 py-1 text-xs font-semibold rounded-lg transition ${
                      filterType === 'EXPENSE'
                        ? 'bg-rose-500/20 text-rose-400 shadow-xs'
                        : 'text-[#7C9791] hover:text-white'
                    }`}
                  >
                    {getFilterTypeLabel('EXPENSE')}
                  </button>
                </div>
              </div>

              {/* Category */}
              <div>
                <label className="text-[10px] font-semibold text-[#7C9791] uppercase tracking-wider block mb-1">
                  Categoría
                </label>
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-[#121212] border border-[#2A2A2A] rounded-xl text-xs font-semibold text-white focus:outline-none focus:ring-1 focus:ring-[#14B8A6] focus:border-[#14B8A6]"
                >
                  <option value="ALL" className="bg-[#121212]">{getAllCategoriesLabel()}</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat} className="bg-[#121212]">
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Row 2: Date Range & Amount Range */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Fecha Desde */}
              <div>
                <label className="text-[10px] font-semibold text-[#7C9791] uppercase tracking-wider block mb-1">
                  Fecha Desde
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-1.5 bg-[#121212] border border-[#2A2A2A] rounded-xl text-xs font-mono text-white focus:outline-none focus:border-[#14B8A6]"
                />
              </div>

              {/* Fecha Hasta */}
              <div>
                <label className="text-[10px] font-semibold text-[#7C9791] uppercase tracking-wider block mb-1">
                  Fecha Hasta
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-1.5 bg-[#121212] border border-[#2A2A2A] rounded-xl text-xs font-mono text-white focus:outline-none focus:border-[#14B8A6]"
                />
              </div>

              {/* Monto Mínimo */}
              <div>
                <label className="text-[10px] font-semibold text-[#7C9791] uppercase tracking-wider block mb-1">
                  Monto Mínimo ({currency})
                </label>
                <div className="relative">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#7C9791] text-xs font-mono">$</span>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    placeholder="0.00"
                    value={minAmount}
                    onChange={(e) => setMinAmount(e.target.value)}
                    className="w-full pl-6 pr-3 py-1.5 bg-[#121212] border border-[#2A2A2A] rounded-xl text-xs font-mono text-white placeholder-[#4A645F] focus:outline-none focus:border-[#14B8A6]"
                  />
                </div>
              </div>

              {/* Monto Máximo */}
              <div>
                <label className="text-[10px] font-semibold text-[#7C9791] uppercase tracking-wider block mb-1">
                  Monto Máximo ({currency})
                </label>
                <div className="relative">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#7C9791] text-xs font-mono">$</span>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    placeholder="Sin límite"
                    value={maxAmount}
                    onChange={(e) => setMaxAmount(e.target.value)}
                    className="w-full pl-6 pr-3 py-1.5 bg-[#121212] border border-[#2A2A2A] rounded-xl text-xs font-mono text-white placeholder-[#4A645F] focus:outline-none focus:border-[#14B8A6]"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* TRANSACTIONS LIST */}
      <div className="space-y-3">
        {/* Table View (Desktop) */}
        <div className="hidden sm:block bg-[#0B1512] rounded-2xl border border-[#182F2A] shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#081512] text-[#7C9791] font-semibold border-b border-[#182F2A] uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="p-3.5">{t.movement}</th>
                  <th className="p-3.5">{t.category}</th>
                  <th className="p-3.5">{t.date}</th>
                  <th className="p-3.5">{t.deductibility}</th>
                  <th className="p-3.5 text-right">{t.amount}</th>
                  {plan !== 'LITE' && <th className="p-3.5 text-center">{t.actions}</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#182F2A]">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={plan === 'LITE' ? 5 : 6} className="p-10 text-center">
                      <div className="flex flex-col items-center justify-center gap-2.5">
                        <Filter className="w-8 h-8 text-[#4A645F]" />
                        <p className="text-sm font-semibold text-white">
                          {getNoResultsMessage()}
                        </p>
                        {hasActiveFilters && (
                          <button
                            onClick={handleClearFilters}
                            className="mt-1 px-3.5 py-1.5 bg-[#11241F] text-[#14B8A6] hover:bg-[#18352D] text-xs font-semibold rounded-xl border border-[#1C3A31] transition flex items-center gap-1.5"
                          >
                            <X className="w-3.5 h-3.5" />
                            <span>Limpiar Filtros</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  filtered.map((tx) => (
                    <tr key={tx.id} className="hover:bg-[#11221D]/40 transition">
                      <td className="p-3.5">
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 border ${
                              tx.type === 'INCOME'
                                ? 'bg-[#11241F] text-[#14B8A6] border-[#1C3A31]/40'
                                : 'bg-rose-500/10 text-rose-400 border-rose-500/10'
                            }`}
                          >
                            {tx.type === 'INCOME' ? '+' : '-'}
                          </div>
                          <div>
                            <div className="font-semibold text-white">{tx.merchant}</div>
                            <div className="text-[11px] text-[#7C9791] line-clamp-1">
                              {tx.description}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="p-3.5">
                        <span className="font-semibold text-white">{tx.category}</span>
                        {tx.hasReceipt && (
                          <span className="flex items-center gap-1 text-[10px] text-[#14B8A6] font-semibold mt-0.5">
                            <FileCheck className="w-3 h-3 text-[#14B8A6]" />
                            <span>{t.receipt} OK</span>
                          </span>
                        )}
                      </td>

                      <td className="p-3.5 font-mono text-[#7C9791] whitespace-nowrap">{tx.date}</td>

                      <td className="p-3.5">
                        {tx.type === 'EXPENSE' ? (
                          <span
                            className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                              tx.deductiblePercent === 100
                                ? 'bg-[#11241F] text-[#14B8A6] border-[#1C3A31]'
                                : tx.deductiblePercent === 50
                                ? 'bg-amber-500/10 text-amber-400 border-amber-500/15'
                                : 'bg-[#050B09] text-[#7C9791] border border-[#182F2A]'
                            }`}
                          >
                            {getDeductibleLabel(tx.deductiblePercent)}
                          </span>
                        ) : (
                          <span className="text-[10px] font-mono text-[#7C9791]">{getBaseIncomeLabel()}</span>
                        )}
                      </td>

                      <td className="p-3.5 text-right font-mono font-bold text-sm whitespace-nowrap">
                        <span className={tx.type === 'INCOME' ? 'text-[#14B8A6]' : 'text-white'}>
                          {tx.type === 'INCOME' ? '+' : '-'} {formatCurrency(tx.amount, currency)}
                        </span>
                      </td>

                      {plan !== 'LITE' && (
                        <td className="p-3.5 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => setEditingTx(tx)}
                              className="p-1.5 text-[#7C9791] hover:text-[#14B8A6] hover:bg-[#11241F] rounded-lg transition"
                              title="Editar"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(tx.id)}
                              className="p-1.5 text-[#7C9791] hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition"
                              title={t.delete}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Card View (Mobile) */}
        <div className="sm:hidden space-y-3">
          {filtered.length === 0 ? (
            <div className="p-8 text-center text-[#7C9791] bg-[#0B1512] rounded-2xl border border-[#182F2A] flex flex-col items-center justify-center gap-2.5">
              <Filter className="w-8 h-8 text-[#4A645F]" />
              <p className="text-sm font-semibold text-white">
                {getNoResultsMessage()}
              </p>
              {hasActiveFilters && (
                <button
                  onClick={handleClearFilters}
                  className="mt-1 px-3.5 py-1.5 bg-[#11241F] text-[#14B8A6] hover:bg-[#18352D] text-xs font-semibold rounded-xl border border-[#1C3A31] transition flex items-center gap-1.5"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Limpiar Filtros</span>
                </button>
              )}
            </div>
          ) : (
            filtered.map((tx) => (
              <div key={tx.id} className="bg-[#0B1512] p-4 rounded-2xl border border-[#182F2A] shadow-md flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 border ${
                      tx.type === 'INCOME'
                        ? 'bg-[#11241F] text-[#14B8A6] border-[#1C3A31]/40'
                        : 'bg-rose-500/10 text-rose-400 border-rose-500/10'
                    }`}
                  >
                    {tx.type === 'INCOME' ? '+' : '-'}
                  </div>
                  <div>
                    <div className="font-semibold text-white">{tx.merchant}</div>
                    <div className="text-[11px] text-[#7C9791]">
                      {tx.category} • {tx.date}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`font-bold font-mono ${tx.type === 'INCOME' ? 'text-[#14B8A6]' : 'text-white'}`}>
                    {tx.type === 'INCOME' ? '+' : '-'} {formatCurrency(tx.amount, currency)}
                  </div>
                  {plan !== 'LITE' && (
                    <div className="mt-1 flex items-center justify-end gap-1">
                      <button
                        onClick={() => setEditingTx(tx)}
                        className="p-1 text-[#7C9791] hover:text-[#14B8A6]"
                        title="Editar"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(tx.id)}
                        className="p-1 text-[#7C9791] hover:text-rose-400"
                        title={t.delete}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* SUCCESS TOAST NOTIFICATION */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#0B1512] border border-[#14B8A6] text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2.5 animate-in fade-in slide-in-from-bottom-5">
          <CheckCircle2 className="w-5 h-5 text-[#14B8A6]" />
          <span className="text-xs font-bold">{toastMessage}</span>
        </div>
      )}

      {/* EDIT TRANSACTION MODAL */}
      <EditTransactionModal
        isOpen={!!editingTx}
        onClose={() => setEditingTx(null)}
        transaction={editingTx}
        taxSettings={taxSettings}
        onUpdateTransaction={handleSaveEditedTx}
      />

      {/* EXPORT REPORT MODAL */}
      <ExportReportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        transactions={transactions}
        taxSettings={taxSettings}
      />

      {/* BANK STATEMENT IMPORT MODAL (CSV & PDF) */}
      <BankStatementImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        existingTransactions={transactions}
        onImportCompleted={(importedList, aiInsights) => {
          if (onBatchAddTransactions) {
            onBatchAddTransactions(importedList);
          } else if (onAddTransaction) {
            importedList.forEach((tx) => onAddTransaction(tx));
          }
          const toastMessage =
            currentLang === 'es'
              ? aiInsights?.summaryNotes
                ? `¡Importados ${importedList.length} movimientos con Gemini! ${aiInsights.summaryNotes}`
                : `Se importaron ${importedList.length} movimientos correctamente`
              : `Imported ${importedList.length} transactions successfully with Gemini`;
          showToast(toastMessage);
        }}
        taxSettings={taxSettings}
      />

      {/* PRO LOCK MODAL */}
      <ProLockModal
        isOpen={isProLockModalOpen}
        onClose={() => setIsProLockModalOpen(false)}
        onUpgradePlan={onUpgradePlan}
        featureName="Exportación de Reportes"
        description="Descarga el historial y reportes contables en PDF, Excel y CSV estructurados para tu gestión fiscal."
      />
    </div>
  );
};
