import React, { useState, useEffect, useRef } from 'react';
import {
  Bot,
  X,
  Send,
  Sparkles,
  Crown,
  HelpCircle,
  RotateCcw,
  Receipt,
  FileText,
  PieChart,
  ShieldAlert,
  Lightbulb,
  ExternalLink,
  ChevronRight,
} from 'lucide-react';
import { PlanType, TaxSettings } from '../types';
import { generateUniqueId } from '../utils/idGenerator';

interface Message {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  category?: 'general' | 'taxes' | 'features' | 'plans' | 'troubleshooting';
}

interface AIAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTab: string;
  plan: PlanType;
  taxSettings: TaxSettings;
  onUpgradePlan: () => void;
  onNavigateTab: (tab: string) => void;
}

// Plan limits for daily questions
export const PLAN_CHAT_LIMITS: Record<PlanType, number> = {
  LITE: 5,
  STANDARD: 15,
  PRO: Infinity,
};

// Fallback intelligent answers for common questions if offline or API delay
const FAQ_KNOWLEDGE_BASE: Array<{
  keywords: string[];
  reply: string;
  category: 'general' | 'taxes' | 'features' | 'plans' | 'troubleshooting';
}> = [
  {
    keywords: ['cómo agrego un gasto', 'agregar gasto', 'nuevo gasto', 'registrar gasto', 'añadir gasto', 'crear transaccion'],
    reply:
      'Para agregar un gasto en Fintack puedes hacerlo de 2 formas:\n\n1. **Botón Rápido (+):** Toca el botón verde esmeralda flotante en la esquina inferior para abrir el modal de registro rápido.\n2. **Escáner Inteligente:** Ve a la pestaña "Escáner" y sube o fotografía tu ticket/factura; la IA extraerá el comercio, total e impuestos en segundos.\n\nRecuerda marcar el porcentaje de deducibilidad fiscal para optimizar tu cálculo de impuestos.',
    category: 'features',
  },
  {
    keywords: ['isr', 'calcula isr', 'cómo calcula', 'impuesto sobre la renta', 'irpf', 'calcular impuestos'],
    reply:
      'Fintack calcula el ISR/IRPF aplicando la tasa configurada en tu perfil sobre tu **Base Gravable** (Ingresos Totales - Gastos Deducibles).\n\n• **Fórmula:** Base Gravable × Tasa ISR (%)\n• **Consejo:** Solo los gastos con porcentaje deducible mayor a 0% reducen tu base. Puedes ajustar las tasas exactas de tu régimen en la pestaña **Impuestos** o en **Configuración**.',
    category: 'taxes',
  },
  {
    keywords: ['plan pro', 'qué incluye', 'beneficios pro', 'planes', 'precio pro', 'estándar'],
    reply:
      'El plan **Pro ($19 USD/mes)** desbloquea la suite contable completa:\n\n⭐ **Exportación Profesional:** Descarga reportes en Excel (.xlsx) y PDF contables listos para tu contador.\n⭐ **Multi-OCR en Lote:** Escanea múltiples facturas y recibos al mismo tiempo.\n⭐ **IA Ilimitada:** Consultas ilimitadas conmigo (Fin) y diagnósticos fiscales avanzados.\n⭐ **Sincronización en la Nube:** Respaldo en tiempo real con Firebase Firestore.',
    category: 'plans',
  },
  {
    keywords: ['no se guarda', 'no guarda', 'problema guardar', 'error guardar', 'perdí datos'],
    reply:
      'Si una transacción no parece guardarse, revisa estos puntos:\n\n1. **Nube conectada:** Verifica el icono de estado de sincronización en la cabecera. Si inicias sesión en la Nube Fintack, tus datos se sincronizan con Firestore automáticamente.\n2. **Almacenamiento Local:** Fintack guarda automáticamente en el navegador. Asegúrate de no estar en una ventana privada estricta que borre la memoria.\n3. **Campos requeridos:** Asegúrate de ingresar al menos el monto, categoría y fecha.',
    category: 'troubleshooting',
  },
  {
    keywords: ['exportar', 'excel', 'pdf', 'descargar reporte'],
    reply:
      'Para exportar tus movimientos contables:\n\n1. Ve a la pestaña **Historial** (Transacciones).\n2. En la parte superior derecha, haz clic en **Exportar CSV / Excel** o **Reporte PDF**.\n3. *Nota:* La exportación avanzada en PDF y Excel formateado está disponible en el plan **Pro**.',
    category: 'features',
  },
  {
    keywords: ['deducible', 'gastos deducibles', 'qué puedo deducir'],
    reply:
      'Como freelancer o trabajador independiente, generalmente puedes deducir gastos indispensables para tu actividad:\n\n• Software y suscripciones de trabajo (herramientas profesionales, servicios cloud, etc.)\n• Equipo de cómputo y oficina\n• Internet y telefonía móvil\n• Cursos de formación y capacitación profesional\n• Transporte o combustible relacionado con visitas a clientes\n\nAl registrar cada gasto en Fintack puedes fijar si es 100%, 50% o 0% deducible.',
    category: 'taxes',
  },
  {
    keywords: ['iva', 'vat', 'cómo calcula iva', 'retenciones'],
    reply:
      'El IVA/VAT en Fintack se proyecta como:\n\n• **IVA Cobrado** (en tus facturas de ingresos emitidas)\n• **menos IVA Acreditable** (en tus gastos deducibles con comprobante fiscal)\n• **= IVA Neto por Pagar a la autoridad tributaria**.\n\nPuedes consultar el balance detallado en la pestaña **Impuestos**.',
    category: 'taxes',
  },
  {
    keywords: ['importar extracto', 'extracto bancario', 'subir csv', 'subir pdf', 'cargar estado de cuenta', 'importador'],
    reply:
      'Para importar tus extractos bancarios en Fintack:\n\n1. Ve a la pestaña **Historial** (Transacciones).\n2. Haz clic en el botón verde **"Importar extracto"**.\n3. Sube tu archivo **CSV** o **PDF** del banco.\n4. La IA detectará los movimientos, asignará categorías automáticamente y verificará si hay duplicados antes de confirmar la importación.',
    category: 'features',
  },
];

