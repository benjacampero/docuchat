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
  const [imgSrc, setImgSrc] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadImage() {
      try {
        const response = await fetch(imageUrl);

        if (!response.ok) {
          throw new Error("Failed to load image");
        }

        const contentType = response.headers.get("content-type");
        if (contentType?.includes("image/")) {
          // It's an image, load it
          const blob = await response.blob();
          const url = URL.createObjectURL(blob);
          if (!cancelled) {
            setImgSrc(url);
            setLoading(false);
          }
        } else {
          // Not an image (probably JSON error response)
          if (!cancelled) {
            setError(true);
            setLoading(false);
          }
        }
      } catch {
        if (!cancelled) {
          setError(true);
          setLoading(false);
        }
      }
    }

    loadImage();

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
      <div className={`animate-pulse bg-background-alt ${className}`} />
    );
  }

  return (
    <>
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
