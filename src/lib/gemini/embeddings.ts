import { getGeminiClient } from "./client";

const MAX_RETRIES = 5;
const CONCURRENCY = 10; // Run 10 requests in parallel

async function embedWithRetry(text: string, retryCount = 0): Promise<number[]> {
  const genAI = getGeminiClient();

  try {
    const response = await genAI.models.embedContent({
      model: "gemini-embedding-001",
      contents: text,
    });
    return response.embeddings![0].values!;
  } catch (error: unknown) {
    const err = error as { status?: number; message?: string };
    if (err.status === 429 && retryCount < MAX_RETRIES) {
      const delay = Math.pow(2, retryCount + 2) * 1000;
      await new Promise((resolve) => setTimeout(resolve, delay));
      return embedWithRetry(text, retryCount + 1);
    }
    throw error;
  }
}

export async function generateEmbedding(text: string): Promise<number[]> {
  return embedWithRetry(text);
}

export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  const results: number[][] = [];

  for (let i = 0; i < texts.length; i += CONCURRENCY) {
    const batch = texts.slice(i, i + CONCURRENCY);
    const batchResults = await Promise.all(batch.map((text) => embedWithRetry(text)));
    results.push(...batchResults);
  }

  return results;
}
