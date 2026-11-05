/**
 * Client-side encryption for saved progress and export bundles (requirement 5.5.3, Q20).
 * Passphrase -> PBKDF2 (SHA-256) -> AES-GCM. No key is stored and there is no recovery:
 * a lost passphrase means re-entering data. Produces a self-describing envelope (design §6.2).
 */

export const SAVE_FORMAT = 'openbridge.save.v1';
const PBKDF2_ITERATIONS = 310_000;

export interface SaveEnvelope {
  format: typeof SAVE_FORMAT;
  dataVersion: string;
  kdf: { algo: 'PBKDF2'; hash: 'SHA-256'; iterations: number; salt: string };
  cipher: { algo: 'AES-GCM'; iv: string };
  ciphertext: string;
}

/** WebCrypto's lib types are picky about the ArrayBuffer generic; this narrows safely. */
function src(bytes: Uint8Array): BufferSource {
  return bytes as unknown as BufferSource;
}

function bytesToBase64(bytes: Uint8Array): string {
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin);
}

function base64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i += 1) out[i] = bin.charCodeAt(i);
  return out;
}

async function deriveKey(passphrase: string, salt: Uint8Array): Promise<CryptoKey> {
  const baseKey = await crypto.subtle.importKey(
    'raw',
    src(new TextEncoder().encode(passphrase)),
    'PBKDF2',
    false,
    ['deriveKey'],
  );
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: src(salt), iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  );
}

/** Encrypt an arbitrary JSON-serializable payload into a save envelope. */
export async function encryptToEnvelope(
  payload: unknown,
  passphrase: string,
  dataVersion: string,
): Promise<SaveEnvelope> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(passphrase, salt);
  const plaintext = new TextEncoder().encode(JSON.stringify(payload));
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: src(iv) },
    key,
    src(plaintext),
  );
  return {
    format: SAVE_FORMAT,
    dataVersion,
    kdf: {
      algo: 'PBKDF2',
      hash: 'SHA-256',
      iterations: PBKDF2_ITERATIONS,
      salt: bytesToBase64(salt),
    },
    cipher: { algo: 'AES-GCM', iv: bytesToBase64(iv) },
    ciphertext: bytesToBase64(new Uint8Array(ciphertext)),
  };
}

/** Machine-readable decrypt failure causes; the UI localizes them (5.9). */
export type DecryptErrorCode = 'unrecognized_format' | 'unlock_failed';

export class DecryptError extends Error {
  readonly code: DecryptErrorCode;

  constructor(code: DecryptErrorCode) {
    // The message is a developer-facing fallback; user-facing text comes from i18n.
    super(`decrypt failed: ${code}`);
    this.code = code;
  }
}

/** Decrypt a save envelope; throws DecryptError on a wrong passphrase or corrupt file. */
export async function decryptFromEnvelope<T = unknown>(
  envelope: SaveEnvelope,
  passphrase: string,
): Promise<T> {
  if (envelope.format !== SAVE_FORMAT) {
    throw new DecryptError('unrecognized_format');
  }
  try {
    const salt = base64ToBytes(envelope.kdf.salt);
    const iv = base64ToBytes(envelope.cipher.iv);
    const key = await deriveKey(passphrase, salt);
    const plaintext = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: src(iv) },
      key,
      src(base64ToBytes(envelope.ciphertext)),
    );
    return JSON.parse(new TextDecoder().decode(plaintext)) as T;
  } catch {
    throw new DecryptError('unlock_failed');
  }
}
