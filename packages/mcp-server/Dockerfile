# OpenBridge MCP server (Streamable HTTP), optional hosting artifact.
#
# Build from the REPO ROOT (the package needs the workspace, data/, and the English locale):
#   docker build -f packages/mcp-server/Dockerfile -t openbridge-mcp .
# Run, publishing to loopback ONLY:
#   docker run --rm -p 127.0.0.1:8787:8787 openbridge-mcp
#
# Inside the container the server binds 0.0.0.0 (so Docker can forward to it) with the explicit
# OPENBRIDGE_MCP_ALLOW_REMOTE=1 opt-in and a Host allowlist. Exposing it beyond this machine is
# the operator's decision and needs a TLS reverse proxy (plus standard auth for a restricted
# audience). There is no built-in authentication.

# ---- build stage ----------------------------------------------------------------------------
FROM node:24-slim AS build
WORKDIR /repo

# Manifests first, so dependency layers cache. Every workspace manifest is needed for npm ci.
COPY package.json package-lock.json tsconfig.base.json ./
COPY packages/shared/package.json packages/shared/
COPY packages/eligibility-engine/package.json packages/eligibility-engine/
COPY packages/form-assembly/package.json packages/form-assembly/
COPY packages/web-app/package.json packages/web-app/
COPY packages/mcp-server/package.json packages/mcp-server/
COPY packages/rule-toolkit/package.json packages/rule-toolkit/
RUN npm ci --ignore-scripts

COPY packages/shared packages/shared
COPY packages/eligibility-engine packages/eligibility-engine
COPY packages/mcp-server packages/mcp-server
COPY data data
COPY packages/web-app/src/i18n/locales/en packages/web-app/src/i18n/locales/en

RUN npm run build -w @openbridge/shared \
 && npm run build -w @openbridge/eligibility-engine \
 && npm run build -w @openbridge/mcp-server

# Production dependencies only, for the three packages the server needs.
RUN rm -rf node_modules packages/*/node_modules \
 && npm ci --ignore-scripts --omit=dev \
      -w @openbridge/shared -w @openbridge/eligibility-engine -w @openbridge/mcp-server \
 && mkdir -p packages/mcp-server/node_modules

# ---- runtime stage --------------------------------------------------------------------------
FROM node:24-slim AS runtime
ENV NODE_ENV=production \
    OPENBRIDGE_MCP_HOST=0.0.0.0 \
    OPENBRIDGE_MCP_PORT=8787 \
    OPENBRIDGE_MCP_ALLOW_REMOTE=1 \
    OPENBRIDGE_MCP_ALLOWED_HOSTS=localhost,127.0.0.1
WORKDIR /app

COPY --from=build /repo/node_modules node_modules
COPY --from=build /repo/packages/shared/package.json packages/shared/
COPY --from=build /repo/packages/shared/dist packages/shared/dist
COPY --from=build /repo/packages/eligibility-engine/package.json packages/eligibility-engine/
COPY --from=build /repo/packages/eligibility-engine/dist packages/eligibility-engine/dist
COPY --from=build /repo/packages/mcp-server/package.json packages/mcp-server/
COPY --from=build /repo/packages/mcp-server/dist packages/mcp-server/dist
# Package-local dependencies (zod 4 sits here when the root resolves a different major).
COPY --from=build /repo/packages/mcp-server/node_modules packages/mcp-server/node_modules

# Run as the image's unprivileged `node` user, never root.
USER node
EXPOSE 8787
CMD ["node", "packages/mcp-server/dist/cli.js", "--http"]
