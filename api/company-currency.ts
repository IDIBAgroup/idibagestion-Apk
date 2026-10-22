import { eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { companies, companyProfiles } from "@db/schema";
import { findOhadaCountry, getOhadaCountryDefaults } from "@/lib/ohada/countries";
import { designCompany, isDesignMode } from "./design-mode";
import { getDb } from "./queries/connection";

export async function resolveCompanyCurrencyCode(companyId: number) {
  if (isDesignMode) {
    const country = findOhadaCountry(designCompany.country);
    if (country) return getOhadaCountryDefaults(country.code).currencyCode;
  }

  const db = getDb();
  const [profile] = await db.select({ currencyCode: companyProfiles.currencyCode })
    .from(companyProfiles).where(eq(companyProfiles.companyId, companyId)).limit(1);
  if (profile?.currencyCode) return profile.currencyCode;

  const [company] = await db.select({ country: companies.country }).from(companies)
    .where(eq(companies.id, companyId)).limit(1);
  const country = findOhadaCountry(company?.country);
  if (!country) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Configurez le profil OHADA de l’entreprise avant de saisir un montant." });
  return getOhadaCountryDefaults(country.code).currencyCode;
}
