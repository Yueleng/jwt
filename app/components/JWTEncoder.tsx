"use client";

import { useState, useEffect, useCallback } from "react";
import { encodeJWT, EncodeResult } from "../utils";
import Navigation from "./Navigation";

const DEFAULT_HEADER = JSON.stringify({ alg: "HS256", typ: "JWT" }, null, 2);
const DEFAULT_PAYLOAD = JSON.stringify(
  {
    sub: "1234567890",
    name: "John Doe",
    iat: Math.floor(Date.now() / 1000),
  },
  null,
  2,
);

export default function JWTEncoder() {
  const [headerText, setHeaderText] = useState(DEFAULT_HEADER);
  const [payloadText, setPayloadText] = useState(DEFAULT_PAYLOAD);
  const [secret, setSecret] = useState("your-256-bit-secret");
  const [result, setResult] = useState<EncodeResult>({ token: "" });
  const [errors, setErrors] = useState<{
    header?: string;
    payload?: string;
  }>({});
  const [isEncoding, setIsEncoding] = useState(false);
  const [copied, setCopied] = useState(false);

  // Parse and validate JSON
  const parseJSON = useCallback(
    (
      text: string,
      field: "header" | "payload",
    ): Record<string, unknown> | null => {
      try {
        const parsed = JSON.parse(text);
        if (
          typeof parsed !== "object" ||
          parsed === null ||
          Array.isArray(parsed)
        ) {
          setErrors((prev) => ({ ...prev, [field]: "Must be a JSON object" }));
          return null;
        }
        setErrors((prev) => ({ ...prev, [field]: undefined }));
        return parsed;
      } catch (e) {
        setErrors((prev) => ({
          ...prev,
          [field]: `Invalid JSON: ${(e as Error).message}`,
        }));
        return null;
      }
    },
    [],
  );

  // Generate token when inputs change
  useEffect(() => {
    const generate = async () => {
      const header = parseJSON(headerText, "header");
      const payload = parseJSON(payloadText, "payload");

      if (!header || !payload) {
        setResult({ token: "", error: "Fix JSON errors first" });
        return;
      }

      if (!secret) {
        setResult({ token: "", error: "Secret is required" });
        return;
      }

      setIsEncoding(true);
      const encoded = await encodeJWT(header, payload, secret);
      setResult(encoded);
      setIsEncoding(false);
    };

    // Debounce
    const timeoutId = setTimeout(generate, 300);
    return () => clearTimeout(timeoutId);
  }, [headerText, payloadText, secret, parseJSON]);

  const handleCopy = async () => {
    if (result.token) {
      await navigator.clipboard.writeText(result.token);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleClear = () => {
    setHeaderText(DEFAULT_HEADER);
    setPayloadText(DEFAULT_PAYLOAD);
    setSecret("");
    setResult({ token: "" });
  };

  const handleAddIat = () => {
    try {
      const payload = JSON.parse(payloadText);
      payload.iat = Math.floor(Date.now() / 1000);
      setPayloadText(JSON.stringify(payload, null, 2));
    } catch {
      // Ignore if payload is invalid
    }
  };

  const handleAddExp = () => {
    try {
      const payload = JSON.parse(payloadText);
      // 1 hour from now
      payload.exp = Math.floor(Date.now() / 1000) + 3600;
      setPayloadText(JSON.stringify(payload, null, 2));
    } catch {
      // Ignore if payload is invalid
    }
  };

  // Split token for colored display
  const tokenParts = result.token ? result.token.split(".") : [];
  const hasThreeParts = tokenParts.length === 3;

  return (
    <div className="min-h-screen p-4 md:p-8">
      {/* Header */}
      <header className="max-w-7xl mx-auto mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold gradient-text">
              JWT Encoder
            </h1>
            <p className="text-[var(--muted)] mt-1">
              Create and sign JSON Web Tokens
            </p>
          </div>
          <Navigation />
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column - Inputs */}
        <div className="space-y-4">
          {/* Header Input */}
          <div className="glass rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-color)]">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-[var(--header-color)]" />
                <div>
                  <h2 className="font-semibold text-[var(--header-color)]">
                    Header
                  </h2>
                  <p className="text-xs text-[var(--muted)]">
                    ALGORITHM & TOKEN TYPE
                  </p>
                </div>
              </div>
              {errors.header && (
                <span className="text-xs text-[var(--error-color)]">
                  ✗ Invalid
                </span>
              )}
            </div>
            <div className="p-4">
              <textarea
                value={headerText}
                onChange={(e) => setHeaderText(e.target.value)}
                className={`w-full h-32 bg-[var(--background)] border rounded-lg p-4 font-mono text-sm resize-none focus:outline-none transition-colors ${
                  errors.header
                    ? "border-[var(--error-color)]"
                    : "border-[var(--border-color)] focus:border-[var(--header-color)]"
                }`}
                spellCheck={false}
              />
              {errors.header && (
                <p className="text-xs text-[var(--error-color)] mt-2">
                  {errors.header}
                </p>
              )}
            </div>
          </div>

          {/* Payload Input */}
          <div className="glass rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-color)]">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-[var(--payload-color)]" />
                <div>
                  <h2 className="font-semibold text-[var(--payload-color)]">
                    Payload
                  </h2>
                  <p className="text-xs text-[var(--muted)]">DATA (CLAIMS)</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleAddIat}
                  className="text-xs px-2 py-1 rounded bg-[var(--border-color)] hover:bg-[var(--muted)] transition-colors"
                  title="Add issued-at timestamp"
                >
                  + iat
                </button>
                <button
                  onClick={handleAddExp}
                  className="text-xs px-2 py-1 rounded bg-[var(--border-color)] hover:bg-[var(--muted)] transition-colors"
                  title="Add expiration (1 hour)"
                >
                  + exp
                </button>
                {errors.payload && (
                  <span className="text-xs text-[var(--error-color)]">
                    ✗ Invalid
                  </span>
                )}
              </div>
            </div>
            <div className="p-4">
              <textarea
                value={payloadText}
                onChange={(e) => setPayloadText(e.target.value)}
                className={`w-full h-48 bg-[var(--background)] border rounded-lg p-4 font-mono text-sm resize-none focus:outline-none transition-colors ${
                  errors.payload
                    ? "border-[var(--error-color)]"
                    : "border-[var(--border-color)] focus:border-[var(--payload-color)]"
                }`}
                spellCheck={false}
              />
              {errors.payload && (
                <p className="text-xs text-[var(--error-color)] mt-2">
                  {errors.payload}
                </p>
              )}
            </div>
          </div>

          {/* Secret Input */}
          <div className="glass rounded-xl overflow-hidden">
            <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--border-color)]">
              <div className="w-3 h-3 rounded-full bg-[var(--signature-color)]" />
              <div>
                <h2 className="font-semibold text-[var(--signature-color)]">
                  Secret
                </h2>
                <p className="text-xs text-[var(--muted)]">SIGNING KEY</p>
              </div>
            </div>
            <div className="p-4">
              <input
                type="text"
                value={secret}
                onChange={(e) => setSecret(e.target.value)}
                placeholder="your-256-bit-secret"
                className="w-full bg-[var(--background)] border border-[var(--border-color)] rounded-lg px-4 py-3 font-mono text-sm focus:outline-none focus:border-[var(--signature-color)] transition-colors"
                spellCheck={false}
              />
              <p className="text-xs text-[var(--muted)] mt-2">
                This secret will be used to sign the JWT with HMAC-SHA256
              </p>
            </div>
          </div>
        </div>

        {/* Right Column - Output */}
        <div className="space-y-4">
          {/* Generated Token */}
          <div className="glass rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-color)]">
              <h2 className="font-semibold">Generated Token</h2>
              <div className="flex gap-2">
                <button
                  onClick={handleCopy}
                  disabled={!result.token}
                  className="text-xs px-3 py-1 rounded-lg bg-[var(--border-color)] hover:bg-[var(--muted)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {copied ? "Copied!" : "Copy"}
                </button>
                <button
                  onClick={handleClear}
                  className="text-xs px-3 py-1 rounded-lg bg-[var(--border-color)] hover:bg-[var(--muted)] transition-colors"
                >
                  Reset
                </button>
              </div>
            </div>

            <div className="p-4">
              {isEncoding ? (
                <div className="text-[var(--muted)] text-sm animate-pulse-subtle">
                  Generating token...
                </div>
              ) : result.error ? (
                <div className="p-3 rounded-lg bg-[var(--error-color)]/10 border border-[var(--error-color)]/30">
                  <p className="text-sm text-[var(--error-color)]">
                    {result.error}
                  </p>
                </div>
              ) : result.token ? (
                <div className="font-mono text-sm break-all p-3 bg-[var(--background)] rounded-lg border border-[var(--border-color)]">
                  {result.token}
                </div>
              ) : (
                <div className="text-[var(--muted)] text-sm italic">
                  Enter header, payload, and secret to generate a token
                </div>
              )}
            </div>
          </div>

          {/* Token Structure Preview */}
          {hasThreeParts && (
            <div className="glass rounded-xl p-4 overflow-hidden animate-fade-in">
              <h3 className="text-sm font-medium text-[var(--muted)] mb-3">
                Token Structure
              </h3>
              <div className="font-mono text-sm break-all leading-relaxed">
                <span className="text-[var(--header-color)]">
                  {tokenParts[0]}
                </span>
                <span className="text-[var(--muted)]">.</span>
                <span className="text-[var(--payload-color)]">
                  {tokenParts[1]}
                </span>
                <span className="text-[var(--muted)]">.</span>
                <span className="text-[var(--signature-color)]">
                  {tokenParts[2]}
                </span>
              </div>
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
            </div>
          )}

          {/* Info Card */}
          <div className="glass rounded-xl p-4">
            <h3 className="font-semibold mb-3">How it works</h3>
            <ol className="text-sm text-[var(--muted)] space-y-2 list-decimal list-inside">
              <li>
                The <strong>header</strong> and <strong>payload</strong> are
                Base64URL encoded
              </li>
              <li>
                They are joined with a dot:{" "}
                <code className="text-[var(--header-color)]">header</code>.
                <code className="text-[var(--payload-color)]">payload</code>
              </li>
              <li>
                The signature is created by HMAC-SHA256 signing this string with
                your secret
              </li>
              <li>
                The final token is:{" "}
                <code className="text-[var(--header-color)]">header</code>.
                <code className="text-[var(--payload-color)]">payload</code>.
                <code className="text-[var(--signature-color)]">signature</code>
              </li>
            </ol>
            <div className="mt-4 p-3 rounded-lg bg-[var(--background)] border border-[var(--border-color)]">
              <div className="flex items-center gap-2 text-xs">
                <span className="text-[var(--muted)]">Algorithm:</span>
                <span className="px-2 py-1 rounded bg-[var(--border-color)] font-mono">
                  HS256
                </span>
                <span className="text-[var(--success-color)]">✓ Supported</span>
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
            JWT tokens are created client-side. Your secrets never leave your
            browser.
          </p>
        </div>
      </footer>
    </div>
  );
}
