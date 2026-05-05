"use client";

import { useEffect, useRef, useState } from "react";
import { FileText } from "@phosphor-icons/react";

interface PdfPageThumbnailProps {
  /** URL that returns the page image (PNG) or PDF info */
  imageUrl: string;
  pageNumber: number;
  className?: string;
}

export function PdfPageThumbnail({ imageUrl, pageNumber, className = "" }: PdfPageThumbnailProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [imgSrc, setImgSrc] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadPage() {
      try {
        // First try loading the image URL directly (for pre-rendered images)
        const response = await fetch(imageUrl);
        const contentType = response.headers.get("content-type");

        if (contentType?.includes("image/")) {
          // It's a pre-rendered image, use it directly
          const blob = await response.blob();
          const url = URL.createObjectURL(blob);
          if (!cancelled) {
            setImgSrc(url);
            setLoading(false);
          }
          return;
        }

        // It returned JSON with PDF URL - render client-side
        const data = await response.json();
        if (data.pdf_url) {
          await renderPdfPage(data.pdf_url, pageNumber);
        }
      } catch {
        if (!cancelled) {
          setError(true);
          setLoading(false);
        }
      }
    }

    async function renderPdfPage(pdfUrl: string, page: number) {
      try {
        const pdfjsLib = await import("pdfjs-dist");
        pdfjsLib.GlobalWorkerOptions.workerSrc = "";

        const pdfResponse = await fetch(pdfUrl);
        const pdfBuffer = await pdfResponse.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: pdfBuffer }).promise;
        const pdfPage = await pdf.getPage(page);

        const scale = 0.5; // Thumbnail scale
        const viewport = pdfPage.getViewport({ scale });

        const canvas = canvasRef.current;
        if (!canvas || cancelled) return;

        canvas.width = viewport.width;
        canvas.height = viewport.height;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        await pdfPage.render({
          canvas,
          viewport,
          canvasContext: ctx,
        }).promise;

        if (!cancelled) {
          setImgSrc(canvas.toDataURL("image/png"));
          setLoading(false);
        }
      } catch {
        if (!cancelled) {
          setError(true);
          setLoading(false);
        }
      }
    }

    loadPage();

    return () => {
      cancelled = true;
    };
  }, [imageUrl, pageNumber]);

  if (error) {
    return (
      <div className={`flex items-center justify-center bg-background-alt ${className}`}>
        <FileText size={32} className="text-foreground-secondary/40" />
      </div>
    );
  }

  if (loading && !imgSrc) {
    return (
      <>
        <canvas ref={canvasRef} className="hidden" />
        <div className={`animate-pulse bg-background-alt ${className}`} />
      </>
    );
  }

  return (
    <>
      <canvas ref={canvasRef} className="hidden" />
      {imgSrc && (
        <img
          src={imgSrc}
          alt={`Página ${pageNumber}`}
          className={`object-cover object-top ${className}`}
          loading="lazy"
        />
      )}
    </>
  );
}
