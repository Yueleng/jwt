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
│   │   ├── jwt.ts            # JWT encoding/decoding and verification functions
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
const result = await verifyJWTSignature(token, "-----BEGIN PUBLIC KEY-----\n...");

// ES256 - with EC public key (PEM format)
const result = await verifyJWTSignature(token, "-----BEGIN PUBLIC KEY-----\n...");

// Returns: { verified: boolean, error?: string, algorithm?: string }
```

### `encodeJWT(header: object, payload: object, key: string): Promise<EncodeResult>`

Creates and signs a JWT token with the specified algorithm.

```typescript
// HS256 - with secret
const result = await encodeJWT(
  { alg: "HS256", typ: "JWT" },
  { sub: "1234567890", name: "John Doe" },
  "your-secret"
);

// RS256 - with RSA private key (PEM format)
const result = await encodeJWT(
  { alg: "RS256", typ: "JWT" },
  { sub: "1234567890", name: "John Doe" },
  "-----BEGIN PRIVATE KEY-----\n..."
);

// ES256 - with EC private key (PEM format)
const result = await encodeJWT(
  { alg: "ES256", typ: "JWT" },
  { sub: "1234567890", name: "John Doe" },
  "-----BEGIN PRIVATE KEY-----\n..."
);

// Returns: { token: string, error?: string }
```

## Supported Algorithms

| Algorithm            | Support          | Key Type       |
| -------------------- | ---------------- | -------------- |
| HS256 (HMAC-SHA256)  | ✅ Supported     | Symmetric      |
| RS256 (RSA-SHA256)   | ✅ Supported     | Asymmetric     |
| ES256 (ECDSA-SHA256) | ✅ Supported     | Asymmetric     |

## License

MIT

## Acknowledgments

Inspired by [jwt.io](https://jwt.io) - the industry standard JWT debugger.
