"use client";

import { useState, useRef, KeyboardEvent } from "react";
import { PaperPlaneRight } from "@phosphor-icons/react";

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
}

export function ChatInput({ onSend, disabled = false }: ChatInputProps) {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  function handleSubmit() {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setValue("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }

  function handleInput() {
    const el = textareaRef.current;
    if (el) {
      el.style.height = "auto";
      el.style.height = Math.min(el.scrollHeight, 200) + "px";
    }
  }

  return (
    <div className="border-t border-border bg-surface p-4">
      <div className="max-w-3xl mx-auto flex items-end gap-3">
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onInput={handleInput}
            placeholder="Escribe tu pregunta..."
            disabled={disabled}
            rows={1}
            className="w-full resize-none px-4 py-3 text-sm bg-background border border-border rounded-lg
              placeholder:text-foreground-secondary/50
              focus:outline-none focus:border-foreground/20 focus:ring-1 focus:ring-foreground/5
              transition-colors duration-200 disabled:opacity-50"
          />
        </div>
        <button
          onClick={handleSubmit}
          disabled={!value.trim() || disabled}
          className="p-3 rounded-lg bg-foreground text-white
            hover:bg-foreground/90 transition-colors duration-150
            disabled:opacity-30 disabled:cursor-not-allowed
            active:scale-[0.96]"
        >
          <PaperPlaneRight size={18} weight="fill" />
        </button>
      </div>
    </div>
  );
}
