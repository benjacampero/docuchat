"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ChatMessage } from "@/types/chat";
import { SourceCard } from "./source-card";
import { User, Robot } from "@phosphor-icons/react";

interface MessageBubbleProps {
  message: ChatMessage;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === "user";

  return (
    <div className={`flex gap-3 ${isUser ? "flex-row-reverse" : ""}`}>
      <div
        className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center
          ${isUser ? "bg-foreground text-white" : "bg-background-alt text-foreground-secondary"}`}
      >
        {isUser ? <User size={14} weight="bold" /> : <Robot size={14} weight="bold" />}
      </div>

      <div className={`flex flex-col gap-2 max-w-xs sm:max-w-sm md:max-w-md lg:max-w-[75%] ${isUser ? "items-end" : "items-start"}`}>
        <div
          className={`px-4 py-3 rounded-xl text-sm leading-relaxed
            ${
              isUser
                ? "bg-foreground text-white rounded-br-sm"
                : "bg-surface border border-border rounded-bl-sm"
            }`}
        >
          {isUser ? (
            <p className="whitespace-pre-wrap">{message.content}</p>
          ) : (
            <div className="prose prose-sm max-w-none prose-p:my-1 prose-headings:my-2 prose-ul:my-1 prose-ol:my-1 prose-li:my-0.5 prose-code:text-xs prose-code:bg-background-alt prose-code:px-1 prose-code:py-0.5 prose-code:rounded">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {message.content}
              </ReactMarkdown>
              {message.isStreaming && (
                <span className="inline-block w-1.5 h-4 bg-foreground/60 animate-pulse ml-0.5" />
              )}
            </div>
          )}
        </div>

        {/* Source references */}
        {message.sources && message.sources.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-1 max-w-full">
            {message.sources.map((source, idx) => (
              <SourceCard key={idx} source={source} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
