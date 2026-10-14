# Déploiement Vercel depuis GitHub

Le build de production doit utiliser la branche `main` de
[`IDIBAgroup/IDIBA-GESTION`](https://github.com/IDIBAgroup/IDIBA-GESTION).
Le projet communiqué est `idibagestion-apk-ql2x`, dans l'équipe
`idibagroups-projects`.

Le statut GitHub du commit `a6d3d16` a également confirmé un déploiement
automatique dans le projet `idiba-gestion` de cette équipe. Vérifier le projet
et le SHA affichés dans les journaux avant de comparer deux déploiements.

## Réglages du projet

Dans les réglages Vercel, vérifier la liaison GitHub et les valeurs suivantes :

| Réglage | Valeur |
| --- | --- |
| Production Branch | `main` |
| Root Directory | Racine du dépôt (`.`) |
| Framework Preset | Next.js |
| Node.js Version | `24.x` |
| Install Command | `npm ci --registry=https://registry.npmjs.org/ --replace-registry-host=always` |
| Build Command | `npm run build` |
| Output Directory | Valeur Next.js détectée par Vercel |

`engines.node` dans `package.json` fixe Node.js sur `24.x`.
Les dépendances de développement sont nécessaires à la compilation, notamment
TypeScript, Tailwind CSS et PostCSS. Ne pas utiliser `--omit=dev` pour l'installation
du build. Le verrou npm doit être commité avec le manifeste.

`vercel.json` impose cette commande d'installation. `replace-registry-host=always`
remplace par le registre officiel l'hôte des URL de tarball enregistrées dans le
verrou, y compris celui d'un ancien miroir. `.npmrc` applique le même réglage
aux installations locales.

## Variables et base de données

Configurer `DATABASE_URL` dans les variables Vercel de chaque environnement
utilisé, avec une base MySQL accessible depuis Vercel et ses migrations appliquées.
Le build importe l'API seulement à la première requête : un build réussi sans
cette variable ne valide pas le fonctionnement de l'API.

Pour activer Google OAuth, configurer `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
et `GOOGLE_REDIRECT_URI`. Cette dernière doit être l'URL HTTPS exacte du callback
`/api/auth/google/callback`, également autorisée dans Google Cloud Console.
`GOOGLE_ADMIN_EMAIL` et `GOOGLE_LOGIN_HINT` sont facultatifs. Voir le README
pour les droits administrateur et la migration Google.

Pour activer le Studio documentaire, configurer `DOCUMENTS_S3_BUCKET`,
`DOCUMENTS_S3_REGION`, `DOCUMENTS_S3_ACCESS_KEY_ID` et
`DOCUMENTS_S3_SECRET_ACCESS_KEY` pour un bucket privé, puis
`DOCUMENTS_ANTIVIRUS_URL` et `DOCUMENTS_ANTIVIRUS_TOKEN`. Le scanner doit accepter
le fichier brut en POST et répondre avec `{ "clean": true }` uniquement après
analyse réussie. Les dépôts sont refusés si le scanner est absent ou indisponible.
Les URL de téléchargement sont signées et expirent après 60 secondes.

Les partages externes exigent aussi `DOCUMENTS_EMAIL_API_KEY` et
`DOCUMENTS_EMAIL_FROM` pour l’envoi des codes OTP via SendGrid. Les liens ne
révèlent aucun contenu avant vérification, expirent au plus tard après 30 jours,
et chaque session OTP expire au plus tard après 8 heures.

## Signature DocuSign

Le Studio documentaire peut envoyer les PDF finalisés vers DocuSign avec le flux
JWT serveur. Définir `DOCUMENTS_DOCUSIGN_INTEGRATION_KEY`,
`DOCUMENTS_DOCUSIGN_USER_ID`, `DOCUMENTS_DOCUSIGN_ACCOUNT_ID`,
`DOCUMENTS_DOCUSIGN_PRIVATE_KEY`, `DOCUMENTS_DOCUSIGN_OAUTH_HOST` et
`DOCUMENTS_DOCUSIGN_BASE_URI` comme secrets/variables serveur. Pour le bac à sable,
utiliser l'hôte OAuth `account-d.docusign.com` et l'URI API
`https://demo.docusign.net`. Le compte de production fournit son URI API propre.
Le propriétaire de l'intégration doit accorder le consentement `signature`
`impersonation` au compte utilisateur et enregistrer la clé publique RSA auprès
de DocuSign. Ne jamais exposer la clé privée au navigateur.

Le document PDF doit contenir le repère configuré dans l'interface (par défaut
`{{SIGN_HERE}}`) à l'endroit voulu. L'application envoie une enveloppe au
signataire et permet une actualisation manuelle du statut au plus une fois toutes
les 15 minutes. Les webhooks Connect restent à configurer pour un suivi immédiat.
L'empreinte du fichier ne certifie pas à elle seule une signature qualifiée.

Les valeurs secrètes restent dans le gestionnaire Vercel. Le mode de démonstration
est limité au développement par le code. Les migrations se valident et s'appliquent
séparément du build selon la procédure du README.

## Publication et validation

Avant publication, valider `npm ci`, `npm run build`, `npm test` et
`npm audit --omit=dev`. Examiner les modifications et obtenir l'autorisation de
publication requise pour ce projet, puis pousser sur `origin/main` sans forcer.

Dans Vercel, vérifier qu'un déploiement issu de ce commit GitHub a démarré.
Contrôler ses journaux d'installation et de build, son état final, puis son URL :
accueil, connexion et ressources statiques. Les routes métier et l'authentification
nécessitent également la base configurée. Consulter les données de production
sans les modifier.

Si un build échoue avec `Exit handler never called!`, relever d'abord la version
Node/npm, l'erreur réseau éventuelle et le commit construit dans ses journaux.
Un build local ne permet pas d'attribuer la cause de cette erreur Vercel.

Si `ENOTFOUND npm.mirrors.msh.team` apparaît, vérifier que le déploiement utilise
le commit contenant `vercel.json` et que sa commande d'installation reprend les
options ci-dessus. La configuration distante effective reste à contrôler si le
miroir persiste.

Référence : [configuration Node.js sur Vercel](https://vercel.com/docs/functions/runtimes/node-js/node-js-versions).
