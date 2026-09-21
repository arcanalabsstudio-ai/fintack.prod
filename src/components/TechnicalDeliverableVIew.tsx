import React from 'react';
import { Transaction, TaxSettings, ActivityLogItem } from '../types';
import {
  Activity,
  Code,
  Receipt,
  ShieldCheck,
  Sparkles,
  PlusCircle,
  Settings,
  Scan,
  Clock,
  CheckCircle2,
  Cpu,
  ArrowRight
} from 'lucide-react';

interface TechnicalDeliverableViewProps {
  transactions?: Transaction[];
  taxSettings?: TaxSettings;
  activityLogs?: ActivityLogItem[];
  onNavigateTab?: (tab: string) => void;
  onOpenSettings?: () => void;
}

export const TechnicalDeliverableVIew: React.FC<TechnicalDeliverableViewProps> = ({
  transactions = [],
  taxSettings = { regime: 'General Freelance', vatRate: 16, incomeTaxRate: 15, estimatedMonthlyIncomeGoal: 5000 },
  activityLogs = [],
  onNavigateTab,
  onOpenSettings,
}) => {
  // Display top 5 log entries or fallback to computed recent logs if activityLogs is empty
  const displayLogs = React.useMemo(() => {
    if (activityLogs && activityLogs.length > 0) {
      return activityLogs.slice(0, 5);
    }

    // Fallback computed recent events if activityLogs is empty
    const computed: ActivityLogItem[] = [];

    if (transactions.length > 0) {
      const latestTx = transactions[0];
      computed.push({
        id: 'log-tx-latest',
        type: latestTx.hasReceipt ? 'RECEIPT_SCANNED' : 'TRANSACTION_ADDED',
        description: latestTx.hasReceipt
          ? `Comprobante de ${latestTx.merchant || latestTx.description} procesado con IA`
          : `Nueva transacción registrada: ${latestTx.description || latestTx.merchant} ($${latestTx.amount})`,
        timestamp: 'Hace unos momentos',
      });
    }

    computed.push({
      id: 'log-regime',
      type: 'REGIME_CHANGED',
      description: `Régimen fiscal activo: ${taxSettings.regime || 'General Freelance'}`,
      timestamp: 'Hoy',
    });

    computed.push({
      id: 'log-scanner',
      type: 'RECEIPT_SCANNED',
      description: 'Motor Gemini OCR listo para escanear comprobantes',
      timestamp: 'Reciente',
    });

    return computed.slice(0, 5);
  }, [activityLogs, transactions, taxSettings]);

  const getLogIcon = (type: ActivityLogItem['type']) => {
    switch (type) {
      case 'TRANSACTION_ADDED':
        return <PlusCircle className="w-4 h-4 text-[#14B8A6]" />;
      case 'REGIME_CHANGED':
        return <Settings className="w-4 h-4 text-blue-400" />;
      case 'RECEIPT_SCANNED':
        return <Scan className="w-4 h-4 text-purple-400" />;
      default:
        return <Activity className="w-4 h-4 text-emerald-400" />;
    }
  };

  const getLogBadgeStyle = (type: ActivityLogItem['type']) => {
    switch (type) {
      case 'TRANSACTION_ADDED':
        return 'bg-emerald-500/10 text-[#14B8A6] border-emerald-500/20';
      case 'REGIME_CHANGED':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'RECEIPT_SCANNED':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      default:
        return 'bg-gray-500/10 text-gray-300 border-gray-500/20';
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16 px-4 sm:px-0">
      {/* HEADER BANNER */}
      <div className="bg-[#0B1512] p-5 sm:p-6 rounded-2xl border border-[#182F2A] shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-[#11241F] text-[#14B8A6] rounded-xl border border-[#1C3A31] shadow-sm">
              <Activity className="w-5 h-5 text-[#14B8A6]" />
            </div>
            <h2 className="text-xl font-bold text-white">Centro de Control</h2>
            <span className="text-[11px] font-mono bg-[#11241F] text-[#14B8A6] border border-[#1C3A31] px-2.5 py-0.5 rounded-full font-semibold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#14B8A6] animate-pulse"></span>
              Sistema Operativo
            </span>
          </div>
          <p className="text-xs text-[#7C9791] mt-1.5 leading-relaxed">
            Estado global del sistema, parámetros fiscales configurados y registro de actividad en tiempo real.
          </p>
        </div>

        {onOpenSettings && (
          <button
            onClick={onOpenSettings}
            className="px-4 py-2 bg-[#11241F] hover:bg-[#18352D] text-white text-xs font-semibold rounded-xl border border-[#1C3A31] transition flex items-center gap-2 shrink-0"
          >
            <Settings className="w-4 h-4 text-[#14B8A6]" />
            <span>Configuración Fiscal</span>
          </button>
        )}
      </div>

      {/* SECCIÓN A: SUMMARY CARDS ROW */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Versión App */}
        <div className="bg-[#121212] p-5 rounded-2xl border border-[#2A2A2A] shadow-md relative overflow-hidden flex flex-col justify-between group hover:border-[#14B8A6]/30 transition">
          <div className="flex items-start justify-between">
            <div className="p-2.5 bg-[#1C1C1C] text-[#14B8A6] rounded-xl border border-[#333]">
              <Code className="w-5 h-5 text-[#14B8A6]" />
            </div>
            <span className="text-[10px] font-mono bg-emerald-500/10 text-[#14B8A6] border border-emerald-500/20 px-2 py-0.5 rounded-md font-bold">
              ESTABLE
            </span>
          </div>
          <div className="mt-4">
            <span className="text-xs text-[#9CA3AF] block font-medium">Versión de la App</span>
            <div className="text-lg font-bold text-white mt-0.5 tracking-tight">v1.0.0 · 2026</div>
            <p className="text-[11px] text-[#6B7280] mt-1 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-[#14B8A6]" />
              <span>Cliente Cloud Run</span>
            </p>
          </div>
        </div>

        {/* Card 2: Transacciones */}
        <div className="bg-[#121212] p-5 rounded-2xl border border-[#2A2A2A] shadow-md relative overflow-hidden flex flex-col justify-between group hover:border-[#14B8A6]/30 transition">
          <div className="flex items-start justify-between">
            <div className="p-2.5 bg-[#1C1C1C] text-[#14B8A6] rounded-xl border border-[#333]">
              <Receipt className="w-5 h-5 text-[#14B8A6]" />
            </div>
            <span className="text-[10px] font-mono bg-[#1E1E1E] text-[#CBD5E1] border border-[#333] px-2 py-0.5 rounded-md font-semibold">
              CONTABILIDAD
            </span>
          </div>
          <div className="mt-4">
            <span className="text-xs text-[#9CA3AF] block font-medium">Transacciones</span>
            <div className="text-lg font-bold text-white mt-0.5 tracking-tight">
              {transactions.length} registros
            </div>
            <p className="text-[11px] text-[#6B7280] mt-1">
              Has registrado {transactions.length} movimientos
            </p>
          </div>
        </div>

        {/* Card 3: Régimen Fiscal */}
        <div className="bg-[#121212] p-5 rounded-2xl border border-[#2A2A2A] shadow-md relative overflow-hidden flex flex-col justify-between group hover:border-[#14B8A6]/30 transition">
          <div className="flex items-start justify-between">
            <div className="p-2.5 bg-[#1C1C1C] text-[#14B8A6] rounded-xl border border-[#333]">
              <ShieldCheck className="w-5 h-5 text-[#14B8A6]" />
            </div>
            <span className="text-[10px] font-mono bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded-md font-semibold">
              CONFIGURADO
            </span>
          </div>
          <div className="mt-4">
            <span className="text-xs text-[#9CA3AF] block font-medium">Régimen Fiscal</span>
            <div className="text-base font-bold text-white mt-0.5 tracking-tight truncate" title={taxSettings.regime}>
              {taxSettings.regime || 'General Freelance'}
            </div>
            <p className="text-[11px] text-[#6B7280] mt-1">
              IVA {taxSettings.vatRate || 0}% · ISR/IRPF {taxSettings.incomeTaxRate || 0}%
            </p>
          </div>
        </div>

        {/* Card 4: Escáner IA */}
        <div className="bg-[#121212] p-5 rounded-2xl border border-[#2A2A2A] shadow-md relative overflow-hidden flex flex-col justify-between group hover:border-[#14B8A6]/30 transition">
          <div className="flex items-start justify-between">
            <div className="p-2.5 bg-[#1C1C1C] text-[#14B8A6] rounded-xl border border-[#333]">
              <Sparkles className="w-5 h-5 text-[#14B8A6]" />
            </div>
            <div className="flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md">
              <span className="w-2 h-2 rounded-full bg-[#14B8A6] animate-pulse"></span>
              <span className="text-[10px] font-mono text-[#14B8A6] font-bold">ONLINE</span>
            </div>
          </div>
          <div className="mt-4">
            <span className="text-xs text-[#9CA3AF] block font-medium">Escáner IA</span>
            <div className="text-lg font-bold text-white mt-0.5 tracking-tight flex items-center gap-2">
              Conectado
            </div>
            <p className="text-[11px] text-[#6B7280] mt-1">
              Gemini OCR Activo
            </p>
          </div>
        </div>
      </div>

      {/* SECCIÓN B: REGISTRO DE ACTIVIDAD (LOG) */}
      <div className="bg-[#121212] p-5 sm:p-6 rounded-2xl border border-[#2A2A2A] shadow-xl text-white">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-6 border-b border-[#2A2A2A] pb-4">
          <div>
            <h3 className="text-base sm:text-lg font-semibold text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#14B8A6]" />
              <span>Registro de Actividad</span>
            </h3>
            <p className="text-xs text-[#CBD5E1]">
              Historial de las acciones y eventos recientes registrados en la plataforma
            </p>
          </div>

          <span className="text-xs text-[#9CA3AF] font-mono bg-[#1E1E1E] px-3 py-1 rounded-xl border border-[#333]">
            Últimas 5 acciones
          </span>
        </div>

        {displayLogs.length === 0 ? (
          <div className="py-12 text-center space-y-3 bg-[#1A1A1A]/50 rounded-xl border border-[#2A2A2A]/50">
            <Clock className="w-8 h-8 text-[#6B7280] mx-auto" />
            <p className="text-sm font-medium text-[#CBD5E1]">
              Aquí aparecerán tus acciones recientes.
            </p>
            <p className="text-xs text-[#6B7280]">
              Registra una transacción o modifica tu régimen fiscal para ver el historial.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {displayLogs.map((log) => (
              <div
                key={log.id}
                className="p-3.5 bg-[#1A1A1A] hover:bg-[#222222] rounded-xl border border-[#2A2A2A] transition flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`p-2.5 rounded-xl border shrink-0 ${getLogBadgeStyle(log.type)}`}>
                    {getLogIcon(log.type)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm font-medium text-white truncate">
                      {log.description}
                    </p>
                    <span className="text-[10px] text-[#9CA3AF] font-mono block mt-0.5">
                      {log.type === 'TRANSACTION_ADDED' && 'Acción: Registro de Transacción'}
                      {log.type === 'REGIME_CHANGED' && 'Acción: Actualización de Régimen Fiscal'}
                      {log.type === 'RECEIPT_SCANNED' && 'Acción: Escaneo de Comprobante IA'}
                    </span>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-xs text-[#CBD5E1] font-mono bg-[#121212] px-2.5 py-1 rounded-lg border border-[#2E2E2E] whitespace-nowrap">
                    {log.timestamp}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* QUICK SYSTEM SHORTCUTS */}
      <div className="bg-[#0B1512] p-5 rounded-2xl border border-[#182F2A] flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-[#11241F] text-[#14B8A6] rounded-xl border border-[#1C3A31]">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white">Acceso Rápido del Sistema</h4>
            <p className="text-xs text-[#7C9791]">
              Navega de forma inmediata entre los módulos de gestión.
            </p>
          </div>
        </div>

        {onNavigateTab && (
          <div className="flex items-center gap-2 flex-wrap w-full md:w-auto">
            <button
              onClick={() => onNavigateTab('dashboard')}
              className="px-3 py-1.5 bg-[#11241F] hover:bg-[#18352D] text-xs font-semibold text-white rounded-lg border border-[#1C3A31] transition flex items-center gap-1.5"
            >
              <span>Dashboard</span>
              <ArrowRight className="w-3 h-3 text-[#14B8A6]" />
            </button>
            <button
              onClick={() => onNavigateTab('scanner')}
              className="px-3 py-1.5 bg-[#11241F] hover:bg-[#18352D] text-xs font-semibold text-white rounded-lg border border-[#1C3A31] transition flex items-center gap-1.5"
            >
              <span>Escáner IA</span>
              <ArrowRight className="w-3 h-3 text-[#14B8A6]" />
            </button>
            <button
              onClick={() => onNavigateTab('tax')}
              className="px-3 py-1.5 bg-[#11241F] hover:bg-[#18352D] text-xs font-semibold text-white rounded-lg border border-[#1C3A31] transition flex items-center gap-1.5"
            >
              <span>Impuestos</span>
              <ArrowRight className="w-3 h-3 text-[#14B8A6]" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
