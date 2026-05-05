"use client";

import { useState, useRef, DragEvent } from "react";
import { useRouter } from "next/navigation";
import { UploadSimple, File, CheckCircle, Warning } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  function handleDrop(e: DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped?.type === "application/pdf") {
      setFile(dropped);
      if (!title) setTitle(dropped.name.replace(".pdf", ""));
    }
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0];
    if (selected) {
      setFile(selected);
      if (!title) setTitle(selected.name.replace(".pdf", ""));
    }
  }

  async function handleUpload() {
    if (!file) return;

    setUploading(true);
    setStatus("idle");
    setErrorMsg("");

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("title", title || file.name.replace(".pdf", ""));

      const uploadRes = await fetch("/api/documents", {
        method: "POST",
        body: formData,
      });

      if (!uploadRes.ok) {
        const err = await uploadRes.json();
        throw new Error(err.error || "Upload failed");
      }

      const { document } = await uploadRes.json();
      setUploading(false);
      setProcessing(true);

      // Trigger processing
      const processRes = await fetch("/api/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ document_id: document.id }),
      });

      if (!processRes.ok) {
        const err = await processRes.json();
        throw new Error(err.error || "Processing failed");
      }

      setStatus("success");
      setTimeout(() => router.push("/admin/documents"), 2000);
    } catch (error) {
      setStatus("error");
      setErrorMsg(error instanceof Error ? error.message : "Error desconocido");
    } finally {
      setUploading(false);
      setProcessing(false);
    }
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="font-serif text-2xl font-semibold mb-8">Subir documento</h1>

      <Card className="animate-fade-in-up">
        {/* Drop zone */}
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={`border-2 border-dashed rounded-lg p-10 text-center cursor-pointer transition-all duration-200
            ${dragOver ? "border-foreground/30 bg-background-alt" : "border-border hover:border-foreground/20"}
            ${file ? "border-accent-green-text/30 bg-accent-green-bg/30" : ""}`}
        >
          <input
            ref={inputRef}
            type="file"
            accept=".pdf"
            onChange={handleFileSelect}
            className="hidden"
          />

          {file ? (
            <div className="flex flex-col items-center gap-2">
              <File size={32} className="text-accent-green-text" />
              <p className="text-sm font-medium">{file.name}</p>
              <p className="text-xs text-foreground-secondary">
                {(file.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <UploadSimple size={32} className="text-foreground-secondary/50" />
              <p className="text-sm text-foreground-secondary">
                Arrastra un PDF aquí o haz clic para seleccionar
              </p>
              <p className="text-xs text-foreground-secondary/60">
                Máximo 50 MB
              </p>
            </div>
          )}
        </div>

        {/* Title input */}
        {file && (
          <div className="mt-5">
            <Input
              id="title"
              label="Título del documento"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej: Manual de usuario v2.0"
            />
          </div>
        )}

        {/* Upload button */}
        {file && (
          <div className="mt-5">
            <Button
              onClick={handleUpload}
              disabled={uploading || processing}
              className="w-full"
            >
              {uploading
                ? "Subiendo..."
                : processing
                ? "Procesando documento..."
                : "Subir y procesar"}
            </Button>
          </div>
        )}

        {/* Status messages */}
        {status === "success" && (
          <div className="mt-4 flex items-center gap-2 text-accent-green-text text-sm">
            <CheckCircle size={18} weight="fill" />
            Documento procesado correctamente. Redirigiendo...
          </div>
        )}

        {status === "error" && (
          <div className="mt-4 flex items-center gap-2 text-accent-red-text text-sm">
            <Warning size={18} weight="fill" />
            {errorMsg}
          </div>
        )}
      </Card>
    </div>
  );
}
