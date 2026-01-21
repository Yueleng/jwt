/**
 * Recursively formats a JSON value with syntax highlighting.
 * Handles nested objects, arrays, and all primitive types.
 */
export function formatJSON(
  value: unknown,
  depth: number = 0,
  keyPrefix: string = "root",
): React.ReactNode {
  // Handle null
  if (value === null) {
    return <span className="json-null">null</span>;
  }

  // Handle primitives
  if (typeof value === "string") {
    return <span className="json-string">&quot;{value}&quot;</span>;
  }

  if (typeof value === "number") {
    return <span className="json-number">{value}</span>;
  }

  if (typeof value === "boolean") {
    return <span className="json-boolean">{value.toString()}</span>;
  }

  // Handle arrays
  if (Array.isArray(value)) {
    if (value.length === 0) {
      return <span className="text-foreground">[]</span>;
    }

    return (
      <span>
        <span className="text-foreground">[</span>
        {value.map((item, index) => (
          <div key={`${keyPrefix}-${index}`} style={{ paddingLeft: "1rem" }}>
            {formatJSON(item, depth + 1, `${keyPrefix}-${index}`)}
            {index < value.length - 1 && (
              <span className="text-foreground">,</span>
            )}
          </div>
        ))}
        <span className="text-foreground">]</span>
      </span>
    );
  }

  // Handle objects
  if (typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>);

    // Empty objects render as inline "{}"
    if (entries.length === 0) {
      return <span className="text-foreground">{"{}"}</span>;
    }

    /**
     * Object Rendering Structure:
     *
     * {                              <- Opening brace (no indentation)
     *   "key": value,                <- Each key-value pair in its own <div>
     *   "nested": {                  <- Nested objects/arrays are rendered recursively
     *     "inner": "value"           <- Each level adds more padding via CSS
     *   }
     * }                              <- Closing brace (no indentation)
     *
     * INDENTATION STRATEGY:
     * - We use CSS `paddingLeft: "1rem"` on each <div> to create visual indentation
     * - Since each nested level creates its own <div> with padding, the indentation
     *   accumulates naturally (1rem -> 2rem -> 3rem as we go deeper)
     * - This is simpler than calculating string-based indentation with spaces
     *
     * REACT KEYS:
     * - `keyPrefix` ensures unique keys across the entire tree
     * - e.g., "root-user-roles-0" for the first role in user.roles array
     * - This prevents React key collisions when the same key name appears at different depths
     */
    return (
      <span>
        {/* Opening brace */}
        <span className="text-foreground">{"{"}</span>

        {/* Iterate over each key-value pair */}
        {entries.map(([key, val], index) => (
          // Each entry gets its own line with 1rem left padding for indentation
          <div key={`${keyPrefix}-${key}`} style={{ paddingLeft: "1rem" }}>
            {/* Key with quotes and syntax highlighting */}
            <span className="json-key">&quot;{key}&quot;</span>
            <span className="text-foreground">: </span>

            {/* RECURSIVE CALL: Format the value, incrementing depth and extending keyPrefix */}
            {formatJSON(val, depth + 1, `${keyPrefix}-${key}`)}

            {/* Add comma after all entries except the last one */}
            {index < entries.length - 1 && (
              <span className="text-foreground">,</span>
            )}
          </div>
        ))}

        {/* Closing brace (aligned with parent, not indented) */}
        <span className="text-foreground">{"}"}</span>
      </span>
    );
  }

  // Fallback for unknown types
  return <span className="text-foreground">{String(value)}</span>;
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
