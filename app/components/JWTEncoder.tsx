"use client";

import { useState, useEffect, useCallback } from "react";
import {
  encodeJWT,
  EncodeResult,
  SUPPORTED_ALGORITHMS,
  ALGORITHM_INFO,
  SupportedAlgorithm,
} from "../utils";
import Navigation from "./Navigation";

// Sample keys for testing (NOT for production use!)
const SAMPLE_RSA_PRIVATE_KEY = `-----BEGIN PRIVATE KEY-----
MIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQDXDeHIa6rRlAN2
ENmJauE2Uxjdc5j3R9AfWZxvK0ls5tDCL/p1D/gVpgEUvIb/VU862W5dewDo1NJW
5xPeG0EUhPrCMAHEdtywP0z3WzGrcFluklzjV5TUC6crBn0yo3McFttNg87OcsPx
4ANfhE6Wht5S5lXXH6V2jyMlHg9161+56+ZpddGVVsclNVJDED/472MZMvdrnAkM
uo24xaDY6KOeuykmIOcWd0pr9721wdh3TA6O1Ah0TwxC1BHim9auqLEjECcp03ua
ZD8hKf3rLuTLV/1UYrwT4+s1nhnPk0hPZuPo647OEh7lPwprlXEcQuECMArj5ONQ
qb0+eEl9AgMBAAECggEAATGGimzzA8tg2/ezI0Mg88L6OVxMtyz63J5wg5sv52EW
ftrpqlsA8GrdXgc5YubSNxxbZDzepVbOo2fZY6CBZyg2rGAjzf1+QnJHrRQsrx4z
5Bep91O8ZgEAByDrlB3UExotawgZ4leiQQJkkgS3AuNwdX2IM8eOt29ICpDxIQwF
cyLlyGKbsOF1ztWgvC6gn69klbHlbY5E5uB5bhCDOExk8vtv8e3cYHAs5bbcd/I8
2fpqlWNRdFK+JoY558GtQnPpVWmdzeO0sANsPJzTBCSvB+TddRDfWzm30a8JfyuQ
Qhv3mdY7PBCqzZj6FN5ymcQwmtgi/5qVgdjmxGgRoQKBgQDsAukJd5JJB02s8xh1
sMzQwGQJWf1zzsVt6RNfQ7btAMHiKgL0YIIuLKUBYcHVx2cgC3BRvzubMKD6RqNT
0juJ38Y4x0QORcImNrlZYslRlYd8vTRYProololBmKlIq9tdDEN0Yt/7CZCXOL8H
1f2edu0KA8H1qJAwr9gjaNBZ3QKBgQDpRJasrnGyDr8FZEZ5pLgyLLFFMGL8ke6X
t98svL31kCzqkYygLEdra11Bs6UhrNmCbnf0JwDevVpciqkWS3Xdn1hVsOik6DM3
TcDK9HDOHBjs/ZAFKVX+Ltynoz3Xo3Zbwp2Ab+p2MGKErivsEYM/Ysp2lMvkdjSR
ei2vidZEIQKBgA1H/KUzvV+usYhSBcZZtKzqpraAAetKb4HH4/cwcFLWABMiGhh2
ddzzVjXFsoq9NehvvFpdUJVjHyv2XaqR4hfYJ+d6DzJeapaL7dJB5OJab81tOEze
+srd7ctrM9uLEEUkM4eRKNmPqDtaTiW6vRL1zlEJ9RhF7BdRTfBwLYlhAoGAXJFK
VbZYCffOF/6l9OnH6qlPo4xDC8WBcBWYa7FulH8lQ+SEcJ+BrAAMHuGCOy3Tlu3t
jibYMovjyut/lAhX+p2cOU0d1SsL//tL8X41MaV2wr0QpOu1Y0wHZkLibKtCccF2
LRy8ZzBmOA7CAUkl00aJ36rGip/Z1o0sigdhzuECgYBRUvZSV3QFhzKOLkIbg3Tn
+BLx7/aV3zXbzBSxKy1We9SG2N6ZfTOUBtuNNgA6zrX2IMQPPLWqgN5q+PdaPCN4
otrfIoWNTK2T0rHGPoOkpDVh3XN5kavjsMiZ0Xl2Av+Vmfl9ow4Iiy0mzOOvE6FK
E2I0ABrRTDevTl+apGBt8g==
-----END PRIVATE KEY-----`;

