# Architecture cible — IDIBAGES

**Décision proposée :** un SaaS multi-tenant construit comme un monolithe modulaire, servi au départ par une seule application web, une API TypeScript centrale et une base PostgreSQL partagée. Les frontières de sécurité et de données sont définies dès le départ ; les déploiements séparés viendront seulement lorsqu’un besoin mesurable le justifiera.

**Périmètre :** cette proposition s’appuie sur le dépôt inspecté en septembre 2026. Elle distingue l’existant des évolutions recommandées. Les sous-domaines ci-dessous sont des noms de conception, à confirmer selon le domaine réellement détenu par IDIBA.

## Synthèse des décisions

| Sujet | Décision cible |
|---|---|
| Architecture logicielle | Monolithe modulaire TypeScript, organisé par domaines métier et contrats explicites |
| Interface | Une SPA React/Vite claire et cohérente, navigation par rôles et modules |
| API | Hono et tRPC conservés pour l’application ; REST/OpenAPI versionné pour les intégrations publiques |
| Identité | Adaptateur d’authentification unique ; fournisseur actuel encapsulé, IAM externe remplaçable |
| Autorisation | RBAC avec permissions d’action et portée tenant/entreprise/équipe/ressource |
| Multi-tenant | Un tenant représente l’organisation cliente ; entreprises légales et établissements en dessous |
| Données | Cible PostgreSQL partagé avec tenant_id partout, contraintes composites et RLS en défense supplémentaire |
| Paiements | Aucun fournisseur activé tant que le choix n’est pas fait ; confirmation uniquement serveur et vérifiable |
| Travail asynchrone | Transactional outbox et worker ; file externe ajoutée quand les volumes ou la disponibilité l’exigent |
| Déploiement initial | Front statique derrière CDN/proxy, API Node, worker léger, base gérée et stockage objet |

## État observé dans le dépôt

- **Frontend :** React 19, TypeScript, Vite, React Router, Tailwind et composants Radix/shadcn. Zustand et React Query sont présents. Les écrans couvrent déjà le tableau de bord, les clients, les partenaires, les ressources, les projets, les RH/paie, les finances et les portails.
- **Backend :** Hono expose les routes d’authentification, le webhook de paiement et l’API tRPC. Les comptes sont provisionnés par un outil opérateur; l’inscription publique reste fermée.
- **Base :** Drizzle avec mysql2 en mode PlanetScale. Le schéma comprend maintenant les adhésions par entreprise, invitations d’accès entreprise et invitations de rattachement partenaire. Le modèle organization/tenant complet, l’audit et les domaines RH/comptabilité/projets restent à construire. Le journal et les snapshots Drizzle sont synchronisés.
- **Authentification :** connexion e-mail/mot de passe avec scrypt, limite de tentatives par e-mail, sessions aléatoires conservées sous forme de hash en base, cookie HttpOnly/SameSite=Lax/Secure en production, révocation à la déconnexion et au changement de mot de passe. L’ancienne colonne d’identité externe est conservée sous le nom `externalId`; les comptes historiques sans hash doivent être réinitialisés par un opérateur.
- **Accès :** les routes d’entreprise consultent les adhésions actives et leurs rôles, avec un contrôle ownerUserId conservé pendant la migration. Le portail partenaire utilise désormais le lien stable partners.userId, attribué par invitation à usage unique.
- **Paiements :** l’interface PaymentGateway et le webhook sont préparés pour valider côté serveur le callback, la référence, le montant, XAF, l’état et l’idempotence avant activation de l’abonnement. Aucun adaptateur fournisseur n’est enregistré ; le webhook reste indisponible et l’interface de paiement est désactivée.
- **Maturité métier :** de nombreuses pages sont alimentées par des stores locaux ou des données de démonstration. Elles ne doivent pas être considérées comme des modules métier déjà persistés et cloisonnés sur le serveur.
- **Exploitation :** le projet est encore une application Vite/Hono dans un même dépôt, sans espaces npm/workspaces établis. Les commandes de build, migration, cohérence Drizzle et tests existent ; les pipelines et environnements restent à structurer.

## Livrables 1 et 2 — architectures fonctionnelle et technique

### Architecture fonctionnelle

Le produit suit un parcours commun : une personne s’authentifie, choisit une organisation et une entreprise, puis voit les modules activés pour son rôle et son abonnement. Les modules métier partagent le référentiel organisationnel et les services transversaux ; chacun reste responsable de ses règles, de ses données et de ses permissions.

