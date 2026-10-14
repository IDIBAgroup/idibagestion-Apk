# Migrations Drizzle


Les fichiers SQL, `meta/_journal.json` et les snapshots décrivent maintenant la même séquence :

1. `0000_talented_roxanne_simpson` : schéma historique initial.
2. `0001_transaction_verification` : création des tables `clients` et `products`, ajout des champs d’identification d’entreprise et de `transactions.isVerified`.
3. `0002_company_memberships` : rôles par entreprise et reprise des propriétaires existants dans `company_memberships`.
4. `0003_partner_account_invitations` : lien stable entre un compte utilisateur et un partenaire, puis invitations à usage unique.
5. `0004_company_access_invitations` : invitations d’accès aux entreprises.
6. `0005_production_auth` : identifiant externe optionnel, adresse e-mail unique, hash du mot de passe et sessions serveur.
7. `0006_google_auth` : liaison stable des comptes Google et transactions OAuth temporaires.
8. `0007_subscription_packs_and_pricing` : mise à jour des trois offres, de leurs quotas, descriptifs et tarifs pour les cycles mensuel et annuel.
9. `0008_outstanding_centennial` : tables additives pour les documents, leurs versions, modèles versionnés, validations, cachets, signatures internes, partages externes et événements.
10. `0009_slippery_the_santerians` : classification de confidentialité pour réserver le partage public aux documents explicitement publiables.
11. `0010_silly_ink` : OTP persistant pour les partages, sessions externes, commentaires et pièces jointes.
12. `0011_spicy_franklin_richards` : horodatage du dernier contrôle manuel de statut d'une demande de signature.
13. `0012_daffy_jackpot` : empreinte SHA-256 de la version de document associée à une demande de visa interne.

`npm run db:check` vérifie la cohérence du journal et des snapshots sans connexion à une base. `npm run db:generate` génère les prochains changements depuis `db/schema.ts`.

## Déploiement

Aucune URL `DATABASE_URL` de déploiement n’est configurée dans cet environnement. Les migrations n’ont donc pas été appliquées à une base distante. Avant `npm run db:migrate`, comparer le schéma réel de la base cible à cet historique, vérifier les doublons d’e-mail et valider la séquence sur une base de staging selon la procédure PlanetScale du projet. Une base créée ou modifiée avec `db:push` peut déjà contenir une partie des changements.

Le journal conserve l’horodatage historique de la migration initiale afin que Drizzle ne la rejoue pas sur une base qui l’a déjà enregistrée. La migration des adhésions remplit `company_memberships` depuis `companies.ownerUserId`; le contrôle propriétaire existant dans l’application reste actif durant ce déploiement.

Les invitations ne stockent que le hash du secret. Le lien en clair n’est présenté qu’à l’administrateur lors de sa création et expire après sept jours.

La migration d’authentification renomme `users.unionId` en `users.externalId` en conservant ses valeurs historiques, permet plusieurs comptes sans identité fédérée, ajoute un hash de mot de passe optionnel pour les comptes historiques et rend les e-mails uniques. Les comptes historiques sans hash doivent recevoir un mot de passe via `npm run auth:create-user` avant de pouvoir se connecter.

La migration `0006_google_auth.sql` ajoute l’identifiant Google stable (`googleSub`) et une table de transactions OAuth éphémères. Appliquez-la avant d’activer les variables `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` et `GOOGLE_REDIRECT_URI`.
