# Design QA — Portail mini client et fournisseur

final result: blocked

## Cible et preuves

- Source visuelle : capture `dssdf.PNG` fournie par l’utilisateur dans la conversation.
- Cible : vues authentifiées `/portal/client` et `/portal/vendor`.
- Implémentation : `components/portal/ExternalMiniPortal.tsx`, utilisé par `views/ClientPortalPage.tsx` et `views/VendorPortalPage.tsx`.
- Capture du rendu : indisponible, aucun outil de capture navigateur n’est exposé dans cette session.
- Interactions navigateur et console : non vérifiées visuellement.

## Correspondance de l’expérience

Le portail connecté présente une en-tête d’entreprise, un état d’invitation, une liste compacte de documents partagés, leur statut, les montants et dates disponibles, puis une note de confidentialité. Les devis clients permettent la validation et l’envoi d’une demande de modification. Les fournisseurs peuvent confirmer la prise en charge d’une commande en attente et demander une modification. Les documents affichés sont filtrés par le compte portail connecté. L’interface est centrée, responsive, et n’affiche pas la navigation ERP après connexion.

## Vérifications

- [x] Filtrage des devis clients par adresse électronique ou entreprise liée au compte.
- [x] Filtrage des factures, contrats et commandes fournisseurs par identifiant du compte portail.
- [x] Validation de devis et enregistrement d’une demande de modification dans les tickets du portail.
- [x] État vide et formulaire de demande adaptés aux petits écrans.
- [ ] Comparaison de capture desktop/mobile avec l’image de référence.
- [ ] Vérification visuelle des actions dans le navigateur.
- [x] Contrôle TypeScript et build de production (`npm.cmd run check`, `npm.cmd run build`).

## Finding

- [P2] Fidélité visuelle et responsive non confirmées par capture navigateur. Le code suit la structure et le contenu de la référence, mais les dimensions, couleurs et interactions rendues restent à contrôler à l’écran.
