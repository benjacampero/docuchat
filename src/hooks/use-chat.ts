"use client";

import { useState, useCallback } from "react";
import { ChatMessage } from "@/types/chat";
import { SourceReference } from "@/types/database";

export function useChat(conversationId?: string) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentConversationId, setCurrentConversationId] = useState<string | undefined>(conversationId);

  const sendMessage = useCallback(async (content: string) => {
    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content,
    };

    const assistantMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "assistant",
      content: "",
      isStreaming: true,
    };

    setMessages((prev) => [...prev, userMessage, assistantMessage]);
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: content,
          conversation_id: currentConversationId,
        }),
      });

      if (!response.ok) {
        if (response.status === 429) {
          throw new Error("rate_limit");
        }
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || "Failed to send message");
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) throw new Error("No reader available");

      let fullText = "";
      let sources: SourceReference[] | undefined;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6);

          try {
            const event = JSON.parse(data);

            if (event.type === "text") {
              fullText += event.data;
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === assistantMessage.id
                    ? { ...msg, content: fullText }
                    : msg
                )
              );
            } else if (event.type === "sources") {
              sources = JSON.parse(event.data);
            } else if (event.type === "done") {
              const doneData = JSON.parse(event.data);
              setCurrentConversationId(doneData.conversation_id);
            }
          } catch {
            // Skip malformed JSON lines
          }
        }
      }

      // Finalize message
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMessage.id
            ? { ...msg, content: fullText, sources, isStreaming: false }
            : msg
        )
      );
    } catch (error) {
      const errMsg = error instanceof Error && error.message === "rate_limit"
        ? "El servicio de IA está temporalmente saturado. Esperá unos segundos e intentá de nuevo."
        : error instanceof Error
          ? error.message
          : "Error al generar la respuesta. Inténtalo de nuevo.";
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMessage.id
            ? {
                ...msg,
                content: errMsg,
                isStreaming: false,
              }
            : msg
        )
      );
    } finally {
      setIsLoading(false);
    }
  }, [currentConversationId]);

  const loadMessages = useCallback(async (convId: string) => {
    try {
      const response = await fetch(`/api/conversations/${convId}/messages`);
      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages);
        setCurrentConversationId(convId);
      }
    } catch {
      // Silent fail
    }
  }, []);

  return {
    messages,
    isLoading,
    sendMessage,
    loadMessages,
    conversationId: currentConversationId,
  };
}
