export interface DecodedJWT {
  header: Record<string, unknown> | null;
  payload: Record<string, unknown> | null;
  signature: string;
  isValid: boolean;
  error?: string;
}

export const SAMPLE_JWT =
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
 * Verifies a JWT signature using the provided secret.
 * Currently supports HS256 (HMAC-SHA256) algorithm.
 *
 * @param token - The complete JWT token string
 * @param secret - The secret key used to sign the token
 * @returns Promise with verification result
 */
export async function verifyJWTSignature(
  token: string,
  secret: string,
): Promise<VerificationResult> {
  if (!token || !secret) {
    return { verified: false, error: "Token and secret are required" };
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

  // Currently only support HS256
  if (algorithm !== "HS256") {
    return {
      verified: false,
      error: `Algorithm "${algorithm}" is not supported. Only HS256 is currently supported.`,
      algorithm,
    };
  }

  try {
    // The data to verify is "header.payload"
    const dataToVerify = `${headerB64}.${payloadB64}`;

    // Import the secret as a CryptoKey
    const encoder = new TextEncoder();
    const keyData = encoder.encode(secret);

    const cryptoKey = await crypto.subtle.importKey(
      "raw",
      keyData,
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"],
    );

    // Sign the data
    const signatureBuffer = await crypto.subtle.sign(
      "HMAC",
      cryptoKey,
      encoder.encode(dataToVerify),
    );

    // Convert the computed signature to base64url
    const computedSignature = uint8ArrayToBase64Url(
      new Uint8Array(signatureBuffer),
    );

    // Compare with the token's signature
    const isValid = computedSignature === signatureB64;

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
 * Creates a JWT token from header, payload, and secret.
 * Currently supports HS256 (HMAC-SHA256) algorithm.
 *
 * @param header - The JWT header object (should include alg and typ)
 * @param payload - The JWT payload object (claims)
 * @param secret - The secret key for signing
 * @returns Promise with the generated token or error
 */
export async function encodeJWT(
  header: Record<string, unknown>,
  payload: Record<string, unknown>,
  secret: string,
): Promise<EncodeResult> {
  // Validate header has required fields
  if (!header.alg) {
    return { token: "", error: "Header must include 'alg' field" };
  }

  // Currently only support HS256
  if (header.alg !== "HS256") {
    return {
      token: "",
      error: `Algorithm "${header.alg}" is not supported. Only HS256 is currently supported.`,
    };
  }

  if (!secret) {
    return { token: "", error: "Secret is required for signing" };
  }

  try {
    // Encode header and payload to base64url
    const headerB64 = base64UrlEncode(JSON.stringify(header));
    const payloadB64 = base64UrlEncode(JSON.stringify(payload));

    // Create the signing input
    const signingInput = `${headerB64}.${payloadB64}`;

    // Import the secret as a CryptoKey
    const encoder = new TextEncoder();
    const keyData = encoder.encode(secret);

    const cryptoKey = await crypto.subtle.importKey(
      "raw",
      keyData,
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"],
    );

    // Sign the data
    const signatureBuffer = await crypto.subtle.sign(
      "HMAC",
      cryptoKey,
      encoder.encode(signingInput),
    );

    // Convert signature to base64url
    const signatureB64 = uint8ArrayToBase64Url(new Uint8Array(signatureBuffer));

    // Combine all parts
    const token = `${headerB64}.${payloadB64}.${signatureB64}`;

    return { token };
  } catch (e) {
    return {
      token: "",
      error: `Encoding failed: ${(e as Error).message}`,
    };
  }
}
