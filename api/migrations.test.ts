import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const migrationsDir = path.join(appRoot, "db", "migrations");
const metaDir = path.join(migrationsDir, "meta");
const zeroId = "00000000-0000-0000-0000-000000000000";

interface JournalEntry {
  idx: number;
  when: number;
  tag: string;
  breakpoints: boolean;
}

interface MigrationJournal {
  version: string;
  dialect: string;
  entries: JournalEntry[];
}

interface MigrationSnapshot {
  id: string;
  prevId: string;
  dialect: string;
  tables: Record<string, { columns: Record<string, unknown> }>;
}

async function readJson<T>(filePath: string): Promise<T> {
  return JSON.parse(await readFile(filePath, "utf8")) as T;
}

describe("Drizzle migration history", () => {
  it("has a contiguous journal with one SQL file per entry", async () => {
    const journal = await readJson<MigrationJournal>(path.join(metaDir, "_journal.json"));
    expect(journal.dialect).toBe("mysql");
    expect(journal.entries.length).toBeGreaterThan(0);
    expect(journal.entries.map(({ idx }) => idx)).toEqual(journal.entries.map((_, index) => index));
    expect(new Set(journal.entries.map(({ tag }) => tag)).size).toBe(journal.entries.length);
    expect(journal.entries.every(({ breakpoints }) => breakpoints)).toBe(true);
    expect(journal.entries.map(({ when }) => when)).toEqual(
      [...journal.entries.map(({ when }) => when)].sort((left, right) => left - right),
    );

    const sqlFiles = (await readdir(migrationsDir))
      .filter((file) => file.endsWith(".sql"))
      .sort();
    expect(sqlFiles).toEqual(journal.entries.map(({ tag }) => `${tag}.sql`).sort());
  });

  it("links every snapshot and ends at the schema used by the application", async () => {
    const journal = await readJson<MigrationJournal>(path.join(metaDir, "_journal.json"));
    let previousId = zeroId;
    let latest: MigrationSnapshot | undefined;

    for (const entry of journal.entries) {
      const snapshot = await readJson<MigrationSnapshot>(
        path.join(metaDir, `${entry.idx.toString().padStart(4, "0")}_snapshot.json`),
      );
      expect(snapshot.dialect).toBe("mysql");
      expect(snapshot.prevId).toBe(previousId);
      previousId = snapshot.id;
      latest = snapshot;
    }

    expect(latest).toBeDefined();
    expect(latest?.tables).toHaveProperty("clients");
    expect(latest?.tables).toHaveProperty("products");
    expect(latest?.tables).toHaveProperty("company_memberships");
    expect(latest?.tables).toHaveProperty("company_access_invitations");
    expect(latest?.tables).toHaveProperty("partner_account_invitations");
    expect(latest?.tables.transactions.columns).toHaveProperty("isVerified");
    expect(latest?.tables.companies.columns).toHaveProperty("capitalSocial");
    expect(latest?.tables.partners.columns).toHaveProperty("userId");
  });

  it("keeps owner access during membership rollout and separates SQL statements", async () => {
    const membershipSql = await readFile(path.join(migrationsDir, "0002_company_memberships.sql"), "utf8");
    const backfillStart = membershipSql.indexOf("INSERT IGNORE INTO company_memberships");
    const backfillBreakpoint = membershipSql.lastIndexOf("--> statement-breakpoint", backfillStart);
    const precedingStatementEnd = membershipSql.lastIndexOf(";", backfillStart);
    expect(backfillStart).toBeGreaterThan(-1);
    expect(backfillBreakpoint).toBeGreaterThan(precedingStatementEnd);
    expect(membershipSql).toMatch(/INSERT IGNORE INTO company_memberships[\s\S]*SELECT id, ownerUserId/);

    const firstSchemaDiff = await readFile(
      path.join(migrationsDir, "0001_transaction_verification.sql"),
      "utf8",
    );
    expect(firstSchemaDiff).toContain("CREATE TABLE `clients`");
    expect(firstSchemaDiff).toContain("CREATE TABLE `products`");
    expect(firstSchemaDiff).toContain("ADD `isVerified`");
  });
});
