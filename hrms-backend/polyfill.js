/**
 * Polyfill globalThis.crypto for Node.js < 19
 * Required by @nestjs/typeorm v11 which uses crypto.randomUUID() as a global.
 * This file is loaded via --require BEFORE any module is imported.
 */
if (!globalThis.crypto) {
  const { webcrypto } = require('crypto');
  globalThis.crypto = webcrypto;
}