1. **Core / Hub** — identité applicative, tenants, adhésions, entreprises légales, établissements, rôles, droits, forfaits, souscriptions, configuration, audit, notifications, connecteurs et sélection du contexte de travail.
2. **CRM & ventes** — clients, prospects, contacts, opportunités, offres, campagnes et pipeline.
3. **Prospection partenaires** — portefeuilles et prospects apportés par des partenaires, règles de protection, commissions et portail externe. Fonctionnellement rattaché au domaine commercial ; ne pas dupliquer le CRM.
4. **Projets** — portefeuille, tâches, jalons, responsables, budgets, risques et temps. Conversion d’une opportunité gagnée en projet par un événement métier.
5. **People / RH** — dossiers des employés, contrats, recrutement, congés, évaluations et organisation interne.
6. **Paie** — calculs, bulletins, retenues, périodes et exports. Sous-domaine RH mais frontière d’accès renforcée, règles versionnées par pays et données très sensibles.
7. **Finance** — facturation commerciale, dépenses, trésorerie, rapprochements, comptabilité, journaux et clôtures. Garder le grand livre et les règles comptables dans une frontière métier cohérente.
8. **Workplace / ressources** — bibliothèque, documents, base de connaissances, chat et réunions. La recherche, l’envoi de fichiers et le chat temps réel peuvent être extraits ultérieurement si leurs besoins divergent.
9. **Pilotage / analytics** — indicateurs agrégés par domaine, entreprise et période ; les rapports ne doivent pas contourner les droits sources.
10. **Administration SaaS** — support et opérations de plateforme séparés de l’administration d’une organisation cliente ; toute consultation opérateur est limitée et auditée.

**Fusionner :** CRM et prospection dans le même domaine commercial ; paie et RH dans la même application au départ, mais avec permissions et schémas séparés ; bibliothèque, connaissance et documents dans Workplace.

**Séparer :** Core SaaS de l’administration client ; finance des écrans commerciaux ; paie des vues RH ordinaires au niveau des droits ; activité d’un partenaire de celle d’un employé. La séparation désigne d’abord des frontières métier et de sécurité, pas obligatoirement des serveurs distincts.

### Architecture technique

Le serveur garde une seule base de code et un seul déploiement API initial. Chaque domaine expose une surface publique contrôlée (commandes, requêtes, événements) et garde ses dépôts et règles internes. Les autres domaines n’écrivent pas directement dans ses tables. Le worker partage les modules métier mais exécute les tâches longues séparément du processus HTTP.

