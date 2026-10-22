CREATE TABLE `sales_document_sequences` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`companyId` bigint unsigned NOT NULL,
	`kind` enum('order','delivery') NOT NULL,
	`fiscalYear` int NOT NULL,
	`lastValue` int NOT NULL DEFAULT 0,
	`updatedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `sales_document_sequences_id` PRIMARY KEY(`id`),
	CONSTRAINT `sales_document_sequences_company_kind_year_uq` UNIQUE(`companyId`,`kind`,`fiscalYear`)
);
