CREATE TABLE `financial_reports` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`companyId` bigint unsigned NOT NULL,
	`type` enum('income_statement','balance_sheet','cash_flow') NOT NULL,
	`period` varchar(12) NOT NULL,
	`startDate` date NOT NULL,
	`endDate` date NOT NULL,
	`reportData` text NOT NULL,
	`generatedByUserId` bigint unsigned NOT NULL,
	`generatedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `financial_reports_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `journal_entries` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`companyId` bigint unsigned NOT NULL,
	`entryDate` date NOT NULL,
	`journalCode` varchar(12) NOT NULL,
	`pieceNumber` varchar(100) NOT NULL,
	`label` varchar(500) NOT NULL,
	`analyticCode` varchar(120),
	`baseCurrency` varchar(3) NOT NULL,
	`transactionCurrency` varchar(3) NOT NULL,
	`exchangeRate` decimal(22,10) NOT NULL,
	`transactionAmount` decimal(22,2) NOT NULL,
	`createdByUserId` bigint unsigned NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `journal_entries_id` PRIMARY KEY(`id`),
	CONSTRAINT `journal_entries_company_journal_piece_uq` UNIQUE(`companyId`,`journalCode`,`pieceNumber`)
);
--> statement-breakpoint
CREATE TABLE `journal_entry_lines` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`companyId` bigint unsigned NOT NULL,
	`journalEntryId` bigint unsigned NOT NULL,
	`lineNumber` int NOT NULL,
	`accountCode` varchar(20) NOT NULL,
	`accountLabel` varchar(255) NOT NULL,
	`debit` decimal(22,2) NOT NULL DEFAULT '0.00',
	`credit` decimal(22,2) NOT NULL DEFAULT '0.00',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `journal_entry_lines_id` PRIMARY KEY(`id`),
	CONSTRAINT `journal_entry_lines_entry_number_uq` UNIQUE(`journalEntryId`,`lineNumber`)
);
--> statement-breakpoint
CREATE INDEX `financial_reports_company_period_idx` ON `financial_reports` (`companyId`,`period`,`generatedAt`);--> statement-breakpoint
CREATE INDEX `journal_entries_company_date_idx` ON `journal_entries` (`companyId`,`entryDate`);--> statement-breakpoint
CREATE INDEX `journal_entry_lines_company_entry_idx` ON `journal_entry_lines` (`companyId`,`journalEntryId`);--> statement-breakpoint
CREATE INDEX `journal_entry_lines_company_account_idx` ON `journal_entry_lines` (`companyId`,`accountCode`);