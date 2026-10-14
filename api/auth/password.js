import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(scryptCallback);
const COST = 32768;
const BLOCK_SIZE = 8;
const PARALLELIZATION = 1;
const KEY_LENGTH = 64;
const SALT_LENGTH = 16;
const SCRYPT_OPTIONS = {
  N: COST,
  r: BLOCK_SIZE,
  p: PARALLELIZATION,
  maxmem: 64 * 1024 * 1024,
};

async function derive(password, salt) {
  return scrypt(password, salt, KEY_LENGTH, SCRYPT_OPTIONS);
}

async function performDummyWork(password) {
  await derive(password, Buffer.alloc(SALT_LENGTH, 0x53));
}

export async function hashPassword(password) {
  if (typeof password !== "string" || password.length < 12 || password.length > 128) {
    throw new RangeError("Password must be between 12 and 128 characters.");
  }

  const salt = randomBytes(SALT_LENGTH);
  const derivedKey = await derive(password, salt);
  return `scrypt$${COST}$${BLOCK_SIZE}$${PARALLELIZATION}$${salt.toString("hex")}$${derivedKey.toString("hex")}`;
}

export async function verifyPassword(password, storedHash) {
  if (typeof password !== "string" || password.length > 1024) return false;

  const parts = typeof storedHash === "string" ? storedHash.split("$") : [];
  const [scheme, cost, blockSize, parallelization, saltHex, keyHex] = parts;
  const validFormat = scheme === "scrypt"
    && cost === String(COST)
    && blockSize === String(BLOCK_SIZE)
    && parallelization === String(PARALLELIZATION)
    && /^[a-f\d]{32}$/i.test(saltHex ?? "")
    && /^[a-f\d]{128}$/i.test(keyHex ?? "");

  if (!validFormat) {
    await performDummyWork(password);
    return false;
  }

  const expected = Buffer.from(keyHex, "hex");
  const actual = await derive(password, Buffer.from(saltHex, "hex"));
  return timingSafeEqual(actual, expected);
}
