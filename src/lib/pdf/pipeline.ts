import { SupabaseClient } from "@supabase/supabase-js";
import { extractTextFromPdf } from "./extract-text";
import { deletePageImages } from "./render-pages";
import { chunkDocument, TextChunk } from "../utils/chunking";
import { generateEmbeddings } from "../gemini/embeddings";
import { upsertVectors, deleteVectorsByPrefix } from "../pinecone/upsert";

interface ProcessingResult {
  success: boolean;
  pageCount?: number;
  chunkCount?: number;
  error?: string;
}

export async function processDocument(
  documentId: string,
  supabase: SupabaseClient
): Promise<ProcessingResult> {

  try {
    // Update status to processing
    await supabase
      .from("documents")
      .update({ status: "processing" })
      .eq("id", documentId);

    // Get document record
    const { data: doc, error: docError } = await supabase
      .from("documents")
      .select("*")
      .eq("id", documentId)
      .single();

    if (docError || !doc) {
      throw new Error("Document not found");
    }

    // Download PDF from storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from("documents")
      .download(doc.file_path);

    if (downloadError || !fileData) {
      throw new Error(`Failed to download PDF: ${downloadError?.message}`);
    }

    const pdfBuffer = await fileData.arrayBuffer();

    // Clean up previous processing data if re-processing
    await deleteVectorsByPrefix(documentId);
    await deletePageImages(documentId, supabase);
    await supabase.from("document_pages").delete().eq("document_id", documentId);

    // Extract text page by page
    const pages = await extractTextFromPdf(pdfBuffer);
    const pageCount = pages.length;

    // Store the PDF buffer for page image generation
    // For each page, we'll generate an image using the API route approach
    // Here we upload a placeholder/reference for each page
    const pageRecords: { document_id: string; page_number: number; image_path: string; image_url: string }[] = [];

    for (let i = 0; i < pageCount; i++) {
      const pageNumber = i + 1;
      // Upload the full PDF to be rendered on-demand via API route
      // The image_path stores the reference for the page rendering API
      const imagePath = `${documentId}/page-${pageNumber}.png`;

      // Store page record pointing to the on-demand rendering endpoint
      const imageUrl = `/api/documents/${documentId}/page/${pageNumber}`;
      pageRecords.push({
        document_id: documentId,
        page_number: pageNumber,
        image_path: imagePath,
        image_url: imageUrl,
      });
    }

    // Insert page records
    if (pageRecords.length > 0) {
      const { error: pagesError } = await supabase
        .from("document_pages")
        .insert(pageRecords);

      if (pagesError) {
        throw new Error(`Failed to insert page records: ${pagesError.message}`);
      }
    }

    // Chunk the text
    const chunks = chunkDocument(pages);

    if (chunks.length === 0) {
      throw new Error("No text content extracted from PDF");
    }

    // Generate embeddings
    const texts = chunks.map((c) => c.text);
    const embeddings = await generateEmbeddings(texts);

    // Prepare vectors for Pinecone
    const vectors = chunks.map((chunk: TextChunk, idx: number) => ({
      id: `${documentId}#page${chunk.pageNumber}#chunk${chunk.chunkIndex}`,
      values: embeddings[idx],
      metadata: {
        document_id: documentId,
        document_title: doc.title,
        page_number: chunk.pageNumber,
        chunk_index: chunk.chunkIndex,
        chunk_text: chunk.text,
        image_path: `${documentId}/page-${chunk.pageNumber}.png`,
      },
    }));

    // Upsert to Pinecone
    await upsertVectors(vectors);

    // Update document as ready
    await supabase
      .from("documents")
      .update({
        status: "ready",
        page_count: pageCount,
        updated_at: new Date().toISOString(),
      })
      .eq("id", documentId);

    return {
      success: true,
      pageCount,
      chunkCount: chunks.length,
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    await supabase
      .from("documents")
      .update({
        status: "error",
        error_message: errorMessage,
        updated_at: new Date().toISOString(),
      })
      .eq("id", documentId);

    return {
      success: false,
      error: errorMessage,
    };
  }
}
