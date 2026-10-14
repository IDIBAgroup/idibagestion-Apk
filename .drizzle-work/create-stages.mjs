import { mkdir, readFile, writeFile } from "node:fs/promises";

const root = process.cwd();
const workDir = `${root}/.drizzle-work`;
await mkdir(workDir, { recursive: true });

let schema = await readFile(`${root}/db/schema.ts`, "utf8");

function removeBetween(source, startText, endText) {
  const start = source.indexOf(startText);
  const end = source.indexOf(endText, start);
  if (start < 0 || end < 0) {
    throw new Error(`Could not find schema markers: ${startText} / ${endText}`);
  }
  return source.slice(0, start) + source.slice(end);
}

const membershipStart = "// ============================================\n// COMPANY MEMBERSHIPS";
const clientsStart = "// ============================================\n// CLIENTS";
const partnerInviteStart = "export const partnerAccountInvitations = mysqlTable(";
const partnerInviteEnd = "export type PartnerAccountInvitation = typeof partnerAccountInvitations.$inferSelect;";
const companyInviteStart = "export const companyAccessInvitations = mysqlTable(";

let historical = removeBetween(schema, membershipStart, clientsStart);
historical = removeBetween(historical, companyInviteStart, clientsStart);
historical = historical.replace(/\s*isVerified: boolean\("isVerified"\)\.default\(false\)\.notNull\(\),\r?\n/, "\n");
historical = historical.replace(/\s*userId: bigint\("userId", \{ mode: "number", unsigned: true \}\),\r?\n/, "\n");
historical = historical.replace(
  /\r?\n  \(table\) => \[\r?\n    uniqueIndex\("partners_user_id_uq"\)\.on\(table\.userId\),\r?\n  \],/,
  "",
);
historical = removeBetween(
  historical,
  partnerInviteStart,
  "// ============================================\n// PARTNER PROSPECTS",
);

const stage1 = historical.replace(
  '  status: mysqlEnum("status", ["pending", "completed", "failed", "refunded"]).default("pending").notNull(),\n',
  '  status: mysqlEnum("status", ["pending", "completed", "failed", "refunded"]).default("pending").notNull(),\n  isVerified: boolean("isVerified").default(false).notNull(),\n',
);
const stage2 = stage1.replace(
  clientsStart,
  `${membershipStart}\n${schema.slice(schema.indexOf("export const companyMemberships"), schema.indexOf("export const companyAccessInvitations"))}${clientsStart}`,
);
const stage3 = stage2
  .replace(
    '    email: varchar("email", { length: 320 }).notNull(),\n',
    '    email: varchar("email", { length: 320 }).notNull(),\n    userId: bigint("userId", { mode: "number", unsigned: true }),\n',
  )
  .replace(
    '    updatedAt: timestamp("updatedAt").defaultNow().notNull().$onUpdate(() => new Date()),\n  },\n);\n\nexport type Partner =',
    '    updatedAt: timestamp("updatedAt").defaultNow().notNull().$onUpdate(() => new Date()),\n  },\n  (table) => [\n    uniqueIndex("partners_user_id_uq").on(table.userId),\n  ],\n);\n\nexport type Partner =',
  )
  .replace(
    "export type Partner = typeof partners.$inferSelect;\nexport type InsertPartner = typeof partners.$inferInsert;\n",
    `export type Partner = typeof partners.$inferSelect;\nexport type InsertPartner = typeof partners.$inferInsert;\n\n${schema.slice(schema.indexOf(partnerInviteStart), schema.indexOf("// ============================================\n// PARTNER PROSPECTS"))}`,
  );

const stages = [historical, stage1, stage2, stage3, schema];
for (const [index, content] of stages.entries()) {
  await writeFile(`${workDir}/schema-${index}.ts`, content);
}

console.log(`Created ${stages.length} temporary schema stages in ${workDir}`);
