"use client";

import { useState, useMemo, useEffect } from "react";
import {
  decodeJWT,
  verifyJWTSignature,
  SAMPLE_JWT,
  VerificationResult,
} from "../utils";
import DecodedSection from "./DecodedSection";

export default function JWTDecoder() {
  const [token, setToken] = useState(SAMPLE_JWT);
  const [copied, setCopied] = useState(false);
  const [secret, setSecret] = useState("");
  const [verification, setVerification] = useState<VerificationResult | null>(
    null,
  );
  const [isVerifying, setIsVerifying] = useState(false);

  const decoded = useMemo(() => decodeJWT(token), [token]);

  // Verify signature when token or secret changes
  useEffect(() => {
    const verify = async () => {
      if (!secret || !token) {
        setVerification(null);
        return;
      }

      setIsVerifying(true);
      const result = await verifyJWTSignature(token, secret);
      setVerification(result);
      setIsVerifying(false);
    };

    // Debounce verification
    const timeoutId = setTimeout(verify, 300);
    return () => clearTimeout(timeoutId);
  }, [token, secret]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(token);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClear = () => {
    setToken("");
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
            {/* Signature verification badge */}
            {verification && (
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  verification.verified ? "badge-success" : "badge-error"
                }`}
              >
                {verification.verified
                  ? "✓ Signature Verified"
                  : "✗ Invalid Signature"}
              </span>
            )}
            {/* JWT structure badge */}
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
          {/* Encoded Token Card */}
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

          {/* Color-coded token preview card */}
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

          {/* Error display Card*/}
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
            <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-color)]">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-[var(--signature-color)]" />
                <div>
                  <h3 className="font-semibold jwt-signature">Signature</h3>
                  <p className="text-xs text-[var(--muted)]">
                    VERIFY SIGNATURE
                  </p>
                </div>
              </div>
              {/* Verification status indicator */}
              {verification && !isVerifying && (
                <span
                  className={`text-xs px-2 py-1 rounded ${
                    verification.verified
                      ? "bg-[var(--success-color)]/20 text-[var(--success-color)]"
                      : "bg-[var(--error-color)]/20 text-[var(--error-color)]"
                  }`}
                >
                  {verification.verified ? "✓ Verified" : "✗ Invalid"}
                </span>
              )}
              {isVerifying && (
                <span className="text-xs text-[var(--muted)] animate-pulse-subtle">
                  Verifying...
                </span>
              )}
            </div>

            <div className="p-4 space-y-4">
              {/* Signature display */}
              <div className="font-mono text-sm p-3 bg-[var(--background)] rounded-lg border border-[var(--border-color)] break-all">
                {decoded?.signature || (
                  <span className="text-[var(--muted)] italic">
                    No signature
                  </span>
                )}
              </div>

              {/* Secret input for verification */}
              <div className="space-y-2">
                <label className="text-sm text-[var(--muted)] block">
                  Enter secret to verify signature:
                </label>
                <input
                  type="text"
                  value={secret}
                  onChange={(e) => setSecret(e.target.value)}
                  placeholder="your-256-bit-secret"
                  className="w-full bg-[var(--background)] border border-[var(--border-color)] rounded-lg px-4 py-2 font-mono text-sm focus:outline-none focus:border-[var(--signature-color)] transition-colors"
                  spellCheck={false}
                />
              </div>

              {/* Verification result message */}
              {verification && !isVerifying && (
                <div
                  className={`p-3 rounded-lg border ${
                    verification.verified
                      ? "bg-[var(--success-color)]/10 border-[var(--success-color)]/30"
                      : "bg-[var(--error-color)]/10 border-[var(--error-color)]/30"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={
                        verification.verified
                          ? "text-[var(--success-color)]"
                          : "text-[var(--error-color)]"
                      }
                    >
                      {verification.verified ? "✓" : "✗"}
                    </span>
                    <span
                      className={`text-sm font-medium ${
                        verification.verified
                          ? "text-[var(--success-color)]"
                          : "text-[var(--error-color)]"
                      }`}
                    >
                      {verification.verified
                        ? "Signature Verified"
                        : "Signature Verification Failed"}
                    </span>
                  </div>
                  {verification.error && !verification.verified && (
                    <p className="text-xs text-[var(--muted)] mt-1">
                      {verification.error}
                    </p>
                  )}
                </div>
              )}

              {/* Algorithm info */}
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
                  {decoded?.header?.alg === "HS256" ? (
                    <span className="text-[var(--success-color)]">
                      ✓ Supported
                    </span>
                  ) : decoded?.header?.alg ? (
                    <span className="text-[var(--muted)]">Not supported</span>
                  ) : null}
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
