#!/usr/bin/env node
/**
 * `openbridge-mcp`: stdio by default (for local AI apps), `--http` for Streamable HTTP.
 * Logs only startup and shutdown lines to stderr (stdout carries the stdio protocol).
 * Never logs request contents (privacy-security.md).
 */
import { serveStdio } from '@modelcontextprotocol/server/stdio';
import { loadAssets } from './data/loader.js';
import { MCP_PATH, resolveHttpConfig, startHttpServer } from './http.js';
import { SERVER_VERSION, serverFactory } from './server.js';

function log(line: string): void {
  process.stderr.write(`[openbridge-mcp] ${line}\n`);
}

function onShutdown(close: () => Promise<void>): void {
  let closing = false;
  const stop = (signal: string) => {
    if (closing) return;
    closing = true;
    log(`received ${signal}, shutting down`);
    close().then(
      () => process.exit(0),
      () => process.exit(1),
    );
  };
  process.once('SIGINT', () => stop('SIGINT'));
  process.once('SIGTERM', () => stop('SIGTERM'));
}

async function runHttp(): Promise<void> {
  const config = resolveHttpConfig(process.env);
  const running = await startHttpServer(config, serverFactory(loadAssets()));
  const shown = config.host.includes(':') ? `[${config.host}]` : config.host;
  log(`v${SERVER_VERSION} serving Streamable HTTP at http://${shown}:${config.port}${MCP_PATH}`);
  if (!config.loopback) log('remote bind enabled (OPENBRIDGE_MCP_ALLOW_REMOTE=1)');
  onShutdown(running.close);
}

function runStdio(): void {
  const handle = serveStdio(serverFactory(loadAssets()));
  log(`v${SERVER_VERSION} serving MCP over stdio`);
  onShutdown(() => handle.close());
}

async function main(argv: string[]): Promise<void> {
  if (argv.includes('--help') || argv.includes('-h')) {
    process.stdout.write('Usage: openbridge-mcp [--http]\n  (default: stdio)\n');
    return;
  }
  if (argv.includes('--http')) await runHttp();
  else runStdio();
}

main(process.argv.slice(2)).catch((err: unknown) => {
  // Startup errors only (config or reference data), never request contents.
  log(err instanceof Error ? err.message : 'startup failed');
  process.exit(1);
});
