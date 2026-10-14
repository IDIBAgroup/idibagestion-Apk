# Audit responsive et PWA IDIBAGES

## Diagnostic du dépôt

- Le dépôt déployé utilise Next.js 16.4, React 19 et l’App Router (`app/`), même si le brief mentionne Vite.
- Le shell partagé des écrans ERP est `components/layout/AppLayout.tsx`, avec `Header.tsx`, `Sidebar.tsx`, les pages métier dans `views/` et les routes App Router.
- L’authentification passe par les providers tRPC et des cookies de session. La sélection d’entreprise est chargée depuis le serveur via `useActiveCompany`; elle ne doit pas être remplacée par des données hors ligne locales.
- La politique de cache côté service worker était inexistante. Le store hors ligne était uniquement en mémoire et sa fonction `syncNow` supprimait une file locale après un délai, sans appel serveur.
- Aucun endpoint de synchronisation hors ligne, modèle de conflit ni backend d’abonnements Web Push/VAPID n’a été trouvé dans le périmètre audité.
- Le shell utilisait une largeur minimale de 360 px, une barre latérale fixe et des marges/paddings de bureau. Le composant `Table` dispose déjà d’une barre d’outils réactive; les vues métier doivent encore être vérifiées une par une sur appareils et tailles réels.

## Ordre de priorité

1. Adapter le shell commun : largeur 320 px, en-tête compact, navigation tactile, safe areas et tiroir de modules mobile/tablette.
2. Mettre en place la fondation PWA : manifest, métadonnées d’installation, service worker versionné, mise à jour contrôlée et page hors ligne.
3. Limiter le cache aux assets statiques publics. Les navigations ERP, l’authentification, les portails et les API restent réseau uniquement.
4. Vérifier les écrans métier par familles (tableaux, formulaires, graphiques, Kanban, calendrier, documents) et corriger les débordements propres à chaque vue.
5. Concevoir une vraie synchronisation seulement après définition d’opérations métier autorisées et d’API serveur idempotentes, tenant-aware, avec contrôle des permissions et conflits.
6. Ajouter Web Push après création du stockage serveur des abonnements et de la configuration VAPID, avec consentement explicite et contenus non sensibles.

## Mise en œuvre de cette livraison

- Ajout d’un manifest Next.js pour IDIBAGES, mode standalone, identité navy/vert, démarrage sur le dashboard, icône vectorielle et métadonnées Apple.
- Enregistrement du service worker sur origine sécurisée, nettoyage des anciennes versions, notification de mise à jour et cache public des seuls assets statiques (`/_next/static/`, `/brand/`, `/pwa/`).
- Navigation mobile basse (Accueil, Modules, Actions, Notifications, Profil), actions rapides, choix de module et dimensions tactiles. La navigation desktop reste en place; la tablette conserve un panneau latéral rétractable en superposition.
- Adaptation du shell à 320 px et réserves de safe area. L’en-tête est compact sur téléphone et la zone de contenu gagne de la place.
- Retrait du faux traitement de synchronisation. Quand le navigateur signale une perte réseau, l’interface bloque les opérations ERP jusqu’au retour du réseau; les navigations échouées ouvrent une page hors ligne sans servir de contenu ERP privé.

## Garanties et limites actuelles

- Cache Storage ne reçoit ni HTML de l’application, ni réponses API, session, données de tenant, RH, paie, finance, signatures ou opérations métier.
- Les écritures métier restent en ligne et ne sont jamais annoncées comme validées avant confirmation du serveur.
- La synchronisation hors ligne et les notifications push ne sont pas activées : elles exigent une conception backend multi-tenant, des permissions serveur, la gestion des conflits et VAPID. Aucun comportement de substitution n’est simulé.
- Une icône vectorielle est déclarée aux tailles 192 et 512. Apple utilise l’icône PNG carrée existante du dépôt.
- Cette livraison adapte le shell commun. Elle ne remplace pas les tests appareil par appareil ni l’adaptation particulière de chaque écran métier.

## Vérifications à exécuter

Valider le build Next.js, puis parcourir les largeurs 320, 360, 375, 390, 430, 768, 820, 1024, 1280, 1440 et 1920 px. Vérifier installation Android/Chromium, procédure iOS Safari, lancement standalone, cache des seuls assets, navigation hors ligne, mise à jour du service worker, authentification, changement d’entreprise, déconnexion, formulaires, tables, documents, permissions et accessibilité clavier/lecteur d’écran. La validation Lighthouse et les tests iOS/Android réels restent à réaliser après déploiement HTTPS.
