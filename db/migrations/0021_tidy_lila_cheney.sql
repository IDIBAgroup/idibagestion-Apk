ALTER TABLE `plans` ADD `moduleAccess` text;

UPDATE `plans`
SET `moduleAccess` = CASE
  WHEN `isEnterprise` = TRUE OR `slug` LIKE 'enterprise%' OR `name` LIKE 'Enterprise%' THEN '["customers","suppliers","quotes","orders","delivery_notes","invoices","payments","expenses","documents","crm","projects","hr","inventory","resources","accounting","banking","fixed_assets","budgets","payroll","automations","advanced_reports","multi_company","custom_api","advanced_security","dedicated_support"]'
  WHEN `slug` LIKE 'business%' OR `name` LIKE 'Business%' OR `name` LIKE 'Business+%' THEN '["customers","suppliers","quotes","orders","delivery_notes","invoices","payments","expenses","documents","crm","projects","hr","inventory","resources","accounting","banking","fixed_assets","budgets","payroll","automations","advanced_reports"]'
  WHEN `slug` LIKE 'pro%' OR `name` LIKE 'Pro%' OR `name` LIKE 'Croissance%' THEN '["customers","suppliers","quotes","orders","delivery_notes","invoices","payments","expenses","documents","crm","projects","hr","inventory","resources"]'
  ELSE '["customers","suppliers","quotes","orders","delivery_notes","invoices","payments","expenses","documents"]'
END
WHERE `moduleAccess` IS NULL;
