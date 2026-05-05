import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateEmbedding } from "@/lib/gemini/embeddings";
import { queryVectors } from "@/lib/pinecone/query";
import { generateChatResponse } from "@/lib/gemini/chat";
import { getPageImageUrl } from "@/lib/pdf/render-pages";
import { MAX_CONVERSATION_HISTORY } from "@/lib/constants";
import { SourceReference } from "@/types/database";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return new Response("Unauthorized", { status: 401 });
    }

    const { message, conversation_id } = await request.json();

    if (!message || typeof message !== "string") {
      return new Response("Message is required", { status: 400 });
    }

    // Create or get conversation
    let conversationId = conversation_id;
    if (!conversationId) {
      const { data: conv, error } = await supabase
        .from("conversations")
        .insert({
          user_id: user.id,
          title: message.slice(0, 100),
        })
        .select("id")
        .single();

      if (error) {
        return new Response("Failed to create conversation", { status: 500 });
      }
      conversationId = conv.id;
    }

    // Save user message
    await supabase.from("messages").insert({
      conversation_id: conversationId,
      role: "user",
      content: message,
    });

    // Get conversation history
    const { data: historyMessages } = await supabase
      .from("messages")
      .select("role, content")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true })
      .limit(MAX_CONVERSATION_HISTORY);

    const conversationHistory = (historyMessages || []).slice(0, -1).map((m) => ({
      role: m.role,
      content: m.content,
    }));

    // Generate embedding for the question
    const questionEmbedding = await generateEmbedding(message);

    // Query Pinecone for relevant chunks
    const results = await queryVectors(questionEmbedding);

    // Resolve image URLs and deduplicate sources
    const sourcesMap = new Map<string, SourceReference>();
    for (const result of results) {
      const key = `${result.metadata.document_id}:${result.metadata.page_number}`;
      const existing = sourcesMap.get(key);

      if (!existing || result.score > existing.relevance_score) {
        const imageUrl = await getPageImageUrl(result.metadata.image_path);
        sourcesMap.set(key, {
          document_id: result.metadata.document_id,
          document_title: result.metadata.document_title,
          page_number: result.metadata.page_number,
          chunk_text: result.metadata.chunk_text,
          image_url: imageUrl,
          relevance_score: result.score,
        });
      }
    }

    const sources = Array.from(sourcesMap.values())
      .sort((a, b) => b.relevance_score - a.relevance_score);

    // Generate streaming response
    const stream = await generateChatResponse(message, results, conversationHistory);

    // Create SSE stream
    const encoder = new TextEncoder();
    let fullResponse = "";

    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const text = chunk.text;
            if (text) {
              fullResponse += text;
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ type: "text", data: text })}\n\n`)
              );
            }
          }

          // Send sources
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ type: "sources", data: JSON.stringify(sources) })}\n\n`
            )
          );

          // Save assistant message
          await supabase.from("messages").insert({
            conversation_id: conversationId,
            role: "assistant",
            content: fullResponse,
            sources,
          });

          // Update conversation timestamp
          await supabase
            .from("conversations")
            .update({ updated_at: new Date().toISOString() })
            .eq("id", conversationId);

          // Send done event
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ type: "done", data: JSON.stringify({ conversation_id: conversationId }) })}\n\n`
            )
          );

          controller.close();
        } catch {
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ type: "error", data: "Error generating response" })}\n\n`
            )
          );
          controller.close();
        }
      },
    });

    return new Response(readableStream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error: unknown) {
    console.error("[Chat API Error]", error);
    const err = error as { status?: number; message?: string };
    const isRateLimit = err.status === 429 || (err.message && err.message.includes("429"));
    const message = isRateLimit
      ? "El servicio de IA está temporalmente saturado. Por favor espera unos segundos e inténtalo de nuevo."
      : "Internal Server Error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: isRateLimit ? 429 : 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
