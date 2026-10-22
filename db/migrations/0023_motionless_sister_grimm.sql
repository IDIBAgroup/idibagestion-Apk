CREATE TABLE `expense_claim_events` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`companyId` bigint unsigned NOT NULL,
	`claimId` bigint unsigned NOT NULL,
	`eventType` varchar(40) NOT NULL,
	`actorUserId` bigint unsigned NOT NULL,
	`detailsJson` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `expense_claim_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `expense_claims` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`companyId` bigint unsigned NOT NULL,
	`employeeUserId` bigint unsigned NOT NULL,
	`description` varchar(255) NOT NULL,
	`amount` decimal(18,2) NOT NULL,
	`category` varchar(120) NOT NULL,
	`incurredOn` date NOT NULL,
	`notes` text,
	`status` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
	`decisionNote` text,
	`decidedByUserId` bigint unsigned,
	`decidedAt` timestamp,
	`receiptStorageKey` varchar(512),
	`receiptName` varchar(180),
	`receiptMimeType` varchar(120),
	`receiptSha256` varchar(64),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `expense_claims_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `expense_claim_events_company_claim_created_idx` ON `expense_claim_events` (`companyId`,`claimId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `expense_claims_company_status_date_idx` ON `expense_claims` (`companyId`,`status`,`incurredOn`);--> statement-breakpoint
CREATE INDEX `expense_claims_employee_date_idx` ON `expense_claims` (`companyId`,`employeeUserId`,`incurredOn`);