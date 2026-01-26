/********* Base64Url encoding *********/

/**
 * Converts a Uint8Array to a base64url string.
 * Base64url is a URL-safe variant of Base64 that uses - instead of + and _ instead of /,
 * and omits padding (= characters).
 *
 * @param bytes - The byte array to convert
 * @returns The base64url encoded string
 */
export function uint8ArrayToBase64Url(bytes: Uint8Array): string {
  const binary = Array.from(bytes, (byte) => String.fromCharCode(byte)).join(
    "",
  );
  // Convert to base64, then to base64url
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

/**
 * Encodes a string to base64url format.
 * Reverse operation of base64UrlDecode.
 *
 * @param str - The string to encode
 * @returns The base64url encoded string
 */
export function base64UrlEncode(str: string): string {
  const utf8Bytes = new TextEncoder().encode(str);
  return uint8ArrayToBase64Url(utf8Bytes);
}

/*********End of Base64Url encoding *********/

/********* Base64Url decoding *********/

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
 * Converts a "binary string" (from atob) to a Uint8Array.
 */
export function binaryStringToUint8Array(
  binary: string,
): Uint8Array<ArrayBuffer> {
  return Uint8Array.from(binary, (c) => c.charCodeAt(0));
}
/**
 * Updated existing function in common.ts
 */
export function base64UrlToUint8Array(
  base64url: string,
): Uint8Array<ArrayBuffer> {
  const binary = atob(base64UrlToBase64(base64url));
  return binaryStringToUint8Array(binary);
}

/**
 * Decodes a base64url string to a UTF-8 string.
 * Reverse operation of base64UrlEncode.
 *
 * @param str - The base64url encoded string to decode
 * @returns The decoded UTF-8 string
 */
export function base64UrlDecode(str: string): string {
  try {
    const bytes = base64UrlToUint8Array(str);
    return new TextDecoder().decode(bytes);
  } catch {
    throw new Error("Invalid Base64 encoding");
  }
}

/*********End of Base64Url decoding *********/

// PEM helper
/**
 * Strips PEM headers and decodes the base64 content
 */
export function pemToArrayBuffer(pem: string): ArrayBuffer {
  const base64 = pem.replace(/-----(BEGIN|END) [\w\s]+-----|\s/g, "");
  return binaryStringToUint8Array(atob(base64)).buffer;
}
