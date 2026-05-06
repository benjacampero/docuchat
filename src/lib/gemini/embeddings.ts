import { getGeminiClient } from "./client";

const MAX_RETRIES = 5;

async function batchEmbedWithRetry(texts: string[], retryCount = 0): Promise<number[][]> {
  const genAI = getGeminiClient();

  try {
    const response = await genAI.models.batchEmbedContents({
      model: "gemini-embedding-001",
      requests: texts.map((text) => ({ contents: text })),
    });
    return response.embeddings!.map((e) => e.values!);
  } catch (error: unknown) {
    const err = error as { status?: number; message?: string };
    if (err.status === 429 && retryCount < MAX_RETRIES) {
      const delay = Math.pow(2, retryCount + 2) * 1000;
      await new Promise((resolve) => setTimeout(resolve, delay));
      return batchEmbedWithRetry(texts, retryCount + 1);
    }
    throw error;
  }
}

export async function generateEmbedding(text: string): Promise<number[]> {
  const results = await batchEmbedWithRetry([text]);
  return results[0];
}

export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  return batchEmbedWithRetry(texts);
}
