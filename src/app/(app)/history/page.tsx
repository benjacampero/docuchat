"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Conversation } from "@/types/database";
import { Card } from "@/components/ui/card";
import { ClockCounterClockwise, Trash, ChatCircle } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";

export default function HistoryPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchConversations = useCallback(async () => {
    try {
      const res = await fetch("/api/conversations");
      if (res.ok) {
        const data = await res.json();
        setConversations(data.conversations);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  async function deleteConversation(id: string) {
    const res = await fetch(`/api/conversations/${id}`, { method: "DELETE" });
    if (res.ok) {
      setConversations((prev) => prev.filter((c) => c.id !== id));
    }
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString("es-ES", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  if (loading) {
    return (
      <div className="p-8 max-w-3xl mx-auto space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-16 bg-background-alt rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <ClockCounterClockwise size={22} className="text-foreground-secondary" />
        <h1 className="font-serif text-2xl font-semibold">Historial</h1>
      </div>

      {conversations.length === 0 ? (
        <div className="text-center py-16">
          <ChatCircle size={40} className="mx-auto text-foreground-secondary/40 mb-4" />
          <p className="text-foreground-secondary text-sm">
            No tienes conversaciones aún
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {conversations.map((conv) => (
            <Card key={conv.id} hover className="!p-4">
              <div className="flex items-center justify-between">
                <Link
                  href={`/chat/${conv.id}`}
                  className="flex-1 min-w-0"
                >
                  <p className="text-sm font-medium truncate">
                    {conv.title || "Conversación sin título"}
                  </p>
                  <p className="text-xs text-foreground-secondary mt-0.5">
                    {formatDate(conv.updated_at)}
                  </p>
                </Link>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => deleteConversation(conv.id)}
                  className="ml-3 text-foreground-secondary hover:text-accent-red-text"
                >
                  <Trash size={16} />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
