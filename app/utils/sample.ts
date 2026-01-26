/**
 * Sample JWT and keys for testing.
 * WARNING: These are NOT for production use!
 */

/**
 * Supported JWT signing algorithms
 */
export type SupportedAlgorithm = "HS256" | "RS256" | "ES256";

export const SUPPORTED_ALGORITHMS: SupportedAlgorithm[] = [
  "HS256",
  "RS256",
  "ES256",
];

/**
 * Algorithm metadata for UI display
 */
export const ALGORITHM_INFO: Record<
  SupportedAlgorithm,
  { name: string; description: string; keyType: "symmetric" | "asymmetric" }
> = {
  HS256: {
    name: "HMAC with SHA-256",
    description: "Symmetric algorithm using a shared secret",
    keyType: "symmetric",
  },
  RS256: {
    name: "RSA with SHA-256",
    description: "Asymmetric algorithm using RSA public/private key pair",
    keyType: "asymmetric",
  },
  ES256: {
    name: "ECDSA with SHA-256",
    description: "Asymmetric algorithm using Elliptic Curve (P-256) key pair",
    keyType: "asymmetric",
  },
};

/**
 * Sample JWT token (standard jwt.io example)
 * Header: {"alg":"HS256","typ":"JWT"}
 * Payload: {"sub":"1234567890","name":"John Doe","iat":1516239022}
 * Secret: "secret"
 */
export const SAMPLE_JWT =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c";

/**
 * Sample RSA key pair for RS256 signing and verification (NOT for production)
 */
export const SAMPLE_RSA_PUBLIC_KEY = `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAtTinFk85PeBC+c0vNG/K
R3T8PITlKwu6na1C/kfGDJTYalLoWDfRh1Os62ROjV0bxbtNavqq0KcPYWzGF49g
CCBTnb2ENf721d+GcAxXHzb3fggwP30lqPojOCzHLgBwq2uYCXHpM12mWIqc05Z6
f2SQLKEwT0usfKLi7vETgGQT/cNgEgmJgYtkEifW8AkSncDDPgEMoiMcxvgXIp22
OEr0hSF9bs0edKcu7Rdrc3dA+hYjBTwOvD/ZWOFLuFrxNtkQqZdpBMjIM4V2acQ0
oA5M70RICokhc79xywUqmy8HHCbDVlvkkyqBxElGrOgHN+nit6d1pLlBgplqB5DE
RQIDAQAB
-----END PUBLIC KEY-----`;

export const SAMPLE_RSA_PRIVATE_KEY = `-----BEGIN PRIVATE KEY-----
MIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC1OKcWTzk94EL5
zS80b8pHdPw8hOUrC7qdrUL+R8YMlNhqUuhYN9GHU6zrZE6NXRvFu01q+qrQpw9h
bMYXj2AIIFOdvYQ1/vbV34ZwDFcfNvd+CDA/fSWo+iM4LMcuAHCra5gJcekzXaZY
ipzTlnp/ZJAsoTBPS6x8ouLu8ROAZBP9w2ASCYmBi2QSJ9bwCRKdwMM+AQyiIxzG
+BcinbY4SvSFIX1uzR50py7tF2tzd0D6FiMFPA68P9lY4Uu4WvE22RCpl2kEyMgz
hXZpxDSgDkzvREgKiSFzv3HLBSqbLwccJsNWW+STKoHESUas6Ac36eK3p3WkuUGC
mWoHkMRFAgMBAAECggEABde2rpCE60RRLQK7Cr98Mev8TNFWL3gqiY/wFBFUD0yV
N8QTMNCpwely+4Af/yaAqtqsRgpLaWtEGjaKok59MbkTwZgtI/qoAU1+qU5pWKl9
JcIkfjZ0cMcrgJXg/yV8OC7jubPUemRpF+H2k6CYGjDz9HpE2amgp8BQp+meHIp1
+bNdIBdbGpKE9VXGY2eX2St4isRLLnGpMoOXf54uzqf2DgDGsGEpavsRhxX3sOZd
LNGD5J8OrcSj2CdmWMWNF6F6CRpPH7dsff/5pA1CH6Vgy120zR6JpqP+ZzfQ9GtH
PUsFhTvci8J/08MOf/sk3i1DElsSU7bt0llGadm12QKBgQDcwD8z5Oi8BsMWH+rQ
tjsTzAxzW20U1OVvwv2YhB29zJpaB9vugLJYpMkabWZgmuC+wsHb3MM3CgZbuym/
jUIC5DAF0HRBCkebmy/0lTIXcGtT4XKSGL/i+ud8CNCay/UU9bKVYU6QxG68r8iT
+VN5bQu/SpxFuIOQeX4NUWEZnwKBgQDSKIfq0RHw7mWwlkNLIIqTirDj0KysqJ0U
RRk4Cf+Bxwf2J3i3ayiHTyeBVDdm5vmTMlWpbOZ8rcSH3/owTzLoXTRyjemiihmZ
RXxWa4W36sxSzIK2EhQG1rIYv262jT1IZPTInx7Zb0/DORUcHOsWZW8muCUITCT2
llulONQfmwKBgAHpyKJygXHfvSEb9bUJX0m0owb8690aW0K0te30dy2F8HCHUOio
RONvyi5odFKyBPCiT3vQVgDMHXH+FUaLut67i48BV4CYzjYTCj9ca6q4VrXLZmrN
vBwDgK4ahXRSADXGS13wEfY/PZZ1D4/4wTh0MX3e76vLBZji9Ky439aRAoGBALgM
nPPtw2ugLNiY0DhUOGh8Vuw9DWxsgpyE41ArmWPbncJa0SK5KxZNIQjna1moQLxD
obeuUrCwMeTZJ6/1PF05ezwzwoABt+d+biT1J3dpnyWIS5UOghF3JyP7Swd+7EOh
fqrQh+De1hjfvfgP72Z+0Pg03uHEZb668WniOguvAoGBANjBM9f5S1lvfUc1dUMV
jNkfgROC/xyjTPuDY2pJF/Fxg2vIZjkNs+2qi3QPnEjkE16U1UNdc1jDjg2A8wft
MuCGmt4PZgUInjStvmUX+Oc6oWlTT8ZmU3Hh8AQBD+c12vEWbCbuJ9jKjxkY6oSI
D8WtTPEVyX8/0Ci2idMPGTJc
-----END PRIVATE KEY-----`;

/**
 * Sample EC key pair for ES256 signing and verification (NOT for production)
 */
export const SAMPLE_EC_PUBLIC_KEY = `-----BEGIN PUBLIC KEY-----
MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEC325RipZ/N6RHypAP4jESkTzCtIh
8bxg2hcyFX6pEZw8k5pyOtSi+y8ifIDMZT2WYFIq1LhBEO45fI6Lt17iTg==
-----END PUBLIC KEY-----`;

export const SAMPLE_EC_PRIVATE_KEY = `-----BEGIN PRIVATE KEY-----
MIGHAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBG0wawIBAQQgXRPg0inHQmySslZQ
4RB13v+rIMkGPxahRiLt6I5t1mihRANCAAQLfblGKln83pEfKkA/iMRKRPMK0iHx
vGDaFzIVfqkRnDyTmnI61KL7LyJ8gMxlPZZgUirUuEEQ7jl8jou3XuJO
-----END PRIVATE KEY-----`;
