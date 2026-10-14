CREATE TABLE `company_memberships` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`companyId` bigint unsigned NOT NULL,
	`userId` bigint unsigned NOT NULL,
	`role` enum('owner','admin','manager','member') NOT NULL DEFAULT 'member',
	`status` enum('active','invited','suspended','revoked') NOT NULL DEFAULT 'active',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `company_memberships_id` PRIMARY KEY(`id`),
	CONSTRAINT `company_memberships_company_user_uq` UNIQUE(`companyId`,`userId`)
);
--> statement-breakpoint
CREATE INDEX `company_memberships_user_status_idx` ON `company_memberships` (`userId`,`status`);
--> statement-breakpoint

-- Preserve access for companies that already have an owner.
INSERT IGNORE INTO company_memberships
  (companyId, userId, role, status, createdAt, updatedAt)
SELECT id, ownerUserId, 'owner', 'active', createdAt, updatedAt
FROM companies
WHERE ownerUserId IS NOT NULL;
