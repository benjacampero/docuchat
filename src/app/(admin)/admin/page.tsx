"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { FileText, CheckCircle, Warning, Clock } from "@phosphor-icons/react";
import { Document } from "@/types/database";

export default function AdminDashboard() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/documents")
      .then((res) => res.json())
      .then((data) => setDocuments(data.documents || []))
      .finally(() => setLoading(false));
  }, []);

  const stats = {
    total: documents.length,
    ready: documents.filter((d) => d.status === "ready").length,
    processing: documents.filter((d) => d.status === "processing").length,
    error: documents.filter((d) => d.status === "error").length,
  };

  if (loading) {
    return (
      <div className="p-8 max-w-5xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 bg-background-alt rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <h1 className="font-serif text-2xl font-semibold mb-8">Panel de administración</h1>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 animate-fade-in-up">
        <Card>
          <CardContent>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-accent-blue-bg flex items-center justify-center">
                <FileText size={20} className="text-accent-blue-text" />
              </div>
              <div>
                <p className="text-2xl font-semibold">{stats.total}</p>
                <p className="text-xs text-foreground-secondary">Documentos</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-accent-green-bg flex items-center justify-center">
                <CheckCircle size={20} className="text-accent-green-text" />
              </div>
              <div>
                <p className="text-2xl font-semibold">{stats.ready}</p>
                <p className="text-xs text-foreground-secondary">Listos</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-accent-yellow-bg flex items-center justify-center">
                <Clock size={20} className="text-accent-yellow-text" />
              </div>
              <div>
                <p className="text-2xl font-semibold">{stats.processing}</p>
                <p className="text-xs text-foreground-secondary">Procesando</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-accent-red-bg flex items-center justify-center">
                <Warning size={20} className="text-accent-red-text" />
              </div>
              <div>
                <p className="text-2xl font-semibold">{stats.error}</p>
                <p className="text-xs text-foreground-secondary">Errores</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
