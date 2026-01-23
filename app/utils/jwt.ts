export interface DecodedJWT {
  header: Record<string, unknown> | null;
  payload: Record<string, unknown> | null;
  signature: string;
  isValid: boolean;
  error?: string;
}

export const SAMPLE_JWT =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c";

/**
 * Supported JWT signing algorithms
 */
export type SupportedAlgorithm = "HS256" | "RS256" | "ES256";

export const SUPPORTED_ALGORITHMS: SupportedAlgorithm[] = [
  "HS256",
  "RS256",
  "ES256",
];

/**
 * Algorithm metadata for UI display
 */
export const ALGORITHM_INFO: Record<
  SupportedAlgorithm,
  { name: string; description: string; keyType: "symmetric" | "asymmetric" }
> = {
  HS256: {
    name: "HMAC with SHA-256",
    description: "Symmetric algorithm using a shared secret",
    keyType: "symmetric",
  },
  RS256: {
    name: "RSA with SHA-256",
    description: "Asymmetric algorithm using RSA public/private key pair",
    keyType: "asymmetric",
  },
  ES256: {
    name: "ECDSA with SHA-256",
    description: "Asymmetric algorithm using Elliptic Curve (P-256) key pair",
    keyType: "asymmetric",
  },
};

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

/**
 * Converts a base64url string to a Uint8Array
 */
