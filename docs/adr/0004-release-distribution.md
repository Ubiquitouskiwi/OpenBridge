# ADR-0004: Release distribution

- **Status:** Proposed
- **Date:** 2026-11-06
- **Deciders:** Project lead
- **Related:** Q32/Q35 (hosting and self-hosting), ADR-0003, `docs/RELEASING.md`

## Context

OpenBridge should be usable by three kinds of people: organizations that host it for the public,
individuals who want to run it on their own computer without hosting anything, and operators who
deploy with containers. Building from source is a barrier for all of them. A normal Vite build
also cannot run by double-clicking `index.html`, because browsers block separate JavaScript module
files on pages opened from disk.

## Decision

- A manually triggered GitHub Actions workflow (`.github/workflows/release.yml`) builds every
  release from a commit that passes the full gate (`npm run verify` and `npm run e2e`).
- Each GitHub Release carries:
  - **Hosted** (`.tar.gz`): the static site plus `Dockerfile`, `compose.yaml`, nginx and Caddy
    examples with matching security headers, and a dependency-free `serve.mjs` that binds loopback
    by default.
  - **Local** (`.zip`): a single self-contained `OpenBridge.html` (Vite `--mode standalone`, an
    in-repo inlining plugin, hash routing, no service worker) that opens from disk, offline.
  - **Container images** for linux/amd64 and linux/arm64 as `docker load` tarballs.
  - `SHA256SUMS.txt`, and `BUILD-INFO.json` inside each download with the rules data version and
    every state's review status.
- Nothing is published to a package or container registry. Releases default to draft and
  pre-release while adapters are unverified.

## Options considered

1. **Source only.** No work, but excludes non-developers entirely.
2. **Publish to registries (npm, GHCR).** Convenient for operators, but a public registry listing
   implies more maturity than an unverified prototype has, and adds credentials to manage. Deferred.
3. **Release downloads on GitHub (chosen).** One place, checksummed, no extra credentials, and the
   same artifacts serve hosts, individuals, and container users.

## Consequences

- The single-file build bundles everything (about 600 KB gzipped) and has no offline service
  worker; it works offline because it is one local file. The CI gate does not yet open it from
  disk; that was verified manually and should become an automated check.
- Security headers live in four files (`serve.mjs`, `nginx.conf`, `Caddyfile`,
  `docker/default.conf`) and must be kept identical.
- Revisit registry publishing when adapters are verified and the project has a release owner.
