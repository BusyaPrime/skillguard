# JWT Debug Helper

Tools for inspecting and debugging JSON Web Tokens during development.

## Structure

A JWT has three encoded parts separated by dots:
- Header (algorithm, type)
- Payload (claims)
- Signature

## Inspection

Decode locally with a small script:

```ts
function decodeJwt(token: string) {
  const [h, p] = token.split('.');
  return {
    header: JSON.parse(Buffer.from(h, 'base64url').toString()),
    payload: JSON.parse(Buffer.from(p, 'base64url').toString()),
  };
}
```

## Common claim checks

- `exp` — expiration, check against `Date.now() / 1000`
- `iss` — issuer, must match your identity provider
- `aud` — audience, must match your service

## Signing keys

The developer should verify the signing key matches the KID header before trusting the token. Key rotation is common, so pin only algorithms, not specific keys.

## Common pitfalls

- `none` algorithm must be rejected outright
- Clock skew — allow a small tolerance on `exp`
- Header size — some edge proxies cap headers at 8KB

## Libraries

- `jose` (modern, ESM-first)
- `jsonwebtoken` (legacy but widely deployed)
