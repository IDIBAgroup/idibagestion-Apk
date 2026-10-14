import type { ChartAccount } from '@/types';

type AccountDefinition = [code: string, label: string];

const classes: AccountDefinition[] = [["1", "Comptes de ressources durables (capitaux)"], ["2", "Comptes d'actif immobilisé"], ["3", "Comptes de stocks"], ["4", "Comptes de tiers"], ["5", "Comptes de trésorerie"], ["6", "Comptes de charges"], ["7", "Comptes de produits"], ["8", "Comptes des autres charges et des autres produits (HAO)"]];

// Official chart extracted from the supplied SYSCOHADA reference PDF (classes 1-8).
const accounts: AccountDefinition[] = [
  ["10", "Capital"],
  ["101", "Capital social"],
  ["1013", "Capital souscrit, appelé, versé"],
  ["105", "Primes liées au capital social"],
  ["109", "Actionnaires, capital souscrit non appelé"],
  ["11", "Réserves"],
  ["111", "Réserve légale"],
  ["112", "Réserves statutaires ou contractuelles"],
  ["118", "Autres réserves"],
  ["12", "Report à nouveau"],
  ["121", "Report à nouveau créditeur"],
  ["129", "Report à nouveau débiteur"],
  ["13", "Résultat net de l'exercice"],
  ["131", "Résultat net: bénéfice"],
  ["139", "Résultat net: perte"],
  ["14", "Subventions d'investissement"],
  ["141", "Subventions d'équipement"],
  ["15", "Provisions réglementées et fonds assimilés"],
  ["151", "Amortissements dérogatoires"],
  ["16", "Emprunts et dettes assimilées"],
  ["161", "Emprunts obligataires"],
  ["162", "Emprunts et dettes auprès des établissements de crédit"],
  ["165", "Dépôts et cautionnements reçus"],
  ["17", "Dettes de location-acquisition"],
  ["18", "Dettes liées à des participations"],
  ["185", "Comptes courants interentreprises (multi-entités)"],
  ["19", "Provisions financières pour risques et charges"],
  ["191", "Provisions pour litiges"],
  ["194", "Provisions pour pertes de change"],
  ["195", "Provisions pour impôts"],
  ["21", "Immobilisations incorporelles"],
  ["212", "Brevets, licences, concessions et droits similaires"],
  ["213", "Logiciels"],
  ["214", "Fonds commercial"],
  ["22", "Terrains"],
  ["221", "Terrains agricoles et forestiers"],
  ["222", "Terrains nus"],
  ["223", "Terrains bâtis"],
  ["23", "Bâtiments, installations techniques et agencements"],
  ["231", "Bâtiments industriels"],
  ["232", "Bâtiments commerciaux"],
  ["233", "Bâtiments administratifs et sociaux"],
  ["24", "Matériel"],
  ["241", "Matériel et outillage industriel et commercial"],
  ["244", "Matériel et mobilier de bureau"],
  ["245", "Matériel de transport"],
  ["246", "Matériel informatique"],
  ["25", "Avances et acomptes versés sur immobilisations"],
  ["27", "Autres immobilisations financières"],
  ["271", "Prêts et créances non commerciales"],
  ["275", "Dépôts et cautionnements versés"],
  ["28", "Amortissements"],
  ["281", "Amortissements des immobilisations incorporelles"],
  ["283", "Amortissements des bâtiments"],
  ["284", "Amortissements du matériel"],
  ["29", "Dépréciations des immobilisations"],
  ["31", "Marchandises"],
  ["311", "Marchandises A"],
  ["32", "Matières premières et fournitures liées"],
  ["321", "Matières premières"],
  ["322", "Fournitures liées"],
  ["33", "Autres approvisionnements"],
  ["331", "Matières consommables"],
  ["332", "Fournitures d'atelier et d'usine"],
  ["335", "Fournitures de bureau"],
  ["34", "Produits en cours"],
  ["35", "Services en cours"],
  ["36", "Produits finis"],
  ["37", "Produits intermédiaires et résiduels"],
  ["371", "Stocks de marchandises (situation)"],
  ["38", "Stocks en cours de route"],
  ["39", "Dépréciations des stocks"],
  ["40", "Fournisseurs et comptes rattachés"],
  ["401", "Fournisseurs, dettes en compte"],
  ["4011", "Fournisseurs locaux"],
  ["4012", "Fournisseurs étrangers"],
  ["408", "Fournisseurs, factures non parvenues"],
  ["409", "Fournisseurs débiteurs"],
  ["41", "Clients et comptes rattachés"],
  ["411", "Clients"],
  ["4111", "Clients locaux"],
  ["4112", "Clients étrangers"],
  ["412", "Clients, effets à recevoir"],
  ["416", "Clients douteux ou litigieux"],
  ["418", "Clients, produits à recevoir"],
  ["419", "Clients créditeurs"],
  ["42", "Personnel"],
  ["421", "Personnel, avances et acomptes"],
  ["422", "Personnel, rémunérations dues"],
  ["423", "Personnel, oppositions, saisies-arrêts"],
  ["428", "Personnel, charges à payer et produits à recevoir"],
  ["43", "Organismes sociaux"],
  ["438", "Organismes sociaux, charges à payer et produits à recevoir"],
  ["431", "Sécurité sociale"],
  ["432", "Caisses de retraite"],
  ["44", "État et collectivités publiques"],
  ["441", "État, impôts sur les bénéfices"],
  ["4421", "État, impôts et taxes d'État"],
  ["442", "État, autres impôts et taxes"],
  ["4431", "TVA facturée sur ventes"],
  ["4432", "TVA facturée sur prestations de services"],
  ["4441", "État, TVA due"],
  ["4449", "État, crédit de TVA à reporter"],
  ["4451", "TVA récupérable sur immobilisations"],
  ["4452", "TVA récupérable sur achats"],
  ["4453", "TVA récupérable sur transport"],
  ["4454", "TVA récupérable sur services extérieurs"],
  ["447", "État, impôts retenus à la source"],
  ["448", "État, charges à payer et produits à recevoir"],
  ["449", "État, créances et dettes diverses"],
  ["46", "Associés et groupe"],
  ["462", "Associés, comptes courants"],
  ["467", "Autres comptes créditeurs — Cotisations tontines"],
  ["47", "Débiteurs et créditeurs divers"],
  ["471", "Compte d'attente"],
  ["478", "Écarts de conversion - Actif"],
  ["479", "Écarts de conversion - Passif"],
  ["49", "Dépréciations et risques provisionnés (tiers)"],
  ["491", "Dépréciations des comptes clients"],
  ["51", "Valeurs à encaisser"],
  ["511", "Effets à encaisser"],
  ["512", "Effets à l'encaissement"],
  ["52", "Banques"],
  ["521", "Banques locales"],
  ["522", "Banques autres états UEMOA"],
  ["526", "Banques, intérêts courus"],
  ["53", "Établissements financiers et assimilés"],
  ["531", "Chèques postaux"],
  ["532", "Trésor"],
  ["54", "Instruments de trésorerie"],
  ["56", "Banques, crédits de trésorerie et d'escompte"],
  ["561", "Crédits de trésorerie"],
  ["57", "Caisse"],
  ["571", "Caisse siège social"],
  ["572", "Caisse succursale"],
  ["58", "Régies d'avances, accréditifs et virements internes"],
  ["581", "Virements de fonds"],
  ["585", "Mobile Money"],
  ["59", "Dépréciations et risques provisionnés (trésorerie)"],
  ["60", "Achats et variations de stocks"],
  ["601", "Achats de marchandises"],
  ["602", "Achats de matières premières et fournitures liées"],
  ["6037", "Variation des stocks de marchandises"],
  ["604", "Achats stockés de matières et fournitures consommables"],
  ["6041", "Fournitures non stockables — Eau"],
  ["6042", "Fournitures non stockables — Électricité"],
  ["6044", "Fournitures d'entretien"],
  ["6047", "Fournitures de bureau non stockables"],
  ["6045", "Fournitures non stockables — Carburants et lubrifiants"],
  ["6048", "Autres fournitures non stockables"],
  ["605", "Autres achats"],
  ["608", "Achats d'emballages"],
  ["61", "Transports"],
  ["611", "Transports sur achats"],
  ["612", "Transports sur ventes"],
  ["613", "Transports pour le compte de tiers"],
  ["62", "Services extérieurs"],
  ["621", "Sous-traitance générale"],
  ["622", "Locations et charges locatives"],
  ["623", "Redevances de crédit-bail et contrats assimilés"],
  ["624", "Entretien, réparations et maintenance"],
  ["6241", "Entretien et réparations des biens immobiliers"],
  ["6242", "Entretien et réparations des biens mobiliers"],
  ["6248", "Autres entretiens et réparations"],
  ["625", "Primes d'assurance"],
  ["626", "Études, recherches et documentation"],
  ["627", "Publicité, publications, relations publiques"],
  ["628", "Frais de télécommunications"],
  ["63", "Autres services extérieurs"],
  ["631", "Frais bancaires"],
  ["632", "Rémunérations d'intermédiaires et de conseils"],
  ["633", "Frais de formation du personnel"],
  ["634", "Réceptions"],
  ["638", "Autres charges externes"],
  ["64", "Impôts et taxes"],
  ["641", "Impôts et taxes directs"],
  ["645", "Impôts et taxes indirects"],
  ["646", "Droits d'enregistrement"],
  ["648", "Autres impôts et taxes"],
  ["65", "Autres charges"],
  ["651", "Pertes sur créances clients et autres débiteurs"],
  ["658", "Charges diverses"],
  ["6581", "Pertes sur stocks (détérioration, vol)"],
  ["6582", "Dons et libéralités"],
  ["66", "Charges de personnel"],
  ["661", "Rémunérations directes versées au personnel national"],
  ["6613", "Conges payes"],
  ["6614", "Indemnites de preavis, de licenciement et de recherche d'embauche"],
  ["662", "Rémunérations directes versées au personnel non national"],
  ["663", "Indemnités forfaitaires versées au personnel"],
  ["664", "Charges sociales"],
  ["6641", "Charges sociales sur rémunérations du personnel national"],
  ["668", "Autres charges sociales"],
  ["67", "Frais financiers et charges assimilées"],
  ["671", "Intérêts des emprunts"],
  ["672", "Intérêts dans loyers de crédit-bail"],
  ["6712", "Pénalités, amendes fiscales et pénales"],
  ["674", "Escomptes accordés"],
  ["676", "Pertes de change"],
  ["68", "Dotations aux amortissements"],
  ["681", "Dotations aux amortissements d'exploitation"],
  ["6811", "Dotations aux amortissements des immobilisations incorporelles"],
  ["6812", "Dotations aux amortissements des immobilisations corporelles"],
  ["6815", "Écarts de caisse (manquants et excédents)"],
  ["687", "Dotations aux amortissements à caractère financier"],
  ["69", "Dotations aux provisions"],
  ["691", "Dotations aux provisions d'exploitation"],
  ["697", "Dotations aux provisions financières"],
  ["70", "Ventes"],
  ["701", "Ventes de marchandises"],
  ["702", "Ventes de produits finis"],
  ["704", "Ventes de travaux"],
  ["705", "Ventes de services"],
  ["706", "Produits accessoires"],
  ["707", "Ventes de produits résiduels"],
  ["71", "Subventions d'exploitation"],
  ["711", "Subventions d'exploitation reçues"],
  ["72", "Production immobilisée"],
  ["721", "Production immobilisée incorporelle"],
  ["722", "Production immobilisée corporelle"],
  ["73", "Variations de stocks de biens produits"],
  ["734", "Variation des en-cours"],
  ["736", "Variation des produits finis"],
  ["75", "Autres produits"],
  ["752", "Quote-part de résultat sur opérations faites en commun"],
  ["754", "Produits des cessions courantes d'immobilisations"],
  ["758", "Produits divers"],
  ["7581", "Surplus de stocks constatés (inventaire)"],
  ["77", "Revenus financiers et produits assimilés"],
  ["771", "Intérêts de prêts"],
  ["773", "Escomptes obtenus"],
  ["776", "Gains de change"],
  ["78", "Transferts de charges"],
  ["781", "Transferts de charges d'exploitation"],
  ["787", "Transferts de charges financières"],
  ["79", "Reprises de provisions"],
  ["791", "Reprises de provisions d'exploitation"],
  ["797", "Reprises de provisions financières"],
  ["80", "Comptes de résultat"],
  ["801", "Valeur ajoutée"],
  ["802", "Excédent brut d'exploitation"],
  ["803", "Résultat d'exploitation"],
  ["804", "Résultat financier"],
  ["805", "Résultat des activités ordinaires"],
  ["806", "Résultat hors activités ordinaires"],
  ["807", "Résultat net"],
  ["82", "Produits et charges hors activités ordinaires"],
  ["83", "Charges hors activités ordinaires"],
  ["831", "Charges HAO constatées"],
  ["835", "Dotations HAO"],
  ["84", "Produits hors activités ordinaires"],
  ["841", "Produits HAO constatés"],
  ["845", "Reprises HAO"],
  ["85", "Résultat hors activités ordinaires"],
  ["86", "Participation des travailleurs"],
  ["87", "Impôts sur le résultat"],
  ["871", "Impôts sur les bénéfices de l'exercice"],
  ["88", "Résultat net de l'exercice (détermination)"]
];


