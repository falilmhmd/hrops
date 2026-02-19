/**
 * Polyfill globalThis.crypto for Node.js < 19
 * Required by @nestjs/typeorm v11 which uses crypto.randomUUID() as a global.
 * Node.js 18 has webcrypto under require('crypto').webcrypto but not as globalThis.crypto
 */
import { webcrypto } from 'crypto';

if (!globalThis.crypto) {
  (globalThis as any).crypto = webcrypto;
}