export const AIAssistantModal: React.FC<AIAssistantModalProps> = ({
  isOpen,
  onClose,
  currentTab,
  plan,
  taxSettings,
  onUpgradePlan,
  onNavigateTab,
}) => {
  const [messages, setMessages] = useState<Message[]>(() => {
    const defaultWelcome: Message = {
      id: 'welcome-msg',
      sender: 'assistant',
      text: '¡Hola! Soy Fin, tu asistente inteligente en Fintack. ¿En qué puedo ayudarte hoy con tus finanzas, impuestos o funcionalidades de la app?',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    try {
      const saved = localStorage.getItem('fintack_ai_chat_history');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // ignore
    }
    return [defaultWelcome];
  });

  const [inputMessage, setInputMessage] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Daily question usage count
  const getTodayKey = () => {
    return `fintack_ai_chat_usage_${new Date().toISOString().slice(0, 10)}`;
  };

  const [dailyUsage, setDailyUsage] = useState<number>(() => {
    try {
      const count = localStorage.getItem(getTodayKey());
      return count ? parseInt(count, 10) : 0;
    } catch {
      return 0;
    }
  });

  // Save messages to local storage
  useEffect(() => {
    try {
      localStorage.setItem('fintack_ai_chat_history', JSON.stringify(messages.slice(-30)));
    } catch {
      // ignore
    }
  }, [messages]);

  // Auto scroll to bottom
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, isLoading]);

  const maxLimit = PLAN_CHAT_LIMITS[plan];
  const isLimitReached = plan !== 'PRO' && dailyUsage >= maxLimit;

  // Context-aware questions for the current screen
  const getContextualPrompts = (): string[] => {
    switch (currentTab) {
      case 'dashboard':
        return [
          '¿Cómo se calculan mis métricas financieras?',
          '¿Cómo agrego un gasto rápido?',
          '¿Qué incluye el plan Pro?',
        ];
      case 'transactions':
        return [
          '¿Cómo importar un extracto en CSV o PDF?',
          '¿Cómo filtrar gastos deducibles?',
          '¿Cómo exportar mis movimientos a Excel?',
        ];
      case 'scanner':
        return [
          '¿Qué datos extrae el escáner IA?',
          '¿Cómo funciona el escaneo múltiple en Pro?',
          '¿Cómo tomar una foto óptima para el OCR?',
        ];
      case 'tax':
        return [
          '¿Cómo calcula Fintack el ISR y el IVA?',
          '¿Qué gastos son 100% deducibles para freelancers?',
          '¿Cómo cambiar mi tasa impositiva?',
        ];
      case 'deliverables':
        return [
          '¿Para qué sirve el Centro de Control?',
          '¿Cómo sincronizar mis datos en la nube?',
          '¿Cómo comparar los planes Lite, Estándar y Pro?',
        ];
      default:
        return [
          '¿Cómo agrego un gasto?',
          '¿Cómo calcula Fintack el ISR?',
          '¿Qué incluye el plan Pro?',
        ];
    }
  };

  const getScreenDisplayName = (tab: string) => {
    switch (tab) {
      case 'dashboard':
        return 'Dashboard General';
      case 'transactions':
        return 'Historial de Movimientos';
      case 'scanner':
        return 'Escáner IA de Recibos';
      case 'tax':
        return 'Estimación Tributaria';
      case 'deliverables':
        return 'Centro de Control';
      default:
        return 'Fintack';
    }
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputMessage).trim();
    if (!text || isLoading) return;

    if (isLimitReached) {
      const limitNotice: Message = {
        id: generateUniqueId('msg-limit'),
        sender: 'assistant',
        text: `Has alcanzado el límite diario de ${maxLimit} consultas de tu plan **${plan === 'LITE' ? '🌱 Lite' : '⚖️ Estándar'}**. Actualiza a **⭐ Pro** para disfrutar de consultas ilimitadas con Fin, exportaciones contables y escaneo múltiple.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, limitNotice]);
      return;
    }

    const userMsg: Message = {
      id: generateUniqueId('msg-user'),
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage('');
    setIsLoading(true);

    // Increment daily usage
    const newUsage = dailyUsage + 1;
    setDailyUsage(newUsage);
    try {
      localStorage.setItem(getTodayKey(), newUsage.toString());
    } catch {
      // ignore
    }

    // Call Gemini Assistant API on backend
    try {
      const res = await fetch('/api/assistant/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          currentTab,
          plan,
          taxSettings,
          history: messages.slice(-6),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.reply) {
          const assistantMsg: Message = {
            id: generateUniqueId('msg-ai'),
            sender: 'assistant',
            text: data.reply,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          };
          setMessages((prev) => [...prev, assistantMsg]);
          setIsLoading(false);
          return;
        }
      }

      const errorPayload = await res.json().catch(() => ({}));
      console.warn('Gemini chat API error:', errorPayload);
      throw new Error(errorPayload.error || 'Error al comunicarse con Gemini');
    } catch (err: any) {
      console.error('Error en consulta de asistente:', err);

      // Check if user is asking a basic app usability FAQ as offline backup
      const lowerQuery = text.toLowerCase();
      let matchedReply = '';

      for (const faq of FAQ_KNOWLEDGE_BASE) {
        if (faq.keywords.some((kw) => lowerQuery.includes(kw))) {
          matchedReply = faq.reply;
          break;
        }
      }

      if (!matchedReply) {
        if (lowerQuery.includes('gracias') || lowerQuery.includes('hola') || lowerQuery.includes('buenos')) {
          matchedReply = '¡Hola! Estoy aquí para resolver tus dudas sobre tributación para freelancers, deducciones fiscales o el uso de Fintack. ¿En qué te puedo asesorar?';
        } else {
          matchedReply = 'Lo siento, no pude obtener respuesta de la API de Gemini en este momento. Por favor verifica que tu clave esté activa e inténtalo nuevamente.';
        }
      }

      const assistantMsg: Message = {
        id: generateUniqueId('msg-ai'),
        sender: 'assistant',
        text: matchedReply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, assistantMsg]);
      setIsLoading(false);
    }
  };

  const handleClearHistory = () => {
    const defaultWelcome: Message = {
      id: generateUniqueId('msg-welcome'),
      sender: 'assistant',
      text: '¡Conversación reiniciada! Hola, soy Fin. ¿En qué puedo orientarte hoy?',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages([defaultWelcome]);
    try {
      localStorage.removeItem('fintack_ai_chat_history');
    } catch {
      // ignore
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:justify-start p-0 sm:p-6 bg-[#020504]/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        id="ai-assistant-modal-panel"
        className="w-full sm:w-[440px] h-[85vh] sm:h-[620px] max-h-[92vh] bg-[#081512] border border-[#182F2A] sm:rounded-3xl rounded-t-3xl shadow-2xl flex flex-col overflow-hidden relative"
      >
        {/* Glow decoration */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-[#14B8A6]/5 rounded-full blur-2xl pointer-events-none" />

        {/* 1. HEADER */}
        <div className="p-4 border-b border-[#182F2A] bg-[#0B1512]/90 flex items-center justify-between shrink-0 relative z-10">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#11241F] to-[#163029] border border-[#14B8A6]/40 flex items-center justify-center shadow-xs">
                <Bot className="w-5 h-5 text-[#14B8A6]" />
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-[#14B8A6] border-2 border-[#081512] rounded-full" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                  Fin
                  <span className="text-[10px] text-[#7C9791] font-normal">· Asistente Fintack</span>
                </h3>
              </div>
              <p className="text-[11px] text-[#7C9791] flex items-center gap-1">
                <span>📍</span>
                <span className="truncate max-w-[200px]">{getScreenDisplayName(currentTab)}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Clear button */}
            <button
              type="button"
              onClick={handleClearHistory}
              title="Limpiar chat"
              className="p-2 text-[#7C9791] hover:text-white hover:bg-[#11241F] rounded-xl transition cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            {/* Close button */}
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-[#7C9791] hover:text-white hover:bg-[#11241F] rounded-xl transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 2. PLAN USAGE BAR */}
        <div className="px-4 py-2 bg-[#06100E] border-b border-[#182F2A] flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                plan === 'PRO'
                  ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                  : 'bg-[#11241F] text-[#14B8A6] border border-[#14B8A6]/20'
              }`}
            >
              {plan === 'PRO' ? '⭐ Plan Pro' : plan === 'STANDARD' ? '⚖️ Estándar' : '🌱 Lite'}
            </span>
            <span className="text-[#7C9791] text-[11px]">
              {plan === 'PRO' ? (
                'Consultas ilimitadas'
              ) : (
                <>
                  <span className="font-mono text-white font-semibold">{dailyUsage}</span> / {maxLimit} hoy
                </>
              )}
            </span>
          </div>

          {plan !== 'PRO' && (
            <button
              type="button"
              onClick={onUpgradePlan}
              className="text-[11px] font-bold text-[#14B8A6] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <Crown className="w-3 h-3 text-amber-400" />
              Obtener Ilimitado
            </button>
          )}
        </div>

        {/* 3. CHAT MESSAGES AREA */}
        <div className="flex-1 p-4 overflow-y-auto space-y-4">
          {messages.map((msg) => {
            const isUser = msg.sender === 'user';
            return (
              <div
                key={msg.id}
                className={`flex gap-2.5 ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isUser && (
                  <div className="w-7 h-7 rounded-xl bg-[#11241F] border border-[#14B8A6]/30 flex items-center justify-center shrink-0 mt-0.5">
                    <Bot className="w-4 h-4 text-[#14B8A6]" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed shadow-xs ${
                    isUser
                      ? 'bg-[#14B8A6] text-[#020504] font-medium rounded-br-xs'
                      : 'bg-[#0B1512] text-[#E5E7EB] border border-[#182F2A] rounded-bl-xs'
                  }`}
                >
                  <div className="whitespace-pre-line break-words space-y-1">
                    {msg.text.split('\n\n').map((paragraph, pIdx) => (
                      <p key={pIdx}>{paragraph}</p>
                    ))}
                  </div>
                  <div
                    className={`text-[9px] mt-1 text-right font-mono ${
                      isUser ? 'text-[#020504]/70' : 'text-[#7C9791]'
                    }`}
                  >
                    {msg.timestamp}
                  </div>
                </div>
              </div>
            );
          })}

          {isLoading && (
            <div className="flex gap-2.5 justify-start">
              <div className="w-7 h-7 rounded-xl bg-[#11241F] border border-[#14B8A6]/30 flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4 text-[#14B8A6]" />
              </div>
              <div className="bg-[#0B1512] border border-[#182F2A] rounded-2xl rounded-bl-xs px-4 py-3 flex items-center gap-1.5 shadow-xs">
                <span className="w-2 h-2 rounded-full bg-[#14B8A6] animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 rounded-full bg-[#14B8A6] animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 rounded-full bg-[#14B8A6] animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* 4. CONTEXTUAL QUICK QUESTIONS PILLS */}
        <div className="px-3.5 py-2 border-t border-[#182F2A] bg-[#06100E]/70">
          <div className="flex items-center gap-1.5 mb-1.5">
            <Lightbulb className="w-3 h-3 text-[#14B8A6]" />
            <span className="text-[10px] font-bold text-[#7C9791] uppercase tracking-wider">
              Preguntas sugeridas
            </span>
          </div>
          <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            {getContextualPrompts().map((prompt, pIdx) => (
              <button
                key={pIdx}
                type="button"
                onClick={() => handleSendMessage(prompt)}
                disabled={isLoading || isLimitReached}
                className="shrink-0 px-2.5 py-1 text-[11px] rounded-lg bg-[#0B1512] hover:bg-[#11241F] text-[#7C9791] hover:text-white border border-[#182F2A] hover:border-[#14B8A6]/40 transition text-left cursor-pointer disabled:opacity-50"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>

        {/* 5. INPUT FORM */}
        <div className="p-3 bg-[#081512] border-t border-[#182F2A] shrink-0">
          {isLimitReached ? (
            <div className="p-2.5 bg-[#11241F]/80 border border-amber-500/30 rounded-xl flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Crown className="w-4 h-4 text-amber-400 shrink-0" />
                <span className="text-[11px] text-white">Límite diario alcanzado ({maxLimit}/{maxLimit})</span>
              </div>
              <button
                type="button"
                onClick={onUpgradePlan}
                className="px-2.5 py-1 bg-[#14B8A6] hover:bg-[#0D9488] text-[#020504] font-bold text-xs rounded-lg transition cursor-pointer"
              >
                Actualizar a Pro
              </button>
            </div>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Pregúntale a Fin sobre gastos, ISR, planes..."
                className="flex-1 bg-[#0B1512] text-white text-xs px-3.5 py-2.5 rounded-xl border border-[#182F2A] focus:outline-none focus:border-[#14B8A6] placeholder-[#7C9791]/60 transition"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={!inputMessage.trim() || isLoading}
                className="p-2.5 bg-[#14B8A6] hover:bg-[#0D9488] disabled:opacity-40 disabled:cursor-not-allowed text-[#020504] rounded-xl font-bold transition flex items-center justify-center cursor-pointer shadow-xs"
                title="Enviar mensaje"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
