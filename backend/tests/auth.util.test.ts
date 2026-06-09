import { hashPassword, verifyPassword, generateToken, hashToken } from '../src/utils/password';
import { signAccessToken, verifyAccessToken } from '../src/utils/jwt';

describe('password utils', () => {
  it('hashes and verifies a password', async () => {
    const hash = await hashPassword('Password123');
    expect(hash).not.toBe('Password123');
    expect(await verifyPassword('Password123', hash)).toBe(true);
    expect(await verifyPassword('wrong', hash)).toBe(false);
  });

  it('generates a token with a stable hash', () => {
    const { token, hash } = generateToken();
    expect(hashToken(token)).toBe(hash);
  });
});

describe('jwt utils', () => {
  it('signs and verifies an access token', () => {
    const token = signAccessToken({ id: 'u1', email: 'a@b.com', role: 'professional' });
    const payload = verifyAccessToken(token);
    expect(payload.sub).toBe('u1');
    expect(payload.role).toBe('professional');
  });
});
