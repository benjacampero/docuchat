"use client";

import { useEffect, useRef, useState } from "react";
import { FileText } from "@phosphor-icons/react";

interface PdfPageThumbnailProps {
  imageUrl: string;
  pageNumber: number;
  className?: string;
}

export function PdfPageThumbnail({
  imageUrl,
  pageNumber,
  className = "",
}: PdfPageThumbnailProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [imgSrc, setImgSrc] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadPage() {
      try {
        const response = await fetch(imageUrl);

        if (!response.ok) {
          throw new Error("Failed to load");
        }

        const contentType = response.headers.get("content-type");

        if (contentType?.includes("image/")) {
          // It's a pre-rendered image
          const blob = await response.blob();
          const url = URL.createObjectURL(blob);
          if (!cancelled) {
            setImgSrc(url);
            setLoading(false);
          }
        } else if (contentType?.includes("application/json")) {
          // It's JSON with PDF URL - render client-side
          const data = await response.json();
          if (data.pdf_url) {
            await renderPdfPage(data.pdf_url, pageNumber);
          } else {
            throw new Error("No PDF URL provided");
          }
        } else {
          throw new Error("Unexpected response type");
        }
      } catch (err) {
        console.error("Failed to load page:", err);
        if (!cancelled) {
          setError(true);
          setLoading(false);
        }
      }
    }

    async function renderPdfPage(pdfUrl: string, page: number) {
      try {
        const pdfjsLib = await import("pdfjs-dist");
        pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

        const pdfResponse = await fetch(pdfUrl);
        const pdfBuffer = await pdfResponse.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: pdfBuffer }).promise;

        const pdfPage = await pdf.getPage(page);
        const scale = 1.5;
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
      } catch (err) {
        console.error("PDF rendering error:", err);
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
      <div
        className={`flex items-center justify-center bg-background-alt ${className}`}
      >
        <FileText size={32} className="text-foreground-secondary/40" />
      </div>
    );
  }

  if (loading && !imgSrc) {
    return <div className={`animate-pulse bg-background-alt ${className}`} />;
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
