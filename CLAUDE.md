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

This is a client-side JWT decoder built with Next.js App Router. All JWT processing happens in the browser - no tokens are ever sent to a server.

### Key Files

| File | Purpose |
|------|---------|
| `app/utils/jwt.ts` | Core JWT decoding and HS256 signature verification using Web Crypto API |
| `app/utils/format.tsx` | Recursive JSON syntax highlighting formatter, claim descriptions, timestamp formatting |
| `app/utils/index.ts` | Re-exports all utilities |
| `app/components/JWTDecoder.tsx` | Main component - manages token state, decoding, and signature verification |
| `app/components/DecodedSection.tsx` | Reusable section for header/payload display with JSON/Claims toggle |
| `app/page.tsx` | Entry point - renders JWTDecoder |
| `app/globals.css` | CSS custom properties for colors, glassmorphic styles, JWT color coding, animations |

### Design System

The app uses CSS custom properties defined in `:root` of `globals.css`:
- `--header-color` (pink) for JWT headers
- `--payload-color` (purple) for JWT payloads
- `--signature-color` (cyan) for JWT signatures
- `--success-color`, `--error-color`, `--muted` for status badges

Components use the `.glass` class for the translucent card effect and `.gradient-text` for the header gradient.

### Data Flow

1. User pastes JWT → `token` state updates
2. `useMemo` triggers `decodeJWT()` → returns `{ header, payload, signature, isValid, error }`
3. Decoded data passed to `DecodedSection` components for display
4. If secret provided, `useEffect` with debounce triggers `verifyJWTSignature()` → updates verification state

### Sample JWT

The sample token (`SAMPLE_JWT` in `jwt.ts`) is the standard jwt.io example:
- Header: `{"alg":"HS256","typ":"JWT"}`
- Payload: `{"sub":"1234567890","name":"John Doe","iat":1516239022}`
- Secret: `"secret"`

### Currently Supported

Only HS256 (HMAC-SHA256) signatures are verified. Other algorithms (RS256, ES256, etc.) will show "not supported" in the UI.
