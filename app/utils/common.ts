/**
 * Converts a Uint8Array to a base64url string.
 * Base64url is a URL-safe variant of Base64 that uses - instead of + and _ instead of /,
 * and omits padding (= characters).
 *
 * @param bytes - The byte array to convert
 * @returns The base64url encoded string
 */
export function uint8ArrayToBase64Url(bytes: Uint8Array): string {
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
 * Converts a base64url string to standard Base64 with padding.
 * Base64url is a URL-safe variant of Base64 that uses - instead of + and _ instead of /,
 * and omits padding (= characters).
 *
 * @param base64url - The base64url encoded string
 * @returns A standard Base64 string with padding
 */
export function base64UrlToBase64(base64url: string): string {
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
export function base64UrlDecode(str: string): string {
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
