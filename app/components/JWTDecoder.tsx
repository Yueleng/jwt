"use client";

import { useState, useEffect, useCallback } from "react";

interface DecodedJWT {
  header: Record<string, unknown> | null;
  payload: Record<string, unknown> | null;
  signature: string;
  isValid: boolean;
  error?: string;
}

// Sample JWT for demonstration
const SAMPLE_JWT =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c";

function base64UrlDecode(str: string): string {
  // Replace URL-safe characters back to standard Base64
  let base64 = str.replace(/-/g, "+").replace(/_/g, "/");

  // Add padding if needed
  const padding = base64.length % 4;
  if (padding) {
    base64 += "=".repeat(4 - padding);
  }

  try {
    return decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join(""),
    );
  } catch {
    throw new Error("Invalid Base64 encoding");
  }
}

function decodeJWT(token: string): DecodedJWT {
  const result: DecodedJWT = {
    header: null,
    payload: null,
    signature: "",
    isValid: false,
  };

  if (!token || !token.trim()) {
    return { ...result, error: "No token provided" };
  }

  const parts = token.trim().split(".");

  if (parts.length !== 3) {
    return {
      ...result,
      error: `Invalid JWT structure. Expected 3 parts, got ${parts.length}`,
    };
  }

  try {
    // Decode header
    const headerJson = base64UrlDecode(parts[0]);
    result.header = JSON.parse(headerJson);
  } catch (e) {
    return { ...result, error: `Invalid header: ${(e as Error).message}` };
  }

  try {
    // Decode payload
    const payloadJson = base64UrlDecode(parts[1]);
    result.payload = JSON.parse(payloadJson);
  } catch (e) {
    return { ...result, error: `Invalid payload: ${(e as Error).message}` };
  }

  // Store the signature (base64url encoded)
  result.signature = parts[2];
  result.isValid = true;

  return result;
}

function formatJSON(obj: Record<string, unknown> | null): React.ReactNode[] {
  if (!obj) return [];

  const lines: React.ReactNode[] = [];
  const entries = Object.entries(obj);

  lines.push(
    <span key="open" className="text-foreground">
      {"{"}
    </span>,
  );

  entries.forEach(([key, value], index) => {
    const isLast = index === entries.length - 1;
    let valueElement: React.ReactNode;

    if (typeof value === "string") {
      valueElement = <span className="json-string">&quot;{value}&quot;</span>;
    } else if (typeof value === "number") {
      valueElement = <span className="json-number">{value}</span>;
    } else if (typeof value === "boolean") {
      valueElement = <span className="json-boolean">{value.toString()}</span>;
    } else if (value === null) {
      valueElement = <span className="json-null">null</span>;
    } else {
      valueElement = (
        <span className="text-foreground">{JSON.stringify(value)}</span>
      );
    }

    lines.push(
      <div key={key} className="pl-4">
        <span className="json-key">&quot;{key}&quot;</span>
        <span className="text-foreground">: </span>
        {valueElement}
        {!isLast && <span className="text-foreground">,</span>}
      </div>,
    );
  });

  lines.push(
    <span key="close" className="text-foreground">
      {"}"}
    </span>,
  );

  return lines;
}

function getClaimDescription(key: string): string | null {
  const claims: Record<string, string> = {
    iss: "Issuer - Identifies the principal that issued the JWT",
    sub: "Subject - Identifies the principal that is the subject of the JWT",
    aud: "Audience - Identifies the recipients that the JWT is intended for",
    exp: "Expiration Time - Identifies the expiration time after which the JWT must not be accepted",
    nbf: "Not Before - Identifies the time before which the JWT must not be accepted",
    iat: "Issued At - Identifies the time at which the JWT was issued",
    jti: "JWT ID - Provides a unique identifier for the JWT",
    alg: "Algorithm - The cryptographic algorithm used to secure the JWT",
    typ: "Type - The type of token (usually 'JWT')",
    name: "Name - Full name of the user",
    email: "Email - Email address of the user",
    picture: "Picture - URL of the user's profile picture",
    role: "Role - User's role or permission level",
    scope: "Scope - The scope of access granted",
  };
  return claims[key] || null;
}