const typeForClass: Record<string, string> = {
  '1': 'Capitaux', '2': 'Immobilisations', '3': 'Stocks', '4': 'Tiers', '5': 'Trésorerie',
  '6': 'Charges', '7': 'Produits', '8': 'HAO',
};

function parentCode(code: string, codes: Set<string>): string | undefined {
  for (let length = code.length - 1; length >= 1; length--) {
    const prefix = code.slice(0, length);
    if (codes.has(prefix)) return prefix;
  }
  return undefined;
}

export function getOhadaChart(existing: ChartAccount[] = []): ChartAccount[] {
  const existingByCode = new Map(existing.map(account => [account.code, account]));
  const definitions = [...classes, ...accounts];
  const codes = new Set(definitions.map(([code]) => code));
  const nodes = new Map<string, ChartAccount>();

  for (const [code, label] of definitions) {
    const previous = existingByCode.get(code);
    nodes.set(code, { id: previous?.id ?? `syscohada-${code}`, code, label, category: typeForClass[code[0]] ?? previous?.category ?? 'Comptes', ...(previous ? { ...previous, code, label } : {}) });
  }

  const roots: ChartAccount[] = [];
  for (const node of nodes.values()) {
    const parent = parentCode(node.code, codes);
    const parentNode = parent ? nodes.get(parent) : undefined;
    if (parentNode) {
      parentNode.children ??= [];
      parentNode.children.push(node);
    } else roots.push(node);
  }
  const sortTree = (items: ChartAccount[]) => {
    items.sort((a, b) => a.code.localeCompare(b.code, 'fr', { numeric: true }));
    items.forEach(item => item.children && sortTree(item.children));
  };
  sortTree(roots);
  return roots;
}

export function filterOhadaChart(roots: ChartAccount[], query: string): ChartAccount[] {
  const normalized = query.trim().toLocaleLowerCase('fr');
  if (!normalized) return roots;
  const filter = (account: ChartAccount): ChartAccount | null => {
    const children = account.children?.map(filter).filter((child): child is ChartAccount => child !== null) ?? [];
    if (account.code.includes(normalized) || account.label.toLocaleLowerCase('fr').includes(normalized) || children.length) {
      return { ...account, children };
    }
    return null;
  };
  return roots.map(filter).filter((account): account is ChartAccount => account !== null);
}

export const OHADA_POSTING_ACCOUNTS = accounts
  .filter(([code]) => code.length >= 3)
  .map(([code, label]) => ({ code, label }));
