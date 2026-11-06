import { describe, expect, it } from 'vitest';
import { HttpConfigError, isLoopbackHost, resolveHttpConfig } from './http.js';

describe('HTTP startup guard', () => {
  it('defaults to 127.0.0.1:8787 with localhost validation', () => {
    expect(resolveHttpConfig({})).toEqual({
      host: '127.0.0.1',
      port: 8787,
      loopback: true,
      allowedHosts: [],
      allowedOrigins: [],
    });
  });

  it('accepts other loopback hosts without an opt-in', () => {
    expect(resolveHttpConfig({ OPENBRIDGE_MCP_HOST: 'localhost' }).loopback).toBe(true);
    expect(resolveHttpConfig({ OPENBRIDGE_MCP_HOST: '::1' }).loopback).toBe(true);
    expect(isLoopbackHost('127.0.0.2')).toBe(true);
    expect(isLoopbackHost('10.0.0.1')).toBe(false);
  });

  it('refuses a non-loopback bind without OPENBRIDGE_MCP_ALLOW_REMOTE=1', () => {
    expect(() => resolveHttpConfig({ OPENBRIDGE_MCP_HOST: '0.0.0.0' })).toThrow(HttpConfigError);
    expect(() =>
      resolveHttpConfig({ OPENBRIDGE_MCP_HOST: '0.0.0.0', OPENBRIDGE_MCP_ALLOW_REMOTE: 'true' }),
    ).toThrow(/OPENBRIDGE_MCP_ALLOW_REMOTE=1/);
  });

  it('refuses a remote bind without an allowed-hosts list', () => {
    expect(() =>
      resolveHttpConfig({ OPENBRIDGE_MCP_HOST: '0.0.0.0', OPENBRIDGE_MCP_ALLOW_REMOTE: '1' }),
    ).toThrow(/OPENBRIDGE_MCP_ALLOWED_HOSTS/);
  });

  it('allows a remote bind with the opt-in and an allowed-hosts list', () => {
    const c = resolveHttpConfig({
      OPENBRIDGE_MCP_HOST: '0.0.0.0',
      OPENBRIDGE_MCP_ALLOW_REMOTE: '1',
      OPENBRIDGE_MCP_ALLOWED_HOSTS: 'mcp.example.org, localhost',
    });
    expect(c).toMatchObject({
      loopback: false,
      allowedHosts: ['mcp.example.org', 'localhost'],
      allowedOrigins: ['mcp.example.org', 'localhost'],
    });
  });

  it('rejects an invalid port', () => {
    expect(() => resolveHttpConfig({ OPENBRIDGE_MCP_PORT: '0' })).toThrow(HttpConfigError);
    expect(() => resolveHttpConfig({ OPENBRIDGE_MCP_PORT: 'abc' })).toThrow(HttpConfigError);
  });
});
