CREATE TABLE `company_tax_rules` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`companyId` bigint unsigned NOT NULL,
	`countryCode` varchar(2) NOT NULL,
	`code` varchar(40) NOT NULL,
	`name` varchar(120) NOT NULL,
	`taxType` enum('vat','withholding','excise','other') NOT NULL DEFAULT 'vat',
	`rateBasisPoints` int NOT NULL,
	`effectiveFrom` date NOT NULL,
	`effectiveTo` date,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdByUserId` bigint unsigned NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `company_tax_rules_id` PRIMARY KEY(`id`),
	CONSTRAINT `company_tax_rules_company_code_from_uq` UNIQUE(`companyId`,`countryCode`,`code`,`effectiveFrom`)
);
--> statement-breakpoint
CREATE INDEX `company_tax_rules_effective_idx` ON `company_tax_rules` (`companyId`,`countryCode`,`taxType`,`isActive`,`effectiveFrom`);