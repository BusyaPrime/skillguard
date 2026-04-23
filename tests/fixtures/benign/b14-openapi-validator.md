# OpenAPI Validator

Helper for validating OpenAPI 3.1 schemas in CI.

## Install

```bash
npm install --save-dev @apidevtools/swagger-cli
```

## Validate

```bash
swagger-cli validate ./openapi.yaml
```

## Lint with spectral

```bash
npm install --save-dev @stoplight/spectral-cli
spectral lint ./openapi.yaml
```

## Naming conventions

Teams follow the project's instructions in `api-style.md` for:
- path casing (kebab-case)
- operation IDs (camelCase)
- response schema names (PascalCase)

## Breaking changes

Before merging:
1. Run `oasdiff` against the last release
2. Flag any removed paths or required fields
3. Bump the major version if the change is breaking

## Generating clients

```bash
openapi-generator-cli generate -i openapi.yaml -g typescript-fetch -o ./clients/ts
```

## Mock servers

Use `prism` to run a mock server from the schema during frontend development.
