import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';
import { PDFParse } from 'pdf-parse';

dotenv.config({ override: true });

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));

  // Initialize Gemini Client lazily or safely
  const getGenAI = () => {
    const rawKey = process.env.GEMINI_API_KEY || '';
    const apiKey = rawKey.trim().replace(/^\[|\]$/g, '');
    if (!apiKey) {
      console.warn('GEMINI_API_KEY is not set in environment variables');
    }
    return new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  };

  // Helper to query Gemini with automatic resilience against temporary demand spikes
  const generateGeminiContent = async (ai: GoogleGenAI, params: any) => {
    const candidateModels = ['gemini-3.8-flash', 'gemini-3.1-flash-lite'];
    let lastError: any = null;
    for (const model of candidateModels) {
      try {
        return await ai.models.generateContent({
          ...params,
          model,
        });
      } catch (err: any) {
        lastError = err;
        console.warn(`Gemini model ${model} encountered an issue (${err?.status || err?.message}). Attempting fallback candidate...`);
      }
    }
    throw lastError;
  };

  // API Endpoint: Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // API Endpoint: OCR / AI Scan Receipt or Invoice
  app.post('/api/scan-receipt', async (req, res) => {
    try {
      const { imageBase64, mimeType = 'image/jpeg', textPrompt } = req.body;

      if (!imageBase64 && !textPrompt) {
        return res.status(400).json({ error: 'Se requiere una imagen o descripción del comprobante.' });
      }

      const ai = getGenAI();

      const parts: any[] = [];

      if (imageBase64) {
        // Strip data prefix if provided
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

      const response = await generateGeminiContent(ai, {
        contents: { parts },
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
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
          },
        },
      });

      const extractedData = JSON.parse(response.text || '{}');
      return res.json({ success: true, data: extractedData });
    } catch (error: any) {
      console.error('Error procesando comprobante:', error);
      return res.status(500).json({
        success: false,
        error: error.message || 'Error al procesar el comprobante con la Inteligencia Artificial.',
      });
    }
  });

  // API Endpoint: Generar Diagnóstico Tributario Freelance con IA
  app.post('/api/tax-advice', async (req, res) => {
    try {
      const {
        totalIncome,
        totalExpenses,
        deductibleExpenses,
        taxRegime = 'General Freelance / Persona Física',
        period = 'Mes Actual',
      } = req.body;

      const ai = getGenAI();

      const prompt = `
Actúa como un Asesor Tributario Experto para trabajadores independientes.
Proporciona un diagnóstico fiscal conciso para el periodo "${period}":
- Ingresos Totales: $${totalIncome}
- Gastos Totales: $${totalExpenses}
- Gastos Deducibles Deducibles: $${deductibleExpenses}
- Régimen Seleccionado: ${taxRegime}

Devuelve un JSON con:
1. estimatedTax: Número con el impuesto proyectado a pagar.
2. effectiveTaxRatePercent: Porcentaje efectivo de carga tributaria (ej. 12.5).
3. potentialSavings: Ahorro potencial estimado si aprovecha deducciones pendientes.
4. recommendations: Array de 3 consejos prácticos, breves y aplicables para optimizar la carga fiscal legalmente.
5. taxCalendarTip: Consejo para la próxima fecha clave de declaración.
`;

      const response = await generateGeminiContent(ai, {
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              estimatedTax: { type: Type.NUMBER },
              effectiveTaxRatePercent: { type: Type.NUMBER },
              potentialSavings: { type: Type.NUMBER },
              recommendations: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              taxCalendarTip: { type: Type.STRING },
            },
            required: ['estimatedTax', 'effectiveTaxRatePercent', 'recommendations', 'taxCalendarTip'],
          },
        },
      });

      const advice = JSON.parse(response.text || '{}');
      return res.json({ success: true, data: advice });
    } catch (error: any) {
      console.error('Error generando diagnóstico tributario:', error);
      return res.status(500).json({
        success: false,
        error: error.message || 'Error al generar recomendación fiscal.',
      });
    }
  });

  // API Endpoint: Fin - Asistente IA de Ayuda de Fintack
  app.post('/api/assistant/chat', async (req, res) => {
    try {
      const {
        message,
        currentTab = 'dashboard',
        plan = 'LITE',
        taxSettings = {},
        history = [],
      } = req.body;

      if (!message || typeof message !== 'string') {
        return res.status(400).json({ error: 'Se requiere un mensaje válido.' });
      }

      const ai = getGenAI();

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

      // Format conversation contents
      const conversationContents: any[] = [];

      // Add recent history if provided
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

      const response = await generateGeminiContent(ai, {
        contents: conversationContents,
        config: {
          systemInstruction,
          temperature: 0.2,
          maxOutputTokens: 600,
        },
      });

      const replyText = response.text || 'Hola, estoy aquí para ayudarte con cualquier duda sobre Fintack, tus impuestos o cómo registrar tus gastos.';

      return res.json({
        success: true,
        reply: replyText,
        sender: 'assistant',
      });
    } catch (error: any) {
      console.error('Error en chat del asistente:', error);
      return res.status(500).json({
        success: false,
        error: error.message || 'No se pudo conectar con el Asistente Fin.',
      });
    }
  });

  // API Endpoint: Parse Bank Statement from CSV using Gemini for intelligent column detection & contextual categorization
  app.post('/api/parse-statement-csv', async (req, res) => {
    try {
      const { csvText } = req.body;

      if (!csvText || typeof csvText !== 'string' || csvText.trim().length === 0) {
        return res.status(400).json({
          success: false,
          error: 'No se recibió el contenido del archivo CSV.',
        });
      }

      const ai = getGenAI();

      // Sample first rows to pass to Gemini along with full/truncated text
      const lines = csvText.split(/\r?\n/).filter((l) => l.trim().length > 0);
      const sampleLines = lines.slice(0, 12).join('\n');
      const contentToProcess = lines.slice(0, 150).join('\n');

      const prompt = `
Eres un asistente de contabilidad inteligente para la plataforma de finanzas Fintack.
Tu tarea es interpretar un extracto bancario en formato CSV, sin importar el orden de columnas, encabezados crípticos o inconsistencias de formato.

PRIMERAS FILAS DE MUESTRA (para deducción de columnas y encabezados):
"""
${sampleLines}
"""

CONTENIDO DEL EXTRACTO CSV A PROCESAR:
"""
${contentToProcess}
"""

INSTRUCCIONES OBLIGATORIAS:
1. INTERPRETACIÓN DE COLUMNAS:
   - Identifica qué columna es la Fecha, sin importar si se llama "FECHA", "FECHA_OP", "F_OPERACION", "F_VALOR", "DATE", "DIA", etc.
   - Identifica la columna de Descripción / Concepto (ej. "CONCEPTO", "DESCRIPCIÓN", "MOVIMIENTO", "DETALLE", "BENEFICIARIO", etc.).
   - Identifica la columna de Monto o si viene separada en Cargo/Abono (Débito/Crédito) o columnas como "IMPORTE", "MONTO", "VALOR", "DEBE", "HABER".
   - Si los encabezados son poco claros o crípticos (ej. "FECHA_OP", "IMPORTE", "DESC_MOV"), interprétalos correctamente.

2. LIMPIEZA Y CORRECCIÓN DE DATOS:
   - Estandariza TODAS las fechas inconsistentes al formato estricto ISO "YYYY-MM-DD" (ej. "15/01/2025" -> "2025-01-15", "03-Feb-2025" -> "2025-02-03", "2025/01/15" -> "2025-01-15"). Cuenta cuántas fechas requirieron estandarización o corrección.
   - Si los montos están en formato europeo (ej. "1.234,56", "1.250,00 €" o donde el punto separa miles y la coma decimales), conviértelos a número flotante internacional estándar (1234.56). Cuenta cuántos montos en formato europeo fueron convertidos.
   - Determina el tipo: "EXPENSE" (gastos, compras, retiros, cargos, comisiones bancarias) o "INCOME" (ingresos, depósitos, cobros, sueldos, transferencias a favor). El campo "amount" debe ser siempre un número positivo.

3. CATEGORIZACIÓN CON CONTEXTO REAL (NO simples palabras clave):
   - Lee la descripción completa de cada movimiento y asigna la categoría más lógica según el contexto:
     * "Pago a Uber Eats", "Rappi", "Didi Food", "Restaurante", "Starbucks" -> "Alimentación" o "Comidas & Clientes"
     * "Pago a Uber", "Didi", "Gasolinera Pemex", "Shell", "Peaje", "Volaris", "Aeromexico" -> "Transporte & Viajes"
     * "Figma", "Adobe", "GitHub", "AWS", "Google Cloud", "OpenAI", "ChatGPT", "Slack" -> "Software & Suscripciones"
     * "Apple Store compra laptop", "Office Depot", "Logitech", "Ikea escritorio" -> "Equipo & Oficina"
     * "Pago de cliente", "Honorarios", "Depósito transferencia nómina/factura" -> "Servicios Profesionales" o "Honorarios Profesionales" (INCOME)
     * "Telmex", "Totalplay", "CFE Luz", "Internet" -> "Servicios & Internet"
     * "Meta Ads", "Google Ads" -> "Marketing & Publicidad"
     * Si no se puede deducir claramente -> "Otros Gastos" (para EXPENSE) u "Otros Ingresos" (para INCOME).
   - Asigna "deductiblePercent" razonable (0 a 100): 100 para software/oficina/servicios; 50 para transporte/comidas; 0 para retiros de efectivo o personales.

4. RESUMEN Y FEEDBACK:
   - Reporta las columnas detectadas (ej. "Fecha: FECHA_OP, Concepto: DESCRIPCION, Monto: IMPORTE").
   - Devuelve las cantidades exactas de correcciones realizadas: datesCorrectedCount, europeanAmountsConvertedCount, categorizedCount.
   - Proporciona un mensaje de resumen en español (summaryNotes) explicando los ajustes aplicados (ej. "Se identificaron las columnas 'FECHA_OP' e 'IMPORTE', se estandarizaron 4 fechas y se categorizaron 12 movimientos contextualmente (ej. Uber Eats asignado a Alimentación).").

Devuelve UNICAMENTE un objeto JSON válido con esta estructura exacta:
{
  "columnsIdentified": {
    "dateColumn": "nombre de la columna fecha",
    "descriptionColumn": "nombre de la columna concepto",
    "amountColumn": "nombre de la columna importe",
    "notes": "explicación breve de las columnas identificadas"
  },
  "datesCorrectedCount": 0,
  "europeanAmountsConvertedCount": 0,
  "categorizedCount": 0,
  "summaryNotes": "Resumen conciso en español de los cambios aplicados por Gemini",
  "transactions": [
    {
      "date": "YYYY-MM-DD",
      "merchant": "Comercio o pagador limpio",
      "description": "Descripción original completa",
      "amount": 123.45,
      "type": "EXPENSE",
      "category": "Nombre de categoría",
      "deductiblePercent": 100
    }
  ]
}
`;

      const response = await generateGeminiContent(ai, {
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.1,
        },
      });

      const responseText = response.text || '{}';
      let parsedData: any = {};
      try {
        parsedData = JSON.parse(responseText);
      } catch (jsonErr) {
        console.error('Error parseando JSON de Gemini CSV parser:', jsonErr);
      }

      const txList = Array.isArray(parsedData.transactions) ? parsedData.transactions : [];

      if (txList.length === 0) {
        return res.status(422).json({
          success: false,
          error: 'Gemini no pudo identificar movimientos válidos en el CSV proporcionado.',
        });
      }

      return res.json({
        success: true,
        transactions: txList,
        aiInsights: {
          columnsIdentified: parsedData.columnsIdentified || {},
          datesCorrectedCount: Number(parsedData.datesCorrectedCount) || 0,
          europeanAmountsConvertedCount: Number(parsedData.europeanAmountsConvertedCount) || 0,
          categorizedCount: Number(parsedData.categorizedCount) || txList.length,
          summaryNotes:
            parsedData.summaryNotes ||
            `Se interpretaron ${txList.length} movimientos y se asignaron categorías inteligentes con contexto.`,
        },
      });
    } catch (error: any) {
      console.error('Error procesando CSV con Gemini:', error);
      return res.status(500).json({
        success: false,
        error: error.message || 'Error analizando el archivo CSV con Gemini.',
      });
    }
  });

  // API Endpoint: Parse Bank Statement from PDF (Extract text & parse transactions with Gemini 3.8 Flash)
  app.post('/api/parse-statement-pdf', async (req, res) => {
    try {
      const { pdfBase64 } = req.body;

      if (!pdfBase64) {
        return res.status(400).json({
          success: false,
          error: 'No se recibió el archivo PDF.',
        });
      }

      // Clean base64 header if present
      const cleanBase64 = pdfBase64.replace(/^data:application\/pdf;base64,/, '');
      const buffer = Buffer.from(cleanBase64, 'base64');

      // Extract raw text using PDFParse
      let extractedText = '';
      try {
        const parser = new PDFParse({ data: new Uint8Array(buffer) });
        const textResult = await parser.getText();
        extractedText = textResult.text || '';
        await parser.destroy();
      } catch (parseError: any) {
        console.warn('pdf-parse could not read the text directly:', parseError);
      }

      if (!extractedText || extractedText.trim().length < 20) {
        // If pdf has no readable text stream, return clear error as requested
        return res.status(422).json({
          success: false,
          error: 'El PDF no tiene un formato reconocible. Usa el formato CSV.',
        });
      }

      // Use Gemini to structure transactions, interpret complex tables, normalize dates/amounts, and contextually categorize
      const ai = getGenAI();
      const prompt = `
Eres un analizador contable inteligente de extractos bancarios para la plataforma de finanzas Fintack.
A continuación se presenta el texto extraído de un estado de cuenta o extracto bancario en PDF.
El texto puede contener tablas complejas, encabezados de columnas dispersos (ej. FECHA, REFERENCIA, CONCEPTO/DESCRIPCIÓN, CARGO/RETIRO, ABONO/DEPÓSITO, SALDO) y formatos numéricos variados.

TEXTO DEL EXTRACTO PDF:
"""
${extractedText.slice(0, 18000)}
"""

INSTRUCCIONES CLAVE:
1. INTERPRETACIÓN DE TABLAS Y MOVIMIENTOS:
   - Extrae todos los movimientos reales de la tabla de movimientos.
   - Omite saldos anteriores, saldos finales, totales del periodo o resúmenes de comisiones globales.
   - Identifica correctamente las columnas aunque estén en formato tabular complejo.

2. LIMPIEZA Y CORRECCIÓN DE DATOS:
   - Estandariza TODAS las fechas al formato estricto ISO "YYYY-MM-DD" (ej. "12/05/2025" -> "2025-05-12", "04-ENE-25" -> "2025-01-04"). Registra cuántas fechas fueron estandarizadas.
   - Convierte importes en formato europeo (ej. "1.234,56 €" o "-1.234,56") a número flotante internacional positivo (ej. 1234.56). Registra cuántos montos fueron convertidos.
   - Determina el tipo: "EXPENSE" (cargos, retiros, compras) o "INCOME" (abonos, depósitos, nómina).

3. CATEGORIZACIÓN CON CONTEXTO REAL:
   - Lee la descripción completa de cada movimiento para asignar la categoría más lógica:
     * "Pago a Uber Eats" o "Rappi" -> "Alimentación" o "Comidas & Clientes"
     * "Pago a Uber" o "Didi" o "Gasolinera" -> "Transporte & Viajes"
     * "Figma", "AWS", "Google", "GitHub", "OpenAI", "Software" -> "Software & Suscripciones"
     * "Apple", "Dell", "Oficina" -> "Equipo & Oficina"
     * "Honorarios", "Depósito cliente" -> "Servicios Profesionales" o "Honorarios Profesionales" (INCOME)
     * "Internet", "Luz", "Teléfono" -> "Servicios & Internet"
     * Si no es evidente -> "Otros Gastos" u "Otros Ingresos".
   - Asigna "deductiblePercent" (0 a 100).

4. FEEDBACK Y RESUMEN DE CAMBIOS:
   - Reporta datesCorrectedCount, europeanAmountsConvertedCount, categorizedCount.
   - Redacta summaryNotes en español con una síntesis de los ajustes realizados por Gemini (ej. "Se interpretaron las tablas del PDF, se estandarizaron 3 fechas y se categorizaron 14 movimientos con contexto.").

Devuelve UNICAMENTE un objeto JSON válido con esta estructura:
{
  "columnsIdentified": {
    "notes": "Estructura de tabla identificada en el extracto PDF"
  },
  "datesCorrectedCount": 0,
  "europeanAmountsConvertedCount": 0,
  "categorizedCount": 0,
  "summaryNotes": "Resumen en español de los cambios aplicados por Gemini",
  "transactions": [
    {
      "date": "YYYY-MM-DD",
      "merchant": "Comercio o pagador limpio",
      "description": "Concepto original completo",
      "amount": 123.45,
      "type": "EXPENSE",
      "category": "Categoría contextual",
      "deductiblePercent": 100
    }
  ]
}
`;

      const response = await generateGeminiContent(ai, {
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.1,
        },
      });

      const responseText = response.text || '{}';
      let parsedData: any = {};
      try {
        parsedData = JSON.parse(responseText);
      } catch (jsonErr) {
        console.error('Error parseando JSON de Gemini PDF parser:', jsonErr);
      }

      const txList = Array.isArray(parsedData.transactions) ? parsedData.transactions : [];

      if (txList.length === 0) {
        return res.status(422).json({
          success: false,
          error: 'El PDF no tiene un formato reconocible. Usa el formato CSV.',
        });
      }

      return res.json({
        success: true,
        transactions: txList,
        aiInsights: {
          columnsIdentified: parsedData.columnsIdentified || { notes: 'Estructura de tabla PDF detectada' },
          datesCorrectedCount: Number(parsedData.datesCorrectedCount) || 0,
          europeanAmountsConvertedCount: Number(parsedData.europeanAmountsConvertedCount) || 0,
          categorizedCount: Number(parsedData.categorizedCount) || txList.length,
          summaryNotes:
            parsedData.summaryNotes ||
            `Gemini procesó la tabla de movimientos del PDF y categorizó ${txList.length} transacciones con contexto.`,
        },
        rawTextLength: extractedText.length,
      });
    } catch (error: any) {
      console.error('Error procesando extracto PDF:', error);
      return res.status(500).json({
        success: false,
        error: error.message || 'Error procesando el archivo PDF.',
      });
    }
  });

  // Setup Vite middleware for development or Static server for production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Fintack Dev Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
