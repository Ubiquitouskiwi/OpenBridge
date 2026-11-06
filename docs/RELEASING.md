# Releasing OpenBridge

Releases are built and published by GitHub Actions with one button. Nothing is uploaded to a
package or container registry: every download is attached to the GitHub Release itself.

## What a release contains

| Download                                                                   | For                                                      | How people use it                                                                                                                                          |
| -------------------------------------------------------------------------- | -------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `openbridge-local-v<version>.zip`                                          | Anyone who wants to use OpenBridge on their own computer | Unzip, double-click `OpenBridge.html`. Works offline; nothing to install.                                                                                  |
| `openbridge-hosted-v<version>.tar.gz`                                      | Organizations hosting it for others                      | Static `site/` plus `Dockerfile`, `compose.yaml`, nginx and Caddy examples, and `serve.mjs` (no-dependency Node server). See `packaging/hosted/README.md`. |
| `openbridge-image-v<version>-linux-amd64.tar.gz` and `-linux-arm64.tar.gz` | Hosts who use containers                                 | `docker load -i <file>`, then `docker run -p 127.0.0.1:8080:8080 openbridge:<version>`.                                                                    |
| `SHA256SUMS.txt`                                                           | Everyone                                                 | Checksums for every file above.                                                                                                                            |

Each download includes `BUILD-INFO.json` with the version, the rules data version, the review
status of every state adapter, and the commit it was built from.

Planned: a third audience package, the **community rule toolkit** (tools that let policy and
legal experts propose rules and test cases without code). It will be added to this workflow as
another download when it exists. The first piece, the in-app test-case recorder at `/review`, ships
in the app today.

## How to cut a release (maintainers)

1. Make sure `main` is green and `CHANGELOG.md` has the changes under `## [Unreleased]`.
2. Move those entries under a new heading `## [<version>] - <YYYY-MM-DD>` and merge that change.
3. On GitHub: **Actions**, then **Release**, then **Run workflow**. Enter the version (for example
   `0.2.0`). Leave **pre-release** on while any state adapter is `draft`. Leave **draft** on to
   review the release before it goes public.
4. The workflow runs the full gate (`npm run verify` and `npm run e2e`), builds the hosted and local
   versions, builds amd64 and arm64 container images, writes checksums, and creates release
   `v<version>` with every download attached.
5. Open the draft release, check the notes and files, and press **Publish**.

The workflow refuses a version that is not semantic (`1.2.3` or `1.2.3-beta.1`) or that already
has a tag. It needs no secrets: it uses the repository's built-in `GITHUB_TOKEN` with
`contents: write` only in the publish job.

## Building the downloads yourself

```bash
npm ci
npm run build                                # hosted site -> packages/web-app/dist
npm run build:local -w @openbridge/web-app   # single file -> packages/web-app/dist-local/OpenBridge.html
npm run release:package -- --version 0.2.0   # -> release-artifacts/
```

Container image from source (not pushed anywhere):

```bash
docker build --build-arg VERSION=0.2.0 -t openbridge:0.2.0 .
docker run --rm -p 127.0.0.1:8080:8080 openbridge:0.2.0
```

## Versioning

Semantic Versioning. While the project is pre-1.0, minor versions may include breaking changes.
A release that only changes reference data (rule values, federal tables, fixtures) bumps the patch
version and the data's `dataVersion`. Keep releases marked **pre-release** until subject-matter
experts have signed off the adapters (`docs/SME_SIGNOFF.md`).
