# Audit et plan â€” Documents, collaboration et signatures

## Constat de lâ€™audit

- La pile opÃ©rationnelle est Next.js 16, Hono et tRPC, avec Drizzle sur MySQL/PlanetScale. Il nâ€™y a pas de backend NestJS ni de schÃ©ma PostgreSQL ; ce chantier doit suivre la pile existante.
- Lâ€™authentification serveur repose sur des sessions HTTP-only. `assertCompanyAccess` vÃ©rifie propriÃ©taire, administrateur de plateforme ou adhÃ©sion active avant les opÃ©rations de tenant.
- Les donnÃ©es ERP et les portails historiques utilisent encore `localStorage`. Les Ã©crans dâ€™impression de devis/factures sont spÃ©cifiques Ã  leurs pages et ne constituent pas un moteur documentaire versionnÃ©.
- `partner_documents` est un catalogue de fichiers par partenaire avec une URL, sans coffre privÃ©, partage temporaire ni validation dâ€™upload.
- Aucun adaptateur de stockage objet, antivirus, SMTP/e-mail transactionnel, SMS, WhatsApp, prestataire de signature ni variable dâ€™environnement associÃ©e nâ€™est configurÃ© dans le dÃ©pÃ´t.
- Les routes `/api/trpc/*` existent ; aucune API de partage externe ni webhook documentaire nâ€™est enregistrÃ©e. Les contrÃ´les dâ€™accÃ¨s mÃ©tier gÃ©nÃ©riques ne dÃ©finissent pas de rÃ¨gles documentaires selon rÃ´le, montant ou type.
- Le schÃ©ma MySQL historique utilise des identifiants `companyId` et des index ; les tables documentaires et leur historique sont absents.
- `DATABASE_URL` de production nâ€™est pas fourni dans lâ€™environnement. Une migration peut Ãªtre prÃ©parÃ©e et testÃ©e dans le dÃ©pÃ´t, mais ne peut pas Ãªtre dÃ©clarÃ©e appliquÃ©e Ã  une base distante.

## Plan non destructif

1. **Socle de donnÃ©es** â€” ajouter par migration additive les modÃ¨les versionnÃ©s, tenants, documents, sÃ©quences, partages, rÃ©ponses, approbations, actifs de signature, Ã©vÃ©nements et audits. Ne pas modifier ni supprimer les donnÃ©es historiques.
2. **Document Studio** â€” crÃ©er les modÃ¨les systÃ¨me/tenant, versions immuables, instances et rendu dÃ©terministe. Ajouter le branding tenant, lâ€™aperÃ§u, lâ€™impression et les contrÃ´les de mentions lÃ©gales. Garder le rendu PDF serveur derriÃ¨re un service configurÃ©, sans rÃ©utiliser les impressions locales comme preuve de signature.
3. **Autorisations et signature** â€” vÃ©rifier lâ€™accÃ¨s tenant sur chaque objet, Ã©tablir les workflows et dÃ©cisions, distinguer approbation interne, image visuelle et signature Ã©lectronique qualifiÃ©e. Hacher les versions finalisÃ©es et produire une nouvelle version en cas de correction.
4. **Collaboration externe** â€” liens alÃ©atoires dont seul le hash est stockÃ©, portÃ©e explicite, expiration, rÃ©vocation, Ã©vÃ©nements, rÃ©ponses idempotentes et limitation dâ€™accÃ¨s persistante. Nâ€™exposer que les champs permis par la portÃ©e.
5. **Services externes** â€” brancher stockage privÃ©/quarantaine, analyse antivirus, e-mail et OTP aprÃ¨s configuration et tests de leurs adaptateurs. SMS/WhatsApp, horodatage et signature qualifiÃ©e restent inactifs tant que leur prestataire nâ€™est pas dÃ©fini.
6. **Interfaces et intÃ©grations** â€” Document Studio, coffre/autorisation, partage externe mobile, puis connexions CRM, achats, finance, RH et logistique. Ajouter les rÃ´les prÃ©cis et journaux dâ€™audit avec ces parcours.
7. **Validation** â€” tests unitaires, isolation multi-tenant, expiration/rÃ©vocation, rejouabilitÃ©, concurrence des numÃ©ros, intÃ©gritÃ© des versions, accessibilitÃ©, rendu imprimÃ© et tests E2E.