function formatTimestamp(value: unknown): string | null {
  if (typeof value !== "number") return null;

  // Check if it looks like a Unix timestamp (after 1970 and before 2100)
  if (value > 0 && value < 4102444800) {
    const date = new Date(value * 1000);
    return date.toLocaleString();
  }
  return null;
}

interface DecodedSectionProps {
  title: string;
  subtitle: string;
  data: Record<string, unknown> | null;
  colorClass: string;
  showClaims?: boolean;
}

function DecodedSection({
  title,
  subtitle,
  data,
  colorClass,
  showClaims = false,
}: DecodedSectionProps) {
  const [viewMode, setViewMode] = useState<"json" | "claims">("json");

  return (
    <div className="glass rounded-xl overflow-hidden animate-fade-in">
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-color)]">
        <div className="flex items-center gap-3">
          <div
            className={`w-3 h-3 rounded-full ${colorClass === "jwt-header" ? "bg-[var(--header-color)]" : colorClass === "jwt-payload" ? "bg-[var(--payload-color)]" : "bg-[var(--signature-color)]"}`}
          />
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

export default function JWTDecoder() {
  const [token, setToken] = useState(SAMPLE_JWT);
  const [decoded, setDecoded] = useState<DecodedJWT | null>(null);
  const [copied, setCopied] = useState(false);

  const handleDecode = useCallback(() => {
    const result = decodeJWT(token);
    setDecoded(result);
  }, [token]);

  useEffect(() => {
    handleDecode();
  }, [handleDecode]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(token);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClear = () => {
    setToken("");
    setDecoded(null);
  };

  const handleLoadSample = () => {
    setToken(SAMPLE_JWT);
  };

  // Split token into colored parts for display
  const tokenParts = token.split(".");
  const hasThreeParts = tokenParts.length === 3;

  return (
    <div className="min-h-screen p-4 md:p-8">
      {/* Header */}
      <header className="max-w-7xl mx-auto mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold gradient-text">
              JWT Decoder
            </h1>
            <p className="text-[var(--muted)] mt-1">
              Decode, inspect, and understand JSON Web Tokens
            </p>
          </div>
          <div className="flex items-center gap-2">
            {decoded?.isValid ? (
              <span className="badge-success px-3 py-1 rounded-full text-sm font-medium">
                ✓ Valid JWT
              </span>
            ) : decoded?.error ? (
              <span className="badge-error px-3 py-1 rounded-full text-sm font-medium">
                ✗ Invalid
              </span>
            ) : (
              <span className="badge-neutral px-3 py-1 rounded-full text-sm font-medium">
                Waiting...
              </span>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column - Encoded */}
        <div className="space-y-4">
          <div className="glass rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-color)]">
              <h2 className="font-semibold">Encoded Token</h2>
              <div className="flex gap-2">
                <button
                  onClick={handleLoadSample}
                  className="text-xs px-3 py-1 rounded-lg bg-[var(--border-color)] hover:bg-[var(--muted)] transition-colors"
                >
                  Load Sample
                </button>
                <button
                  onClick={handleCopy}
                  className="text-xs px-3 py-1 rounded-lg bg-[var(--border-color)] hover:bg-[var(--muted)] transition-colors"
                >
                  {copied ? "Copied!" : "Copy"}
                </button>
                <button
                  onClick={handleClear}
                  className="text-xs px-3 py-1 rounded-lg bg-[var(--border-color)] hover:bg-[var(--muted)] transition-colors"
                >
                  Clear
                </button>
              </div>
            </div>

            <div className="p-4">
              <textarea
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="Paste your JWT token here..."
                className="w-full h-48 bg-[var(--background)] border border-[var(--border-color)] rounded-lg p-4 font-mono text-sm resize-none focus:outline-none focus:border-[var(--payload-color)] transition-colors"
                spellCheck={false}
              />
            </div>
          </div>

          {/* Color-coded preview */}
          {token && (
            <div className="glass rounded-xl p-4 overflow-hidden">
              <h3 className="text-sm font-medium text-[var(--muted)] mb-3">
                Token Structure
              </h3>
              <div className="font-mono text-sm break-all leading-relaxed">
                {hasThreeParts ? (
                  <>
                    <span className="jwt-header">{tokenParts[0]}</span>
                    <span className="jwt-dot">.</span>
                    <span className="jwt-payload">{tokenParts[1]}</span>
                    <span className="jwt-dot">.</span>
                    <span className="jwt-signature">{tokenParts[2]}</span>
                  </>
                ) : (
                  <span className="text-[var(--error-color)]">{token}</span>
                )}
              </div>
              {hasThreeParts && (
                <div className="flex gap-4 mt-4 text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-[var(--header-color)]" />
                    <span className="text-[var(--muted)]">Header</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-[var(--payload-color)]" />
                    <span className="text-[var(--muted)]">Payload</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-[var(--signature-color)]" />
                    <span className="text-[var(--muted)]">Signature</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Error display */}
          {decoded?.error && (
            <div className="glass rounded-xl p-4 border-l-4 border-[var(--error-color)] animate-fade-in">
              <div className="flex items-start gap-3">
                <span className="text-[var(--error-color)] text-xl">⚠</span>
                <div>
                  <h3 className="font-medium text-[var(--error-color)]">
                    Decoding Error
                  </h3>
                  <p className="text-sm text-[var(--muted)] mt-1">
                    {decoded.error}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column - Decoded */}
        <div className="space-y-4">
          <DecodedSection
            title="Header"
            subtitle="ALGORITHM & TOKEN TYPE"
            data={decoded?.header || null}
            colorClass="jwt-header"
            showClaims={true}
          />

          <DecodedSection
            title="Payload"
            subtitle="DATA"
            data={decoded?.payload || null}
            colorClass="jwt-payload"
            showClaims={true}
          />

          {/* Signature Section */}
          <div className="glass rounded-xl overflow-hidden animate-fade-in">
            <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--border-color)]">
              <div className="w-3 h-3 rounded-full bg-[var(--signature-color)]" />
              <div>
                <h3 className="font-semibold jwt-signature">Signature</h3>
                <p className="text-xs text-[var(--muted)]">VERIFY SIGNATURE</p>
              </div>
            </div>

            <div className="p-4 space-y-4">
              <div className="font-mono text-sm p-3 bg-[var(--background)] rounded-lg border border-[var(--border-color)] break-all">
                {decoded?.signature || (
                  <span className="text-[var(--muted)] italic">
                    No signature
                  </span>
                )}
              </div>

              <div className="p-4 rounded-lg bg-[var(--background)] border border-[var(--border-color)]">
                <p className="text-sm text-[var(--muted)] mb-3">
                  The signature is used to verify that the sender of the JWT is
                  who it says it is and to ensure that the message wasn&apos;t
                  changed along the way.
                </p>
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-[var(--muted)]">Algorithm:</span>
                  <span className="px-2 py-1 rounded bg-[var(--border-color)] font-mono">
                    {(decoded?.header?.alg as string) || "Unknown"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-7xl mx-auto mt-12 pt-8 border-t border-[var(--border-color)]">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-[var(--muted)]">
          <p>
            Built with Next.js • Inspired by{" "}
            <a
              href="https://jwt.io"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--payload-color)] hover:underline"
            >
              jwt.io
            </a>
          </p>
          <p>
            JWT tokens are decoded client-side. Your tokens never leave your
            browser.
          </p>
        </div>
      </footer>
    </div>
  );
}
