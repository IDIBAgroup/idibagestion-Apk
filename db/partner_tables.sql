CREATE TABLE `partner_commissions` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`partnerId` bigint unsigned NOT NULL,
	`opportunityId` bigint unsigned NOT NULL,
	`invoiceNumber` varchar(100),
	`collectedAmount` int NOT NULL,
	`rate` decimal(5,2) NOT NULL,
	`amount` int NOT NULL,
	`status` enum('pending','validated','paid','cancelled') NOT NULL DEFAULT 'pending',
	`validatedAt` timestamp,
	`paidAt` timestamp,
	`paymentMethod` enum('bank_transfer','mobile_money','cash','other'),
	`paymentReference` varchar(255),
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `partner_commissions_id` PRIMARY KEY(`id`)
);

CREATE TABLE `partner_documents` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`partnerId` bigint unsigned,
	`name` varchar(255) NOT NULL,
	`fileUrl` text NOT NULL,
	`fileType` varchar(50),
	`category` enum('partnership_contract','terms','commission_grid','sales_support','catalog','presentation','brochure','template') NOT NULL,
	`isPublic` boolean DEFAULT false,
	`allowedLevels` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `partner_documents_id` PRIMARY KEY(`id`)
);

CREATE TABLE `partner_levels` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`slug` varchar(50) NOT NULL,
	`name` varchar(100) NOT NULL,
	`commissionRate` decimal(5,2) NOT NULL,
	`minRevenueXAF` int DEFAULT 0,
	`maxRevenueXAF` int DEFAULT 0,
	`description` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `partner_levels_id` PRIMARY KEY(`id`),
	CONSTRAINT `partner_levels_slug_unique` UNIQUE(`slug`)
);

CREATE TABLE `partner_notifications` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`partnerId` bigint unsigned NOT NULL,
	`type` enum('prospect_qualified','quote_sent','contract_signed','commission_validated','commission_paid','level_up','general') NOT NULL,
	`title` varchar(255) NOT NULL,
	`message` text,
	`isRead` boolean DEFAULT false,
	`link` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `partner_notifications_id` PRIMARY KEY(`id`)
);

CREATE TABLE `partner_opportunities` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`prospectId` bigint unsigned NOT NULL,
	`partnerId` bigint unsigned NOT NULL,
	`quoteNumber` varchar(100),
	`quoteAmountHT` int,
	`quoteAmountTTC` int,
	`quoteStatus` enum('draft','sent','viewed','accepted','rejected','expired'),
	`contractNumber` varchar(100),
	`contractAmount` int,
	`contractStatus` enum('draft','signed','active','terminated','cancelled'),
	`contractSignatureDate` date,
	`contractDuration` int,
	`contractType` varchar(100),
	`collectedAmount` int DEFAULT 0,
	`remainingAmount` int DEFAULT 0,
	`commissionRate` decimal(5,2),
	`commissionEarned` int DEFAULT 0,
	`commissionStatus` enum('pending','validated','paid','cancelled') DEFAULT 'pending',
	`closedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `partner_opportunities_id` PRIMARY KEY(`id`)
);

CREATE TABLE `partner_prospects` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`leadId` varchar(50) NOT NULL,
	`partnerId` bigint unsigned NOT NULL,
	`companyName` varchar(255) NOT NULL,
	`contactName` varchar(255),
	`contactFunction` varchar(100),
	`phone` varchar(50),
	`whatsapp` varchar(50),
	`email` varchar(320),
	`city` varchar(100),
	`sector` varchar(100),
	`need` text,
	`serviceSearched` varchar(255),
	`estimatedBudget` int,
	`urgency` enum('low','medium','high','critical') DEFAULT 'medium',
	`description` text,
	`source` varchar(100),
	`status` enum('new','to_qualify','qualified','appointment','proposal','negotiation','won','lost','cancelled') NOT NULL DEFAULT 'new',
	`estimatedAmount` int,
	`probability` int DEFAULT 0,
	`nextAction` text,
	`assignedTo` bigint unsigned,
	`protectionEndDate` date,
	`isDuplicate` boolean DEFAULT false,
	`duplicateOfId` bigint unsigned,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `partner_prospects_id` PRIMARY KEY(`id`),
	CONSTRAINT `partner_prospects_leadId_unique` UNIQUE(`leadId`)
);

CREATE TABLE `partners` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`code` varchar(50) NOT NULL,
	`firstName` varchar(100) NOT NULL,
	`lastName` varchar(100) NOT NULL,
	`email` varchar(320) NOT NULL,
	`phone` varchar(50),
	`whatsapp` varchar(50),
	`city` varchar(100),
	`companyName` varchar(255),
	`jobTitle` varchar(100),
	`photoUrl` text,
	`levelId` bigint unsigned NOT NULL,
	`status` enum('active','suspended','inactive','pending') NOT NULL DEFAULT 'pending',
	`internalManagerId` bigint unsigned,
	`notes` text,
	`partnershipDate` date NOT NULL,
	`lastLoginAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `partners_id` PRIMARY KEY(`id`),
	CONSTRAINT `partners_code_unique` UNIQUE(`code`)
);