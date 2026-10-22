export const OHADA_COUNTRIES = [
  { code: "BJ", name: "Bénin", currency: "XOF", timezone: "Africa/Porto-Novo", locale: "fr-BJ", taxIdLabel: "IFU", commercialRegisterLabel: "RCCM" },
  { code: "BF", name: "Burkina Faso", currency: "XOF", timezone: "Africa/Ouagadougou", locale: "fr-BF", taxIdLabel: "IFU", commercialRegisterLabel: "RCCM" },
  { code: "CM", name: "Cameroun", currency: "XAF", timezone: "Africa/Douala", locale: "fr-CM", taxIdLabel: "NIU", commercialRegisterLabel: "RCCM" },
  { code: "CF", name: "République centrafricaine", currency: "XAF", timezone: "Africa/Bangui", locale: "fr-CF", taxIdLabel: "NIF", commercialRegisterLabel: "RCCM" },
  { code: "KM", name: "Comores", currency: "KMF", timezone: "Indian/Comoro", locale: "fr-KM", taxIdLabel: "NIF", commercialRegisterLabel: "RCCM" },
  { code: "CG", name: "Congo", currency: "XAF", timezone: "Africa/Brazzaville", locale: "fr-CG", taxIdLabel: "NIU", commercialRegisterLabel: "RCCM" },
  { code: "CI", name: "Côte d’Ivoire", currency: "XOF", timezone: "Africa/Abidjan", locale: "fr-CI", taxIdLabel: "CC", commercialRegisterLabel: "RCCM" },
  { code: "GA", name: "Gabon", currency: "XAF", timezone: "Africa/Libreville", locale: "fr-GA", taxIdLabel: "NIF", commercialRegisterLabel: "RCCM" },
  { code: "GN", name: "Guinée", currency: "GNF", timezone: "Africa/Conakry", locale: "fr-GN", taxIdLabel: "NIF", commercialRegisterLabel: "RCCM" },
  { code: "GW", name: "Guinée-Bissau", currency: "XOF", timezone: "Africa/Bissau", locale: "pt-GW", taxIdLabel: "NIF", commercialRegisterLabel: "Registo comercial" },
  { code: "GQ", name: "Guinée équatoriale", currency: "XAF", timezone: "Africa/Malabo", locale: "es-GQ", taxIdLabel: "NIF", commercialRegisterLabel: "Registro Mercantil" },
  { code: "ML", name: "Mali", currency: "XOF", timezone: "Africa/Bamako", locale: "fr-ML", taxIdLabel: "NIF", commercialRegisterLabel: "RCCM" },
  { code: "NE", name: "Niger", currency: "XOF", timezone: "Africa/Niamey", locale: "fr-NE", taxIdLabel: "NIF", commercialRegisterLabel: "RCCM" },
  { code: "CD", name: "République démocratique du Congo", currency: "CDF", timezone: "Africa/Kinshasa", locale: "fr-CD", taxIdLabel: "ID. Nat.", commercialRegisterLabel: "RCCM" },
  { code: "SN", name: "Sénégal", currency: "XOF", timezone: "Africa/Dakar", locale: "fr-SN", taxIdLabel: "NINEA", commercialRegisterLabel: "RCCM" },
  { code: "TD", name: "Tchad", currency: "XAF", timezone: "Africa/Ndjamena", locale: "fr-TD", taxIdLabel: "NIF", commercialRegisterLabel: "RCCM" },
  { code: "TG", name: "Togo", currency: "XOF", timezone: "Africa/Lome", locale: "fr-TG", taxIdLabel: "NIF", commercialRegisterLabel: "RCCM" },
] as const;

export type OhadaCountryCode = (typeof OHADA_COUNTRIES)[number]["code"];
export type OhadaCurrencyCode = (typeof OHADA_COUNTRIES)[number]["currency"];
export type OhadaLocale = (typeof OHADA_COUNTRIES)[number]["locale"];
export const OHADA_COUNTRY_CODES = OHADA_COUNTRIES.map((country) => country.code) as [OhadaCountryCode, ...OhadaCountryCode[]];
export const OHADA_CURRENCY_CODES = [...new Set(OHADA_COUNTRIES.map((country) => country.currency))] as [OhadaCurrencyCode, ...OhadaCurrencyCode[]];

export const OHADA_INDUSTRIES = [
  { code: "agriculture", label: "Agriculture et élevage" },
  { code: "construction", label: "BTP et construction" },
  { code: "education", label: "Éducation et formation" },
  { code: "energy", label: "Énergie et services publics" },
  { code: "finance", label: "Finance et assurance" },
  { code: "healthcare", label: "Santé" },
  { code: "hospitality", label: "Hôtellerie et restauration" },
  { code: "logistics", label: "Transport et logistique" },
  { code: "manufacturing", label: "Industrie et fabrication" },
  { code: "nonprofit", label: "Association et organisme à but non lucratif" },
  { code: "professional_services", label: "Services professionnels" },
  { code: "public_sector", label: "Secteur public" },
  { code: "retail", label: "Commerce et distribution" },
  { code: "technology", label: "Technologies et télécommunications" },
  { code: "other", label: "Autre secteur" },
] as const;

export type OhadaIndustryCode = (typeof OHADA_INDUSTRIES)[number]["code"];
export const OHADA_INDUSTRY_CODES = OHADA_INDUSTRIES.map((industry) => industry.code) as [OhadaIndustryCode, ...OhadaIndustryCode[]];

export function getOhadaCountry(code: string) {
  return OHADA_COUNTRIES.find((country) => country.code === code.toUpperCase());
}

export function findOhadaCountry(value?: string | null) {
  if (!value) return undefined;
  const normalize = (text: string) => text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[’'`-]/g, " ").replace(/\s+/g, " ").trim();
  const normalized = normalize(value);
  const aliases: Record<string, OhadaCountryCode> = {
    rdc: "CD",
    "republique democratique du congo": "CD",
    "centrafrique": "CF",
    rca: "CF",
    "guinee bissau": "GW",
    "guinee equatoriale": "GQ",
  };
  const aliasCode = aliases[normalized];
  if (aliasCode) return getOhadaCountry(aliasCode);
  return OHADA_COUNTRIES.find((country) => country.code.toLowerCase() === normalized || normalize(country.name) === normalized);
}

export function getOhadaCountryDefaults(code: OhadaCountryCode) {
  const country = getOhadaCountry(code)!;
  return {
    countryCode: country.code,
    currencyCode: country.currency,
    timezone: country.timezone,
    locale: country.locale,
    accountingFramework: "SYSCOHADA_REVISED" as const,
    fiscalYearStartMonth: 1,
    fiscalYearStartDay: 1,
    industryCode: "other" as const,
    customIndustryName: null,
  };
}
