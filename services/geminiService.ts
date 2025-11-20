import { GoogleGenAI, Type } from "@google/genai";
import { NormativeDoc, CaseFile, ChatMessage, CaseEvent } from "../types";

// Initialize the client
const getAiClient = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Extracts case metadata (Rol, Caratula, Court) from a Markdown file.
 */
export const extractCaseMetadata = async (mdContent: string): Promise<{ rol: string, caratula: string, court: string }> => {
  const ai = getAiClient();
  const model = "gemini-2.5-flash";

  const prompt = `
    Analiza el siguiente expediente judicial (formato Markdown/Texto).
    Extrae la siguiente información:
    1. ROL o RIT de la causa (ej: C-123-2023, O-45-2024).
    2. Carátula: DEBE ser estrictamente en formato "DEMANDANTE / DEMANDADO" (Mayúsculas). Busca los nombres de las partes principales.
    3. Tribunal o Juzgado.

    Si no encuentras algún dato exacto, infiérelo o déjalo vacío.
    Retorna SOLO un objeto JSON.
  `;

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: {
        parts: [
          { text: prompt },
          { text: mdContent }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            rol: { type: Type.STRING },
            caratula: { type: Type.STRING },
            court: { type: Type.STRING }
          },
          required: ["rol", "caratula", "court"]
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text);
    }
    throw new Error("No se pudo extraer información.");
  } catch (error) {
    console.error("Error extracting metadata:", error);
    throw error;
  }
};

/**
 * Generates a chronological summary of the case based on uploaded files.
 */
export const generateCaseTimeline = async (files: CaseFile[]): Promise<CaseEvent[]> => {
  const ai = getAiClient();
  const model = "gemini-2.5-flash";

  // Prepare content parts. Check if it is text/md or binary pdf
  const contentParts = files.map(f => {
    if (f.mimeType === 'text/markdown' || f.mimeType === 'text/plain') {
      // Decode base64 to text for better processing if it was stored as base64
      try {
        const text = atob(f.content);
        return { text: `--- DOCUMENTO: ${f.name} ---\n${text}` };
      } catch (e) {
        return { text: `--- DOCUMENTO: ${f.name} ---\n${f.content}` }; // Fallback if not base64 or plain text
      }
    } else {
      return {
        inlineData: {
          mimeType: f.mimeType,
          data: f.content
        }
      };
    }
  });

  const prompt = `
    Analiza los documentos proporcionados de una causa judicial chilena.
    Genera una línea de tiempo estructurada de los hitos procesales RELEVANTES.
    Ignora trámites administrativos menores.
    La fecha debe estar en formato YYYY-MM-DD.
    El tipo debe ser 'resolucion', 'escrito', u 'otro'.
    IDIOMA DE RESPUESTA: ESPAÑOL.
  `;

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: {
        parts: [
          ...contentParts,
          { text: prompt }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              date: { type: Type.STRING },
              title: { type: Type.STRING },
              description: { type: Type.STRING },
              type: { type: Type.STRING, enum: ["resolucion", "escrito", "otro"] }
            },
            required: ["date", "title", "description", "type"]
          }
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text) as CaseEvent[];
    }
    return [];
  } catch (error) {
    console.error("Error generating timeline:", error);
    throw error;
  }
};

/**
 * Chat with the normative context and optional case context.
 */
export const askLegalAssistant = async (
  query: string,
  normativeDocs: NormativeDoc[],
  useWebSearch: boolean,
  chatHistory: ChatMessage[],
  caseFiles?: CaseFile[] // Optional case context
): Promise<{ text: string, sources?: string[] }> => {
  const ai = getAiClient();
  const model = "gemini-2.5-flash";

  // Construct context from normative documents
  const normativeParts = normativeDocs.map(doc => ({
    inlineData: {
      mimeType: doc.mimeType,
      data: doc.content
    }
  }));

  // Construct context from Case Files (specifically expecting MD/Text usually)
  let caseParts: any[] = [];
  if (caseFiles && caseFiles.length > 0) {
    caseParts = caseFiles.map(f => {
      if (f.mimeType.includes('text') || f.mimeType.includes('markdown')) {
        try {
          return { text: `CONTEXTO EXPEDIENTE (${f.name}):\n${atob(f.content)}` };
        } catch (e) {
          return { text: `CONTEXTO EXPEDIENTE (${f.name}):\n${f.content}` };
        }
      } else {
        return {
          inlineData: { mimeType: f.mimeType, data: f.content }
        };
      }
    });
  }

  // Updated instruction
  const systemInstruction = `
    Eres un asistente legal experto en Derecho Chileno.
    
    IDIOMA: SIEMPRE ESPAÑOL.
    
    CONTEXTO:
    1. Tienes acceso a normativas cargadas (Leyes, Autos Acordados).
    ${caseFiles && caseFiles.length > 0 ? '2. Tienes acceso al EXPEDIENTE de la causa actual (Resoluciones, Escritos, Markdown).' : ''}

    OBJETIVO:
    Responder consultas sobre plazos, procedimientos y detalles de la causa actual (si se proporciona).
    
    INSTRUCCIONES DE RESPUESTA:
    1. **CONCISIÓN**: Directo al grano.
    2. **FORMATO**: Usa **negritas** para plazos (ej: **3 días**) y artículos/hitos clave.
    3. **FUENTES**: Cita el artículo legal o el folio del expediente según corresponda.
    4. Si te preguntan algo del caso, busca en el expediente provisto.
  `;

  // Convert app chat history to Gemini chat history format
  const history = chatHistory.map(msg => ({
    role: msg.role,
    parts: [{ text: msg.text }]
  }));

  const tools = useWebSearch ? [{ googleSearch: {} }] : [];

  try {
    const chat = ai.chats.create({
      model: model,
      config: {
        systemInstruction: systemInstruction,
        tools: tools,
      },
      history: history
    });

    // Prioritize case parts in the message payload if they exist
    const messageParts = [
      ...normativeParts,
      ...caseParts,
      { text: query }
    ];

    const response = await chat.sendMessage({
      message: messageParts
    });

    const text = response.text || "No pude generar una respuesta.";
    
    let sources: string[] = [];
    if (response.candidates?.[0]?.groundingMetadata?.groundingChunks) {
      response.candidates[0].groundingMetadata.groundingChunks.forEach((chunk: any) => {
        if (chunk.web?.uri) {
          sources.push(chunk.web.uri);
        }
      });
    }

    return { text, sources };

  } catch (error) {
    console.error("Error in legal assistant:", error);
    return { text: "Ocurrió un error al consultar al asistente. (Error RPC o de Red)." };
  }
};