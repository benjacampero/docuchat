"use client";

import { useState } from "react";
import { FileText, X } from "@phosphor-icons/react";
import { SourceReference } from "@/types/database";
import { Badge } from "@/components/ui/badge";
import { PdfPageThumbnail } from "@/components/shared/pdf-page-thumbnail";

interface SourceCardProps {
  source: SourceReference;
}

export function SourceCard({ source }: SourceCardProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setLightboxOpen(true)}
        className="flex flex-col items-start gap-2 p-3 border border-border rounded-lg
          hover:shadow-[0_2px_8px_rgba(0,0,0,0.04)] transition-all duration-200
          bg-surface text-left min-w-[200px] max-w-[240px] flex-shrink-0"
      >
        <div className="w-full h-24 bg-background-alt rounded overflow-hidden flex items-center justify-center">
          {source.image_url ? (
            <PdfPageThumbnail
              imageUrl={source.image_url}
              pageNumber={source.page_number}
              className="w-full h-full rounded"
            />
          ) : (
            <FileText size={32} className="text-foreground-secondary/40" />
          )}
        </div>

        <div className="w-full">
          <p className="text-xs font-medium text-foreground truncate">
            {source.document_title}
          </p>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="info">Pag. {source.page_number}</Badge>
            <span className="text-[10px] text-foreground-secondary">
              {Math.round(source.relevance_score * 100)}% relevancia
            </span>
          </div>
        </div>
      </button>

      {/* Lightbox */}
      {lightboxOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-6"
          onClick={() => setLightboxOpen(false)}
        >
          <div
            className="relative bg-surface rounded-xl max-w-4xl max-h-[90vh] overflow-auto shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-3 border-b border-border bg-surface rounded-t-xl">
              <div>
                <p className="text-sm font-medium">{source.document_title}</p>
                <p className="text-xs text-foreground-secondary">
                  Pagina {source.page_number}
                </p>
              </div>
              <button
                onClick={() => setLightboxOpen(false)}
                className="p-1.5 rounded-md hover:bg-background-alt transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-4">
              {source.image_url ? (
                <PdfPageThumbnail
                  imageUrl={source.image_url}
                  pageNumber={source.page_number}
                  className="w-full rounded-lg"
                />
              ) : (
                <div className="flex items-center justify-center h-96 text-foreground-secondary">
                  Imagen no disponible
                </div>
              )}
            </div>
            <div className="px-5 pb-4">
              <p className="text-xs text-foreground-secondary font-medium uppercase tracking-wider mb-2">
                Fragmento relevante
              </p>
              <p className="text-sm text-foreground/80 leading-relaxed bg-background-alt p-3 rounded-md">
                {source.chunk_text}
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
