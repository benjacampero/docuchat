"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Chat,
  ClockCounterClockwise,
  FileText,
  UploadSimple,
  House,
} from "@phosphor-icons/react";

interface SidebarProps {
  isAdmin?: boolean;
  onNavigate?: () => void;
}

export function Sidebar({ isAdmin = false, onNavigate }: SidebarProps) {
  const pathname = usePathname();

  const userLinks = [
    { href: "/chat", label: "Chat", icon: Chat },
    { href: "/history", label: "Historial", icon: ClockCounterClockwise },
  ];

  const adminLinks = [
    { href: "/admin", label: "Panel", icon: House },
    { href: "/admin/documents", label: "Documentos", icon: FileText },
    { href: "/admin/upload", label: "Subir PDF", icon: UploadSimple },
  ];

  const links = isAdmin ? [...userLinks, ...adminLinks] : userLinks;

  return (
    <aside className="w-60 border-r border-border bg-surface h-full flex flex-col pt-16 md:pt-0">
      <div className="p-6 border-b border-border">
        <h1 className="font-serif text-xl font-semibold tracking-tight">
          DocuChat
        </h1>
      </div>

      <nav className="flex-1 p-3">
        <ul className="space-y-1">
          {links.map((link) => {
            const isActive = link.href === "/admin"
              ? pathname === "/admin"
              : pathname === link.href || pathname.startsWith(link.href + "/");
            const Icon = link.icon;
            return (
              <li key={link.href}>
                <Link
                  href={link.href}
                  onClick={onNavigate}
                  className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors duration-150
                    ${
                      isActive
                        ? "bg-background-alt text-foreground font-medium"
                        : "text-foreground-secondary hover:text-foreground hover:bg-background-alt/60"
                    }`}
                >
                  <Icon size={18} weight={isActive ? "fill" : "regular"} />
                  {link.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
