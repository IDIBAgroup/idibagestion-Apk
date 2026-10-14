import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "./password.js";
import { clearLoginFailures, getLoginRetryAfter, recordLoginFailure } from "./rate-limit";

describe("password credentials", () => {
  it("hashes passwords with scrypt and verifies without storing plaintext", async () => {
    const password = "UnePhraseDePasseTresSolide2026!";
    const storedHash = await hashPassword(password);

    expect(storedHash).not.toContain(password);
    expect(storedHash.startsWith("scrypt$32768$8$1$")).toBe(true);
    await expect(verifyPassword(password, storedHash)).resolves.toBe(true);
    await expect(verifyPassword("mauvais-mot-de-passe", storedHash)).resolves.toBe(false);
    await expect(verifyPassword(password, null)).resolves.toBe(false);
  });

  it("rejects passwords outside the accepted size", async () => {
    await expect(hashPassword("trop-court")).rejects.toThrow(RangeError);
    await expect(hashPassword("x".repeat(129))).rejects.toThrow(RangeError);
  });
});

describe("login attempt limits", () => {
  it("blocks repeated failures for 15 minutes and clears after success or timeout", () => {
    const email = `limit-${Date.now()}@idibages.test`;
    const now = 1_000_000;

    for (let i = 0; i < 9; i += 1) recordLoginFailure(email, now + i);
    expect(getLoginRetryAfter(email, now + 10)).toBe(0);

    recordLoginFailure(email, now + 10);
    expect(getLoginRetryAfter(email, now + 11)).toBeGreaterThan(0);
    expect(getLoginRetryAfter(email, now + 16 * 60 * 1000)).toBe(0);

    recordLoginFailure(email, now + 16 * 60 * 1000);
    clearLoginFailures(email);
    expect(getLoginRetryAfter(email, now + 16 * 60 * 1000)).toBe(0);
  });
});
