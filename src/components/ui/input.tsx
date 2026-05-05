"use client";

import { InputHTMLAttributes, forwardRef } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className = "", label, error, id, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={id}
            className="text-sm font-medium text-foreground"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={id}
          className={`w-full px-3 py-2 text-sm bg-surface border border-border rounded-md
            placeholder:text-foreground-secondary/60
            focus:outline-none focus:border-foreground/30 focus:ring-1 focus:ring-foreground/10
            transition-colors duration-200
            ${error ? "border-accent-red-text/40" : ""}
            ${className}`}
          {...props}
        />
        {error && (
          <span className="text-xs text-accent-red-text">{error}</span>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
export { Input };
