"use client";

import { useState } from "react";
import {
  formatJSON,
  getClaimDescription,
  formatTimestamp,
} from "../utils/format";

interface DecodedSectionProps {
  title: string;
  subtitle: string;
  data: Record<string, unknown> | null;
  colorClass: string;
  showClaims?: boolean;
}

export default function DecodedSection({
  title,
  subtitle,
  data,
  colorClass,
  showClaims = false,
}: DecodedSectionProps) {
  const [viewMode, setViewMode] = useState<"json" | "claims">("json");

  const getColorIndicator = () => {
    switch (colorClass) {
      case "jwt-header":
        return "bg-[var(--header-color)]";
      case "jwt-payload":
        return "bg-[var(--payload-color)]";
      default:
        return "bg-[var(--signature-color)]";
    }
  };

  return (
    <div className="glass rounded-xl overflow-hidden animate-fade-in">
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-color)]">
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${getColorIndicator()}`} />
          <div>
            <h3 className={`font-semibold ${colorClass}`}>{title}</h3>
            <p className="text-xs text-[var(--muted)]">{subtitle}</p>
          </div>
        </div>
        {showClaims && (
          <div className="flex rounded-lg overflow-hidden border border-[var(--border-color)]">
            <button
              onClick={() => setViewMode("json")}
              className={`px-3 py-1 text-xs font-medium transition-colors ${
                viewMode === "json"
                  ? "bg-[var(--border-color)] text-foreground"
                  : "text-[var(--muted)] hover:text-foreground"
              }`}
            >
              JSON
            </button>
            <button
              onClick={() => setViewMode("claims")}
              className={`px-3 py-1 text-xs font-medium transition-colors ${
                viewMode === "claims"
                  ? "bg-[var(--border-color)] text-foreground"
                  : "text-[var(--muted)] hover:text-foreground"
              }`}
            >
              Claims
            </button>
          </div>
        )}
      </div>

      <div className="p-4 font-mono text-sm overflow-x-auto">
        {!data ? (
          <span className="text-[var(--muted)] italic">No data</span>
        ) : viewMode === "json" ? (
          <pre className="whitespace-pre-wrap">{formatJSON(data)}</pre>
        ) : (
          <div className="space-y-2">
            {Object.entries(data).map(([key, value]) => {
              const description = getClaimDescription(key);
              const timestamp = formatTimestamp(value);
              return (
                <div
                  key={key}
                  className="flex flex-col gap-1 p-2 rounded-lg bg-[var(--background)] border border-[var(--border-color)]"
                >
                  <div className="flex items-center justify-between">
                    <span className="json-key font-medium">{key}</span>
                    <span className="json-string text-xs">
                      {typeof value === "string"
                        ? value
                        : JSON.stringify(value)}
                    </span>
                  </div>
                  {timestamp && (
                    <span className="text-xs text-[var(--muted)]">
                      📅 {timestamp}
                    </span>
                  )}
                  {description && (
                    <span className="text-xs text-[var(--muted)]">
                      {description}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
