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
| `app/utils/jwt.ts` | Core JWT encoding, decoding, and HS256 signature verification using Web Crypto API |
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
3. Decoded data passed to `DecodedSection` components for display
4. If secret provided, `useEffect` with debounce triggers `verifyJWTSignature()` → updates verification state

**Encoder (`/encode`):**
1. User edits header/payload JSON or secret → state updates
2. `useEffect` with debounce parses JSON and calls `encodeJWT()` → returns `{ token, error }`
3. Generated token displayed with color-coded structure preview
4. Quick buttons (`+iat`, `+exp`) modify payload with timestamp claims

### Sample JWT

The sample token (`SAMPLE_JWT` in `jwt.ts`) is the standard jwt.io example:
- Header: `{"alg":"HS256","typ":"JWT"}`
- Payload: `{"sub":"1234567890","name":"John Doe","iat":1516239022}`
- Secret: `"secret"`

### Currently Supported

- **Encoding:** Only HS256 (HMAC-SHA256) algorithm for token creation
- **Verification:** Only HS256 (HMAC-SHA256) signatures are verified
- Other algorithms (RS256, ES256, etc.) will show "not supported" in the UI
