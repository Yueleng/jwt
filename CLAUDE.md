# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start development server on http://localhost:3000
npm run build    # Create production build
npm start        # Start production server
npm run lint     # Run ESLint
```

## Architecture

This is a client-side JWT toolbox (encoder + decoder) built with Next.js App Router. All JWT processing happens in the browser - no tokens or secrets are ever sent to a server.

### Key Files

| File | Purpose |
|------|---------|
| `app/utils/decode.ts` | JWT decoding functions and base64url utilities |
| `app/utils/encode.ts` | JWT encoding and signature verification (HS256, RS256, ES256) using Web Crypto API |
| `app/utils/sample.ts` | Sample JWT and matching RSA/EC key pairs for testing |
| `app/utils/format.tsx` | Recursive JSON syntax highlighting formatter, claim descriptions, timestamp formatting |
| `app/utils/index.ts` | Re-exports all utilities |
| `app/components/JWTDecoder.tsx` | Decoder component - manages token state, decoding, and signature verification |
| `app/components/JWTEncoder.tsx` | Encoder component - creates JWTs with header/payload editors and live preview |
| `app/components/DecodedSection.tsx` | Reusable section for header/payload display with JSON/Claims toggle |
| `app/components/Navigation.tsx` | Nav component for switching between Encoder and Decoder pages |
| `app/page.tsx` | Decoder page entry point - renders JWTDecoder |
| `app/encode/page.tsx` | Encoder page entry point - renders JWTEncoder |
| `app/globals.css` | CSS custom properties for colors, glassmorphic styles, JWT color coding, animations |

### Design System

The app uses CSS custom properties defined in `:root` of `globals.css`:
- `--header-color` for JWT headers
- `--payload-color` for JWT payloads
- `--signature-color` for JWT signatures
- `--success-color`, `--error-color`, `--muted` for status badges

The `.gradient-text` class creates a gradient from these three colors (header → payload → signature).

Components use the `.glass` class for the translucent card effect and `.gradient-text` for the header gradient.

### Data Flow

**Decoder (`/`):**
1. User pastes JWT → `token` state updates
2. `useMemo` triggers `decodeJWT()` → returns `{ header, payload, signature, isValid, error }`
3. Algorithm is auto-detected from header (`alg` field)
4. If key provided, `useEffect` with debounce triggers `verifyJWTSignature()` → updates verification state
5. Key input adapts based on algorithm: secret (HS256) or PEM public key (RS256/ES256)

**Encoder (`/encode`):**
1. User edits header/payload JSON or key → state updates
2. Algorithm is selected from dropdown (HS256, RS256, ES256)
3. `useEffect` with debounce parses JSON and calls `encodeJWT()` → returns `{ token, error }`
4. Generated token displayed with color-coded structure preview
5. Quick buttons (`+iat`, `+exp`) modify payload with timestamp claims
6. Key input adapts: secret field (HS256) or PEM private key field (RS256/ES256)

### Sample JWT

The sample token (`SAMPLE_JWT` in `sample.ts`) is the standard jwt.io example:
- Header: `{"alg":"HS256","typ":"JWT"}`
- Payload: `{"sub":"1234567890","name":"John Doe","iat":1516239022}`
- Secret: `"secret"`

Sample keys for testing (NOT for production use) - all in `sample.ts`:
- **RSA Key Pair** (`SAMPLE_RSA_PRIVATE_KEY` / `SAMPLE_RSA_PUBLIC_KEY`): Matching RS256 keys
- **EC Key Pair** (`SAMPLE_EC_PRIVATE_KEY` / `SAMPLE_EC_PUBLIC_KEY`): Matching ES256 keys

### Supported Algorithms

| Algorithm | Type | Key for Signing | Key for Verification |
|-----------|------|-----------------|---------------------|
| **HS256** | Symmetric | Shared secret | Same shared secret |
| **RS256** | Asymmetric | RSA private key (PKCS#8 PEM) | RSA public key (SPKI PEM) |
| **ES256** | Asymmetric | EC private key (PKCS#8 PEM, P-256) | EC public key (SPKI PEM, P-256) |

### Key Helper Functions

Located in `app/utils/encode.ts`:

| Function | Purpose |
|----------|---------|
| `importRSAPrivateKey()` | Import RSA private key for signing (RS256) |
| `importRSAPublicKey()` | Import RSA public key for verification (RS256) |
| `importECPrivateKey()` | Import EC private key for signing (ES256) |
| `importECPublicKey()` | Import EC public key for verification (ES256) |
| `pemToArrayBuffer()` | Strip PEM headers and decode base64 content |
| `derToRaw()` / `rawToDer()` | Convert ECDSA signatures between DER and raw formats |

Located in `app/utils/decode.ts`:

| Function | Purpose |
|----------|---------|
| `base64UrlToBase64()` | Convert base64url to standard Base64 with padding |
| `base64UrlToUint8Array()` | Convert base64url to Uint8Array |
| `base64UrlDecode()` | Convert base64url to UTF-8 string |
| `decodeJWT()` | Decode JWT token into header, payload, signature |
