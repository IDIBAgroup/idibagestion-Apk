CREATE TABLE `fiscal_periods` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`companyId` bigint unsigned NOT NULL,
	`fiscalYear` int NOT NULL,
	`label` varchar(24) NOT NULL,
	`startDate` date NOT NULL,
	`endDate` date NOT NULL,
	`status` enum('open','closed') NOT NULL DEFAULT 'closed',
	`closedByUserId` bigint unsigned,
	`closedAt` timestamp,
	`reopenedByUserId` bigint unsigned,
	`reopenedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `fiscal_periods_id` PRIMARY KEY(`id`),
	CONSTRAINT `fiscal_periods_company_year_uq` UNIQUE(`companyId`,`fiscalYear`)
);
--> statement-breakpoint
CREATE INDEX `fiscal_periods_company_dates_status_idx` ON `fiscal_periods` (`companyId`,`startDate`,`endDate`,`status`);