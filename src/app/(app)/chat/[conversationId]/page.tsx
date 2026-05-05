"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";
import { useChat } from "@/hooks/use-chat";
import { ChatContainer } from "@/components/chat/chat-container";

export default function ConversationPage() {
  const params = useParams();
  const conversationId = params.conversationId as string;
  const { messages, isLoading, sendMessage, loadMessages } = useChat(conversationId);

  useEffect(() => {
    if (conversationId) {
      loadMessages(conversationId);
    }
  }, [conversationId, loadMessages]);

  return (
    <ChatContainer
      messages={messages}
      isLoading={isLoading}
      onSend={sendMessage}
    />
  );
}