## Limites Ã  conserver explicitement

Le stockage local dÃ©jÃ  prÃ©sent ne convient ni aux documents confidentiels ni Ã  lâ€™accÃ¨s multi-utilisateur. Aucun lien public ne doit servir de substitut Ã  une ACL serveur. Sans stockage privÃ©, scanner de fichiers et fournisseur transactionnel configurÃ©s, les uploads et OTP ne doivent pas Ãªtre prÃ©sentÃ©s comme opÃ©rationnels. La conformitÃ© juridique dâ€™une signature Ã©lectronique dÃ©pend du pays, du document et du prestataire retenu.

## Premier incrément livré dans le dépôt

- Migrations additives `0008` et `0009` ajoutent les modèles versionnés, documents et versions, validations, cachets, demandes de signature, événements et partages à jeton haché. Les partages sont limités aux documents marqués publics, finalisés, avec empreinte et référence de stockage.
- L'API tRPC `document` permet de lister et créer des brouillons, gérer des modèles et créer/lister/révoquer des liens. Les opérations sensibles exigent un rôle de gestion et filtrent sur `companyId`.
- `openPublicShare` vérifie le secret, la révocation, l'expiration et la classification puis ne renvoie que des métadonnées. Le secret en clair est renvoyé uniquement à la création et aucun chemin d'objet privé n'est exposé.
- Les uploads, le téléchargement, les commentaires/réponses externes, le code OTP, les notifications, le rendu PDF, le stockage/quarantaine, l'antivirus et les signatures prestataire ne sont pas encore implémentés. Le partage reste donc métadonnées seulement et son endpoint public doit recevoir une limitation de débit persistante avant un déploiement de production.

## Mise à jour du Studio documentaire

Le dashboard expose maintenant `/documents` avec les onglets Documents, Modèles, Partages externes et Signatures & cachets. La page permet de créer des brouillons et modèles, d’activer un modèle, de téléverser un fichier aux formats PDF/PNG/JPEG, de le télécharger et de le finaliser. Le stockage utilise des URL S3 présignées, chiffrement serveur AES-256 et exige un scan antivirus HTTP positif (`{ "clean": true }`) avant l’écriture.

Les partages demandent l’adresse du destinataire, une portée lecture/commentaire/dépôt et une expiration. L’accès au document exige un code OTP envoyé par SendGrid ; les codes sont hachés, expirent après 10 minutes et sont limités à 5 tentatives. Les sessions sont hachées et expirent après 8 heures au plus. Les commentaires et fichiers reçus sont visibles dans la page interne et les dépôts passent aussi par le scanner.

Les secrets S3, antivirus et e-mail sont documentés dans `.env.example` et `docs/deployment-vercel.md`. Aucune de ces intégrations n’est activée sans secrets fournis. L’intégration d’un prestataire de signature électronique n’est toujours pas implémentée et nécessite le choix du fournisseur et la validation juridique du parcours.

## Prestataire retenu : DocuSign

Le Studio inclut un parcours serveur JWT pour envoyer un PDF finalisÃ© Ã  un signataire DocuSign, enregistrer la rÃ©fÃ©rence d'enveloppe et actualiser son Ã©tat. L'interface exige un repÃ¨re d'ancrage prÃ©sent dans le PDF. Les clÃ©s et le consentement restent Ã  configurer par environnement ; les demandes sont bloquÃ©es tant que DocuSign ne rÃ©pond pas comme configurÃ©. En attendant une intÃ©gration Connect, la vÃ©rification manuelle du statut est limitÃ©e Ã  une fois toutes les 15 minutes par enveloppe. Les signatures prestataire ne sont pas prÃ©sentÃ©es comme des signatures qualifiÃ©es.
