import { GoogleGenAI } from '@google/genai';

// Vercel Serverless Function interface definition
interface VercelRequest {
  method?: string;
  body?: any;
  headers?: Record<string, string | string[] | undefined>;
  query?: Record<string, string | string[] | undefined>;
}

interface VercelResponse {
  status: (statusCode: number) => VercelResponse;
  json: (body: any) => void;
  setHeader: (name: string, value: string) => VercelResponse;
  end: (chunk?: any) => void;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Solo aceptar peticiones POST
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Método no permitido. Solo se aceptan peticiones POST.',
    });
  }

  try {
    const rawKey = process.env.GEMINI_API_KEY || '';
    const apiKey = rawKey.trim().replace(/^\[|\]$/g, '');

    if (!apiKey) {
      console.warn('GEMINI_API_KEY no está configurada en las variables de entorno');
      return res.status(500).json({
        success: false,
        error: 'GEMINI_API_KEY no está configurada en las variables de entorno.',
      });
    }

    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
    const {
      message,
      currentTab = 'dashboard',
      plan = 'LITE',
      taxSettings = {},
      history = [],
    } = body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Se requiere un mensaje válido.',
      });
    }

    const ai = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    const screenNames: Record<string, string> = {
      dashboard: 'Dashboard (Resumen Ejecutivo, Métricas Financieras, Gráficos)',
      transactions: 'Historial de Movimientos (Ingresos, Gastos, Filtros, Exportación)',
      scanner: 'Escáner Inteligente de Recibos y Facturas con OCR IA',
      tax: 'Estimación Tributaria e Impuestos (ISR, IVA, Deducciones, Calendario)',
      deliverables: 'Centro de Control y Configuración Técnica',
    };

    const currentScreenName = screenNames[currentTab] || currentTab;

    const systemInstruction = `Eres "Fin", el asistente de Fintack. Tu función es ayudar al usuario a usar la app, no dar asesoría fiscal detallada. Responde de forma breve y directa (máximo 3-4 frases). Si el usuario pregunta sobre impuestos, da una respuesta general y sugiérele consultar la sección de Impuestos de la app o a un contador. Prioriza siempre guiar al usuario a la funcionalidad de Fintack que resuelve su problema (Dashboard, Historial, Escáner, Impuestos, Configuración). No des clases de contabilidad. Sé conciso y útil.

Contexto de la app:
- Pantalla actual: "${currentScreenName}" (pestaña: ${currentTab})
- Plan: ${plan}
- Moneda configurada: ${taxSettings.currency || 'USD'}
- Régimen configurado: ${taxSettings.taxRegime || 'General Freelance'}`;

    // Formatear contenidos de la conversación
    const conversationContents: any[] = [];

    // Agregar historial reciente si existe
    if (Array.isArray(history) && history.length > 0) {
      for (const item of history.slice(-6)) {
        if (item.sender === 'user') {
          conversationContents.push({ role: 'user', parts: [{ text: item.text }] });
        } else if (item.sender === 'assistant') {
          conversationContents.push({ role: 'model', parts: [{ text: item.text }] });
        }
      }
    }

    conversationContents.push({ role: 'user', parts: [{ text: message }] });

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: conversationContents,
      config: {
        systemInstruction,
        temperature: 0.2,
        maxOutputTokens: 600,
      },
    });

    const replyText =
      response.text ||
      'Hola, estoy aquí para ayudarte con cualquier duda sobre Fintack, tus impuestos o cómo registrar tus gastos.';

    return res.status(200).json({
      success: true,
      reply: replyText,
      sender: 'assistant',
    });
  } catch (error: any) {
    console.error('Error en serverless function api/assistant-chat:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'No se pudo conectar con el Asistente Fin.',
    });
  }
}
