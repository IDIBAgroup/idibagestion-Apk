CREATE TABLE `customer_invoice_reminders` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`companyId` bigint unsigned NOT NULL,
	`invoiceDocumentId` bigint unsigned NOT NULL,
	`reminderType` enum('before_due','on_due','after_due_7','after_due_15','after_due_30','final') NOT NULL,
	`reminderDate` date NOT NULL,
	`status` enum('scheduled','sent','failed','cancelled') NOT NULL DEFAULT 'scheduled',
	`templateUsed` varchar(180) NOT NULL,
	`sentAt` timestamp,
	`sentByUserId` bigint unsigned,
	`notes` text,
	`createdByUserId` bigint unsigned NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `customer_invoice_reminders_id` PRIMARY KEY(`id`),
	CONSTRAINT `customer_invoice_reminders_invoice_type_date_uq` UNIQUE(`invoiceDocumentId`,`reminderType`,`reminderDate`)
);
--> statement-breakpoint
CREATE INDEX `customer_invoice_reminders_company_date_status_idx` ON `customer_invoice_reminders` (`companyId`,`reminderDate`,`status`);