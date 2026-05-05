import { getGeminiClient } from "./client";

const BATCH_SIZE = 20; // Process 20, then pause
const BATCH_DELAY_MS = 15000; // 15s between batches (~80 req/min stays under 100 limit)
const ITEM_DELAY_MS = 500; // 500ms between individual requests within a batch
const MAX_RETRIES = 5;

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
      // Exponential backoff: 4s, 8s, 16s, 32s, 64s
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

export async function generateEmbeddings(
  texts: string[]
): Promise<number[][]> {
  const embeddings: number[][] = [];

  for (let i = 0; i < texts.length; i += BATCH_SIZE) {
    const batch = texts.slice(i, i + BATCH_SIZE);

    // Process each item sequentially with small delay to avoid burst
    for (let j = 0; j < batch.length; j++) {
      const result = await embedWithRetry(batch[j]);
      embeddings.push(result);
      if (j < batch.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, ITEM_DELAY_MS));
      }
    }

    // Delay between batches
    if (i + BATCH_SIZE < texts.length) {
      await new Promise((resolve) => setTimeout(resolve, BATCH_DELAY_MS));
    }
  }

  return embeddings;
}
