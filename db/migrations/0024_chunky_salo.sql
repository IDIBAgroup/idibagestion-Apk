ALTER TABLE `expense_claims` ADD `currencyCode` varchar(3) NOT NULL;--> statement-breakpoint
ALTER TABLE `fixed_assets` ADD `currencyCode` varchar(3) DEFAULT 'XAF' NOT NULL;--> statement-breakpoint
UPDATE `fixed_assets` AS assets
INNER JOIN `company_profiles` AS profiles ON profiles.`companyId` = assets.`companyId`
SET assets.`currencyCode` = profiles.`currencyCode`;
