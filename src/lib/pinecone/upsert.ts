import { getIndex } from "./client";

interface VectorRecord {
  id: string;
  values: number[];
  metadata: Record<string, string | number>;
}

export async function upsertVectors(vectors: VectorRecord[]) {
  const index = getIndex();
  const batchSize = 100;

  for (let i = 0; i < vectors.length; i += batchSize) {
    const batch = vectors.slice(i, i + batchSize);
    await index.upsert({ records: batch });
  }
}

export async function deleteVectorsByPrefix(prefix: string) {
  const index = getIndex();

  // List and delete vectors matching the document ID prefix
  const listed = await index.listPaginated({ prefix });
  if (listed.vectors && listed.vectors.length > 0) {
    const ids = listed.vectors.map((v) => v.id);
    await index.deleteMany(ids);
  }

  // Continue pagination if there are more
  let nextToken = listed.pagination?.next;
  while (nextToken) {
    const page = await index.listPaginated({ prefix, paginationToken: nextToken });
    if (page.vectors && page.vectors.length > 0) {
      const ids = page.vectors.map((v) => v.id);
      await index.deleteMany(ids);
    }
    nextToken = page.pagination?.next;
  }
}
