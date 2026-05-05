export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  role: "user" | "admin";
  created_at: string;
  updated_at: string;
}

export interface Document {
  id: string;
  title: string;
  file_name: string;
  file_path: string;
  file_size: number;
  page_count: number | null;
  status: "pending" | "processing" | "ready" | "error";
  error_message: string | null;
  uploaded_by: string;
  created_at: string;
  updated_at: string;
}

export interface DocumentPage {
  id: string;
  document_id: string;
  page_number: number;
  image_path: string;
  image_url: string | null;
  created_at: string;
}

export interface Conversation {
  id: string;
  user_id: string;
  title: string | null;
  created_at: string;
  updated_at: string;
}

export interface SourceReference {
  document_id: string;
  document_title: string;
  page_number: number;
  chunk_text: string;
  image_url: string;
  relevance_score: number;
}

export interface Message {
  id: string;
  conversation_id: string;
  role: "user" | "assistant";
  content: string;
  sources: SourceReference[] | null;
  created_at: string;
}
