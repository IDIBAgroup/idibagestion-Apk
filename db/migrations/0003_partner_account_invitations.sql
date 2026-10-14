CREATE TABLE `partner_account_invitations` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`partnerId` bigint unsigned NOT NULL,
	`tokenHash` varchar(64) NOT NULL,
	`expiresAt` timestamp NOT NULL,
	`claimedAt` timestamp,
	`createdByUserId` bigint unsigned NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `partner_account_invitations_id` PRIMARY KEY(`id`),
	CONSTRAINT `partner_account_invitations_token_hash_uq` UNIQUE(`tokenHash`)
);
--> statement-breakpoint
ALTER TABLE `partners` ADD `userId` bigint unsigned;--> statement-breakpoint
ALTER TABLE `partners` ADD CONSTRAINT `partners_user_id_uq` UNIQUE(`userId`);--> statement-breakpoint
CREATE INDEX `partner_account_invitations_partner_claimed_idx` ON `partner_account_invitations` (`partnerId`,`claimedAt`);