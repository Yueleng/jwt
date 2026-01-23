"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Navigation() {
  const pathname = usePathname();

  const isDecoder = pathname === "/";
  const isEncoder = pathname === "/encode";

  return (
    <nav className="flex rounded-lg overflow-hidden border border-[var(--border-color)] bg-[var(--card-bg)]">
      <Link
        href="/"
        className={`px-4 py-2 text-sm font-medium transition-colors flex items-center gap-2 ${
          isDecoder
            ? "bg-[var(--border-color)] text-foreground"
            : "text-[var(--muted)] hover:text-foreground hover:bg-[var(--border-color)]/50"
        }`}
      >
        <span>🔓</span>
        <span>Decoder</span>
      </Link>
      <Link
        href="/encode"
        className={`px-4 py-2 text-sm font-medium transition-colors flex items-center gap-2 ${
          isEncoder
            ? "bg-[var(--border-color)] text-foreground"
            : "text-[var(--muted)] hover:text-foreground hover:bg-[var(--border-color)]/50"
        }`}
      >
        <span>🔐</span>
        <span>Encoder</span>
      </Link>
    </nav>
  );
}