function base64UrlToUint8Array(base64url: string): Uint8Array<ArrayBuffer> {
  // Replace URL-safe characters back to standard Base64
  let base64 = base64url.replace(/-/g, "+").replace(/_/g, "/");
  // Add padding if needed
  const padding = base64.length % 4;
  if (padding) {
    base64 += "=".repeat(4 - padding);
  }
  const binary = atob(base64);
  const buffer = new ArrayBuffer(binary.length);
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Strips PEM headers and decodes the base64 content
 */
function pemToArrayBuffer(pem: string): ArrayBuffer {
  // Remove PEM headers, footers, and whitespace in between
  const base64 = pem
    .replace(/-----BEGIN [\w\s]+-----/g, "")
    .replace(/-----END [\w\s]+-----/g, "")
    .replace(/\s/g, "");

  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * Imports an RSA private key for signing
 */
async function importRSAPrivateKey(pem: string): Promise<CryptoKey> {
  const keyData = pemToArrayBuffer(pem);
  return await crypto.subtle.importKey(
    "pkcs8",
    keyData,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"],
  );
}

/**
 * Imports an RSA public key for verification
 */
async function importRSAPublicKey(pem: string): Promise<CryptoKey> {
  const keyData = pemToArrayBuffer(pem);
  return await crypto.subtle.importKey(
    "spki",
    keyData,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["verify"],
  );
}

/**
 * Imports an EC private key for signing (P-256 curve)
 */
async function importECPrivateKey(pem: string): Promise<CryptoKey> {
  const keyData = pemToArrayBuffer(pem);
  return await crypto.subtle.importKey(
    "pkcs8",
    keyData,
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["sign"],
  );
}

/**
 * Imports an EC public key for verification (P-256 curve)
 */
async function importECPublicKey(pem: string): Promise<CryptoKey> {
  const keyData = pemToArrayBuffer(pem);
  return await crypto.subtle.importKey(
    "spki",
    keyData,
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["verify"],
  );
}

/**
 * Converts an ECDSA signature from DER format to raw R+S format
 * JWT uses raw R+S format (64 bytes for P-256), but Web Crypto produces DER
 */
function derToRaw(derSignature: ArrayBuffer): ArrayBuffer {
  const der = new Uint8Array(derSignature);
  // DER format: 0x30 [length] 0x02 [r-length] [r] 0x02 [s-length] [s]
  // Check if it's already raw format (64 bytes for P-256)
  if (der.length === 64) {
    return derSignature;
  }

  let offset = 2; // Skip 0x30 and total length byte

  // Parse R
  if (der[offset] !== 0x02) throw new Error("Invalid DER signature");
  offset++;
  const rLen = der[offset];
  offset++;
  let r = der.slice(offset, offset + rLen);
  offset += rLen;

  // Parse S
  if (der[offset] !== 0x02) throw new Error("Invalid DER signature");
  offset++;
  const sLen = der[offset];
  offset++;
  let s = der.slice(offset, offset + sLen);

  // Remove leading zeros and pad to 32 bytes
  if (r.length > 32 && r[0] === 0) r = r.slice(1);
  if (s.length > 32 && s[0] === 0) s = s.slice(1);

  // Pad to 32 bytes if shorter
  if (r.length < 32) {
    const padded = new Uint8Array(32);
    padded.set(r, 32 - r.length);
    r = padded;
  }
  if (s.length < 32) {
    const padded = new Uint8Array(32);
    padded.set(s, 32 - s.length);
    s = padded;
  }

  const raw = new Uint8Array(64);
  raw.set(r, 0);
  raw.set(s, 32);
  return raw.buffer;
}

/**
 * Converts a raw R+S signature to DER format for Web Crypto verification
 */
function rawToDer(rawSignature: Uint8Array): ArrayBuffer {
  // Split into R and S (each 32 bytes for P-256)
  let r = rawSignature.slice(0, 32);
  let s = rawSignature.slice(32, 64);

  // Add leading zero if high bit is set (to prevent interpretation as negative)
  if (r[0] & 0x80) {
    const padded = new Uint8Array(33);
    padded[0] = 0;
    padded.set(r, 1);
    r = padded;
  }
  if (s[0] & 0x80) {
    const padded = new Uint8Array(33);
    padded[0] = 0;
    padded.set(s, 1);
    s = padded;
  }

  // Remove leading zeros (except if value would be negative)
  while (r.length > 1 && r[0] === 0 && !(r[1] & 0x80)) {
    r = r.slice(1);
  }
  while (s.length > 1 && s[0] === 0 && !(s[1] & 0x80)) {
    s = s.slice(1);
  }

  const totalLen = 2 + r.length + 2 + s.length;
  const der = new Uint8Array(2 + totalLen);

  let offset = 0;
  der[offset++] = 0x30; // SEQUENCE
  der[offset++] = totalLen;
  der[offset++] = 0x02; // INTEGER
  der[offset++] = r.length;
  der.set(r, offset);
  offset += r.length;
  der[offset++] = 0x02; // INTEGER
  der[offset++] = s.length;
  der.set(s, offset);

  return der.buffer;
}

export function decodeJWT(token: string): DecodedJWT {
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

/**
 * Converts a Uint8Array to a base64url string
 */
function uint8ArrayToBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  // Convert to base64, then to base64url
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

/**
 * Encodes a string to base64url format (URL-safe base64 without padding)
 */
function base64UrlEncode(str: string): string {
  // Convert string to UTF-8 bytes, then to base64
  const utf8Bytes = new TextEncoder().encode(str);
  let binary = "";
  for (let i = 0; i < utf8Bytes.length; i++) {
    binary += String.fromCharCode(utf8Bytes[i]);
  }
  // Convert to base64, then to base64url (replace + with -, / with _, remove =)
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

export type VerificationResult = {
  verified: boolean;
  error?: string;
  algorithm?: string;
};

/**
 * Verifies a JWT signature using the provided key.
 * Supports HS256 (HMAC-SHA256), RS256 (RSA-SHA256), and ES256 (ECDSA-SHA256).
 *
 * @param token - The complete JWT token string
 * @param key - The key used to verify the token:
 *              - For HS256: the shared secret string
 *              - For RS256/ES256: the public key in PEM format
 * @returns Promise with verification result
 */
export async function verifyJWTSignature(
  token: string,
  key: string,
): Promise<VerificationResult> {
  if (!token || !key) {
    return { verified: false, error: "Token and key are required" };
  }

  const parts = token.trim().split(".");
  if (parts.length !== 3) {
    return { verified: false, error: "Invalid JWT structure" };
  }

  const [headerB64, payloadB64, signatureB64] = parts;

  // Decode header to check algorithm
  let header: Record<string, unknown>;
  try {
    const headerJson = atob(
      headerB64.replace(/-/g, "+").replace(/_/g, "/") +
        "=".repeat((4 - (headerB64.length % 4)) % 4),
    );
    header = JSON.parse(headerJson);
  } catch {
    return { verified: false, error: "Invalid header" };
  }

  const algorithm = header.alg as string;

  // Check if algorithm is supported
  if (!SUPPORTED_ALGORITHMS.includes(algorithm as SupportedAlgorithm)) {
    return {
      verified: false,
      error: `Algorithm "${algorithm}" is not supported. Supported: ${SUPPORTED_ALGORITHMS.join(", ")}`,
      algorithm,
    };
  }

  try {
    // The data to verify is "header.payload"
    const dataToVerify = `${headerB64}.${payloadB64}`;
    const encoder = new TextEncoder();
    const dataBytes = encoder.encode(dataToVerify);
    const signatureBytes = base64UrlToUint8Array(signatureB64);

    let isValid = false;

    if (algorithm === "HS256") {
      // HMAC-SHA256: Use secret to compute signature and compare
      const keyData = encoder.encode(key);
      const cryptoKey = await crypto.subtle.importKey(
        "raw",
        keyData,
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["sign"],
      );

      const signatureBuffer = await crypto.subtle.sign(
        "HMAC",
        cryptoKey,
        dataBytes,
      );

      const computedSignature = uint8ArrayToBase64Url(
        new Uint8Array(signatureBuffer),
      );
      isValid = computedSignature === signatureB64;
    } else if (algorithm === "RS256") {
      // RSA-SHA256: Use public key to verify
      const publicKey = await importRSAPublicKey(key);
      isValid = await crypto.subtle.verify(
        { name: "RSASSA-PKCS1-v1_5" },
        publicKey,
        signatureBytes,
        dataBytes,
      );
    } else if (algorithm === "ES256") {
      // ECDSA-SHA256: Use public key to verify
      // Convert raw signature to DER format for Web Crypto
      const derSignature = rawToDer(signatureBytes);
      const publicKey = await importECPublicKey(key);
      isValid = await crypto.subtle.verify(
        { name: "ECDSA", hash: "SHA-256" },
        publicKey,
        derSignature,
        dataBytes,
      );
    }

    return {
      verified: isValid,
      algorithm,
      error: isValid ? undefined : "Signature does not match",
    };
  } catch (e) {
    return {
      verified: false,
      error: `Verification failed: ${(e as Error).message}`,
      algorithm,
    };
  }
}

export type EncodeResult = {
  token: string;
  error?: string;
};

/**
 * Creates a JWT token from header, payload, and key.
 * Supports HS256 (HMAC-SHA256), RS256 (RSA-SHA256), and ES256 (ECDSA-SHA256).
 *
 * @param header - The JWT header object (should include alg and typ)
 * @param payload - The JWT payload object (claims)
 * @param key - The key for signing:
 *              - For HS256: the shared secret string
 *              - For RS256/ES256: the private key in PEM format
 * @returns Promise with the generated token or error
 */
export async function encodeJWT(
  header: Record<string, unknown>,
  payload: Record<string, unknown>,
  key: string,
): Promise<EncodeResult> {
  // Validate header has required fields
  if (!header.alg) {
    return { token: "", error: "Header must include 'alg' field" };
  }

  const algorithm = header.alg as string;

  // Check if algorithm is supported
  if (!SUPPORTED_ALGORITHMS.includes(algorithm as SupportedAlgorithm)) {
    return {
      token: "",
      error: `Algorithm "${algorithm}" is not supported. Supported: ${SUPPORTED_ALGORITHMS.join(", ")}`,
    };
  }

  if (!key) {
    const keyType = ALGORITHM_INFO[algorithm as SupportedAlgorithm].keyType;
    if (keyType === "symmetric") {
      return { token: "", error: "Secret is required for signing" };
    } else {
      return { token: "", error: "Private key is required for signing" };
    }
  }

  try {
    // Encode header and payload to base64url
    const headerB64 = base64UrlEncode(JSON.stringify(header));
    const payloadB64 = base64UrlEncode(JSON.stringify(payload));

    // Create the signing input
    const signingInput = `${headerB64}.${payloadB64}`;
    const encoder = new TextEncoder();
    const signingInputBytes = encoder.encode(signingInput);

    let signatureB64: string;

    if (algorithm === "HS256") {
      // HMAC-SHA256: Use secret for signing
      const keyData = encoder.encode(key);
      const cryptoKey = await crypto.subtle.importKey(
        "raw",
        keyData,
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["sign"],
      );

      const signatureBuffer = await crypto.subtle.sign(
        "HMAC",
        cryptoKey,
        signingInputBytes,
      );

      signatureB64 = uint8ArrayToBase64Url(new Uint8Array(signatureBuffer));
    } else if (algorithm === "RS256") {
      // RSA-SHA256: Use private key for signing
      const privateKey = await importRSAPrivateKey(key);
      const signatureBuffer = await crypto.subtle.sign(
        { name: "RSASSA-PKCS1-v1_5" },
        privateKey,
        signingInputBytes,
      );

      signatureB64 = uint8ArrayToBase64Url(new Uint8Array(signatureBuffer));
    } else if (algorithm === "ES256") {
      // ECDSA-SHA256: Use private key for signing
      const privateKey = await importECPrivateKey(key);
      const signatureBuffer = await crypto.subtle.sign(
        { name: "ECDSA", hash: "SHA-256" },
        privateKey,
        signingInputBytes,
      );

      // Convert DER signature to raw R+S format (JWT uses raw format)
      const rawSignature = derToRaw(signatureBuffer);
      signatureB64 = uint8ArrayToBase64Url(new Uint8Array(rawSignature));
    } else {
      return { token: "", error: "Unsupported algorithm" };
    }

    // Combine all parts
    const token = `${headerB64}.${payloadB64}.${signatureB64}`;

    return { token };
  } catch (e) {
    console.error(e);
    return {
      token: "",
      error: `Encoding failed: ${(e as Error).message}`,
    };
  }
}
