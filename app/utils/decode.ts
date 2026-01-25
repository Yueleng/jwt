import {
  base64UrlDecode,
  base64UrlToUint8Array,
  uint8ArrayToBase64Url,
} from "./common";
import { SUPPORTED_ALGORITHMS, SupportedAlgorithm } from "./sample";

export interface DecodedJWT {
  header: Record<string, unknown> | null;
  payload: Record<string, unknown> | null;
  signature: string;
  isValid: boolean;
  error?: string;
}

export type VerificationResult = {
  verified: boolean;
  error?: string;
  algorithm?: string;
};

/**
 * decodeJWT is a synchronous function that decodes a JWT token.
 * Since it only decodes the header and payload, it is safe to use in a
 * synchronous context and is simply a BASE64URL decode.
 * The signature is not decoded; it is returned as-is.
 * This function does NOT verify the signature.
 *
 * @param token - The JWT token string to decode
 * @returns DecodedJWT object with header, payload, signature, and validity status
 */
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
  // Set isValid to true if no errors
  // Note: this does NOT verify the signature,
  // it only indicates the token structure is valid
  result.isValid = true;

  return result;
}

/**
 * Strips PEM headers and decodes the base64 content
 */
function pemToArrayBuffer(pem: string): ArrayBuffer {
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
 * Converts a raw R+S signature to DER format for Web Crypto verification
 */
function rawToDer(rawSignature: Uint8Array): ArrayBuffer {
  let r = rawSignature.slice(0, 32);
  let s = rawSignature.slice(32, 64);

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

  while (r.length > 1 && r[0] === 0 && !(r[1] & 0x80)) {
    r = r.slice(1);
  }
  while (s.length > 1 && s[0] === 0 && !(s[1] & 0x80)) {
    s = s.slice(1);
  }

  const totalLen = 2 + r.length + 2 + s.length;
  const der = new Uint8Array(2 + totalLen);

  let offset = 0;
  der[offset++] = 0x30;
  der[offset++] = totalLen;
  der[offset++] = 0x02;
  der[offset++] = r.length;
  der.set(r, offset);
  offset += r.length;
  der[offset++] = 0x02;
  der[offset++] = s.length;
  der.set(s, offset);

  return der.buffer;
}

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
