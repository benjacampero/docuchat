import { getGeminiClient } from "./client";
import { QueryResult } from "../pinecone/query";

const SYSTEM_PROMPT = `Eres un asistente experto que responde preguntas basándose en el contexto de los documentos proporcionados.

REGLAS:
- Responde SOLO basándote en el contexto proporcionado. Si el contexto no contiene la respuesta, dilo claramente.
- Cuando hagas referencia a información, menciona el documento fuente y el número de página.
- Sé conciso pero completo.
- Usa formato markdown cuando sea útil.
- Responde en el mismo idioma en que se hace la pregunta.`;

const MAX_RETRIES = 3;

async function callWithRetry<T>(fn: () => Promise<T>): Promise<T> {
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      return await fn();
    } catch (error: unknown) {
      const err = error as { status?: number; message?: string };
      if (err.status === 429 && attempt < MAX_RETRIES) {
        // Extract retry delay from error or use exponential backoff
        const delay = Math.pow(2, attempt + 1) * 5000; // 10s, 20s, 40s
        console.log(`[Gemini] Rate limited, retrying in ${delay / 1000}s (attempt ${attempt + 1}/${MAX_RETRIES})`);
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }
      throw error;
    }
  }
  throw new Error("Max retries exceeded");
}

export async function generateChatResponse(
  question: string,
  context: QueryResult[],
  conversationHistory: { role: string; content: string }[]
) {
  const genAI = getGeminiClient();

  const contextText = context
    .map(
      (c) =>
        `[Fuente: "${c.metadata.document_title}", Página ${c.metadata.page_number}]\n${c.metadata.chunk_text}`
    )
    .join("\n\n---\n\n");

  const history = conversationHistory.map((msg) => ({
    role: msg.role === "user" ? ("user" as const) : ("model" as const),
    parts: [{ text: msg.content }],
  }));

  const prompt = `CONTEXTO DE DOCUMENTOS:\n${contextText}\n\n---\n\nPREGUNTA DEL USUARIO: ${question}`;

  const response = await callWithRetry(() =>
    genAI.models.generateContentStream({
      model: "gemini-2.5-flash",
      config: {
        systemInstruction: SYSTEM_PROMPT,
      },
      contents: [
        ...history.map((msg) => ({
          role: msg.role,
          parts: msg.parts,
        })),
        {
          role: "user" as const,
          parts: [{ text: prompt }],
        },
      ],
    })
  );

  return response;
}
