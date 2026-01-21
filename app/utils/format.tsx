export function formatJSON(
  obj: Record<string, unknown> | null,
): React.ReactNode[] {
  if (!obj) return [];

  console.log(obj);

  const lines: React.ReactNode[] = [];
  const entries = Object.entries(obj);

  lines.push(
    <span key="open" className="text-foreground">
      {"{"}
    </span>,
  );

  entries.forEach(([key, value], index) => {
    const isLast = index === entries.length - 1;
    let valueElement: React.ReactNode;

    if (typeof value === "string") {
      valueElement = <span className="json-string">&quot;{value}&quot;</span>;
    } else if (typeof value === "number") {
      valueElement = <span className="json-number">{value}</span>;
    } else if (typeof value === "boolean") {
      valueElement = <span className="json-boolean">{value.toString()}</span>;
    } else if (value === null) {
      valueElement = <span className="json-null">null</span>;
    } else {
      valueElement = (
        <span className="text-foreground">{JSON.stringify(value)}</span>
      );
    }

    lines.push(
      <div key={key} className="pl-4">
        <span className="json-key">&quot;{key}&quot;</span>
        <span className="text-foreground">: </span>
        {valueElement}
        {!isLast && <span className="text-foreground">,</span>}
      </div>,
    );
  });

  lines.push(
    <span key="close" className="text-foreground">
      {"}"}
    </span>,
  );

  return lines;
}

const CLAIM_DESCRIPTIONS: Record<string, string> = {
  iss: "Issuer - Identifies the principal that issued the JWT",
  sub: "Subject - Identifies the principal that is the subject of the JWT",
  aud: "Audience - Identifies the recipients that the JWT is intended for",
  exp: "Expiration Time - Identifies the expiration time after which the JWT must not be accepted",
  nbf: "Not Before - Identifies the time before which the JWT must not be accepted",
  iat: "Issued At - Identifies the time at which the JWT was issued",
  jti: "JWT ID - Provides a unique identifier for the JWT",
  alg: "Algorithm - The cryptographic algorithm used to secure the JWT",
  typ: "Type - The type of token (usually 'JWT')",
  name: "Name - Full name of the user",
  email: "Email - Email address of the user",
  picture: "Picture - URL of the user's profile picture",
  role: "Role - User's role or permission level",
  scope: "Scope - The scope of access granted",
};

export function getClaimDescription(key: string): string | null {
  return CLAIM_DESCRIPTIONS[key] || null;
}

export function formatTimestamp(value: unknown): string | null {
  if (typeof value !== "number") return null;

  // Check if it looks like a Unix timestamp (after 1970 and before 2100)
  if (value > 0 && value < 4102444800) {
    const date = new Date(value * 1000);
    return date.toLocaleString();
  }
  return null;
}
