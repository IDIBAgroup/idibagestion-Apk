CREATE TABLE `external_document_comments` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`companyId` bigint unsigned NOT NULL,
	`documentId` bigint unsigned NOT NULL,
	`shareId` bigint unsigned NOT NULL,
	`body` text NOT NULL,
	`attachmentStorageKey` varchar(512),
	`attachmentName` varchar(180),
	`attachmentMimeType` varchar(120),
	`attachmentSha256` varchar(64),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `external_document_comments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `external_share_challenges` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`shareId` bigint unsigned NOT NULL,
	`challengeHash` varchar(64) NOT NULL,
	`otpHash` varchar(64) NOT NULL,
	`attempts` int NOT NULL DEFAULT 0,
	`expiresAt` timestamp NOT NULL,
	`consumedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `external_share_challenges_id` PRIMARY KEY(`id`),
	CONSTRAINT `external_share_challenges_hash_uq` UNIQUE(`challengeHash`)
);
--> statement-breakpoint
CREATE TABLE `external_share_sessions` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`shareId` bigint unsigned NOT NULL,
	`sessionHash` varchar(64) NOT NULL,
	`expiresAt` timestamp NOT NULL,
	`revokedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `external_share_sessions_id` PRIMARY KEY(`id`),
	CONSTRAINT `external_share_sessions_hash_uq` UNIQUE(`sessionHash`)
);
--> statement-breakpoint
ALTER TABLE `external_document_shares` MODIFY COLUMN `permission` enum('view','comment','upload') NOT NULL DEFAULT 'view';--> statement-breakpoint
CREATE INDEX `external_document_comments_share_created_idx` ON `external_document_comments` (`shareId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `external_share_challenges_share_created_idx` ON `external_share_challenges` (`shareId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `external_share_sessions_share_expiry_idx` ON `external_share_sessions` (`shareId`,`expiresAt`);