const SAMPLE_EC_PRIVATE_KEY = `-----BEGIN PRIVATE KEY-----
MIGHAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBG0wawIBAQQgevZzL1gdAFr88hb2
OF/2NxApJCzGCEDdfSp6VQO30hyhRANCAAQRWz+jn65BtOMvdyHKcvjBeBSDZH2r
1RTwjmYSi9R/zpBnuQ4EiMnCqfMPWiZqB4QdbAd0E7oH50VpuZ1P087G
-----END PRIVATE KEY-----`;

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
  const [key, setKey] = useState("your-256-bit-secret");
  const [algorithm, setAlgorithm] = useState<SupportedAlgorithm>("HS256");
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

  // Update header when algorithm changes
  const handleAlgorithmChange = useCallback(
    (newAlg: SupportedAlgorithm) => {
      setAlgorithm(newAlg);
      // Update header JSON with new algorithm
      try {
        const header = JSON.parse(headerText);
        header.alg = newAlg;
        setHeaderText(JSON.stringify(header, null, 2));
      } catch {
        // If header is invalid, create a new one
        setHeaderText(JSON.stringify({ alg: newAlg, typ: "JWT" }, null, 2));
      }
      // Set appropriate default key
      if (newAlg === "HS256") {
        setKey("your-256-bit-secret");
      } else if (newAlg === "RS256") {
        setKey(SAMPLE_RSA_PRIVATE_KEY);
      } else if (newAlg === "ES256") {
        setKey(SAMPLE_EC_PRIVATE_KEY);
      }
    },
    [headerText],
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

      const algInfo = ALGORITHM_INFO[algorithm];
      if (!key) {
        const keyLabel =
          algInfo.keyType === "symmetric" ? "Secret" : "Private key";
        setResult({ token: "", error: `${keyLabel} is required` });
        return;
      }

      setIsEncoding(true);
      const encoded = await encodeJWT(header, payload, key);
      setResult(encoded);
      setIsEncoding(false);
    };

    // Debounce
    const timeoutId = setTimeout(generate, 300);
    return () => clearTimeout(timeoutId);
  }, [headerText, payloadText, key, algorithm, parseJSON]);

  const handleCopy = async () => {
    if (result.token) {
      await navigator.clipboard.writeText(result.token);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleClear = () => {
    setAlgorithm("HS256");
    setHeaderText(DEFAULT_HEADER);
    setPayloadText(DEFAULT_PAYLOAD);
    setKey("your-256-bit-secret");
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

          {/* Algorithm Selector */}
          <div className="glass rounded-xl overflow-hidden">
            <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--border-color)]">
              <div className="w-3 h-3 rounded-full bg-gradient-to-r from-[var(--header-color)] to-[var(--signature-color)]" />
              <div>
                <h2 className="font-semibold">Algorithm</h2>
                <p className="text-xs text-[var(--muted)]">SIGNING ALGORITHM</p>
              </div>
            </div>
            <div className="p-4">
              <div className="flex flex-wrap gap-2">
                {SUPPORTED_ALGORITHMS.map((alg) => (
                  <button
                    key={alg}
                    onClick={() => handleAlgorithmChange(alg)}
                    className={`px-4 py-2 rounded-lg font-mono text-sm transition-all ${
                      algorithm === alg
                        ? "bg-gradient-to-r from-[var(--header-color)] to-[var(--signature-color)] text-white shadow-lg"
                        : "bg-[var(--background)] border border-[var(--border-color)] hover:border-[var(--muted)]"
                    }`}
                  >
                    {alg}
                  </button>
                ))}
              </div>
              <p className="text-xs text-[var(--muted)] mt-3">
                {ALGORITHM_INFO[algorithm].description}
              </p>
            </div>
          </div>

          {/* Key Input */}
          <div className="glass rounded-xl overflow-hidden">
            <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--border-color)]">
              <div className="w-3 h-3 rounded-full bg-[var(--signature-color)]" />
              <div>
                <h2 className="font-semibold text-[var(--signature-color)]">
                  {ALGORITHM_INFO[algorithm].keyType === "symmetric"
                    ? "Secret"
                    : "Private Key"}
                </h2>
                <p className="text-xs text-[var(--muted)]">
                  {ALGORITHM_INFO[algorithm].keyType === "symmetric"
                    ? "SHARED SECRET"
                    : "PEM FORMAT"}
                </p>
              </div>
            </div>
            <div className="p-4">
              {ALGORITHM_INFO[algorithm].keyType === "symmetric" ? (
                <input
                  type="text"
                  value={key}
                  onChange={(e) => setKey(e.target.value)}
                  placeholder="your-256-bit-secret"
                  className="w-full bg-[var(--background)] border border-[var(--border-color)] rounded-lg px-4 py-3 font-mono text-sm focus:outline-none focus:border-[var(--signature-color)] transition-colors"
                  spellCheck={false}
                />
              ) : (
                <textarea
                  value={key}
                  onChange={(e) => setKey(e.target.value)}
                  placeholder="-----BEGIN PRIVATE KEY-----&#10;...&#10;-----END PRIVATE KEY-----"
                  className="w-full h-32 bg-[var(--background)] border border-[var(--border-color)] rounded-lg p-4 font-mono text-xs resize-none focus:outline-none focus:border-[var(--signature-color)] transition-colors"
                  spellCheck={false}
                />
              )}
              <p className="text-xs text-[var(--muted)] mt-2">
                {ALGORITHM_INFO[algorithm].keyType === "symmetric"
                  ? "This secret will be used to sign the JWT with HMAC-SHA256"
                  : `Private key in PKCS#8 PEM format for ${algorithm} signing`}
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
                {algorithm === "HS256"
                  ? "The signature is created by HMAC-SHA256 signing this string with your secret"
                  : algorithm === "RS256"
                    ? "The signature is created by RSA-SHA256 signing this string with your private key"
                    : "The signature is created by ECDSA-SHA256 signing this string with your private key"}
              </li>
              <li>
                The final token is:{" "}
                <code className="text-[var(--header-color)]">header</code>.
                <code className="text-[var(--payload-color)]">payload</code>.
                <code className="text-[var(--signature-color)]">signature</code>
              </li>
            </ol>
            <div className="mt-4 p-3 rounded-lg bg-[var(--background)] border border-[var(--border-color)]">
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="text-[var(--muted)]">Supported:</span>
                {SUPPORTED_ALGORITHMS.map((alg) => (
                  <span
                    key={alg}
                    className={`px-2 py-1 rounded font-mono ${
                      algorithm === alg
                        ? "bg-[var(--signature-color)] text-white"
                        : "bg-[var(--border-color)]"
                    }`}
                  >
                    {alg}
                  </span>
                ))}
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
