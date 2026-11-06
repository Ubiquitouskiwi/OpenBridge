# Making a release

This page is a short guide for maintainers who cut an OpenBridge release. The source of truth is
[`docs/RELEASING.md`]({{repo}}/blob/HEAD/docs/RELEASING.md); if this page and that file disagree,
the file wins.

Releases are built by GitHub Actions with one button. Nothing goes to a package or container
registry: every download is attached to the GitHub Release itself.

## Before you start

- `mainline` is green in CI.
- `CHANGELOG.md` lists the changes under `## [Unreleased]`.
- You have permission to run workflows in the repository.

## Steps

1. Move the `Unreleased` entries in `CHANGELOG.md` under a new heading
   `## [<version>] - <YYYY-MM-DD>`, and merge that change.
2. On GitHub, open **Actions**, then **Release**, then **Run workflow**.
3. Enter the version, for example `0.2.0`. It must be semantic (`1.2.3` or `1.2.3-beta.1`) and not
   already tagged, or the workflow stops.
4. Leave **pre-release** on while any state adapter is `draft` (today, all of them are).
5. Leave **draft** on so you can check the release before it goes public.
6. Wait for the workflow. It runs `npm run verify` and `npm run e2e`, builds the hosted and local
   versions, builds amd64 and arm64 container images, writes checksums, and creates release
   `v<version>`.
7. Open the draft release, check the notes and files, and press **Publish**.

## What a release contains

| Download                                                                   | For                                                                                                                  |
| -------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `openbridge-local-v<version>.zip`                                          | One person on one computer: unzip and open `OpenBridge.html`                                                         |
| `openbridge-hosted-v<version>.tar.gz`                                      | Organizations hosting it: the static site plus Dockerfile, `compose.yaml`, nginx and Caddy examples, and `serve.mjs` |
| `openbridge-image-v<version>-linux-amd64.tar.gz` and `-linux-arm64.tar.gz` | Hosts who use containers                                                                                             |
| `SHA256SUMS.txt`                                                           | Checksums for every file                                                                                             |

Each download includes `BUILD-INFO.json` with the version, the rules `dataVersion`, the review
status of each state adapter, and the commit it was built from.

## Building the downloads yourself

```bash
npm ci
npm run build
npm run build:local -w @openbridge/web-app
npm run release:package -- --version 0.2.0   # writes release-artifacts/
```

## Versioning

- Semantic Versioning. Before 1.0, a minor version may include breaking changes.
- A release that only changes reference data (rule values, federal tables, test cases) bumps the
  patch version. See [[Yearly data updates|Yearly-Data-Updates]].
- Keep releases marked pre-release until experts have signed off the adapters in
  [`docs/SME_SIGNOFF.md`]({{repo}}/blob/HEAD/docs/SME_SIGNOFF.md).

## Related pages

- [[Host it for others|Host-OpenBridge]]
- [[Run it on your computer|Run-OpenBridge-on-Your-Computer]]
- [[Yearly data updates|Yearly-Data-Updates]]
- [[Architecture|Architecture]]
