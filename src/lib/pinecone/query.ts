import { getIndex } from "./client";
import { PINECONE_TOP_K } from "../constants";

export interface QueryResult {
  id: string;
  score: number;
  metadata: {
    document_id: string;
    document_title: string;
    page_number: number;
    chunk_index: number;
    chunk_text: string;
    image_path: string;
  };
}

export async function queryVectors(
  embedding: number[],
  topK: number = PINECONE_TOP_K
): Promise<QueryResult[]> {
  const index = getIndex();

  const results = await index.query({
    vector: embedding,
    topK,
    includeMetadata: true,
  });

  return (results.matches || []).map((match) => ({
    id: match.id,
    score: match.score || 0,
    metadata: match.metadata as unknown as QueryResult["metadata"],
  }));
}
