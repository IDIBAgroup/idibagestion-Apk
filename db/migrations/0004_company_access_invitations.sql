CREATE TABLE `company_access_invitations` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`companyId` bigint unsigned NOT NULL,
	`role` enum('admin','manager','member') NOT NULL,
	`tokenHash` varchar(64) NOT NULL,
	`expiresAt` timestamp NOT NULL,
	`claimedAt` timestamp,
	`createdByUserId` bigint unsigned NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `company_access_invitations_id` PRIMARY KEY(`id`),
	CONSTRAINT `company_access_invitations_token_hash_uq` UNIQUE(`tokenHash`)
);
--> statement-breakpoint
CREATE INDEX `company_access_invitations_company_claimed_idx` ON `company_access_invitations` (`companyId`,`claimedAt`);