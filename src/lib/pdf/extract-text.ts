import { PDFParse } from "pdf-parse";

export interface PageText {
  pageNumber: number;
  text: string;
}

/**
 * Extract text from PDF using pdf-parse
 * This is lightweight and works well on Vercel serverless
 */
export async function extractTextFromPdf(
  pdfBuffer: ArrayBuffer
): Promise<PageText[]> {
  try {
    const buffer = Buffer.from(pdfBuffer);
    const parser = new PDFParse({ data: buffer });

    // Get text from all pages
    const textResult = await parser.getText();

    if (!textResult.pages || textResult.pages.length === 0) {
      return [{ pageNumber: 1, text: "No text extracted from PDF" }];
    }

    return textResult.pages.map((pageResult, index) => ({
      pageNumber: index + 1,
      text: (pageResult as any).text || `[Page ${index + 1}]`,
    }));
  } catch (error) {
    console.error("PDF extraction error:", error);
    return [
      { pageNumber: 1, text: "Error extracting PDF content. Please try again." },
    ];
  }
}

export async function getPdfPageCount(pdfBuffer: ArrayBuffer): Promise<number> {
  try {
    const buffer = Buffer.from(pdfBuffer);
    const parser = new PDFParse({ data: buffer });

    // Get text to determine page count
    const textResult = await parser.getText();
    return (textResult.pages?.length || 0) + 1 || 1;
  } catch (error) {
    console.error("PDF page count error:", error);
    return 1;
  }
}
