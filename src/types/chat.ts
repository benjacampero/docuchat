import { SourceReference } from "./database";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: SourceReference[];
  isStreaming?: boolean;
}

export interface ChatRequest {
  message: string;
  conversation_id?: string;
}

export interface ChatStreamEvent {
  type: "text" | "sources" | "done" | "error";
  data: string;
}
