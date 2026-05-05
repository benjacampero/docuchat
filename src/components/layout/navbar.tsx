"use client";

import { UserMenu } from "./user-menu";

interface NavbarProps {
  title?: string;
}

export function Navbar({ title }: NavbarProps) {
  return (
    <header className="h-14 border-b border-border bg-surface flex items-center justify-between px-6">
      <div>
        {title && (
          <h2 className="text-sm font-medium text-foreground">{title}</h2>
        )}
      </div>
      <UserMenu />
    </header>
  );
}
