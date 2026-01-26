import {
  base64UrlEncode,
  uint8ArrayToBase64Url,
  pemToArrayBuffer,
} from "./common";
import {
  SUPPORTED_ALGORITHMS,
  SupportedAlgorithm,
  ALGORITHM_INFO,
} from "./sample";

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

    // step 1: stringify the header [JSON.stringify(header)]
    // step 2: TextEncoder().encode(stringifiedHeader): result to Uint8Array
    // step 3: uint8ArrayToBase64Url(uint8Array): result to base64url string
    // step 4: repeat step 1-3 for the payload
    // step 5: textEncoder().encode(`${headerB64}.${payloadB64}`): result to Uint8Array
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
      // Web Crypto returns raw R||S format (64 bytes), same as JWT
      const privateKey = await importECPrivateKey(key);
      const signatureBuffer = await crypto.subtle.sign(
        { name: "ECDSA", hash: "SHA-256" },
        privateKey,
        signingInputBytes,
      );

      signatureB64 = uint8ArrayToBase64Url(new Uint8Array(signatureBuffer));
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
