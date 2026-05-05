// Use the legacy build for Node.js compatibility
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";

export interface PageText {
  pageNumber: number;
  text: string;
}

export async function extractTextFromPdf(
  pdfBuffer: ArrayBuffer
): Promise<PageText[]> {
  const pdf = await getDocument({ data: pdfBuffer, useWorkerFetch: false, useSystemFonts: true }).promise;
  const pages: PageText[] = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const text = textContent.items
      .map((item) => ("str" in item ? item.str : ""))
      .join(" ");

    pages.push({
      pageNumber: i,
      text,
    });
  }

  return pages;
}

export async function getPdfPageCount(pdfBuffer: ArrayBuffer): Promise<number> {
  const pdf = await getDocument({ data: pdfBuffer, useWorkerFetch: false, useSystemFonts: true }).promise;
  return pdf.numPages;
}
