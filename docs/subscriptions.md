# Abonnements IDIBAGES

## Catalogue et migration

La migration 0020_subscription_catalog.sql crée ou actualise les huit variantes mensuelles et annuelles des quatre offres. Appliquer les migrations sur la base avant le déploiement (npm run db:migrate). Les prix annuels du catalogue représentent dix mensualités, soit une remise initiale de 20 %. Les prix, quotas, avantages et états de chaque variante se modifient dans Administration SaaS → Forfaits.

Les inscriptions peuvent choisir Starter, Pro ou Business et démarrent un essai de 14 jours. Enterprise reste une offre sur devis.

## Activer CinetPay

Configurer ces variables dans l’environnement du serveur, sans les exposer au navigateur :

- CINETPAY_API_KEY
- CINETPAY_SITE_ID
- CINETPAY_SECRET_KEY
- APP_URL (URL publique HTTPS, par exemple https://app.example.com)

Déclarer https://app.example.com/api/payments/webhook comme URL de notification du compte CinetPay. Le retour du client va vers /subscription?payment=pending. L’API ne fait confiance ni à la redirection ni au statut envoyé dans la notification : elle vérifie le HMAC, relit la transaction via l’API CinetPay, compare le montant, puis active le forfait dans une transaction de base de données. Aucune donnée de carte n’est conservée.

Le connecteur actuel lance les paiements XAF par carte ou Mobile Money. La devise et les moyens disponibles dépendent du compte marchand CinetPay. Les autres monnaies OHADA (dont XOF, GNF et KMF) et un second prestataire ne sont pas encore raccordés à la facturation d’abonnement : ne pas présenter le paiement comme disponible pour ces devises avant d’ajouter leur tarification, leur devise persistée et leur connecteur.

Un échec de démarrage ou un rejet confirmé par CinetPay ne valide pas l’abonnement. Les upgrades à cycle identique sont proratisés sur le temps restant ; les downgrades doivent attendre la prochaine échéance. Le renouvellement automatique et l’enregistrement de moyens de paiement ne sont pas activés par ce connecteur.
