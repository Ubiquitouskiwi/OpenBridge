---
inclusion: always
---

# Technology stack

Use what is already here. Do not introduce a parallel library for something the stack already
covers (a second state manager, a second test runner, a CSS framework, a date library).

| Concern       | Choice                            | Notes                                                                                            |
| ------------- | --------------------------------- | ------------------------------------------------------------------------------------------------ |
| Language      | TypeScript (strict)               | `tsconfig.base.json`: `strict`, `noUncheckedIndexedAccess`, ES2019 target                        |
| Runtime       | Node 24 LTS for tooling           | `.nvmrc`; browsers: last 2 versions plus older library browsers                                  |
| Monorepo      | npm workspaces + Turborepo        | `turbo.json` tasks: build, typecheck, test, lint                                                 |
| UI            | React 18 + Vite 8                 | PWA via `vite-plugin-pwa` (Workbox); `--mode standalone` builds the single-file offline download |
| Routing       | react-router-dom 7                | Routes in `packages/web-app/src/router.tsx` (hash router in the standalone build)                |
| State         | Zustand                           | Memory-only stores in `packages/web-app/src/store/`                                              |
| Validation    | Zod 4                             | At the intake boundary, adapter validation, and MCP tool inputs                                  |
| i18n          | i18next + react-i18next           | Locales in `packages/web-app/src/i18n/locales/{en,es}/`                                          |
| PDF           | @react-pdf/renderer               | In `packages/form-assembly`                                                                      |
| Crypto        | WebCrypto                         | PBKDF2 (SHA-256, 310k iterations) + AES-GCM; no crypto libraries                                 |
| Unit tests    | Vitest                            | Colocated `*.test.ts(x)`                                                                         |
| E2E / a11y    | Playwright + @axe-core/playwright | `packages/web-app/e2e/`                                                                          |
| Lint / format | ESLint 9 flat config + Prettier   | `eslint.config.js`, `.prettierrc.json`                                                           |
| Hosting       | Static files on any HTTPS host    | `packaging/hosted/` (Docker, nginx, Caddy, serve.mjs); reference AWS CDK in `infra/`             |
| AI agents     | MCP TypeScript SDK v2             | `packages/mcp-server`; spec 2026-07-28; stdio + loopback Streamable HTTP                         |

## Constraints

- **Bundle budget:** initial JS at most 250 KB gzipped. Check `packages/web-app/dist/assets` after
  a build when adding UI code or dependencies.
- **Performance:** interactive in under 5 seconds on a throttled mid-range Android device.
- **Offline:** every core flow works offline after first load.
- **Money:** integer cents everywhere (`packages/shared/src/money.ts`). Never use floats for money.
- **Dates:** helpers in `packages/shared/src/date.ts`; the evaluation date is always an input.
- **Dependencies:** prefer zero new dependencies. If one is truly needed, it must be well
  maintained, permissively licensed (compatible with AGPL-3.0), justified in the PR, and approved
  by a maintainer first. Keep the lockfile committed; install with `npm ci`.
