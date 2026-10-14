CREATE TABLE `user_sessions` (
	`id` varchar(64) NOT NULL,
	`userId` bigint unsigned NOT NULL,
	`expiresAt` timestamp NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `user_sessions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` RENAME COLUMN `unionId` TO `externalId`;--> statement-breakpoint
ALTER TABLE `users` DROP INDEX `users_unionId_unique`;--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `externalId` varchar(255);--> statement-breakpoint
ALTER TABLE `users` ADD `passwordHash` varchar(255);--> statement-breakpoint
ALTER TABLE `users` ADD CONSTRAINT `users_externalId_unique` UNIQUE(`externalId`);--> statement-breakpoint
ALTER TABLE `users` ADD CONSTRAINT `users_email_unique` UNIQUE(`email`);--> statement-breakpoint
CREATE INDEX `user_sessions_user_expires_idx` ON `user_sessions` (`userId`,`expiresAt`);