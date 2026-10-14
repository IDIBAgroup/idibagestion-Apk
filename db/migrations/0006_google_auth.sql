CREATE TABLE `google_auth_transactions` (
	`stateHash` varchar(64) NOT NULL,
	`browserHash` varchar(64) NOT NULL,
	`nonce` varchar(64) NOT NULL,
	`codeVerifier` varchar(128) NOT NULL,
	`expiresAt` timestamp NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `google_auth_transactions_stateHash` PRIMARY KEY(`stateHash`)
);
--> statement-breakpoint
ALTER TABLE `users` ADD `googleSub` varchar(255);--> statement-breakpoint
ALTER TABLE `users` ADD CONSTRAINT `users_googleSub_unique` UNIQUE(`googleSub`);--> statement-breakpoint
CREATE INDEX `google_auth_transactions_expires_idx` ON `google_auth_transactions` (`expiresAt`);