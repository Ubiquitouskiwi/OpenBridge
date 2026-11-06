/**
 * The McpServer factory shared by the stdio and HTTP entries. Reference data is loaded once
 * by the caller and closed over; each call builds a fresh, stateless server instance.
 */
import { McpServer } from '@modelcontextprotocol/server';
import { SERVER_INSTRUCTIONS } from './copy.js';
import type { LoadedAssets } from './data/loader.js';
import { EnglishRenderer } from './render/english.js';
import type { ToolContext } from './tools/handlers.js';
import { registerOpenBridgeTools } from './tools/register.js';

export const SERVER_NAME = 'openbridge';
export const SERVER_VERSION = '0.1.0';

/**
 * Largest combined count of array elements and object members in one tool call. A full
 * household (30 members x 16 fields, 50 incomes x 6 fields) is about 800; this leaves room
 * while rejecting oversized payloads before validation.
 */
export const MAX_TOOL_INPUT_ELEMENTS = 2_000;

export interface ServerOptions {
  /** Injectable clock for the default evaluation date (tests pass a fixed one). */
  now?: () => Date;
}

export function createToolContext(assets: LoadedAssets, options: ServerOptions = {}): ToolContext {
  return {
    data: assets.data,
    en: new EnglishRenderer(assets.locale),
    now: options.now ?? (() => new Date()),
  };
}

export function createOpenBridgeServer(ctx: ToolContext): McpServer {
  const server = new McpServer(
    { name: SERVER_NAME, version: SERVER_VERSION },
    { instructions: SERVER_INSTRUCTIONS, maxToolInputElements: MAX_TOOL_INPUT_ELEMENTS },
  );
  registerOpenBridgeTools(server, ctx);
  return server;
}

/** A factory suitable for `serveStdio` and `createMcpHandler`. */
export function serverFactory(assets: LoadedAssets, options: ServerOptions = {}): () => McpServer {
  const ctx = createToolContext(assets, options);
  return () => createOpenBridgeServer(ctx);
}
