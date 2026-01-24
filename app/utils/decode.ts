export interface DecodedJWT {
  header: Record<string, unknown> | null;
  payload: Record<string, unknown> | null;
  signature: string;
  isValid: boolean;
  error?: string;
}

/**
 * Converts a base64url string to standard Base64 with padding.
 * Base64url is a URL-safe variant of Base64 that uses - instead of + and _ instead of /,
 * and omits padding (= characters).
 *
 * @param base64url - The base64url encoded string
 * @returns A standard Base64 string with padding
 */
function base64UrlToBase64(base64url: string): string {
  let base64 = base64url.replace(/-/g, "+").replace(/_/g, "/");
  const padding = base64.length % 4;
  if (padding) {
    base64 += "=".repeat(4 - padding);
  }
  return base64;
}

/**
 * Converts a base64url string to a Uint8Array.
 *
 * @param base64url - The base64url encoded string to convert
 * @returns A Uint8Array containing the decoded bytes
 */
export function base64UrlToUint8Array(
  base64url: string,
): Uint8Array<ArrayBuffer> {
  const base64 = base64UrlToBase64(base64url);
  const binary = atob(base64);
  const buffer = new ArrayBuffer(binary.length);
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Decodes a base64url string to a UTF-8 string.
 *
 * @param str - The base64url encoded string to decode
 * @returns The decoded UTF-8 string
 */
function base64UrlDecode(str: string): string {
  const base64 = base64UrlToBase64(str);

  try {
    return decodeURIComponent(
      atob(base64)
        .split("")
        // ("00" + ...).slice(-2) Ensures the hex is always 2 digits (padding).
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join(""),
    );
  } catch {
    throw new Error("Invalid Base64 encoding");
  }
}

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
