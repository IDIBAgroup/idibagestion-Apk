CREATE TABLE `business_document_versions` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`companyId` bigint unsigned NOT NULL,
	`documentId` bigint unsigned NOT NULL,
	`version` int NOT NULL,
	`storageKey` varchar(512),
	`mimeType` varchar(120),
	`sha256` varchar(64),
	`snapshotJson` text,
	`createdByUserId` bigint unsigned NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `business_document_versions_id` PRIMARY KEY(`id`),
	CONSTRAINT `business_document_versions_document_version_uq` UNIQUE(`documentId`,`version`)
);
--> statement-breakpoint
CREATE TABLE `business_documents` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`companyId` bigint unsigned NOT NULL,
	`templateId` bigint unsigned,
	`documentType` varchar(80) NOT NULL,
	`documentNumber` varchar(100),
	`title` varchar(255) NOT NULL,
	`status` enum('draft','review','approved','finalized','void') NOT NULL DEFAULT 'draft',
	`metadataJson` text,
	`storageKey` varchar(512),
	`mimeType` varchar(120),
	`sha256` varchar(64),
	`createdByUserId` bigint unsigned NOT NULL,
	`finalizedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `business_documents_id` PRIMARY KEY(`id`),
	CONSTRAINT `business_documents_company_number_uq` UNIQUE(`companyId`,`documentNumber`)
);
--> statement-breakpoint
CREATE TABLE `document_approvals` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`companyId` bigint unsigned NOT NULL,
	`documentId` bigint unsigned NOT NULL,
	`step` int NOT NULL,
	`approverUserId` bigint unsigned NOT NULL,
	`status` enum('pending','approved','rejected','cancelled') NOT NULL DEFAULT 'pending',
	`note` text,
	`decidedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `document_approvals_id` PRIMARY KEY(`id`),
	CONSTRAINT `document_approvals_document_step_uq` UNIQUE(`documentId`,`step`)
);
--> statement-breakpoint
CREATE TABLE `document_signature_events` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`companyId` bigint unsigned NOT NULL,
	`requestId` bigint unsigned NOT NULL,
	`eventType` varchar(80) NOT NULL,
	`actorUserId` bigint unsigned,
	`payloadJson` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `document_signature_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `document_signature_requests` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`companyId` bigint unsigned NOT NULL,
	`documentId` bigint unsigned NOT NULL,
	`signerUserId` bigint unsigned,
	`signerEmail` varchar(320),
	`status` enum('pending','signed','declined','cancelled') NOT NULL DEFAULT 'pending',
	`signatureKind` enum('internal_acknowledgement','visual_stamp','provider_signature') NOT NULL DEFAULT 'internal_acknowledgement',
	`provider` varchar(80),
	`providerReference` varchar(255),
	`completedAt` timestamp,
	`createdByUserId` bigint unsigned NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `document_signature_requests_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `document_stamps` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`companyId` bigint unsigned NOT NULL,
	`name` varchar(160) NOT NULL,
	`assetStorageKey` varchar(512) NOT NULL,
	`sha256` varchar(64) NOT NULL,
	`status` enum('active','disabled','revoked') NOT NULL DEFAULT 'active',
	`allowedRolesJson` text,
	`createdByUserId` bigint unsigned NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `document_stamps_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `document_template_versions` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`companyId` bigint unsigned NOT NULL,
	`templateId` bigint unsigned NOT NULL,
	`version` int NOT NULL,
	`layoutJson` text NOT NULL,
	`createdByUserId` bigint unsigned NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `document_template_versions_id` PRIMARY KEY(`id`),
	CONSTRAINT `document_template_versions_template_version_uq` UNIQUE(`templateId`,`version`)
);
--> statement-breakpoint
CREATE TABLE `document_templates` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`companyId` bigint unsigned NOT NULL,
	`name` varchar(180) NOT NULL,
	`documentType` varchar(80) NOT NULL,
	`status` enum('draft','active','archived') NOT NULL DEFAULT 'draft',
	`currentVersion` int NOT NULL DEFAULT 1,
	`createdByUserId` bigint unsigned NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `document_templates_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `external_document_events` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`companyId` bigint unsigned NOT NULL,
	`documentId` bigint unsigned NOT NULL,
	`shareId` bigint unsigned,
	`eventType` varchar(80) NOT NULL,
	`actorUserId` bigint unsigned,
	`detailsJson` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `external_document_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `external_document_shares` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`companyId` bigint unsigned NOT NULL,
	`documentId` bigint unsigned NOT NULL,
	`tokenHash` varchar(64) NOT NULL,
	`recipientEmail` varchar(320),
	`permission` enum('view','comment') NOT NULL DEFAULT 'view',
	`expiresAt` timestamp NOT NULL,
	`revokedAt` timestamp,
	`createdByUserId` bigint unsigned NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `external_document_shares_id` PRIMARY KEY(`id`),
	CONSTRAINT `external_document_shares_token_hash_uq` UNIQUE(`tokenHash`)
);
--> statement-breakpoint
CREATE INDEX `business_document_versions_company_document_idx` ON `business_document_versions` (`companyId`,`documentId`);--> statement-breakpoint
CREATE INDEX `business_documents_company_type_created_idx` ON `business_documents` (`companyId`,`documentType`,`createdAt`);--> statement-breakpoint
CREATE INDEX `document_approvals_company_approver_status_idx` ON `document_approvals` (`companyId`,`approverUserId`,`status`);--> statement-breakpoint
CREATE INDEX `document_signature_events_company_request_idx` ON `document_signature_events` (`companyId`,`requestId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `document_signature_requests_company_document_idx` ON `document_signature_requests` (`companyId`,`documentId`);--> statement-breakpoint
CREATE INDEX `document_stamps_company_status_idx` ON `document_stamps` (`companyId`,`status`);--> statement-breakpoint
CREATE INDEX `document_template_versions_company_template_idx` ON `document_template_versions` (`companyId`,`templateId`);--> statement-breakpoint
CREATE INDEX `document_templates_company_status_idx` ON `document_templates` (`companyId`,`status`);--> statement-breakpoint
CREATE INDEX `external_document_events_company_document_idx` ON `external_document_events` (`companyId`,`documentId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `external_document_events_share_idx` ON `external_document_events` (`shareId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `external_document_shares_company_document_idx` ON `external_document_shares` (`companyId`,`documentId`);--> statement-breakpoint
CREATE INDEX `external_document_shares_expiry_idx` ON `external_document_shares` (`expiresAt`,`revokedAt`);