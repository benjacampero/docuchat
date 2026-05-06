"use client";

import { useState } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Navbar } from "@/components/layout/navbar";
import { List, X } from "@phosphor-icons/react";

interface AppShellProps {
  children: React.ReactNode;
  isAdmin?: boolean;
}

export function AppShell({ children, isAdmin = false }: AppShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar - visible on desktop, overlay on mobile */}
      <div className="hidden md:block">
        <Sidebar isAdmin={isAdmin} />
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-30 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="fixed top-0 left-0 h-full w-60 z-40 md:hidden">
            <Sidebar isAdmin={isAdmin} onNavigate={() => setSidebarOpen(false)} />
          </div>
        </>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-14 border-b border-border bg-surface flex items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-4">
            {/* Mobile menu button */}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="md:hidden p-2 text-foreground hover:bg-background-alt rounded"
            >
              {sidebarOpen ? <X size={20} /> : <List size={20} />}
            </button>
            {/* Logo on mobile */}
            <h1 className="md:hidden font-serif font-semibold">DocuChat</h1>
          </div>
          <div className="hidden md:block flex-1" />
          {/* User menu */}
          <Navbar />
        </header>
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
