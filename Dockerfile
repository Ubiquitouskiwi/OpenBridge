# Builds the OpenBridge web app from source into a small, non-root static image.
#
#   docker build -t openbridge .
#   docker run --rm -p 127.0.0.1:8080:8080 openbridge
#
# Released images are attached to GitHub Releases as tarballs (docker load); see
# docs/RELEASING.md. The container listens on 8080; keep it published to loopback and put an
# HTTPS reverse proxy in front for public use.

ARG NODE_VERSION=24

FROM node:${NODE_VERSION}-alpine AS build
WORKDIR /src
# Install from the lockfile first so dependency layers cache between source changes.
COPY package.json package-lock.json ./
COPY packages/shared/package.json packages/shared/
COPY packages/eligibility-engine/package.json packages/eligibility-engine/
COPY packages/form-assembly/package.json packages/form-assembly/
COPY packages/web-app/package.json packages/web-app/
COPY packages/mcp-server/package.json packages/mcp-server/
COPY packages/rule-toolkit/package.json packages/rule-toolkit/
RUN npm ci --ignore-scripts --no-audit --no-fund
COPY . .
RUN npx turbo run build --filter=@openbridge/web-app

FROM nginxinc/nginx-unprivileged:1.30-alpine

ARG VERSION=dev
ARG REVISION=unknown
LABEL org.opencontainers.image.title="OpenBridge" \
      org.opencontainers.image.description="Privacy-first benefits screener. Static site; no personal data reaches the server." \
      org.opencontainers.image.version="${VERSION}" \
      org.opencontainers.image.revision="${REVISION}" \
      org.opencontainers.image.licenses="AGPL-3.0-only" \
      org.opencontainers.image.vendor="StarlingTek, LLC"

COPY packaging/hosted/docker/default.conf /etc/nginx/conf.d/default.conf
COPY --from=build /src/packages/web-app/dist/ /usr/share/nginx/html/

EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -q --spider http://127.0.0.1:8080/healthz || exit 1
