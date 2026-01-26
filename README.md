# JWT Toolbox

A modern, client-side JSON Web Token (JWT) encoder and decoder built with Next.js, React, and TypeScript. Create, decode, inspect, and verify JWT tokens instantly in your browser with a beautiful dark-themed interface.

![JWT Decoder](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js)
![React](https://img.shields.io/badge/React-19-blue?style=flat-square&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square&logo=typescript)

## Features

### Token Decoding

- **Instant Decoding** - Decode JWT headers and payloads in real-time as you type
- **Syntax Highlighted JSON** - Beautiful, color-coded JSON display with proper indentation
- **Structure Visualization** - Color-coded token preview showing header, payload, and signature sections
- **Validation** - Automatic JWT structure validation with clear error messages

### Signature Verification

- **HS256 Support** - Verify HMAC-SHA256 signatures using your secret key
- **RS256 Support** - Verify RSA-SHA256 signatures using a public key
- **ES256 Support** - Verify ECDSA-SHA256 signatures using a public key
- **Real-time Verification** - Debounced verification that updates as you type
- **Visual Indicators** - Clear status badges showing verification state
- **Auto Algorithm Detection** - Automatically detects the algorithm from the token header

### Token Encoding

- **Create JWTs** - Build custom JWT tokens with header and payload editors
- **Algorithm Selection** - Choose between HS256, RS256, or ES256
- **JSON Validation** - Real-time JSON parsing with clear error messages
- **Quick Timestamps** - One-click buttons to add `iat` (issued at) and `exp` (expiration) claims
- **Live Preview** - See your token generated instantly as you type
- **Token Structure** - Color-coded preview showing header, payload, and signature sections

### User Experience

- **Navigation** - Seamless switching between Encoder and Decoder pages
- **Dual View Modes** - Toggle between raw JSON and human-readable claims view
- **Timestamp Formatting** - Automatic conversion of Unix timestamps to readable dates
- **Claim Descriptions** - Built-in descriptions for standard JWT claims (iss, sub, exp, etc.)
- **Sample Token** - Load a sample JWT to explore the tool's features
- **Copy/Clear Actions** - Quick buttons to copy token to clipboard or clear input
- **Responsive Design** - Works seamlessly on desktop and mobile devices

### Privacy & Security

- **100% Client-Side** - All processing happens in your browser
- **No Data Transmission** - Your tokens and secrets never leave your device
- **Web Crypto API** - Uses native browser cryptography for signature verification

## Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org) with App Router
- **UI Library**: [React 19](https://react.dev)
- **Language**: [TypeScript 5](https://www.typescriptlang.org)
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com) with custom glassmorphic design
- **Cryptography**: Native [Web Crypto API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API)

## Getting Started

### Prerequisites

- Node.js 18+
- npm, yarn, pnpm, or bun

### Installation

```bash
# Clone the repository
git clone https://github.com/Yueleng/jwt.git
cd jwt

# Install dependencies
npm install
```

### Development

```bash
# Run the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build

```bash
# Create a production build
npm run build

# Start the production server
npm start
```

## Project Structure

```
jwt/
├── app/
│   ├── components/
│   │   ├── JWTDecoder.tsx    # Main decoder component with state management
│   │   ├── JWTEncoder.tsx    # Encoder component for token creation
│   │   ├── DecodedSection.tsx # Reusable section for header/payload display
│   │   └── Navigation.tsx    # Nav component for page switching
│   ├── utils/
│   │   ├── common.ts         # Base64url encoding/decoding utilities
│   │   ├── decode.ts         # JWT decoding and signature verification
│   │   ├── encode.ts         # JWT encoding functions
│   │   ├── sample.ts         # Algorithm constants, sample JWT, and key pairs
│   │   ├── format.tsx        # JSON formatting and claim descriptions
│   │   └── index.ts          # Utility exports
│   ├── encode/
│   │   └── page.tsx          # Encoder page
│   ├── globals.css           # Global styles with CSS custom properties
│   ├── layout.tsx            # Root layout
│   └── page.tsx              # Home page (decoder)
├── public/                   # Static assets
├── package.json
└── tsconfig.json
```

## Key APIs

### `decodeJWT(token: string): DecodedJWT`

Decodes a JWT token and returns its header, payload, and signature.

```typescript
const result = decodeJWT(token);
// Returns: { header: {...}, payload: {...}, signature: "...", isValid: true }
```

### `verifyJWTSignature(token: string, key: string): Promise<VerificationResult>`

Verifies the signature of a JWT using the provided key (secret for HS256, PEM public key for RS256/ES256).

```typescript
// HS256 - with secret
const result = await verifyJWTSignature(token, "your-secret");

// RS256 - with RSA public key (PEM format)
const result = await verifyJWTSignature(
  token,
  "-----BEGIN PUBLIC KEY-----\n...",
);

// ES256 - with EC public key (PEM format)
const result = await verifyJWTSignature(
  token,
  "-----BEGIN PUBLIC KEY-----\n...",
);

// Returns: { verified: boolean, error?: string, algorithm?: string }
```

### `encodeJWT(header: object, payload: object, key: string): Promise<EncodeResult>`

Creates and signs a JWT token with the specified algorithm.

```typescript
// HS256 - with secret
const result = await encodeJWT(
  { alg: "HS256", typ: "JWT" },
  { sub: "1234567890", name: "John Doe" },
  "your-secret",
);

// RS256 - with RSA private key (PEM format)
const result = await encodeJWT(
  { alg: "RS256", typ: "JWT" },
  { sub: "1234567890", name: "John Doe" },
  "-----BEGIN PRIVATE KEY-----\n...",
);

// ES256 - with EC private key (PEM format)
const result = await encodeJWT(
  { alg: "ES256", typ: "JWT" },
  { sub: "1234567890", name: "John Doe" },
  "-----BEGIN PRIVATE KEY-----\n...",
);

// Returns: { token: string, error?: string }
```

## How JWT Works

### JWT Structure

A JWT consists of three parts separated by dots (`.`):

```
header.payload.signature
```

For example:

```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c
```

### Encoding Process

Creating a JWT involves these steps:

```
1. Create Header
   {"alg": "HS256", "typ": "JWT"}
   ↓
2. Base64Url encode Header
   ↓
3. Create Payload (Claims)
   {"sub": "1234567890", "name": "John Doe", "iat": 1516239022}
   ↓
4. Base64Url encode Payload
   ↓
5. Create Signature
   data: base64UrlString = base64Url(header) + "." + base64Url(payload)
   signingInput: Uint8Array = encoder.encode(data)
   signingSecret: Uint8Array = encoder.encode(secret)
   signature: Uint8Array = sign(signingInput, signingSecret)  // Algorithm-specific
   ↓
6. Base64Url encode Signature (convert Uint8Array to base64url string)
   ↓
7. Combine: base64Url(header).base64Url(payload).base64Url(signature)
```

### Create Signature Process

The signature is the cryptographic proof that the token was created by someone who possesses the signing key. It binds the header and payload together so any modification would invalidate the signature.

**Algorithm-specific signing:**

| Algorithm | Signing Process                                                                          |
| --------- | ---------------------------------------------------------------------------------------- |
| **HS256** | `HMAC-SHA256(data, secret)` → symmetric, same key for sign/verify                        |
| **RS256** | `RSASSA-PKCS1-v1_5.sign(data, privateKey)` → asymmetric, private key signs               |
| **ES256** | `ECDSA-SHA256.sign(data, privateKey)` → asymmetric, private key signs, raw R\|\|S format |

---

#### HS256 (HMAC with SHA-256)

**Symmetric algorithm** - the same secret is used for both signing and verification.

```
Signing Input: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0"
Secret: "your-256-bit-secret"

Process:
1. Convert secret to bytes (UTF-8)
2. Import key as HMAC key with SHA-256
3. Compute HMAC-SHA256(signingInput, keyBytes)
4. Output: 32-byte hash

5. Encode to base64url: "SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c"
```

**Key requirements:**

- Any string (typically 256+ bits recommended)
- Shared between signing and verification parties
- Must be kept confidential

---

#### RS256 (RSA Signature with PKCS#1 v1_5 and SHA-256)

**Asymmetric algorithm** - private key signs, public key verifies.

```
Signing Input: "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0"
Private Key: RSA 2048-bit (PKCS#8 PEM format)

Process:
1. Parse PEM: Strip "-----BEGIN PRIVATE KEY-----" headers, decode base64
2. Import key: PKCS#8 format, RSASSA-PKCS1-v1_5, SHA-256 hash
3. Sign: crypto.subtle.sign(
     { name: "RSASSA-PKCS1-v1_5" },
     privateKey,
     signingInputBytes
   )
4. Output: 256-byte signature (for 2048-bit RSA key)

5. Encode to base64url: signature becomes the third part of JWT
```

**Key requirements:**

- **Signing**: RSA private key in PKCS#8 format (PEM encoded)
- **Verification**: RSA public key in SPKI format (PEM encoded)
- Recommended key size: 2048 bits minimum (4096 bits for higher security)

**PEM format example:**

```
-----BEGIN PRIVATE KEY-----
MIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC...
-----END PRIVATE KEY-----
```

---

#### ES256 (ECDSA Signature with P-256 and SHA-256)

**Asymmetric algorithm** - private key signs, public key verifies. Uses Elliptic Curve cryptography for smaller signatures.

```
Signing Input: "eyJhbGciOiJFUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0"
Private Key: EC P-256 (PKCS#8 PEM format)

Process:
1. Parse PEM: Strip "-----BEGIN PRIVATE KEY-----" headers, decode base64
2. Import key: PKCS#8 format, ECDSA, namedCurve: P-256
3. Sign: crypto.subtle.sign(
     { name: "ECDSA", hash: "SHA-256" },
     privateKey,
     signingInputBytes
   )
4. Output: 64-byte raw signature (R || S format)
   - R: 32 bytes (first half)
   - S: 32 bytes (second half)
   - This is the same format JWT uses, so no conversion needed!

5. Encode to base64url: 64-byte raw signature becomes the third part
```

**Key requirements:**

- **Signing**: EC private key for P-256 curve (PKCS#8 format)
- **Verification**: EC public key for P-256 curve (SPKI format)
- Signature size: 64 bytes (raw R||S), much smaller than RS256's 256 bytes

**Note on signature format:**

- Web Crypto API uses raw R||S format (IEEE P1363) for ECDSA
- JWT specification also uses raw R||S format
- No conversion is needed between Web Crypto and JWT!
- Some other libraries (like OpenSSL) use DER format, but browsers do not

**PEM format example:**

```
-----BEGIN PRIVATE KEY-----
MIGHAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBG0wawIBAQQg...
-----END PRIVATE KEY-----
```

---

#### Base64Url Encoding

After signature generation, the binary output must be encoded:

```
Raw binary: [0x5F, 0x6C, 0x6B, ...]
↓
Base64: "SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c="
↓
Base64Url: "SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c"
           (remove padding, replace + and /)
```

**Character mapping:**

- `+` → `-` (URL-safe)
- `/` → `_` (URL-safe)
- `=` (padding) → removed

**Base64Url encoding** converts binary data to URL-safe text:

- Standard Base64 characters: `A-Z`, `a-z`, `0-9`, `+`, `/`
- Base64Url replaces: `+` → `-`, `/` → `_`, removes `=` padding

### Decoding Process

Decoding a JWT is the reverse (for header and payload):

```
1. Split token by "."
   [headerB64, payloadB64, signatureB64]
   ↓
2. Decode Header
   base64UrlDecode(headerB64) → JSON.parse() → {"alg": "HS256", "typ": "JWT"}
   ↓
3. Decode Payload
   base64UrlDecode(payloadB64) → JSON.parse() → {"sub": "1234567890", ...}
   ↓
4. Extract Signature
   signatureB64 (kept as-is for verification)
```

**Important:** Decoding only reveals the content. It does **not** verify the signature. Anyone can decode a JWT and read its contents—the signature proves it was created by someone with the private/secret key.

### Signature Verification

Verification ensures the token hasn't been tampered with:

```
1. Decode header to get algorithm (e.g., "RS256")
   ↓
2. Recreate the signing input
   data = headerB64 + "." + payloadB64
   ↓
3. Verify signature using algorithm and key
   - HS256: HMAC-SHA256(data, secret) == decodedSignature
   - RS256: RSA.verify(data, publicKey, signature)
   - ES256: ECDSA.verify(data, publicKey, signature)
   ↓
4. Return verified: true/false
```

**Key types for verification:**

| Algorithm | Key Required                                          |
| --------- | ----------------------------------------------------- |
| **HS256** | Same shared secret used for signing                   |
| **RS256** | RSA public key (matching the private key that signed) |
| **ES256** | EC public key (matching the private key that signed)  |

### Security Notes

1. **Never store sensitive data in JWT payload** — anyone can decode it
2. **Always verify signatures** — decoded tokens may be tampered
3. **Use strong secrets for HS256** — at least 256 bits (32 characters)
4. **Keep private keys secure** — never expose them in client-side code
5. **Validate claims** — check `exp` (expiration), `nbf` (not before), `iss` (issuer)

## Supported Algorithms

| Algorithm            | Support      | Key Type   |
| -------------------- | ------------ | ---------- |
| HS256 (HMAC-SHA256)  | ✅ Supported | Symmetric  |
| RS256 (RSA-SHA256)   | ✅ Supported | Asymmetric |
| ES256 (ECDSA-SHA256) | ✅ Supported | Asymmetric |

## License

MIT

## Acknowledgments

Inspired by [jwt.io](https://jwt.io) - the industry standard JWT debugger.
