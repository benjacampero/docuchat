import { CHUNK_SIZE, CHUNK_OVERLAP } from "../constants";

export interface TextChunk {
  text: string;
  pageNumber: number;
  chunkIndex: number;
}

export function chunkText(pageText: string, pageNumber: number): TextChunk[] {
  const chunks: TextChunk[] = [];
  const cleanedText = pageText.trim();

  if (!cleanedText) return chunks;

  let start = 0;
  let chunkIndex = 0;

  while (start < cleanedText.length) {
    const end = Math.min(start + CHUNK_SIZE, cleanedText.length);
    const chunkContent = cleanedText.slice(start, end).trim();

    if (chunkContent.length > 0) {
      chunks.push({
        text: chunkContent,
        pageNumber,
        chunkIndex,
      });
    }

    start += CHUNK_SIZE - CHUNK_OVERLAP;
    chunkIndex++;
  }

  return chunks;
}

export function chunkDocument(
  pages: { pageNumber: number; text: string }[]
): TextChunk[] {
  const allChunks: TextChunk[] = [];

  for (const page of pages) {
    const pageChunks = chunkText(page.text, page.pageNumber);
    allChunks.push(...pageChunks);
  }

  return allChunks;
}
