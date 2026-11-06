/**
 * End-to-end: a real MCP Client drives the server through the SDK's HTTP handler, first in
 * process (handler.fetch), then over a real 127.0.0.1 listener to check the Host guard.
 */
import { request } from 'node:http';
import type { AddressInfo } from 'node:net';
import { Client, StreamableHTTPClientTransport } from '@modelcontextprotocol/client';
import { createMcpHandler } from '@modelcontextprotocol/server';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { DISCLAIMER } from './copy.js';
import { type RunningHttpServer, startHttpServer } from './http.js';
import { serverFactory } from './server.js';
import { EVAL_DATE, familyHousehold, testAssets } from './testsupport/fixtures.js';

const factory = serverFactory(testAssets());

describe('MCP client end-to-end (in process)', () => {
  const handler = createMcpHandler(factory);
  const client = new Client({ name: 'e2e-test', version: '0.0.0' });

  beforeAll(async () => {
    const transport = new StreamableHTTPClientTransport(new URL('http://localhost/mcp'), {
      fetch: (url, init) => handler.fetch(new Request(url, init)),
    });
    await client.connect(transport);
  });

  afterAll(async () => {
    await client.close();
    await handler.close();
  });

  it('lists the four read-only tools and the prompt, with instructions', async () => {
    const { tools } = await client.listTools();
    expect(tools.map((t) => t.name).sort()).toEqual([
      'explore_income_change',
      'get_program_rules',
      'list_supported_states',
      'screen_household',
    ]);
    for (const t of tools) expect(t.annotations?.readOnlyHint).toBe(true);
    const { prompts } = await client.listPrompts();
    expect(prompts.map((p) => p.name)).toEqual(['screening_guide']);
    expect(client.getInstructions()).toContain('Never ask for or send names');
  });

  it('screens a household and returns text with the disclaimer', async () => {
    const r = await client.callTool({
      name: 'screen_household',
      arguments: { household: familyHousehold(), evaluationDate: EVAL_DATE },
    });
    expect(r.isError).toBeFalsy();
    const first = r.content[0];
    expect(first?.type).toBe('text');
    expect(first?.type === 'text' ? first.text : '').toContain(DISCLAIMER);
  });

  it('rejects invalid input through schema validation', async () => {
    const r = await client.callTool({
      name: 'screen_household',
      arguments: { household: { stateCode: 'OH', members: [], incomeSources: [] } },
    });
    expect(r.isError).toBe(true);
  });
});

describe('HTTP listener guards', () => {
  let running: RunningHttpServer;
  let port: number;

  beforeAll(async () => {
    running = await startHttpServer(
      { host: '127.0.0.1', port: 0, loopback: true, allowedHosts: [], allowedOrigins: [] },
      factory,
    );
    port = (running.server.address() as AddressInfo).port;
  });

  afterAll(async () => {
    await running.close();
  });

  function get(path: string, host: string): Promise<number> {
    return new Promise((resolve, reject) => {
      const req = request({ host: '127.0.0.1', port, path, method: 'GET', headers: { host } });
      req.on('response', (res) => {
        res.resume();
        resolve(res.statusCode ?? 0);
      });
      req.on('error', reject);
      req.end();
    });
  }

  it('binds loopback only', () => {
    expect((running.server.address() as AddressInfo).address).toBe('127.0.0.1');
  });

  it('rejects a foreign Host header with 403 (DNS rebinding guard)', async () => {
    expect(await get('/mcp', 'evil.example.org')).toBe(403);
  });

  it('answers 404 outside /mcp', async () => {
    expect(await get('/other', `127.0.0.1:${port}`)).toBe(404);
  });
});
