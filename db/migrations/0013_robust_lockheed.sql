CREATE TABLE `company_profiles` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`companyId` bigint unsigned NOT NULL,
	`countryCode` varchar(2) NOT NULL,
	`currencyCode` varchar(3) NOT NULL,
	`timezone` varchar(80) NOT NULL,
	`locale` varchar(12) NOT NULL,
	`fiscalYearStartMonth` int NOT NULL DEFAULT 1,
	`fiscalYearStartDay` int NOT NULL DEFAULT 1,
	`industryCode` varchar(40) NOT NULL DEFAULT 'other',
	`customIndustryName` varchar(120),
	`accountingFramework` varchar(40) NOT NULL DEFAULT 'SYSCOHADA_REVISED',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `company_profiles_id` PRIMARY KEY(`id`),
	CONSTRAINT `company_profiles_company_uq` UNIQUE(`companyId`)
);
--> statement-breakpoint
CREATE INDEX `company_profiles_country_industry_idx` ON `company_profiles` (`countryCode`,`industryCode`);