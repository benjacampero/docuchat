import { HTMLAttributes } from "react";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "success" | "warning" | "error" | "info";
}

export function Badge({ className = "", variant = "default", children, ...props }: BadgeProps) {
  const variants = {
    default: "bg-background-alt text-foreground-secondary",
    success: "bg-accent-green-bg text-accent-green-text",
    warning: "bg-accent-yellow-bg text-accent-yellow-text",
    error: "bg-accent-red-bg text-accent-red-text",
    info: "bg-accent-blue-bg text-accent-blue-text",
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium uppercase tracking-wider ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
}
