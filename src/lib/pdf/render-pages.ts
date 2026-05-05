import { SupabaseClient } from "@supabase/supabase-js";

export async function getPageImageUrl(imagePath: string): Promise<string> {
  // Parse the image path to extract document ID and page number
  // Format: {documentId}/page-{pageNumber}.png
  const match = imagePath.match(/^(.+?)\/page-(\d+)\.png$/);
  if (match) {
    const [, documentId, pageNumber] = match;
    return `/api/documents/${documentId}/page/${pageNumber}`;
  }

  return "";
}

export async function deletePageImages(
  documentId: string,
  supabase?: SupabaseClient
): Promise<void> {
  if (!supabase) return;

  const { data: files } = await supabase.storage
    .from("page-images")
    .list(documentId);

  if (files && files.length > 0) {
    const paths = files.map((f) => `${documentId}/${f.name}`);
    await supabase.storage.from("page-images").remove(paths);
  }
}
