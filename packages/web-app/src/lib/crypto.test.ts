import { describe, it, expect } from 'vitest';
import { encryptToEnvelope, decryptFromEnvelope, DecryptError, SAVE_FORMAT } from './crypto.js';

describe('client-side encryption', () => {
  it('round-trips a payload with the correct passphrase', async () => {
    const payload = { profile: { stateCode: 'OH', members: [{ id: 'a' }] } };
    const env = await encryptToEnvelope(payload, 'correct horse battery', '2024');
    expect(env.format).toBe(SAVE_FORMAT);
    expect(env.dataVersion).toBe('2024');
    const back = await decryptFromEnvelope<typeof payload>(env, 'correct horse battery');
    expect(back).toEqual(payload);
  });

  it('throws DecryptError on a wrong passphrase', async () => {
    const env = await encryptToEnvelope({ x: 1 }, 'right', '2024');
    await expect(decryptFromEnvelope(env, 'wrong')).rejects.toBeInstanceOf(DecryptError);
  });

  it('uses a fresh salt and iv each time', async () => {
    const a = await encryptToEnvelope({ x: 1 }, 'pw', '2024');
    const b = await encryptToEnvelope({ x: 1 }, 'pw', '2024');
    expect(a.kdf.salt).not.toBe(b.kdf.salt);
    expect(a.cipher.iv).not.toBe(b.cipher.iv);
  });
});
