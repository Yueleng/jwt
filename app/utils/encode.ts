import {
  SUPPORTED_ALGORITHMS,
  SupportedAlgorithm,
  ALGORITHM_INFO,
} from "./sample";

/**
 * Strips PEM headers and decodes the base64 content
 */
function pemToArrayBuffer(pem: string): ArrayBuffer {
  // Remove PEM headers, footers, and whitespace
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
 * Converts a Uint8Array to a base64url string.
 * Base64url is a URL-safe variant of Base64 that uses - instead of + and _ instead of /,
 * and omits padding (= characters).
 *
 * @param bytes - The byte array to convert
 * @returns The base64url encoded string
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
 * Encodes a string to base64url format.
 *
 * @param str - The string to encode
 * @returns The base64url encoded string
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
