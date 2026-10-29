-- Database Schema Dump
SET FOREIGN_KEY_CHECKS = 0;

-- Table: accounting_vouchers
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
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Table: company_details
CREATE TABLE `company_details` (
  `id` int NOT NULL,
  `name` varchar(255) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `mobile` varchar(20) DEFAULT NULL,
  `address` text,
  `logo_url` longtext,
  `gst_number` varchar(20) DEFAULT NULL,
  `pan_number` varchar(20) DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  CONSTRAINT `company_details_chk_1` CHECK ((`id` = 1))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Table: customer_item_mapping
CREATE TABLE `customer_item_mapping` (
  `id` varchar(50) NOT NULL,
  `customer_id` varchar(50) NOT NULL,
  `item_id` varchar(50) NOT NULL,
  `actual_selling_price` decimal(15,2) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_cust_item` (`customer_id`,`item_id`),
  KEY `item_id` (`item_id`),
  CONSTRAINT `customer_item_mapping_ibfk_1` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE CASCADE,
  CONSTRAINT `customer_item_mapping_ibfk_2` FOREIGN KEY (`item_id`) REFERENCES `items` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Table: customers
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
  `state` varchar(100) DEFAULT NULL,
  `country` varchar(100) DEFAULT 'India',
  `registration_type` varchar(100) DEFAULT 'Regular',
  `opening_balance_pakka` decimal(15,2) DEFAULT '0.00',
  `opening_balance_actual` decimal(15,2) DEFAULT '0.00',
  `closing_balance` decimal(15,2) DEFAULT '0.00',
  `pan` varchar(15) DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Table: employees
CREATE TABLE `employees` (
  `id` varchar(50) NOT NULL,
  `name` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `mobile` varchar(20) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role` varchar(50) DEFAULT 'STAFF',
  `salary` decimal(10,2) DEFAULT '0.00',
  `permissions` json DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Table: expenses
CREATE TABLE `expenses` (
  `id` varchar(36) NOT NULL,
  `employee_id` varchar(50) DEFAULT NULL,
  `category` varchar(50) NOT NULL,
  `amount` decimal(15,2) NOT NULL,
  `method` enum('CASH','ONLINE','BANK','CARD') NOT NULL DEFAULT 'CASH',
  `date` date NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `employee_id` (`employee_id`),
  CONSTRAINT `expenses_ibfk_1` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Table: internal_ledgers
CREATE TABLE `internal_ledgers` (
  `id` varchar(36) NOT NULL,
  `entity_type` enum('CUSTOMER','SUPPLIER') NOT NULL,
  `entity_id` varchar(50) DEFAULT NULL,
  `bill_id` varchar(50) NOT NULL,
  `amount` decimal(15,2) NOT NULL DEFAULT '0.00',
  `amount_paid` decimal(15,2) NOT NULL DEFAULT '0.00',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Table: item_shades
CREATE TABLE `item_shades` (
  `id` varchar(50) NOT NULL,
  `item_id` varchar(50) NOT NULL,
  `shade_id_label` varchar(100) NOT NULL,
  `available_qty` decimal(15,2) DEFAULT '0.00',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `unit` varchar(20) DEFAULT 'pcs',
  `base_pakka_purchase_rate` decimal(15,2) DEFAULT '0.00',
  `base_pakka_selling_rate` decimal(15,2) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `item_id` (`item_id`),
  CONSTRAINT `item_shades_ibfk_1` FOREIGN KEY (`item_id`) REFERENCES `items` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Table: items
CREATE TABLE `items` (
  `id` varchar(50) NOT NULL,
  `name` varchar(255) NOT NULL,
  `hsn_code` varchar(50) NOT NULL,
  `base_pakka_selling_rate` decimal(15,2) NOT NULL,
  `tax_bracket_percent` decimal(5,2) NOT NULL DEFAULT '18.00',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `base_pakka_purchase_rate` decimal(15,2) DEFAULT '0.00',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Table: ledger_formal_pakka
CREATE TABLE `ledger_formal_pakka` (
  `voucher_no` varchar(50) NOT NULL,
  `entity_type` enum('SUPPLIER','CUSTOMER') NOT NULL,
  `entity_id` varchar(50) NOT NULL,
  `transaction_type` enum('PURCHASE','SALE','RETURN','PAYMENT') NOT NULL,
  `total_taxable_value` decimal(15,2) NOT NULL,
  `total_tax_computed` decimal(15,2) NOT NULL,
  `net_invoice_total` decimal(15,2) NOT NULL,
  `financial_period` varchar(20) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`voucher_no`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Table: ledger_internal_actual
CREATE TABLE `ledger_internal_actual` (
  `voucher_no` varchar(50) NOT NULL,
  `entity_type` enum('SUPPLIER','CUSTOMER') NOT NULL,
  `entity_id` varchar(50) NOT NULL,
  `transaction_type` enum('PURCHASE','SALE','RETURN','PAYMENT') NOT NULL,
  `net_godown_total` decimal(15,2) NOT NULL,
  `split_reference` varchar(50) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`voucher_no`),
  CONSTRAINT `ledger_internal_actual_ibfk_1` FOREIGN KEY (`voucher_no`) REFERENCES `ledger_formal_pakka` (`voucher_no`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Table: price_change_log
CREATE TABLE `price_change_log` (
  `id` int NOT NULL AUTO_INCREMENT,
  `entity_type` enum('ITEM_PAKKA_SALE','SUPPLIER_PAKKA_BUY','SUPPLIER_ACTUAL_DEDUCTION','CUSTOMER_ACTUAL_SALE') COLLATE utf8mb4_unicode_ci NOT NULL,
  `entity_id` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `old_value` decimal(15,2) DEFAULT NULL,
  `new_value` decimal(15,2) DEFAULT NULL,
  `changed_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `reference_transaction_id` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT 'MANUAL_CHANGE',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: role_permissions
CREATE TABLE `role_permissions` (
  `role` varchar(50) NOT NULL,
  `permissions` json NOT NULL,
  PRIMARY KEY (`role`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Table: sale_items
CREATE TABLE `sale_items` (
  `id` varchar(50) NOT NULL,
  `sale_id` varchar(50) NOT NULL,
  `shade_id` varchar(50) NOT NULL,
  `name` varchar(255) NOT NULL,
  `hsn` varchar(100) DEFAULT NULL,
  `qty` decimal(15,2) NOT NULL DEFAULT '0.00',
  `price` decimal(15,2) NOT NULL DEFAULT '0.00',
  `cgst` decimal(5,2) DEFAULT '0.00',
  `sgst` decimal(5,2) DEFAULT '0.00',
  `igst` decimal(5,2) DEFAULT '0.00',
  `gst_amount` decimal(15,2) DEFAULT '0.00',
  `price_after_gst` decimal(15,2) DEFAULT '0.00',
  `actual_price` decimal(15,2) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `sale_id` (`sale_id`),
  KEY `shade_id` (`shade_id`),
  CONSTRAINT `sale_items_ibfk_1` FOREIGN KEY (`sale_id`) REFERENCES `sales` (`id`) ON DELETE CASCADE,
  CONSTRAINT `sale_items_ibfk_2` FOREIGN KEY (`shade_id`) REFERENCES `item_shades` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Table: sales
CREATE TABLE `sales` (
  `id` varchar(50) NOT NULL,
  `invoice_number` varchar(50) NOT NULL,
  `voucher_no` varchar(50) DEFAULT NULL,
  `customer_id` varchar(50) DEFAULT NULL,
  `customer_name` varchar(255) NOT NULL,
  `sale_date` date NOT NULL,
  `sale_type` enum('KACCHA','PAKKA') NOT NULL DEFAULT 'PAKKA',
  `gst_type` enum('LOCAL','INTERSTATE','NONE') NOT NULL DEFAULT 'LOCAL',
  `subtotal` decimal(15,2) NOT NULL DEFAULT '0.00',
  `total_gst_amount` decimal(15,2) NOT NULL DEFAULT '0.00',
  `discount` decimal(15,2) NOT NULL DEFAULT '0.00',
  `total_amount` decimal(15,2) NOT NULL DEFAULT '0.00',
  `amount_paid` decimal(15,2) NOT NULL DEFAULT '0.00',
  `balance` decimal(15,2) NOT NULL DEFAULT '0.00',
  `payment_status` enum('PENDING','PARTIALLY_PAID','PAID','RETURNED') NOT NULL DEFAULT 'PENDING',
  `created_by` varchar(50) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `invoice_number` (`invoice_number`),
  KEY `voucher_no` (`voucher_no`),
  KEY `customer_id` (`customer_id`),
  CONSTRAINT `sales_ibfk_1` FOREIGN KEY (`voucher_no`) REFERENCES `ledger_formal_pakka` (`voucher_no`) ON DELETE SET NULL,
  CONSTRAINT `sales_ibfk_2` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Table: sales_payments
CREATE TABLE `sales_payments` (
  `id` int NOT NULL AUTO_INCREMENT,
  `sale_id` varchar(50) NOT NULL,
  `payment_mode` enum('CASH','UPI','CHEQUE','BANK_TRANSFER') NOT NULL,
  `reference_number` varchar(100) DEFAULT NULL,
  `amount` decimal(15,2) NOT NULL,
  `payment_date` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `sale_id` (`sale_id`),
  CONSTRAINT `sales_payments_ibfk_1` FOREIGN KEY (`sale_id`) REFERENCES `sales` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Table: settings
CREATE TABLE `settings` (
  `key` varchar(100) NOT NULL,
  `value` text NOT NULL,
  `group` varchar(50) DEFAULT 'general',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Table: supplier_bill_items
CREATE TABLE `supplier_bill_items` (
  `id` varchar(50) NOT NULL,
  `bill_id` varchar(50) NOT NULL,
  `shade_id` varchar(50) DEFAULT NULL,
  `hsn` varchar(20) DEFAULT NULL,
  `name` varchar(255) NOT NULL,
  `received_qty` decimal(15,2) DEFAULT '0.00',
  `price` decimal(15,2) DEFAULT '0.00',
  `cgst` decimal(5,2) DEFAULT '0.00',
  `sgst` decimal(5,2) DEFAULT '0.00',
  `igst` decimal(5,2) DEFAULT '0.00',
  `price_after_gst` decimal(15,2) DEFAULT '0.00',
  `actual_price` decimal(15,2) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `bill_id` (`bill_id`),
  KEY `shade_id` (`shade_id`),
  CONSTRAINT `supplier_bill_items_ibfk_1` FOREIGN KEY (`bill_id`) REFERENCES `supplier_bills` (`id`) ON DELETE CASCADE,
  CONSTRAINT `supplier_bill_items_ibfk_2` FOREIGN KEY (`shade_id`) REFERENCES `item_shades` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Table: supplier_bills
CREATE TABLE `supplier_bills` (
  `id` varchar(50) NOT NULL,
  `supplier_id` varchar(50) NOT NULL,
  `voucher_no` varchar(50) DEFAULT NULL,
  `bill_number` varchar(100) NOT NULL,
  `bill_date` date NOT NULL,
  `subtotal` decimal(15,2) DEFAULT '0.00',
  `total_gst_amount` decimal(15,2) DEFAULT '0.00',
  `total_amount` decimal(15,2) DEFAULT '0.00',
  `amount_paid` decimal(15,2) DEFAULT '0.00',
  `balance_amount` decimal(15,2) DEFAULT '0.00',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `created_by` varchar(50) DEFAULT NULL,
  `status` enum('PENDING','FULFILLED') DEFAULT 'PENDING',
  PRIMARY KEY (`id`),
  KEY `supplier_id` (`supplier_id`),
  KEY `voucher_no` (`voucher_no`),
  CONSTRAINT `supplier_bills_ibfk_1` FOREIGN KEY (`supplier_id`) REFERENCES `suppliers` (`id`) ON DELETE CASCADE,
  CONSTRAINT `supplier_bills_ibfk_2` FOREIGN KEY (`voucher_no`) REFERENCES `ledger_formal_pakka` (`voucher_no`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Table: supplier_item_mapping
CREATE TABLE `supplier_item_mapping` (
  `id` varchar(50) NOT NULL,
  `supplier_id` varchar(50) NOT NULL,
  `item_id` varchar(50) NOT NULL,
  `pakka_buying_rate` decimal(15,2) NOT NULL,
  `kaccha_deduction_commission` decimal(15,2) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_supp_item` (`supplier_id`,`item_id`),
  KEY `item_id` (`item_id`),
  CONSTRAINT `supplier_item_mapping_ibfk_1` FOREIGN KEY (`supplier_id`) REFERENCES `suppliers` (`id`) ON DELETE CASCADE,
  CONSTRAINT `supplier_item_mapping_ibfk_2` FOREIGN KEY (`item_id`) REFERENCES `items` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Table: supplier_payments
CREATE TABLE `supplier_payments` (
  `id` varchar(50) NOT NULL,
  `supplier_id` varchar(50) NOT NULL,
  `bill_id` varchar(50) DEFAULT NULL,
  `amount` decimal(15,2) NOT NULL,
  `method` enum('CASH','BANK_TRANSFER','UPI','CHEQUE') NOT NULL,
  `payment_date` datetime DEFAULT CURRENT_TIMESTAMP,
  `reference_number` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `bill_id` (`bill_id`),
  KEY `supplier_id` (`supplier_id`),
  CONSTRAINT `supplier_payments_ibfk_1` FOREIGN KEY (`bill_id`) REFERENCES `supplier_bills` (`id`) ON DELETE SET NULL,
  CONSTRAINT `supplier_payments_ibfk_2` FOREIGN KEY (`supplier_id`) REFERENCES `suppliers` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Table: suppliers
CREATE TABLE `suppliers` (
  `id` varchar(50) NOT NULL,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) DEFAULT NULL,
  `mobile` varchar(20) DEFAULT NULL,
  `address` text,
  `pan` varchar(15) DEFAULT NULL,
  `gstNumber` varchar(20) DEFAULT NULL,
  `created_by` varchar(50) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `state` varchar(100) DEFAULT NULL,
  `country` varchar(100) DEFAULT 'India',
  `registration_type` varchar(100) DEFAULT 'Regular',
  `opening_balance_pakka` decimal(15,2) DEFAULT '0.00',
  `opening_balance_actual` decimal(15,2) DEFAULT '0.00',
  `closing_balance` decimal(15,2) DEFAULT '0.00',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

SET FOREIGN_KEY_CHECKS = 1;
