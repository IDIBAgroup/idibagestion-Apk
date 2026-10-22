INSERT INTO `plans` (`slug`, `name`, `description`, `billingCycle`, `priceXAF`, `originalPriceXAF`, `isPopular`, `isEnterprise`, `maxUsers`, `maxClients`, `maxInvoices`, `maxProjects`, `features`, `supportLevel`, `trialDays`, `isActive`)
VALUES
('starter-monthly', 'Starter', 'Les outils essentiels pour gérer votre activité au quotidien.', 'monthly', 5000, NULL, FALSE, FALSE, 2, 100, 300, 0, '["Gestion des clients et fournisseurs", "Devis, facturation et paiements", "Gestion des dépenses", "Documents PDF"]', 'email', 14, TRUE),
('starter-yearly', 'Starter', 'Les outils essentiels pour gérer votre activité au quotidien.', 'yearly', 48000, 60000, FALSE, FALSE, 2, 100, 300, 0, '["Gestion des clients et fournisseurs", "Devis, facturation et paiements", "Gestion des dépenses", "Documents PDF"]', 'email', 14, TRUE),
('pro-monthly', 'Pro', 'Les outils de collaboration et de pilotage pour les équipes en croissance.', 'monthly', 15000, NULL, TRUE, FALSE, 5, 1000, 2000, 25, '["Tout Starter", "CRM et gestion des prospects", "Projets et tâches", "Ressources humaines de base", "Stocks et ressources"]', 'priority', 14, TRUE),
('pro-yearly', 'Pro', 'Les outils de collaboration et de pilotage pour les équipes en croissance.', 'yearly', 144000, 180000, TRUE, FALSE, 5, 1000, 2000, 25, '["Tout Starter", "CRM et gestion des prospects", "Projets et tâches", "Ressources humaines de base", "Stocks et ressources"]', 'priority', 14, TRUE),
('business-monthly', 'Business', 'Une gestion financière et opérationnelle avancée pour les entreprises structurées.', 'monthly', 30000, NULL, FALSE, FALSE, 15, 5000, 10000, 999, '["Tout Pro", "Comptabilité SYSCOHADA révisée", "Budgets et rapports avancés", "Paie", "Automatisations"]', 'priority', 14, TRUE),
('business-yearly', 'Business', 'Une gestion financière et opérationnelle avancée pour les entreprises structurées.', 'yearly', 288000, 360000, FALSE, FALSE, 15, 5000, 10000, 999, '["Tout Pro", "Comptabilité SYSCOHADA révisée", "Budgets et rapports avancés", "Paie", "Automatisations"]', 'priority', 14, TRUE),
('enterprise-monthly', 'Enterprise', 'Une offre sur mesure pour les groupes et les organisations multi-sociétés.', 'monthly', 0, NULL, FALSE, TRUE, 0, 0, 0, 0, '["Tarification sur devis", "Toutes les fonctionnalités Business", "Gestion multi-sociétés", "API personnalisées", "Sécurité avancée", "Support dédié"]', 'dedicated', 0, TRUE),
('enterprise-yearly', 'Enterprise', 'Une offre sur mesure pour les groupes et les organisations multi-sociétés.', 'yearly', 0, NULL, FALSE, TRUE, 0, 0, 0, 0, '["Tarification sur devis", "Toutes les fonctionnalités Business", "Gestion multi-sociétés", "API personnalisées", "Sécurité avancée", "Support dédié"]', 'dedicated', 0, TRUE)
ON DUPLICATE KEY UPDATE
  `name` = VALUES(`name`), `description` = VALUES(`description`), `priceXAF` = VALUES(`priceXAF`),
  `originalPriceXAF` = VALUES(`originalPriceXAF`), `isPopular` = VALUES(`isPopular`),
  `isEnterprise` = VALUES(`isEnterprise`), `maxUsers` = VALUES(`maxUsers`),
  `maxClients` = VALUES(`maxClients`), `maxInvoices` = VALUES(`maxInvoices`),
  `maxProjects` = VALUES(`maxProjects`), `features` = VALUES(`features`),
  `supportLevel` = VALUES(`supportLevel`), `trialDays` = VALUES(`trialDays`), `isActive` = TRUE;
