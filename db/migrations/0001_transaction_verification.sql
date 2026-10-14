CREATE TABLE `clients` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`companyId` bigint unsigned NOT NULL,
	`name` varchar(255) NOT NULL,
	`email` varchar(320),
	`phone` varchar(50),
	`whatsapp` varchar(50),
	`address` text,
	`city` varchar(100),
	`country` varchar(100) DEFAULT 'Cameroun',
	`niu` varchar(100),
	`rccm` varchar(100),
	`taxCategory` varchar(100),
	`status` enum('active','inactive','lead') NOT NULL DEFAULT 'active',
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `clients_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `products` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`companyId` bigint unsigned NOT NULL,
	`code` varchar(50),
	`name` varchar(255) NOT NULL,
	`description` text,
	`unitPriceHT` int NOT NULL,
	`taxRate` decimal(5,2) DEFAULT '19.25',
	`unit` varchar(50) DEFAULT 'Unité',
	`category` varchar(100) DEFAULT 'Service',
	`stockQuantity` int DEFAULT 0,
	`isActive` boolean DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `products_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `companies` ADD `niu` varchar(100);--> statement-breakpoint
ALTER TABLE `companies` ADD `rccm` varchar(100);--> statement-breakpoint
ALTER TABLE `companies` ADD `capitalSocial` varchar(100);--> statement-breakpoint
ALTER TABLE `transactions` ADD `isVerified` boolean DEFAULT false NOT NULL;