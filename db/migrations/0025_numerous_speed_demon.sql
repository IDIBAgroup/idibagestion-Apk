CREATE TABLE `department_members` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`companyId` bigint unsigned NOT NULL,
	`departmentId` int NOT NULL,
	`userId` bigint unsigned NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `department_members_id` PRIMARY KEY(`id`),
	CONSTRAINT `department_members_department_user_uq` UNIQUE(`departmentId`,`userId`)
);
--> statement-breakpoint
CREATE TABLE `departments` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`companyId` bigint unsigned NOT NULL,
	`name` varchar(120) NOT NULL,
	`managerUserId` bigint unsigned,
	`createdByUserId` bigint unsigned NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `departments_id` PRIMARY KEY(`id`),
	CONSTRAINT `departments_company_name_uq` UNIQUE(`companyId`,`name`)
);
--> statement-breakpoint
CREATE INDEX `department_members_company_department_idx` ON `department_members` (`companyId`,`departmentId`);--> statement-breakpoint
CREATE INDEX `department_members_company_user_idx` ON `department_members` (`companyId`,`userId`);--> statement-breakpoint
CREATE INDEX `departments_company_manager_idx` ON `departments` (`companyId`,`managerUserId`);