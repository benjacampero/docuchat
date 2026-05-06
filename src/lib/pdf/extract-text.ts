export interface PageText {
  pageNumber: number;
  text: string;
}

/**
 * Extract text from PDF
 * Uses pdfjs-dist with fallback for Vercel serverless
 */
export async function extractTextFromPdf(
  pdfBuffer: ArrayBuffer
): Promise<PageText[]> {
  try {
    // Try to use pdfjs-dist
    const pdfjsLib = await import("pdfjs-dist/legacy/build/pdf.mjs");

    // Don't set worker - just try to extract text
    const pdf = await pdfjsLib.getDocument({
      data: new Uint8Array(pdfBuffer),
      disableAutoFetch: true,
    }).promise;

    const pages: PageText[] = [];

    for (let i = 1; i <= Math.min(pdf.numPages, 100); i++) {
      try {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const text = textContent.items
          .map((item: any) => (typeof item.str === "string" ? item.str : ""))
          .join(" ");

        pages.push({
          pageNumber: i,
          text: text.trim() || `[Página ${i}]`,
        });
      } catch (pageError) {
        console.warn(`Failed to extract page ${i}:`, pageError);
        pages.push({ pageNumber: i, text: `[Página ${i}]` });
      }
    }

    return pages.length > 0 ? pages : [{ pageNumber: 1, text: "[Contenido del PDF]" }];
  } catch (error) {
    console.error("PDF extraction error:", error);
    // Throw error so processing fails - better to show error than fake success
    throw new Error(`Failed to extract PDF text: ${error instanceof Error ? error.message : String(error)}`);
  }
}

export async function getPdfPageCount(pdfBuffer: ArrayBuffer): Promise<number> {
  try {
    const pdfjsLib = await import("pdfjs-dist/legacy/build/pdf.mjs");
    const pdf = await pdfjsLib.getDocument({
      data: new Uint8Array(pdfBuffer),
      disableAutoFetch: true,
    }).promise;
    return pdf.numPages;
  } catch (error) {
    console.error("PDF page count error:", error);
    return 1;
  }
}
