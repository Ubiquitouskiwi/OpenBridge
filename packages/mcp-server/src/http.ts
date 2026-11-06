/**
 * Streamable HTTP entry. Secure by default: binds 127.0.0.1, validates Host and Origin in
 * front of the MCP handler, and refuses a non-loopback bind unless the operator opts in with
 * OPENBRIDGE_MCP_ALLOW_REMOTE=1 plus an explicit OPENBRIDGE_MCP_ALLOWED_HOSTS list.
 *
 * There is deliberately no built-in authentication: this is a public, anonymous calculator.
 * Operators serving a restricted audience must put standard auth in front (for example an
 * authenticating reverse proxy). Never add a home-made token scheme here.
 */
import { createServer, type IncomingMessage, type Server, type ServerResponse } from 'node:http';
import {
  hostHeaderValidation,
  localhostHostValidation,
  localhostOriginValidation,
  originValidation,
  toNodeHandler,
} from '@modelcontextprotocol/node';
import {
  createMcpHandler,
  type McpHttpHandler,
  type McpServer,
} from '@modelcontextprotocol/server';
import type { EnvLike } from './data/loader.js';

export const DEFAULT_HOST = '127.0.0.1';
export const DEFAULT_PORT = 8787;
export const MCP_PATH = '/mcp';
/** 1 MiB: a full household is a few KB; larger bodies are rejected. */
const MAX_REQUEST_BODY_BYTES = 1_048_576;

export class HttpConfigError extends Error {
  override name = 'HttpConfigError';
}

export interface HttpConfig {
  host: string;
  port: number;
  /** False only when the operator opted in to a non-loopback bind. */
  loopback: boolean;
  /** Host-header allowlist for a remote bind (empty for loopback, which uses localhost rules). */
  allowedHosts: string[];
  allowedOrigins: string[];
}

export function isLoopbackHost(host: string): boolean {
  const h = host.trim().toLowerCase();
  return h === 'localhost' || h === '::1' || h === '[::1]' || /^127(\.\d{1,3}){3}$/.test(h);
}

function parseList(value: string | undefined): string[] {
  return (value ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

/** Read and check the HTTP settings. Throws HttpConfigError with an operator-facing message. */
export function resolveHttpConfig(env: EnvLike): HttpConfig {
  const host = (env.OPENBRIDGE_MCP_HOST ?? DEFAULT_HOST).trim() || DEFAULT_HOST;
  const rawPort = env.OPENBRIDGE_MCP_PORT ?? String(DEFAULT_PORT);
  const port = Number(rawPort);
  if (!/^\d+$/.test(rawPort) || port < 1 || port > 65535) {
    throw new HttpConfigError(`OPENBRIDGE_MCP_PORT must be a port number from 1 to 65535.`);
  }
  if (isLoopbackHost(host)) {
    return { host, port, loopback: true, allowedHosts: [], allowedOrigins: [] };
  }
  if (env.OPENBRIDGE_MCP_ALLOW_REMOTE !== '1') {
    throw new HttpConfigError(
      `Refusing to bind ${host}: it is not a loopback address. To serve other machines, set ` +
        'OPENBRIDGE_MCP_ALLOW_REMOTE=1 and OPENBRIDGE_MCP_ALLOWED_HOSTS to the host names ' +
        'clients will use, and put TLS (and auth, if the audience is restricted) in front.',
    );
  }
  const allowedHosts = parseList(env.OPENBRIDGE_MCP_ALLOWED_HOSTS);
  if (allowedHosts.length === 0) {
    throw new HttpConfigError(
      `Refusing to bind ${host}: OPENBRIDGE_MCP_ALLOWED_HOSTS must list the host names ` +
        'clients will use (comma-separated), so the Host header can be checked.',
    );
  }
  const origins = parseList(env.OPENBRIDGE_MCP_ALLOWED_ORIGINS);
  return {
    host,
    port,
    loopback: false,
    allowedHosts,
    allowedOrigins: origins.length > 0 ? origins : allowedHosts,
  };
}

type Guard = (req: IncomingMessage, res: ServerResponse) => boolean;

export interface RunningHttpServer {
  server: Server;
  handler: McpHttpHandler;
  close: () => Promise<void>;
}

function notFound(res: ServerResponse): void {
  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('Not found. The MCP endpoint is /mcp.');
}

/** Start listening. Resolves once bound; never logs request contents. */
export function startHttpServer(
  config: HttpConfig,
  factory: () => McpServer,
): Promise<RunningHttpServer> {
  const handler = createMcpHandler(factory, { maxRequestBodySize: MAX_REQUEST_BODY_BYTES });
  const nodeHandler = toNodeHandler(handler, { maxRequestBodySize: MAX_REQUEST_BODY_BYTES });
  const guards: Guard[] = config.loopback
    ? [localhostHostValidation(), localhostOriginValidation()]
    : [hostHeaderValidation(config.allowedHosts), originValidation(config.allowedOrigins)];

  const server = createServer((req, res) => {
    for (const guard of guards) if (!guard(req, res)) return;
    const path = (req.url ?? '').split('?')[0];
    if (path !== MCP_PATH) return notFound(res);
    void nodeHandler(req, res);
  });

  const close = async (): Promise<void> => {
    await handler.close();
    await new Promise<void>((resolve) => {
      server.close(() => resolve());
      server.closeAllConnections();
    });
  };

  return new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(config.port, config.host, () => {
      server.off('error', reject);
      resolve({ server, handler, close });
    });
  });
}
