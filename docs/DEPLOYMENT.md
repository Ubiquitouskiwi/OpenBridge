# Deployment

OpenBridge Phase 1 is a static PWA. It can be run from the primary hosted instance or self-hosted by
any organization (AGPL-3.0). There is no backend and no server-side personal data (Q32/Q35).

## Architecture

- Private, encrypted **S3** bucket (no public access) holds the built site.
- **CloudFront** serves it over HTTPS with Origin Access Control and SPA rewrites (403/404 → the app
  shell so client-side routes resolve).
- **No user analytics.** CloudFront and S3 emit infrastructure metrics to CloudWatch natively; we add
  no custom analytics and collect no personal data.

Infrastructure is defined with AWS CDK in `infra/`.

## Hosted deploy (maintainers)

Prerequisites: an AWS account you control, CDK bootstrapped in the target account/region, and a
GitHub OIDC role.

```bash
# 1) Build the web app (produces packages/web-app/dist)
npm ci && npm run build

# 2) Deploy the infrastructure
cd infra
npm install
npx cdk bootstrap        # first time only, per account/region
npx cdk deploy
```

CDK outputs the CloudFront domain (`DistributionDomainName`) and the bucket name.

### CI/CD

`.github/workflows/deploy.yml` deploys on pushes to `mainline`. It is **skipped unless** the repository
has an `AWS_DEPLOY_ROLE_ARN` secret (an IAM role trusted for GitHub OIDC). Optionally set an
`AWS_REGION` repo variable (defaults to `us-west-2`). The workflow builds the app, installs infra
deps, assumes the role via OIDC, and runs `cdk deploy`.

> Deploying changes live infrastructure. Review `npx cdk diff` before deploying, and never disable
> the bucket's public-access block or SSL enforcement.

## Self-hosting (community organizations)

Because the app is static and AGPL-3.0, any org can host it:

1. `npm ci && npm run build`
2. Serve `packages/web-app/dist/` from any static host or CDN over HTTPS, with SPA fallback (serve
   `index.html` for unknown routes).
3. Optionally drop a `deployment-config.json` at the site root to override defaults:

```json
{
  "orgName": "Example Food Bank",
  "defaultMode": "navigator",
  "autoClearTimeoutSeconds": 300,
  "localResources": [{ "label": "Our benefits desk", "url": "https://example.org/help" }]
}
```

The app loads this file at startup if present (failures are ignored). A sample lives at
`packages/web-app/public/deployment-config.json`.

> Only `defaultMode` and `autoClearTimeoutSeconds` change behavior today, and the file is applied
> only when **both** are present. `orgName`, `contact`, and `localResources` are accepted but not
> shown in the app yet (tracked in `ROADMAP.md`).

## Verifying a build locally

```bash
npm run build
npm run preview -w @openbridge/web-app   # serves the production build
```

> Note: reference data values are illustrative and adapters are `draft` pending SME sign-off (see
> `docs/SME_SIGNOFF.md`). Do not present results as authoritative until verified.

## Ready-made downloads and containers

Most organizations do not need to build from source. Each GitHub Release includes a hosted
download (static site plus `Dockerfile`, `compose.yaml`, nginx and Caddy examples, and a
no-dependency `serve.mjs`), a single-file local download, and prebuilt container images. See
[RELEASING.md](./RELEASING.md) and the hosting guide inside the download
(`packaging/hosted/README.md` in this repository).

To build the container image from source:

```bash
docker build -t openbridge .
docker run --rm -p 127.0.0.1:8080:8080 openbridge
```

The image runs nginx as a non-root user on port 8080, keeps no access log, serves `/healthz`, and
sends the same security headers as the examples. Publish it to `127.0.0.1` and put an HTTPS reverse
proxy in front for public use.