Le frontend conserve React/Vite : les pages authentifiées sont une SPA, distribuée comme des fichiers statiques. Le site marketing pourra être statique ou rendu côté serveur séparément si le référencement le demande ; une migration globale vers Next.js n’est pas nécessaire. Vite documente la production en fichiers statiques, adaptés à un hébergement statique/CDN ([guide Vite](https://vite.dev/guide/static-deploy)).

Le backend conserve Hono et tRPC à court terme. tRPC est adapté au client TypeScript de première partie déjà présent. Les intégrations externes reçoivent plutôt une API REST documentée et versionnée avec contrat OpenAPI, clés limitées, idempotence et quotas. N’introduire NestJS que si la taille de l’équipe ou du code rend ses modules, gardes et conventions réellement utiles ; ne pas réécrire pour changer de framework.

### Livrable 3 — schéma d’architecture ASCII

~~~text
Employés / Admins / Partenaires / Clients
                  |
        app.idibages.cm (SPA React)
          | OIDC/session, HTTPS
          v
   api.idibages.cm (Hono + tRPC)
          |
   +------+-------------------------------+
   | Core / IAM / Tenant / RBAC / Audit   |
   +------+-------------------------------+
          |
   +------+---------+----------+----------+-----------+
   | Commercial     | People   | Projets  | Finance   |
   | CRM + partners | RH/Paie  |          |           |
   +------+---------+----------+----------+-----------+
          | commandes, événements, outbox
          v
 PostgreSQL partagé       Worker / file de travaux
          |                | email, exports, webhooks
          +----------------+------------------------+
          | stockage objet, fournisseur d’identité,
          | paiement choisi ultérieurement, email/SMS
          v
 admin.idibages.cm : console SaaS avec contrôle renforcé
~~~

## Livrables 4 et 5 — sous-domaines et modules

### Sous-domaines finaux visés

| Sous-domaine | Fonction | Mise en place |
|---|---|---|
| www.idibages.cm | Site public, documentation commerciale | Séparé si nécessaire pour référencement et contenu |
| app.idibages.cm | Application, espace de travail, navigation et tous les modules métier | Hôte unique au lancement ; modules sous des routes |
| api.idibages.cm | API privée de l’application, API publique versionnée et webhooks | Un service API modulaire initial |
| auth.idibages.cm | Point d’entrée IAM, fédération et SSO | Alias logique au départ ; service IdP distinct si un IAM central est nécessaire |
| admin.idibages.cm | Console de plateforme réservée au personnel IDIBA habilité | Peut d’abord être une route protégée ; isoler l’origine avant d’accorder accès support |
| crm.idibages.cm | CRM et prospection commerciale | Candidat futur si le déploiement indépendant apporte un bénéfice |
| people.idibages.cm | RH et paie | Un seul domaine logique ; séparer l’accès paie même si l’hôte reste commun |
| projects.idibages.cm | Gestion de projets | Futur, sans déploiement distinct initial |
| finance.idibages.cm | Facturation, comptabilité et trésorerie | Futur, avec règles et audit dédiés |
| workplace.idibages.cm | Ressources, documents, chat et réunions | Futur ; le chat temps réel peut être extrait plus tôt si requis |

**Règle :** au lancement, seule l’application, l’API et éventuellement la console ont une adresse distincte. Les hôtes par module sont des possibilités de routage produit, pas une promesse de microservices ou de bases séparées. Des hôtes d’application multiples ajoutent CORS, configuration SSO, cookies, observabilité et procédures de déploiement.

### Livrable 6 — matrice Module × Utilisateurs × Permissions × Données × API

| Module | Utilisateurs | Permissions dominantes | Données possédées | API / événements |
|---|---|---|---|---|
| Core / IAM | Tous, owner, administrateur d’organisation, support autorisé | Gérer tenant, adhésions, rôles, entreprises, forfaits ; support plateforme séparé et audité | tenants, memberships, companies, roles, permissions, plans, subscriptions, audit | sessions, contextes tenant, adhésions ; TenantCreated, MembershipChanged |
| CRM | Ventes, managers, direction | lire/assigner/modifier prospects et comptes selon propriétaire, équipe ou entreprise | clients, contacts, prospects, opportunités, pipeline | CRM interne tRPC ; API REST partenaire ; OpportunityWon |
| Partenaires | Partenaire invité, responsable partenaire, commercial | accès aux prospects attribués et à ses commissions ; aucun accès transversal par défaut | profil partenaire, prospects attribués, contrats et commissions | portail filtré ; PartnerProspectSubmitted, CommissionValidated |
| Projets | Chef de projet, contributeurs, direction | gérer ses projets ; visibilité membre, département ou tenant selon politique | projets, tâches, budgets, jalons, risques, temps | commandes/query projets ; ProjectCreated, ProjectStatusChanged |
| RH | RH, manager limité, employé | accès selon population et lien hiérarchique ; employé à ses données | dossiers RH, congés, recrutement, évaluations | API RH ; LeaveRequested, LeaveApproved |
| Paie | Paie habilitée, approbateur dédié, employé pour son bulletin publié | accès paie distinct ; préparer, valider et publier séparément | salaires, éléments de paie, calculs, bulletins, exports | API paie ; PayrollCalculated, PayrollApproved |
| Finance | Comptable, contrôleur, direction | séparation saisie/validation/paiement ; portée société et période | factures, dépenses, comptes, écritures, rapprochements | API finance ; InvoiceIssued, PaymentReconciled, PeriodClosed |
| Workplace | Tous selon adhésion ; invités sur espaces explicitement partagés | lire/écrire dans les espaces autorisés ; fichiers privés contrôlés | documents, articles, salons, messages, réunions | API fichiers et contenus ; DocumentShared, MeetingScheduled |
| Analytics | Direction et managers selon périmètre | rapports filtrés selon les droits du domaine source ; export audité | agrégats et vues de lecture, pas copie libre des données sensibles | endpoints de lecture ; projections mises à jour par événements |
| Admin SaaS | Opérations IDIBA spécialement habilitées | opérations plateforme ; accès exceptionnel aux données client, motif et audit obligatoires | configuration plateforme, support, traces opérateur | API admin séparée logique ; événements SupportAccessGranted |

## Livrable 7 — stratégie multi-tenant

### Modèle cible

~~~text
Plateforme IDIBAGES
└── Tenant = organisation cliente / contrat SaaS
    ├── Membres (users ↔ tenant, rôle et statut)
    ├── Entreprises légales (une ou plusieurs)
    │   └── Établissements / unités opérationnelles
    ├── Départements et équipes
    ├── Abonnement et fonctionnalités activées
    └── Invités externes : partenaires, clients ou fournisseurs
~~~

Un compte utilisateur peut être membre de plusieurs tenants. Une entreprise légale est une entité opérationnelle ou juridique d’un tenant, et non le tenant lui-même. Un partenaire externe est un acteur invité ou une organisation partenaire rattachée par adhésion explicite ; son adresse e-mail seule ne lui donne aucun droit.

Chaque table métier porte tenant_id non nul ; company_id et éventuellement business_unit_id précisent la portée. Les index uniques et références incluent le tenant (par exemple tenant_id + numéro de facture) pour empêcher les collisions inter-entreprises. Les données globales de catalogue sont identifiées explicitement comme globales et ne mélangent pas leur portée avec les enregistrements client.

À chaque requête, le serveur authentifie l’utilisateur, résout le tenant actif parmi ses adhésions, puis vérifie la permission et la portée de la ressource. Le tenant transmis par le navigateur est une sélection, jamais une preuve d’accès. Les fonctions métiers reçoivent un contexte d’autorisation serveur et filtrent les données systématiquement. Les identifiants opaques réduisent l’énumération mais ne remplacent pas les contrôles.

Le rôle admin de plateforme n’est pas un contournement silencieux des règles : accès exceptionnel limité dans le temps, motif, identité opérateur et journalisation. Les partenaires passent par le même moteur de permissions avec des permissions d’invité, sans rôle global de confiance.

### Plan de migration du modèle actuel

1. Ajouter Organization/Tenant, Membership, TenantRole/Permission et la relation Company légale ; créer un tenant pour chaque entreprise existante.
2. Convertir ownerUserId en adhésion propriétaire explicite, puis relier les comptes applicatifs aux membres.
3. Ajouter tenant_id aux clients, produits, abonnements, transactions, factures et objets partenaire lorsque leur relation le justifie ; remplir les anciennes lignes par jointure contrôlée.
4. Modifier les procédures pour exiger le contexte tenant côté serveur. Retirer la confiance donnée aux seuls companyId/email envoyés par le navigateur.
5. En production, vérifier les comptages et les clés avant de rendre tenant_id obligatoire ; garder une sauvegarde restaurable et effectuer la bascule par migrations compatibles.
6. Bloquer l’accès direct aux nouvelles routes métier tant que le contrôle d’adhésion n’est pas appliqué ; journaliser les refus sans enregistrer de données sensibles.

## Livrable 8 — SSO / IAM

- Unifier l’entrée utilisateur vers un seul parcours et un seul objet User applicatif ; garder les règles métier indépendantes du fournisseur d’identité choisi.
- L’IdP prouve l’identité ; le Core IDIBAGES décide de l’organisation, des rôles et des autorisations. Le rôle n’est jamais déduit d’un profil OAuth ou d’un e-mail.
- Si plusieurs frontends ou applications sont introduits, utiliser un fournisseur central OIDC et le flux Authorization Code avec PKCE. Les applications vérifient l’état de session côté serveur et n’échangent pas des jetons durables entre sous-domaines.
- Garder une session serveur courte, révocable et renouvelée selon une politique définie. Prévoir déconnexion globale, suppression d’adhésion, révocation de session et journal des connexions.
- Exiger MFA pour les comptes plateforme, administrateurs, paie et finance dès que le fournisseur le permet ; demander une réauthentification pour les actions à risque.
- Choisir et intégrer un fournisseur d’identité ou un mécanisme interne avant la production ; définir MFA, récupération de compte et gestion des sessions sans coder un IAM maison.
- En production, utiliser un cookie de session HTTPS avec Secure, HttpOnly et SameSite ; protéger les mutations contre CSRF et ne pas stocker de session dans localStorage. Les recommandations OWASP détaillent ces attributs ([OWASP Session Management](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html)).

## Livrable 9 — stratégie de sécurité

1. **Autorisation serveur par défaut refusée :** permission à chaque action et chaque ressource ; rôle seul insuffisant. Appliquer le moindre privilège et auditer les changements de rôles. OWASP recommande une politique deny-by-default et des autorisations explicites ([OWASP Authorization](https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html)).
2. **Barrière tenant :** utiliser des helpers centraux et contrôles de périmètre réutilisables ; requêtes filtrées tenant et contraintes de données. Sur PostgreSQL, activer RLS en deuxième barrière pour les tables tenant-owned. Le rôle applicatif ne doit pas être propriétaire des tables ni contourner les politiques ; utiliser FORCE ROW LEVEL SECURITY et initialiser le tenant dans chaque transaction. PostgreSQL précise que l’absence de policy conduit au refus par défaut, mais que propriétaires et superutilisateurs peuvent contourner RLS ([PostgreSQL Row Security](https://www.postgresql.org/docs/17/ddl-rowsecurity.html)).
3. **Séparer les données sensibles :** paie, coordonnées bancaires, pièces RH et informations financières ont des permissions et exports distincts ; chiffrer le transport et les sauvegardes, limiter l’accès au stockage objet, masquer les champs dans les logs et limiter les exports.
4. **Sessions et navigateur :** TLS partout, cookie HttpOnly/Secure/SameSite, CSP, CSRF, rotation après élévation, expiration et révocation. Éviter un cookie de session partagé sur tous les sous-domaines.
5. **API :** validation Zod côté serveur, limites de taille et de fréquence, contrôle des origines, pagination maximale, erreurs sans stack trace, idempotence pour paiements et commandes à effet financier.
6. **Paiement :** le navigateur ne marque jamais une transaction réglée. La confirmation serveur vérifie signature ou API du fournisseur, référence interne, montant attendu, XAF, statut terminal, référence fournisseur et idempotence dans une transaction SQL. Prévoir rapprochement et procédure de remboursement ; journaliser les événements.
7. **Fichiers :** URL pré-signées de courte durée, contrôle d’accès à la création et au téléchargement, limite de taille/type, analyse antivirus, rétention et liens non publics.
8. **Secrets et exploitation :** secrets en gestionnaire dédié, rotation, comptes de base séparés par environnement, sauvegardes chiffrées et test de restauration, correctifs de dépendances, environnements staging/prod distincts.
9. **Audit :** acteur, tenant, ressource, action, horodatage, résultat et motif pour actions sensibles. Journal append-only avec accès limité ; ne pas y copier le bulletin, les tokens ou les secrets.
10. **Tests de sécurité à inclure dans la feuille de route :** tests négatifs inter-tenant, escalade de rôles, accès partenaire hors portefeuille, session révoquée, webhook invalide/dupliqué et contournement UI. Ils sont des critères de recette, pas des tests exécutés dans le cadre de cette analyse.

## Livrable 10 — stratégie de base de données

### Choix d’isolation

| Option | Atout | Coût / risque | Usage |
|---|---|---|---|
| Base dédiée par tenant | Isolation et restauration par client simples à raisonner | migrations, connexions, coûts et supervision multipliés | Clients grands comptes ou exigence contractuelle |
| Schéma SQL par tenant | Limite certains accès accidentels | explosion des schémas et migrations plus délicates | Peu de tenants avec forte personnalisation |
| Base et tables partagées | Coût faible et opérations simples | une erreur de filtre expose d’autres tenants | Bon socle SaaS avec contrôles stricts |
| Hybride | Mutualisé par défaut, dédié pour clients qui le justifient | demande un routage des connexions discipliné | Cible d’évolution recommandée |

**Cible retenue :** mutualisé au lancement, avec tenant_id partout, clés/indices composites, rôles SQL restreints et RLS comme défense supplémentaire. Garder une voie d’isolation dédiée pour les gros clients ; aucune donnée métier ne doit dépendre d’un routage futur impossible.

### Choix du moteur

Le dépôt utilise actuellement MySQL/PlanetScale. Comme l’application métier et le modèle tenant ne sont pas encore généralisés, décider du moteur avant les modules Finance/Paie en production. La recommandation cible est PostgreSQL pour les transactions relationnelles, contraintes, reporting SQL et RLS. Cette décision implique de migrer le pilote Drizzle/mysql2, les migrations, le mode PlanetScale et toutes les requêtes propres au moteur. Si une exploitation réelle ou une contrainte fournisseur impose MySQL, le garder est raisonnable, mais il faudra assumer l’absence de RLS et renforcer les contrôles explicites de l’application. Ne pas entretenir deux moteurs en parallèle.

### Modèle de données et cohérence

- Base opérationnelle normalisée par domaine ; clés étrangères et contraintes tenant-aware.
- Montants stockés avec devise, unités mineures ou décimales exactes, jamais en nombres flottants. XAF est le cas initial ; la devise doit rester explicite.
- Finance : écritures comptables équilibrées, journaux append-only après validation, correction par contre-écriture, clôtures datées et piste d’audit. Les règles locales ne sont pas codées en constantes globales.
- Paie et fiscalité : jeux de règles versionnés par pays, date d’effet et entreprise ; résultats recalculables à partir des paramètres historisés. Validation par un professionnel local avant usage légal.
- Fichiers dans stockage objet privé, métadonnées et tenant_id en base. Ne pas stocker les blobs en base relationnelle.
- Analytics d’abord par vues et agrégats filtrés ; entrepôt ou réplique de lecture lorsque le volume et la charge de rapports le justifient.
- Sauvegardes chiffrées, restauration par point dans le temps si le service choisi le permet, exercices de restauration documentés.

## Livrable 11 — API / event-driven

- Les commandes sensibles (droits, publication paie, clôture, abonnement) sont synchrones et contrôlées dans le domaine propriétaire.
- Garder tRPC pour le client web de première partie. Publier une REST API versionnée pour clients externes et intégrations, avec contrat OpenAPI, permissions par scope, pagination, quotas et politique de retrait de version.
- Introduire un événement métier après validation d’une transaction : OpportunityWon, ProjectCreated, PayrollApproved, InvoiceIssued, SubscriptionChanged. Événements versionnés, sans données personnelles inutiles.
- Écrire l’événement dans la table outbox dans la même transaction que le changement métier. Un worker publie ensuite, avec reprise, dédoublonnage, état d’échec et dead-letter. Cela évite qu’une écriture réussie perde sa notification si l’envoi échoue ; voir le modèle outbox documenté par AWS ([Transactional outbox](https://docs.aws.amazon.com/prescriptive-guidance/latest/cloud-design-patterns/transactional-outbox.html)).
- Démarrer sans Kafka : table outbox et worker, puis file managée ou Redis/BullMQ si le volume, les reprises ou les tâches longues le demandent.
- Webhooks entrants : vérifier cryptographiquement l’émetteur, conserver l’identifiant événement unique, répondre de façon idempotente, puis traiter la mutation dans une transaction. Les webhooks sortants sont signés, limités en débit et rejouables.
- Éviter les appels directs aux tables d’un autre module. La donnée de référence appartient au domaine propriétaire ; une projection locale est reconstruite à partir d’événements.

## Notifications, recherche, workflows et IA

- **Notifications :** centre in-app dès le socle ; email en premier canal externe ; SMS/WhatsApp via fournisseurs identifiés plus tard. Préférences par utilisateur, langue, module et type. Dédupliquer les envois et permettre de voir l’état de livraison.
- **Recherche globale :** commencer par la recherche plein texte SQL filtrée par tenant et permissions. Une personne ne doit jamais trouver dans les résultats le nom ou l’extrait d’une donnée qu’elle ne peut pas ouvrir. Extraire vers un moteur dédié seulement avec preuve de besoin.
- **Automatisation :** commencer par quelques transitions explicites et auditées — opportunité gagnée vers projet, congé approuvé vers calendrier, facture en retard vers notification. Versionner les workflows et enregistrer l’identité du déclencheur.
- **IA :** proposer aide à la qualification CRM, synthèse de documents et assistance de reporting après fiabilisation des permissions. Ne pas envoyer données RH, paie ou finance vers un modèle externe sans contrat, réglages de conservation, filtrage d’accès et consentement adaptés. Toute recommandation de recrutement, paie ou décision financière reste validée par un humain.

## UX/UI et design system

Conserver une interface française en premier, claire et lisible, adaptée au mobile et à une connexion lente. Une navigation commune comprend sélecteur d’organisation/entreprise, accès aux modules autorisés, recherche, notifications, aide et profil. Les portails externes gardent leur contexte visuel IDIBAGES mais n’exposent aucune navigation interne non autorisée.

Formaliser les tokens de couleur, typographie, espacements, densité des tableaux, formulaires, états vide/chargement/erreur, accessibilité clavier et formats de date/nombre/devise. Les pages métier réutilisent les composants plutôt que recréer chacun son thème. Français au lancement ; anglais et autres langues peuvent s’ajouter sans dupliquer les règles métier.

Prévoir une PWA pour consultation et brouillons non sensibles quand le réseau est intermittent. Toute mutation hors ligne doit afficher son état et gérer les conflits. Ne pas mettre en file locale les paiements, décisions de paie, changements de permission, clôtures comptables ou données personnelles de haute sensibilité.

## Livrable 12 — DevOps / CI-CD

1. Dépôt monorepo avec lockfile unique, workspaces npm/pnpm et commandes reproductibles.
2. Environnements local, intégration, staging et production isolés ; données de production interdites en environnements inférieurs sans anonymisation.
3. Pipeline à chaque changement : installation immuable, format/lint, vérification TypeScript, tests unitaires/contrats, audit dépendances et build. Les migrations vérifient leur applicabilité en base temporaire.
4. Build en artefacts immuables : bundle web servi statiquement ; image API Node ; image worker si les tâches l’exigent. Déploiement par promotion de la même version de staging vers production.
5. Migrations expand/contract : déployer d’abord champs compatibles, migrer les données, déployer le nouveau code, retirer les anciens champs seulement après observation. Prévoir retour applicatif et restauration DB.
6. Déploiement canari ou progressif quand la plateforme le permet ; health checks, arrêt propre et rollback de l’artefact en cas d’échec.
7. Secrets injectés par environnement depuis un gestionnaire, jamais commités ni incorporés au bundle Vite.
8. Démarrer sans Kubernetes : plateforme de conteneurs gérée ou VM/container géré, base managée, stockage objet et CDN. Terraform/IaC lorsque les environnements sont stables ; Kubernetes seulement si contraintes multi-service, équipes ou plateforme l’imposent.

## Livrable 13 — monitoring

- Instrumenter API et worker avec OpenTelemetry pour traces, métriques et logs corrélés ; la norme fournit ces trois signaux et l’instrumentation nécessaire ([OpenTelemetry concepts](https://opentelemetry.io/docs/concepts/), [instrumentation](https://opentelemetry.io/docs/concepts/instrumentation/)).
- Suivre disponibilité et latence par route, taux d’erreur, connexions DB, temps des requêtes, file d’attente, reprises, webhooks invalides, connexions, refus d’autorisation, génération d’exports et succès de migrations.
- Logs structurés avec request_id, tenant_id pseudonymisé si utile, module et statut ; jamais de cookie, token, contenu de bulletin, coordonnées bancaires ou corps complet d’un webhook.
- Alertes actionnables : dégradation API/DB, échec répété du worker, retard de file, échec backup, échec de callback paiement et anomalies d’accès. Définir les objectifs de service à partir d’une mesure réelle avant d’annoncer un SLA.
- Audit métier stocké et protégé séparément des journaux techniques ; durée de conservation définie selon la finalité et les obligations applicables.

## Livrable 14 — facturation SaaS

Le tenant est l’unité de facturation. Le Core possède les plans, souscriptions, périodes, limites, essais, coupons et entitlements. Une entitlement active un module ou une limite ; elle ne donne jamais à elle seule la permission d’accéder aux données.

Prévoir une offre par modules et paliers de sièges/usage, avec exceptions contractuelles validées côté serveur. Contrôler les plafonds dans les commandes métier et afficher les limites dans l’interface. Conserver l’historique du plan appliqué à chaque période et l’identité ayant modifié une exception.

Le paiement reste non activé tant que le prestataire n’est pas choisi. L’interface de passerelle déjà présente permet une intégration future. Le flux cible est : création serveur d’une transaction pending → redirection ou instruction prestataire → callback signé et vérifié ou consultation API serveur → vérification montant/devise/référence → transition idempotente → activation de souscription → rapprochement et reçu. Ne jamais activer à la réception d’un simple paramètre de retour navigateur.

## Livrable 15 — roadmap de développement

| Phase | Résultat attendu | Conditions de sortie |
|---|---|---|
| 0. Décisions et inventaire | Définir tenant, entreprise, partenaire, rôles, pays pilotes, moteur DB, exigences de conservation et prestataire d’identité | Glossaire validé ; décision de moteur avant les données Finance/Paie |
| 1. Fondation Core | Sessions, organisations, entreprises, adhésions, RBAC, contexte tenant, entitlements, audit, navigation et design system clair | Les endpoints refusent par défaut et les adhésions sont la source d’accès |
| 2. Vertical commercial | Clients, CRM, opportunités, pipeline partenaires ; conversion gagnée vers projet | Données server-side, filtres tenant et parcours commercial opérationnel |
| 3. Projets | Projets, tâches, budgets, responsabilités, notifications et documents liés | Gestion des rôles et fil des événements opérationnels |
| 4. Finance socle | Factures et dépenses, paiements en attente, écritures équilibrées et rapprochement ; intégration de paiement seulement après choix fournisseur | Audit et idempotence vérifiés, exports validés localement |
| 5. RH puis paie | Dossiers RH et congés, puis paie avec règles versionnées et séparation d’approbation | Validation par spécialistes locaux, calcul reproductible et accès cloisonné |
| 6. Workplace | Bibliothèque, recherche, chat et réunions ; stockage objet et notifications | Partage contrôlé et expérience correcte avec réseau faible |
| 7. Échelle et intelligence | Analytics, automatisations, intégrations, extraction ciblée de services | Charge mesurée, contrats stables et bénéfice opérationnel démontré |

À chaque phase : migration de données, modèle de permission, événements, audit, critères d’acceptation et plan de support. Ne pas lancer la comptabilité réglementaire ou la paie officielle avant validation par les responsables locaux compétents.

## Livrable 16 — structure recommandée du monorepo

~~~text
/
├── apps/
│   ├── web/                 # SPA React/Vite, navigation et pages par domaine
│   ├── api/                 # Hono, tRPC, REST/OpenAPI, webhooks
│   └── worker/              # outbox, notifications, imports et exports
├── packages/
│   ├── ui/                  # design system partagé et composants accessibles
│   ├── contracts/           # schémas Zod, contrats API et événements versionnés
│   ├── auth/                # session, identité et adaptateurs OAuth/OIDC
│   ├── authorization/       # permissions, portées et vérifications tenant
│   ├── database/            # schéma, migrations, connexions et accès par domaine
│   ├── domain-core/         # tenants, memberships, plans, audit
│   ├── domain-commercial/   # CRM et partenaires
│   ├── domain-projects/
│   ├── domain-people/       # RH et paie à frontières d’accès distinctes
│   ├── domain-finance/
│   ├── domain-workplace/    # ressources, documents, chat, réunions
│   ├── notifications/
│   ├── api-client/
│   ├── config/              # TypeScript, ESLint, Tailwind
│   └── utils/
├── infra/
│   ├── docker/
│   ├── environments/        # modèles de configuration sans secrets
│   └── terraform/           # quand infra récurrente stabilisée
├── docs/
│   ├── architecture/
│   ├── adr/                 # décisions datées et raisons
│   ├── security/
│   └── runbooks/
└── package.json
~~~

Les dossiers de domaines sont des modules du même serveur et ne correspondent pas chacun à un microservice. Les frontières d’import et les contrats sont contrôlés. Les packages ne deviennent des applications déployées séparément que quand cela réduit un risque ou un coût réel.

## Évolution vers PME, ETI, CEMAC et international

Déployer un service séparément uniquement si le domaine a un propriétaire d’équipe clair, un contrat d’API/événements stable, une contrainte de disponibilité ou de confidentialité distincte, une charge mesurée ou un rythme de livraison qui justifie le coût réseau et opérationnel. Premiers candidats plausibles : livraison de notifications/webhooks, traitement de fichiers, recherche ou chat temps réel.

Garder ensemble au début : Core tenant/IAM, CRM, projets, RH, finance et règles d’autorisation partagées. Une séparation prématurée créerait des transactions distribuées, des retries, des incohérences d’identité, du monitoring multi-service et des coûts d’exploitation avant d’apporter de la valeur. Finance ou paie peut d’abord être séparé par module, schéma, permissions et accès, sans service dédié.

L’expansion CEMAC/internationale utilise des paramètres explicites de pays, devise, fuseau, formats, langues, entités légales et règles fiscales/sociales versionnées. Le socle technique peut être commun ; les règles légales doivent être validées pays par pays. Mesurer la latence depuis les utilisateurs, choisir la région d’hébergement selon résidence et disponibilité réellement requises, puis ajouter réplication ou région dédiée si une exigence l’impose. Concevoir pour réseau intermittent avec cache non sensible et reprises idempotentes.

## Références techniques

- PostgreSQL, Row Security Policies : https://www.postgresql.org/docs/17/ddl-rowsecurity.html
- OWASP, Authorization Cheat Sheet : https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html
- OWASP, Session Management Cheat Sheet : https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html
- Vite, déploiement statique : https://vite.dev/guide/static-deploy
- OpenTelemetry, concepts : https://opentelemetry.io/docs/concepts/
- AWS Prescriptive Guidance, transactional outbox : https://docs.aws.amazon.com/prescriptive-guidance/latest/cloud-design-patterns/transactional-outbox.html

## Suivi de mise en œuvre — fondation des accès

La première tranche de la phase 1 ajoute des adhésions par entreprise avec les rôles propriétaire, administrateur, manager et membre. Les contrôles serveur utilisent ces adhésions ; le propriétaire historique reste accepté pendant la migration. Les administrateurs d’entreprise peuvent consulter, accorder et révoquer des accès selon leur rôle.

Les propriétaires et administrateurs disposent d’un écran pour créer des invitations entreprise à durée limitée et révoquer les accès actifs. Les invitations sont acceptées après authentification dans l’application.

Les comptes partenaires sont désormais associés à un identifiant utilisateur stable au moyen d’une invitation à usage unique. Le secret est stocké sous forme de hash, expire après sept jours et reste dans le fragment du lien navigateur. Les invitations s’appuient maintenant sur la session applicative interne.

Cette tranche ne constitue pas encore le modèle final organization/tenant, ni des permissions métier fines par module. Les rôles entreprise donnent actuellement accès aux routes commerciales déjà protégées au niveau de l’entreprise. Les paiements restent désactivés.

La base visuelle globale utilise maintenant une palette claire ivoire/gris, bleu ardoise et vert sarcelle, avec des tokens partagés pour les pages et l’écran de connexion. Plus Jakarta Sans est réservée aux titres et Inter au corps et aux données. Les icônes React existantes de Lucide gardent un trait arrondi uniforme. L’écran de connexion utilise maintenant les sessions serveur de l’application.

Le flux de paiement reste fermé jusqu’au choix du prestataire. Sans adaptateur enregistré, le webhook répond 503 ; un test protège ce comportement. Dès qu’un fournisseur sera choisi, son adaptateur devra vérifier la signature ou interroger son API avant de produire un événement vérifié.

Le journal Drizzle référence maintenant les migrations 0000 à 0004 et leurs snapshots. `npm run db:check`, `npm run db:generate`, les tests Vitest et le contrôle TypeScript passent. Les migrations n’ont pas été appliquées à une base distante ; comparer d’abord son état réel à la séquence, en particulier si elle a déjà reçu des changements via `db:push`.
