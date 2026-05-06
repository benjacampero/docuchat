"use client";

import { useEffect, useState, useRef } from "react";
import { Document } from "@/types/database";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Trash, ArrowsClockwise, FileText } from "@phosphor-icons/react";

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    fetchDocuments();
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, []);

  // Start/stop polling based on whether any docs are processing
  useEffect(() => {
    const hasProcessing = documents.some((d) => d.status === "processing");

    if (hasProcessing && !pollingRef.current) {
      pollingRef.current = setInterval(fetchDocuments, 5000);
    } else if (!hasProcessing && pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  }, [documents]);

  async function fetchDocuments() {
    try {
      const res = await fetch("/api/documents");
      if (res.ok) {
        const data = await res.json();
        setDocuments(data.documents || []);
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleProcess(docId: string) {
    setProcessingIds((prev) => new Set([...prev, docId]));
    try {
      const res = await fetch("/api/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ document_id: docId }),
      });
      if (res.ok) {
        // Refresh to show "processing" status, then polling takes over
        await fetchDocuments();
      }
    } finally {
      setProcessingIds((prev) => {
        const next = new Set(prev);
        next.delete(docId);
        return next;
      });
    }
  }

  async function handleDelete(docId: string) {
    if (!confirm("¿Seguro que quieres eliminar este documento?")) return;
    const res = await fetch(`/api/documents/${docId}`, { method: "DELETE" });
    if (res.ok) {
      setDocuments((prev) => prev.filter((d) => d.id !== docId));
    }
  }

  const statusBadge = (status: Document["status"]) => {
    const map = {
      pending: { variant: "default" as const, label: "Pendiente" },
      processing: { variant: "warning" as const, label: "Procesando..." },
      ready: { variant: "success" as const, label: "Listo" },
      error: { variant: "error" as const, label: "Error" },
    };
    const { variant, label } = map[status];
    return <Badge variant={variant}>{label}</Badge>;
  };

  if (loading) {
    return (
      <div className="p-8 max-w-5xl mx-auto space-y-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-16 bg-background-alt rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
        <h1 className="font-serif text-2xl font-semibold">Documentos</h1>
        <Button variant="secondary" onClick={fetchDocuments} size="sm">
          <ArrowsClockwise size={14} className="mr-2" />
          Actualizar
        </Button>
      </div>

      {documents.length === 0 ? (
        <div className="text-center py-16">
          <FileText size={40} className="mx-auto text-foreground-secondary/40 mb-4" />
          <p className="text-foreground-secondary text-sm">No hay documentos subidos</p>
        </div>
      ) : (
        <div className="space-y-2">
          {documents.map((doc) => (
            <Card key={doc.id} className="!p-4">
              <div className="flex flex-col md:flex-row md:items-center gap-4">
                <div className="w-9 h-9 rounded-lg bg-accent-blue-bg flex items-center justify-center flex-shrink-0">
                  <FileText size={16} className="text-accent-blue-text" />
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{doc.title}</p>
                  <p className="text-xs text-foreground-secondary">
                    {doc.file_name} · {(doc.file_size / 1024 / 1024).toFixed(1)} MB
                    {doc.page_count && ` · ${doc.page_count} páginas`}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 md:gap-3">
                  {statusBadge(doc.status)}

                  {doc.status === "processing" && (
                    <ArrowsClockwise size={16} className="animate-spin text-foreground-secondary" />
                  )}

                  {(doc.status === "pending" || doc.status === "error") && (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleProcess(doc.id)}
                      disabled={processingIds.has(doc.id)}
                    >
                      {processingIds.has(doc.id) ? (
                        <ArrowsClockwise size={14} className="animate-spin" />
                      ) : (
                        "Procesar"
                      )}
                    </Button>
                  )}

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(doc.id)}
                    className="text-foreground-secondary hover:text-accent-red-text"
                  >
                    <Trash size={16} />
                  </Button>
                </div>
              </div>

              {doc.status === "error" && doc.error_message && (
                <p className="text-xs text-accent-red-text mt-2 pl-13">
                  {doc.error_message}
                </p>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
