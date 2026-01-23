import { Metadata } from "next";
import JWTEncoder from "../components/JWTEncoder";

export const metadata: Metadata = {
  title: "JWT Encoder | Create JSON Web Tokens",
  description:
    "Create and sign JWT tokens with custom header and payload. Client-side encoding using HMAC-SHA256.",
  keywords: ["JWT", "JSON Web Token", "encoder", "generator", "authentication"],
};

export default function EncodePage() {
  return <JWTEncoder />;
}
