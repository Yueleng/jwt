# JWT Decoder

A modern, client-side JSON Web Token (JWT) decoder and inspector built with Next.js, React, and TypeScript. Decode, inspect, and verify JWT tokens instantly in your browser with a beautiful dark-themed interface.

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
- **Real-time Verification** - Debounced verification that updates as you type
- **Visual Indicators** - Clear status badges showing verification state

### User Experience

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
│   │   └── DecodedSection.tsx # Reusable section for header/payload display
│   ├── utils/
│   │   ├── jwt.ts            # JWT decoding and verification functions
│   │   ├── format.tsx        # JSON formatting and claim descriptions
│   │   └── index.ts          # Utility exports
│   ├── globals.css           # Global styles with CSS custom properties
│   ├── layout.tsx            # Root layout
│   └── page.tsx              # Home page
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

### `verifyJWTSignature(token: string, secret: string): Promise<VerificationResult>`

Verifies the signature of an HS256-encoded JWT.

```typescript
const result = await verifyJWTSignature(token, secret);
// Returns: { verified: boolean, error?: string, algorithm?: string }
```

## Supported Algorithms

| Algorithm            | Support          |
| -------------------- | ---------------- |
| HS256 (HMAC-SHA256)  | ✅ Supported     |
| RS256 (RSA-SHA256)   | ❌ Not supported |
| ES256 (ECDSA-SHA256) | ❌ Not supported |

## License

MIT

## Acknowledgments

Inspired by [jwt.io](https://jwt.io) - the industry standard JWT debugger.
