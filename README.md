# IDIBAGES

Application de gestion SaaS construite avec Next.js 16 (App Router), React, TypeScript, Hono, tRPC, Drizzle et MySQL.

Le [guide de déploiement Vercel](docs/deployment-vercel.md) décrit la construction depuis la branche `main` du dépôt GitHub.

## Authentification

Les comptes utilisent une adresse e-mail et un mot de passe. L’inscription publique est désactivée : un administrateur ou un opérateur de déploiement crée les comptes. Aucun compte ni mot de passe par défaut n’est livré avec l’application.

- Mots de passe hachés avec scrypt; minimum 12 caractères.
- Sessions opaques de sept jours. Le navigateur reçoit un cookie HttpOnly, SameSite=Lax et Secure en production; la base ne conserve que le hash du jeton.
- Déconnexion et changement de mot de passe révoquent les sessions concernées.
- Dix tentatives invalides par adresse e-mail sur 15 minutes déclenchent un blocage temporaire dans le processus Node courant.
- Les mutations d’authentification exigent une origine de même site.

Le limiteur de tentatives est en mémoire par processus. Pour plusieurs réplicas, le remplacer par un stockage de limite partagé avant d’augmenter le nombre d’instances.

Le portail partenaire réutilise l’authentification centrale et vérifie son association côté serveur. Les portails client/fournisseur et pages de test utilisent encore des données locales; ils ne sont disponibles qu’en développement et affichent une page indisponible en production.

### Inscription et connexion Google

Le bouton « Continuer avec Google » utilise le flux OpenID Connect côté serveur. Un compte Google vérifié crée un compte IDIBAGES sans mot de passe local, puis dirige son propriétaire vers la création de son espace entreprise. Les comptes existants avec la même adresse ne sont pas liés automatiquement ; exception : l’adresse explicitement définie dans `GOOGLE_ADMIN_EMAIL` peut être liée après vérification Google et recevoir le rôle administrateur.

`GOOGLE_ADMIN_EMAIL` désigne une adresse Google de confiance qui reçoit le rôle administrateur plateforme après vérification de son e-mail. Il est actuellement prérempli avec `idibagroup2020@gmail.com`. Ce rôle donne les droits d’administration de toute la plateforme ; la création de l’entreprise dans le parcours suivant lui attribue aussi le rôle propriétaire de cette entreprise. Le rôle reste enregistré en base même si la variable est ensuite retirée.

Dans Google Cloud Console, créez un client OAuth de type **Application Web** et ajoutez l’URI de redirection exacte de l’environnement (par exemple `https://app.example.com/api/auth/google/callback`) parmi les URI autorisées. Configurez ensuite `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` et `GOOGLE_REDIRECT_URI` dans le gestionnaire de secrets. En local, l’exemple `http://localhost:3000/api/auth/google/callback` est déjà indiqué dans `.env.example`. `GOOGLE_LOGIN_HINT` peut suggérer une adresse dans le sélecteur Google ; cela ne réserve pas le compte ni ne limite les autres adresses. Seuls les scopes `openid`, `email` et `profile` sont demandés.

Le serveur vérifie la signature Google, l’audience, l’émetteur, le nonce et l’adresse e-mail vérifiée. Le flux utilise `state`, PKCE S256 et un cookie de corrélation HttpOnly à durée courte. Appliquez aussi la migration `0006_google_auth.sql` avant d’activer ce bouton sur un environnement connecté à une base.

## Mise en service

1. Copier `.env.example` vers `.env` et renseigner `DATABASE_URL` avec les identifiants MySQL de l’environnement.
2. Installer les dépendances avec `npm ci` sous Node.js 24.
3. Vérifier les doublons d’e-mail avant migration :

   ```sql
   SELECT LOWER(email), COUNT(*)
   FROM users
   WHERE email IS NOT NULL
   GROUP BY LOWER(email)
   HAVING COUNT(*) > 1;
   ```

   Résoudre tout doublon avant de poursuivre, car l’authentification impose une adresse unique.
4. Valider les migrations sur une base de staging, puis lancer `npm run db:migrate`.
5. Créer le premier administrateur depuis un terminal interactif :

   ```powershell
   npm run auth:create-user -- --admin
   ```

   Le mot de passe est saisi sans affichage. Omettre `--admin` pour créer un compte utilisateur. Relancer la commande avec la même adresse réinitialise le mot de passe après confirmation.
6. Construire et démarrer le serveur : `npm run build`, puis `npm start`.

Définir `DATABASE_URL` dans le gestionnaire de secrets de production et servir l’application derrière HTTPS. `npm start` lance Next.js en production et utilise `PORT` si cette variable est définie, sinon le port 3000.

## Développement

```powershell
npm run dev
```

Par défaut, `next dev` active une session administrateur et des données de démonstration, sans base de données. Définir `DESIGN_MODE=0` pour utiliser la base MySQL et les comptes provisionnés. Le mode de démonstration est toujours désactivé en production.

## Vérifications

```powershell
npm run check
npm test
npm run db:check
```
