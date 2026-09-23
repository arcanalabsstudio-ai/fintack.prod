import { GoogleGenAI, Type } from '@google/genai';

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
  // Aceptar únicamente peticiones POST
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
    const { imageBase64, mimeType = 'image/jpeg', textPrompt } = body;

    if (!imageBase64 && !textPrompt) {
      return res.status(400).json({
        success: false,
        error: 'Se requiere una imagen o descripción del comprobante.',
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

    const parts: any[] = [];

    if (imageBase64) {
      // Remover prefijo data URL si viene incluido
      const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');
      parts.push({
        inlineData: {
          mimeType: mimeType,
          data: cleanBase64,
        },
      });
    }

    const promptText = `
Analiza esta factura o recibo fiscal para un profesional freelance/independiente.
${textPrompt ? `Detalles adicionales: "${textPrompt}"` : ''}

Extrae los datos en formato JSON estricto con las siguientes llaves:
- merchant: Nombre del comercio, proveedor o cliente
- amount: Monto total final en número decimal
- taxAmount: Monto estimado de impuestos/IVA incluido en número decimal (0 si no aplica)
- category: Categoría sugerida entre: ["Software/Suscripciones", "Equipamiento", "Espacio de Trabajo", "Transporte", "Servicios Profesionales", "Alimentación/Reuniones", "Servicios Públicos", "Educación/Cursos", "Otros"]
- type: "EXPENSE" (para gastos de operación) o "INCOME" (si es factura emitida a cliente)
- date: Fecha en formato AAAA-MM-DD (usar fecha actual si no se distingue: ${new Date().toISOString().split('T')[0]})
- deductiblePercent: Porcentaje estimado de deducibilidad fiscal para freelancers (0 a 100)
- taxNote: Breve nota fiscal de 1 oración sobre por qué es deducible o cómo registrarlo
- rawSummary: Resumen corto del concepto (máximo 8 palabras)
`;

    parts.push({ text: promptText });

    const responseSchema = {
      type: Type.OBJECT,
      properties: {
        merchant: { type: Type.STRING },
        amount: { type: Type.NUMBER },
        taxAmount: { type: Type.NUMBER },
        category: { type: Type.STRING },
        type: { type: Type.STRING },
        date: { type: Type.STRING },
        deductiblePercent: { type: Type.NUMBER },
        taxNote: { type: Type.STRING },
        rawSummary: { type: Type.STRING },
      },
      required: ['merchant', 'amount', 'category', 'type', 'deductiblePercent'],
    };

    const candidateModels = ['gemini-2.0-flash', 'gemini-2.5-flash'];
    let responseText = '';
    let lastError: any = null;

    for (const model of candidateModels) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: { parts },
          config: {
            responseMimeType: 'application/json',
            responseSchema,
          },
        });
        responseText = response.text || '{}';
        break;
      } catch (err: any) {
        lastError = err;
        console.warn(`Modelo ${model} no disponible (${err?.message}). Probando alternativa...`);
      }
    }

    if (!responseText && lastError) {
      throw lastError;
    }

    const extractedData = JSON.parse(responseText || '{}');
    return res.status(200).json({ success: true, data: extractedData });
  } catch (error: any) {
    console.error('Error procesando comprobante en api/scan-receipt:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Error al procesar el comprobante con la Inteligencia Artificial.',
    });
  }
}
