import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

const derive = promisify(scrypt);
const options = { N: 131072, r: 8, p: 1, maxmem: 256 * 1024 * 1024 };
// Perform the same expensive derivation for an unknown email.
export const dummyHash = `scrypt-v1$${'0'.repeat(32)}$${'0'.repeat(128)}`;

export async function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  const key = await derive(password, salt, 64, options);
  return `scrypt-v1$${salt}$${key.toString('hex')}`;
}

export async function verifyPassword(password, encoded) {
  if (!/^scrypt-v1\$[a-f0-9]{32}\$[a-f0-9]{128}$/.test(encoded)) return false;
  const [, salt, hash] = encoded.split('$');
  const key = await derive(password, salt, 64, options);
  return timingSafeEqual(key, Buffer.from(hash, 'hex'));
}
