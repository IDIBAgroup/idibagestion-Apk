UPDATE `plans`
SET `name` = 'Essentiel',
    `description` = 'Les outils essentiels pour structurer la gestion d’une petite entreprise.',
    `priceXAF` = 14900,
    `originalPriceXAF` = NULL,
    `isPopular` = FALSE,
    `isEnterprise` = FALSE,
    `maxUsers` = 5,
    `maxClients` = 100,
    `maxInvoices` = 300,
    `maxProjects` = 5,
    `features` = '["Jusqu’à 5 utilisateurs","100 clients et fournisseurs","Jusqu’à 300 devis et factures par mois","Devis, facturation, relances et dépenses","Trésorerie et comptabilité de base","Projets et tâches (5 projets)","Messagerie interne et bibliothèque de documents","Assistance par e-mail"]',
    `supportLevel` = 'email'
WHERE `slug` IN ('starter-monthly', 'starter-yearly');
--> statement-breakpoint

UPDATE `plans`
SET `name` = 'Croissance',
    `description` = 'La suite de gestion complète pour les PME qui accélèrent.',
    `priceXAF` = 49900,
    `originalPriceXAF` = NULL,
    `isPopular` = TRUE,
    `isEnterprise` = FALSE,
    `maxUsers` = 15,
    `maxClients` = 1000,
    `maxInvoices` = 2000,
    `maxProjects` = 25,
    `features` = '["Jusqu’à 15 utilisateurs et 1 000 clients","Jusqu’à 2 000 documents commerciaux par mois","Tout le pack Essentiel","Comptabilité SYSCOHADA révisée et rapports financiers","Immobilisations, clôture comptable et préparation DSF OHADA","Ressources humaines, congés, paie et CNPS","VIBE Prospection et gestion des leads","Portails clients et fournisseurs","Messagerie et assistance prioritaire"]',
    `supportLevel` = 'priority'
WHERE `slug` IN ('pro-monthly', 'pro-yearly');
--> statement-breakpoint

UPDATE `plans`
SET `name` = 'Business+',
    `description` = 'Une offre évolutive pour les organisations multi-équipes et multi-entités.',
    `priceXAF` = 149000,
    `originalPriceXAF` = NULL,
    `isPopular` = FALSE,
    `isEnterprise` = TRUE,
    `maxUsers` = 50,
    `maxClients` = 5000,
    `maxInvoices` = 10000,
    `maxProjects` = 999,
    `features` = '["Jusqu’à 50 utilisateurs inclus et 5 000 clients","Jusqu’à 10 000 documents commerciaux par mois","Tout le pack Croissance","Accès multi-sociétés et pilotage consolidé","Rôles, accès et circuits de validation avancés","Portails clients, fournisseurs et partenaires","Accompagnement prioritaire au paramétrage","Migration de données et intégrations spécifiques sur devis","Tarification adaptée au volume au-delà des limites incluses"]',
    `supportLevel` = 'dedicated'
WHERE `slug` IN ('enterprise-monthly', 'enterprise-yearly');
