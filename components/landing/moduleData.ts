import { BarChart3, Briefcase, FileText, Sparkles, Users } from "lucide-react";

export const modules = [
  {
    id: "finance",
    label: "Comptabilité",
    icon: BarChart3,
    title: "Des chiffres clairs. Des décisions éclairées.",
    description:
      "Retrouvez vos écritures, votre trésorerie et vos états financiers dans une comptabilité adaptée au référentiel SYSCOHADA.",
    features: [
      "Plan comptable SYSCOHADA Révisé",
      "Préparation des états financiers et de la DSF",
      "Suivi de trésorerie et rapports financiers",
    ],
    metric: "124 500 000",
    unit: "FCFA · Actif immobilisé",
    rows: [
      ["Actif circulant", "82 300 000 FCFA"],
      ["Trésorerie", "34 200 000 FCFA"],
    ],
    caption: "Vue financière",
  },
  {
    id: "sales",
    label: "Ventes",
    icon: FileText,
    title: "Du premier devis à la facture réglée.",
    description:
      "Centralisez vos clients et suivez chaque étape de votre cycle commercial, sans perdre le fil des paiements.",
    features: [
      "Devis et factures réunis",
      "Gestion des clients et fournisseurs",
      "Suivi des règlements et relances",
    ],
    metric: "1 250 000",
    unit: "FCFA · Facture FAC-089",
    rows: [
      ["Client", "Groupe SOCAPALM"],
      ["Statut", "Réglée"],
    ],
    caption: "Suivi commercial",
  },
  {
    id: "people",
    label: "Équipes & paie",
    icon: Users,
    title: "Votre équipe mérite une gestion plus simple.",
    description:
      "Réunissez les dossiers de vos collaborateurs, les congés et la paie dans un espace cohérent.",
    features: [
      "Dossiers salariés et suivi des congés",
      "Bulletins de paie et cotisations CNPS",
      "Rapports d’activité et suivi RH",
    ],
    metric: "398 700",
    unit: "FCFA · Net à payer",
    rows: [
      ["Salaire de base", "450 000 FCFA"],
      ["Cotisations et retenues", "51 300 FCFA"],
    ],
    caption: "Exemple de bulletin",
  },
  {
    id: "projects",
    label: "Projets",
    icon: Briefcase,
    title: "Gardez vos projets sur la bonne trajectoire.",
    description:
      "Suivez les tâches, les budgets et les actifs de votre entreprise avec une vue partagée par vos équipes.",
    features: [
      "Suivi des tâches et avancement",
      "Budgets et rentabilité des projets",
      "Gestion des immobilisations",
    ],
    metric: "78 %",
    unit: "Avancement · Extension du siège",
    rows: [
      ["Budget engagé", "45 000 000 FCFA"],
      ["Budget restant", "12 000 000 FCFA"],
    ],
    caption: "Pilotage de projet",
  },
  {
    id: "ai",
    label: "VIBE AI",
    icon: Sparkles,
    title: "Donnez une longueur d’avance à vos ventes.",
    description:
      "Structurez votre prospection B2B avec VIBE AI et concentrez vos efforts sur les opportunités pertinentes.",
    features: [
      "Identification de prospects B2B",
      "Suivi des signaux commerciaux",
      "Organisation des actions de prospection",
    ],
    metric: "14",
    unit: "Entreprises qualifiées",
    rows: [
      ["Secteur ciblé", "BTP & infrastructures"],
      ["Zone", "Douala, Cameroun"],
    ],
    caption: "Exemple de prospection",
  },
];

export type ModuleInfo = (typeof modules)[number];
