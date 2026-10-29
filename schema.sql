SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS `accounting_vouchers`;
CREATE TABLE `accounting_vouchers` (
`id` varchar(50) NOT NULL,
`voucher_date` date NOT NULL,
`voucher_type` enum('SALES_RECEIPT','PURCHASE_PAYMENT','CONTRA','EXPENSE') NOT NULL,
`transaction_side` enum('DEBIT','CREDIT') NOT NULL,
`amount` decimal(15,2) NOT NULL,
`payment_mode` enum('CASH','UPI','CHEQUE','BANK_TRANSFER') NOT NULL,
`bank_name` varchar(100) NOT NULL,
`reference_no` varchar(100) DEFAULT NULL,
`particulars` varchar(255) NOT NULL,
`narration` text,
`created_by` varchar(50) NOT NULL,
`created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
`updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

DROP TABLE IF EXISTS `company_details`;
CREATE TABLE `company_details` (
`id` int NOT NULL,
`name` varchar(255) DEFAULT NULL,
`email` varchar(255) DEFAULT NULL,
`mobile` varchar(20) DEFAULT NULL,
`address` text,
`logo_url` longtext,
`updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
`gst_number` varchar(20) DEFAULT NULL,
`pan_number` varchar(20) DEFAULT NULL,
PRIMARY KEY (`id`),
CONSTRAINT `company_details_chk_1` CHECK ((`id` = 1))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

INSERT INTO `company_details` VALUES (1,'CityScene Global','citysceneglobal@gmail.com','7689999377','Jaipur, Rajasthan, India','https://res.cloudinary.com/dmswrbcdm/image/upload/v1774077305/i4b0ccbuqxpcbokhyed5.png','2026-03-21 07:15:07','27ABCDE1234F1Z5','ABCDE1234F');

DROP TABLE IF EXISTS `customers`;
CREATE TABLE `customers` (
`id` varchar(50) NOT NULL,
`name` varchar(100) NOT NULL,
`email` varchar(100) DEFAULT NULL,
`mobile` varchar(20) NOT NULL,
`address` text,
`gstNumber` varchar(20) DEFAULT NULL,
`created_by` varchar(50) DEFAULT NULL,
`created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
`updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
PRIMARY KEY (`id`),
KEY `fk_customer_creator` (`created_by`),
CONSTRAINT `fk_customer_creator` FOREIGN KEY (`created_by`) REFERENCES `employees` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

INSERT INTO `customers` VALUES ('f5dce2e8-b665-4e24-92ab-9a34cdf1dfc5','Vedant ','','9876543210','','',NULL,'2026-04-02 05:51:43','2026-04-02 05:51:43');

DROP TABLE IF EXISTS `dummy_company_details`;
CREATE TABLE `dummy_company_details` (
`id` int NOT NULL,
`name` varchar(255) DEFAULT NULL,
`email` varchar(255) DEFAULT NULL,
`mobile` varchar(20) DEFAULT NULL,
`address` text,
`updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
PRIMARY KEY (`id`),
CONSTRAINT `dummy_company_details_chk_1` CHECK ((`id` = 1))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

INSERT INTO `dummy_company_details` VALUES (1,'Dummy Company','dummy@company.com','+91 9876543210','dummy road, dummy state, dummy country','2026-02-20 07:36:13');

DROP TABLE IF EXISTS `employees`;
CREATE TABLE `employees` (
`id` varchar(50) NOT NULL,
`name` varchar(100) NOT NULL,
`email` varchar(100) NOT NULL,
`mobile` varchar(20) NOT NULL,
`password` varchar(255) NOT NULL,
`role` varchar(50) DEFAULT NULL,
`salary` decimal(10,2) DEFAULT '0.00',
`permissions` json DEFAULT NULL,
`created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
PRIMARY KEY (`id`),
UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

INSERT INTO `employees` VALUES ('3280180a-88ad-44e7-aea7-03f084f0acc4','Ashish','ashish@gmail.com','7482907681','$2b$10$qFMQd1R8UCLPevwa9fKD.uYfYqpo1j/xW3KdNoEud25SplOPaBGBu','ADMIN',25000.00,'[\"/\", \"/suppliers\", \"/inventory\", \"/sales\", \"/billings\", \"/expenses\", \"/employees\", \"/references\", \"/settings\", \"/accounting\", \"/customers\"]','2026-03-09 09:03:55'),('86589449-d5a7-427d-87b7-d250c9d3d2ee','Abhishek','asaini9926@gmail.com','9602799926','$2b$10$S2gDfWTjrs6RRDcEQa893u8Lv4ADS48wm2W1.bnZcqsV14d2..51O','ADMIN',22000.00,'[\"/\", \"/suppliers\", \"/inventory\", \"/sales\", \"/billings\", \"/expenses\", \"/employees\", \"/references\", \"/settings\", \"/accounting\", \"/customers\"]','2026-03-31 11:10:30'),('e5bec7c8-f53e-4d17-92a1-38146ae34932','Ashish Kumar','ashish@yopmail.com','7482907681','$2b$10$jzwXtYqK59zHt0tvZVSqBe.Ng2ECu7kQpZyN/ke1GeHFW6SBudZEq','SUPER_ADMIN',100000.00,'[\"/\", \"/suppliers\", \"/inventory\", \"/sales\", \"/billings\", \"/expenses\", \"/employees\", \"/references\", \"/accounting\", \"/internal-ledger\", \"/settings\", \"/customers\"]','2026-03-12 06:42:43');

DROP TABLE IF EXISTS `expenses`;
CREATE TABLE `expenses` (
`id` varchar(36) NOT NULL,
`employee_id` varchar(36) DEFAULT NULL,
`category` varchar(50) NOT NULL,
`amount` decimal(15,2) NOT NULL,
`method` enum('CASH','ONLINE','BANK','CARD') NOT NULL DEFAULT 'CASH',
`remarks` text,
`date` date NOT NULL,
`created_by` varchar(36) DEFAULT NULL,
`created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
`updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
`expense_type` enum('OFFICE','EMPLOYEE') NOT NULL DEFAULT 'EMPLOYEE',
`status` enum('PENDING','APPROVED','REJECTED') DEFAULT 'PENDING',
PRIMARY KEY (`id`),
KEY `expenses_ibfk_1` (`employee_id`),
CONSTRAINT `expenses_ibfk_1` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

INSERT INTO `expenses` VALUES ('6954d33d-3f9d-4835-9bd8-fc39032d8cf1','3280180a-88ad-44e7-aea7-03f084f0acc4','SALARY',1000.00,'CASH',NULL,'2026-03-31','e5bec7c8-f53e-4d17-92a1-38146ae34932','2026-03-31 05:39:57','2026-04-01 05:02:56','EMPLOYEE','APPROVED');

DROP TABLE IF EXISTS `internal_ledgers`;
CREATE TABLE `internal_ledgers` (
`id` varchar(36) NOT NULL,
`entity_type` enum('CUSTOMER','SUPPLIER') NOT NULL,
`entity_id` varchar(36) DEFAULT NULL,
`bill_id` varchar(36) NOT NULL,
`amount` decimal(15,2) NOT NULL DEFAULT '0.00',
`amount_paid` decimal(15,2) NOT NULL DEFAULT '0.00',
`created_by` varchar(36) DEFAULT NULL,
`created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
`updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

DROP TABLE IF EXISTS `internal_payments`;
CREATE TABLE `internal_payments` (
`id` varchar(36) NOT NULL,
`ledger_id` varchar(36) NOT NULL,
`payment_date` date NOT NULL,
`payment_mode` enum('CASH','UPI','BANK_TRANSFER','CHEQUE') NOT NULL,
`amount` decimal(15,2) NOT NULL,
`reference_number` varchar(255) DEFAULT NULL,
`created_by` varchar(36) DEFAULT NULL,
`created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
PRIMARY KEY (`id`),
KEY `ledger_id` (`ledger_id`),
CONSTRAINT `internal_payments_ibfk_1` FOREIGN KEY (`ledger_id`) REFERENCES `internal_ledgers` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

DROP TABLE IF EXISTS `inventory`;
CREATE TABLE `inventory` (
`id` varchar(50) NOT NULL,
`hsn` varchar(20) NOT NULL,
`name` varchar(255) NOT NULL,
`category` varchar(50) DEFAULT NULL,
`type` varchar(100) DEFAULT NULL,
`inventory_type` enum('PAKKA','KACCHA') NOT NULL,
`unit` varchar(50) DEFAULT NULL,
`size` varchar(50) DEFAULT NULL,
`color` varchar(50) DEFAULT NULL,
`available_stock` decimal(15,2) DEFAULT '0.00',
`buying_price` decimal(10,2) DEFAULT '0.00',
`selling_price` decimal(10,2) DEFAULT '0.00',
`created_by` varchar(50) DEFAULT NULL,
`created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
`updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
`conversion_rate` decimal(10,2) DEFAULT '1.00',
PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

DROP TABLE IF EXISTS `notification_reads`;
CREATE TABLE `notification_reads` (
`id` char(36) NOT NULL,
`notification_id` char(36) NOT NULL,
`user_id` char(36) NOT NULL,
`read_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
PRIMARY KEY (`id`),
KEY `notification_id` (`notification_id`),
CONSTRAINT `notification_reads_ibfk_1` FOREIGN KEY (`notification_id`) REFERENCES `notifications` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

DROP TABLE IF EXISTS `notification_targets`;
CREATE TABLE `notification_targets` (
`id` char(36) NOT NULL,
`notification_id` char(36) NOT NULL,
`target_type` varchar(20) NOT NULL,
`target_value` varchar(50) NOT NULL,
PRIMARY KEY (`id`),
KEY `notification_id` (`notification_id`),
CONSTRAINT `notification_targets_ibfk_1` FOREIGN KEY (`notification_id`) REFERENCES `notifications` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

DROP TABLE IF EXISTS `notifications`;
CREATE TABLE `notifications` (
`id` char(36) NOT NULL,
`type` varchar(50) NOT NULL,
`title` varchar(255) NOT NULL,
`message` text NOT NULL,
`reference_module` varchar(50) DEFAULT NULL,
`reference_id` char(36) DEFAULT NULL,
`created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

DROP TABLE IF EXISTS `references`;
CREATE TABLE `references` (
`id` varchar(36) NOT NULL,
`reference_number` varchar(50) NOT NULL,
`name` varchar(100) NOT NULL,
`email` varchar(150) DEFAULT NULL,
`mobile` varchar(20) NOT NULL,
`address` text,
`points` int DEFAULT '0',
`redeemed_points` int DEFAULT '0',
`status` enum('Active','Inactive') DEFAULT 'Active',
`remarks` text,
`created_by` varchar(36) DEFAULT NULL,
`created_at` datetime DEFAULT CURRENT_TIMESTAMP,
`updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
PRIMARY KEY (`id`),
UNIQUE KEY `reference_number` (`reference_number`),
UNIQUE KEY `mobile` (`mobile`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

DROP TABLE IF EXISTS `return_items`;
CREATE TABLE `return_items` (
`id` varchar(50) NOT NULL,
`return_id` varchar(50) NOT NULL,
`product_id` varchar(50) NOT NULL,
`name` varchar(255) NOT NULL,
`hsn` varchar(100) DEFAULT NULL,
`sold_qty` decimal(15,2) NOT NULL DEFAULT '0.00',
`return_qty` decimal(15,2) NOT NULL DEFAULT '0.00',
`price` decimal(12,2) NOT NULL DEFAULT '0.00',
`cgst` decimal(5,2) DEFAULT '0.00',
`sgst` decimal(5,2) DEFAULT '0.00',
`igst` decimal(5,2) DEFAULT '0.00',
`gst_amount` decimal(12,2) DEFAULT '0.00',
`price_after_gst` decimal(12,2) DEFAULT '0.00',
`base_price` decimal(10,2) NOT NULL DEFAULT '0.00',
`item_disc_percent` decimal(5,2) NOT NULL DEFAULT '0.00',
`conversion_rate` decimal(10,4) NOT NULL DEFAULT '1.0000',
`unit` text,
PRIMARY KEY (`id`),
KEY `fk_ret_item_header` (`return_id`),
CONSTRAINT `fk_ret_item_header` FOREIGN KEY (`return_id`) REFERENCES `returns` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

DROP TABLE IF EXISTS `returns`;
CREATE TABLE `returns` (
`id` varchar(50) NOT NULL,
`return_number` varchar(50) NOT NULL,
`original_sale_id` varchar(50) NOT NULL,
`return_date` date NOT NULL,
`sale_date` date NOT NULL,
`remarks` text,
`customer_name` varchar(255) NOT NULL,
`customer_email` varchar(255) DEFAULT NULL,
`customer_mobile` varchar(20) DEFAULT NULL,
`sale_type` enum('KACCHA','PAKKA') NOT NULL DEFAULT 'PAKKA',
`gst_type` enum('LOCAL','INTERSTATE','NONE') NOT NULL DEFAULT 'LOCAL',
`subtotal` decimal(12,2) NOT NULL DEFAULT '0.00',
`total_gst_amount` decimal(12,2) NOT NULL DEFAULT '0.00',
`total_amount` decimal(12,2) NOT NULL DEFAULT '0.00',
`created_by` varchar(50) DEFAULT NULL,
`created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
`discount_applied` decimal(10,2) DEFAULT '0.00',
`net_refund` decimal(10,2) DEFAULT '0.00',
`customer_address` text,
`gst_number` varchar(20) DEFAULT NULL,
`shipping_name` varchar(255) DEFAULT NULL,
`shipping_mobile` varchar(15) DEFAULT NULL,
`shipping_email` varchar(255) DEFAULT NULL,
`shipping_address` text,
`shipping_gst` varchar(20) DEFAULT NULL,
`po_number` varchar(255) DEFAULT NULL,
`po_date` varchar(255) DEFAULT NULL,
`vehicle_no` varchar(255) DEFAULT NULL,
PRIMARY KEY (`id`),
UNIQUE KEY `return_number` (`return_number`),
KEY `fk_ret_sale_id` (`original_sale_id`),
CONSTRAINT `fk_ret_sale_id` FOREIGN KEY (`original_sale_id`) REFERENCES `sales` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

DROP TABLE IF EXISTS `role_permissions`;
CREATE TABLE `role_permissions` (
`role` varchar(50) NOT NULL,
`permissions` json NOT NULL,
PRIMARY KEY (`role`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

INSERT INTO `role_permissions` VALUES ('ACCOUNTANT','[\"/billings\", \"/expenses\"]'),('ADMIN','[\"/\", \"/suppliers\", \"/inventory\", \"/sales\", \"/billings\", \"/expenses\", \"/employees\", \"/references\", \"/settings\", \"/accounting\", \"/customers\"]'),('EMPLOYEE','[]'),('MANAGER','[\"/inventory\", \"/sales\", \"/expenses\", \"/billings\"]'),('SUPER_ADMIN','[\"/\", \"/suppliers\", \"/inventory\", \"/sales\", \"/billings\", \"/expenses\", \"/accounting\", \"/employees\", \"/references\", \"/internal-ledger\", \"/settings\"]');

DROP TABLE IF EXISTS `sale_items`;
CREATE TABLE `sale_items` (
`id` varchar(50) NOT NULL,
`sale_id` varchar(50) NOT NULL,
`product_id` varchar(50) NOT NULL,
`name` varchar(255) NOT NULL,
`hsn` varchar(100) DEFAULT NULL,
`qty` decimal(15,2) NOT NULL DEFAULT '0.00',
`price` decimal(12,2) NOT NULL DEFAULT '0.00',
`cgst` decimal(5,2) DEFAULT '0.00',
`sgst` decimal(5,2) DEFAULT '0.00',
`igst` decimal(5,2) DEFAULT '0.00',
`gst_amount` decimal(12,2) DEFAULT '0.00',
`price_after_gst` decimal(12,2) DEFAULT '0.00',
`base_price` decimal(10,2) NOT NULL DEFAULT '0.00',
`item_disc_percent` decimal(5,2) NOT NULL DEFAULT '0.00',
`conversion_rate` decimal(10,4) NOT NULL DEFAULT '1.0000',
`unit` text,
PRIMARY KEY (`id`),
KEY `sale_id` (`sale_id`),
CONSTRAINT `sale_items_ibfk_1` FOREIGN KEY (`sale_id`) REFERENCES `sales` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

INSERT INTO `sale_items` VALUES ('b7750828-6ce0-479a-bc3d-72e5a15e3130','8183711c-4620-493a-92e3-13797a49c058','6151693d-955f-41ab-849c-6902fb8c8a2b','cpvc pipe','4421',1.00,142.50,9.00,9.00,0.00,25.65,168.15,150.00,5.00,1.0000,'unit');

DROP TABLE IF EXISTS `sales`;
CREATE TABLE `sales` (
`id` varchar(50) NOT NULL,
`invoice_number` varchar(50) NOT NULL,
`customer_name` varchar(255) NOT NULL,
`customer_email` varchar(255) DEFAULT NULL,
`customer_mobile` varchar(20) DEFAULT NULL,
`sale_date` date NOT NULL,
`sale_type` enum('KACCHA','PAKKA') NOT NULL DEFAULT 'PAKKA',
`gst_type` enum('LOCAL','INTERSTATE','NONE') NOT NULL DEFAULT 'LOCAL',
`subtotal` decimal(12,2) NOT NULL DEFAULT '0.00',
`total_gst_amount` decimal(12,2) NOT NULL DEFAULT '0.00',
`discount` decimal(12,2) NOT NULL DEFAULT '0.00',
`total_amount` decimal(12,2) NOT NULL DEFAULT '0.00',
`amount_paid` decimal(12,2) NOT NULL DEFAULT '0.00',
`balance` decimal(12,2) NOT NULL DEFAULT '0.00',
`payment_status` enum('PENDING','PARTIALLY_PAID','PAID') NOT NULL DEFAULT 'PENDING',
`created_by` varchar(50) DEFAULT NULL,
`created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
`updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
`reference_id` varchar(36) DEFAULT NULL,
`customer_address` text,
`gst_number` varchar(20) DEFAULT NULL,
`shipping_name` varchar(255) DEFAULT NULL,
`shipping_mobile` varchar(15) DEFAULT NULL,
`shipping_email` varchar(255) DEFAULT NULL,
`shipping_address` text,
`shipping_gst` varchar(20) DEFAULT NULL,
`po_number` varchar(255) DEFAULT NULL,
`po_date` varchar(255) DEFAULT NULL,
`vehicle_no` varchar(255) DEFAULT NULL,
`freight_charges` decimal(10,2) DEFAULT '0.00',
PRIMARY KEY (`id`),
UNIQUE KEY `invoice_number` (`invoice_number`),
KEY `reference_id` (`reference_id`),
CONSTRAINT `sales_ibfk_1` FOREIGN KEY (`reference_id`) REFERENCES `references` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

INSERT INTO `sales` VALUES ('8183711c-4620-493a-92e3-13797a49c058','INV-1774952779750','Himanshu',NULL,'','2026-03-31','KACCHA','LOCAL',142.50,25.65,0.00,168.15,0.00,168.15,'PENDING','e5bec7c8-f53e-4d17-92a1-38146ae34932','2026-03-31 10:26:19','2026-03-31 10:26:19',NULL,'','','','','','','','','2026-03-31','',0.00);

DROP TABLE IF EXISTS `sales_payments`;
CREATE TABLE `sales_payments` (
`id` int NOT NULL AUTO_INCREMENT,
`sale_id` varchar(50) NOT NULL,
`payment_mode` enum('CASH','UPI','CHEQUE','BANK_TRANSFER') NOT NULL,
`reference_number` varchar(100) DEFAULT NULL,
`amount` decimal(15,2) NOT NULL,
`payment_date` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
PRIMARY KEY (`id`),
KEY `fk_sale_payment` (`sale_id`),
CONSTRAINT `fk_sale_payment` FOREIGN KEY (`sale_id`) REFERENCES `sales` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

DROP TABLE IF EXISTS `settings`;
CREATE TABLE `settings` (
`key` varchar(100) NOT NULL,
`value` text NOT NULL,
`group` varchar(50) DEFAULT 'general',
`updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
PRIMARY KEY (`key`),
UNIQUE KEY `key` (`key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

INSERT INTO `settings` VALUES ('bank_list','[\"HDFC Bank - 1234\",\"BOB - 106\"]','accounting','2026-03-21 10:31:25'),('customer_credit_days','15','credit_terms','2026-03-20 06:40:01'),('inflation_percent','10','pricing','2026-04-02 12:00:11'),('invoice_terms','1. Goods once sold will not be taken back or exchanged.\n2. Please check material at the time of delivery.\n3. All disputes are subject to local jurisdiction.\n4. Computer generated invoice, signature not required.','invoice','2026-03-11 06:22:39'),('min_threshold','5','inventory','2026-03-11 05:49:37'),('notification_enabled','true','inventory','2026-03-31 11:11:18'),('preferred_format','csv','export_settings','2026-03-18 07:05:32'),('referral_percent','10','referral','2026-03-20 11:08:00'),('supplier_credit_days','50','credit_terms','2026-03-20 06:40:01');

DROP TABLE IF EXISTS `supplier_bill_items`;
CREATE TABLE `supplier_bill_items` (
`id` varchar(50) NOT NULL,
`bill_id` varchar(50) NOT NULL,
`product_id` varchar(50) DEFAULT NULL,
`hsn` varchar(20) DEFAULT NULL,
`name` varchar(255) NOT NULL,
`ordered_qty` decimal(15,2) DEFAULT '0.00',
`received_qty` decimal(15,2) DEFAULT '0.00',
`price` decimal(15,2) DEFAULT '0.00',
`disc_percent` decimal(5,2) DEFAULT '0.00',
`cgst` decimal(5,2) DEFAULT '0.00',
`sgst` decimal(5,2) DEFAULT '0.00',
`igst` decimal(5,2) DEFAULT '0.00',
`taxable_value` decimal(15,2) DEFAULT '0.00',
`price_after_gst` decimal(15,2) DEFAULT '0.00',
`base_price` decimal(10,2) DEFAULT '0.00',
`conversion_rate` decimal(10,2) DEFAULT '1.00',
`unit` varchar(50) DEFAULT NULL,
`size` varchar(50) DEFAULT NULL,
PRIMARY KEY (`id`),
KEY `fk_item_bill` (`bill_id`),
KEY `fk_item_product` (`product_id`),
CONSTRAINT `fk_item_bill` FOREIGN KEY (`bill_id`) REFERENCES `supplier_bills` (`id`) ON DELETE CASCADE,
CONSTRAINT `fk_item_product` FOREIGN KEY (`product_id`) REFERENCES `inventory` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

DROP TABLE IF EXISTS `supplier_bills`;
CREATE TABLE `supplier_bills` (
`id` varchar(50) NOT NULL,
`supplier_id` varchar(50) NOT NULL,
`po_id` varchar(50) DEFAULT NULL,
`po_number` varchar(50) DEFAULT NULL,
`po_date` date DEFAULT NULL,
`bill_number` varchar(100) NOT NULL,
`bill_date` date NOT NULL,
`vehicle_number` varchar(50) DEFAULT NULL,
`subtotal` decimal(15,2) DEFAULT '0.00',
`total_gst_amount` decimal(15,2) DEFAULT '0.00',
`freight_charges` decimal(15,2) DEFAULT '0.00',
`total_amount` decimal(15,2) DEFAULT '0.00',
`amount_paid` decimal(15,2) DEFAULT '0.00',
`balance_amount` decimal(15,2) DEFAULT '0.00',
`created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
`created_by` varchar(50) DEFAULT NULL,
`discount` decimal(10,2) DEFAULT '0.00',
PRIMARY KEY (`id`),
KEY `fk_bill_supplier` (`supplier_id`),
CONSTRAINT `fk_bill_supplier` FOREIGN KEY (`supplier_id`) REFERENCES `suppliers` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

DROP TABLE IF EXISTS `supplier_order_items`;
CREATE TABLE `supplier_order_items` (
`id` varchar(50) NOT NULL,
`order_id` varchar(50) NOT NULL,
`productId` varchar(50) DEFAULT NULL,
`hsn` varchar(20) DEFAULT NULL,
`name` varchar(255) NOT NULL,
`qty` decimal(15,2) NOT NULL DEFAULT '0.00',
`price` decimal(15,2) NOT NULL DEFAULT '0.00',
`disc_percent` decimal(5,2) DEFAULT '0.00',
`cgst` decimal(5,2) DEFAULT '0.00',
`sgst` decimal(5,2) DEFAULT '0.00',
`igst` decimal(5,2) DEFAULT '0.00',
`gst_amount` decimal(15,2) DEFAULT '0.00',
`price_after_gst` decimal(15,2) NOT NULL,
`base_price` decimal(10,2) DEFAULT '0.00',
`conversion_rate` decimal(10,2) DEFAULT '1.00',
`unit` varchar(50) DEFAULT NULL,
`size` varchar(50) DEFAULT NULL,
PRIMARY KEY (`id`),
KEY `fk_item_order` (`order_id`),
CONSTRAINT `fk_item_order` FOREIGN KEY (`order_id`) REFERENCES `supplier_orders` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

DROP TABLE IF EXISTS `supplier_orders`;
CREATE TABLE `supplier_orders` (
`id` varchar(50) NOT NULL,
`supplier_id` varchar(50) NOT NULL,
`order_number` varchar(50) NOT NULL,
`order_date` date NOT NULL,
`billing_name` varchar(255) DEFAULT NULL,
`billing_email` varchar(100) DEFAULT NULL,
`billing_mobile` varchar(20) DEFAULT NULL,
`billing_address` text,
`billing_gst` varchar(20) DEFAULT NULL,
`shipping_name` varchar(255) DEFAULT NULL,
`shipping_email` varchar(100) DEFAULT NULL,
`shipping_mobile` varchar(20) DEFAULT NULL,
`shipping_address` text,
`shipping_gst` varchar(20) DEFAULT NULL,
`gst_type` enum('LOCAL','INTERSTATE','NONE') DEFAULT 'LOCAL',
`subtotal` decimal(15,2) NOT NULL DEFAULT '0.00',
`total_gst_amount` decimal(15,2) NOT NULL DEFAULT '0.00',
`total_amount` decimal(15,2) NOT NULL DEFAULT '0.00',
`is_billed` tinyint(1) DEFAULT '0',
`created_by` varchar(50) DEFAULT NULL,
`created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
`updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
`order_type` enum('PAKKA','KACCHA') NOT NULL DEFAULT 'PAKKA',
PRIMARY KEY (`id`),
UNIQUE KEY `unique_order_no` (`order_number`),
KEY `fk_order_supplier` (`supplier_id`),
CONSTRAINT `fk_order_supplier` FOREIGN KEY (`supplier_id`) REFERENCES `suppliers` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

DROP TABLE IF EXISTS `supplier_payments`;
CREATE TABLE `supplier_payments` (
`id` varchar(50) NOT NULL,
`supplier_id` varchar(50) NOT NULL,
`bill_id` varchar(50) DEFAULT NULL,
`amount` decimal(15,2) NOT NULL,
`method` enum('CASH','BANK_TRANSFER','UPI','CHEQUE') NOT NULL,
`payment_date` datetime DEFAULT CURRENT_TIMESTAMP,
`reference_number` varchar(100) DEFAULT NULL,
`created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
`created_by` varchar(50) DEFAULT NULL,
PRIMARY KEY (`id`),
KEY `fk_pay_bill` (`bill_id`),
KEY `fk_pay_supplier` (`supplier_id`),
CONSTRAINT `fk_pay_bill` FOREIGN KEY (`bill_id`) REFERENCES `supplier_bills` (`id`) ON DELETE SET NULL,
CONSTRAINT `fk_pay_supplier` FOREIGN KEY (`supplier_id`) REFERENCES `suppliers` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

DROP TABLE IF EXISTS `suppliers`;
CREATE TABLE `suppliers` (
`id` varchar(50) NOT NULL,
`name` varchar(255) NOT NULL,
`email` varchar(255) DEFAULT NULL,
`mobile` varchar(20) DEFAULT NULL,
`address` text,
`created_by` varchar(50) DEFAULT NULL,
`created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
`updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
`pan` varchar(15) DEFAULT NULL,
`gstNumber` varchar(20) DEFAULT NULL,
PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

SET FOREIGN_KEY_CHECKS = 1;