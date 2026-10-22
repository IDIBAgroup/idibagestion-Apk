CREATE TABLE `fixed_assets` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`companyId` bigint unsigned NOT NULL,
	`name` varchar(255) NOT NULL,
	`category` varchar(180) NOT NULL,
	`serialNumber` varchar(120) NOT NULL,
	`description` text,
	`acquisitionDate` date,
	`acquisitionValue` decimal(18,2) NOT NULL,
	`location` varchar(255),
	`status` enum('active','maintenance','disposed','out_of_service') NOT NULL DEFAULT 'active',
	`usefulLifeYears` int,
	`depreciationMethod` enum('linear','degressive'),
	`createdByUserId` bigint unsigned NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `fixed_assets_id` PRIMARY KEY(`id`),
	CONSTRAINT `fixed_assets_company_serial_uq` UNIQUE(`companyId`,`serialNumber`)
);
--> statement-breakpoint
CREATE INDEX `fixed_assets_company_status_idx` ON `fixed_assets` (`companyId`,`status`);