-- MySQL dump 10.13  Distrib 8.0.46, for Linux (x86_64)
--
-- Host: localhost    Database: inventory_management_system
-- ------------------------------------------------------
-- Server version	8.0.46-0ubuntu0.24.04.2

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `accounting_vouchers`
--

DROP TABLE IF EXISTS `accounting_vouchers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
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
  `related_entity_type` enum('CUSTOMER','SUPPLIER','BILL','PO','NONE') DEFAULT 'NONE',
  `related_entity_id` varchar(50) DEFAULT NULL,
  `status` enum('PENDING','APPROVED','REJECTED') DEFAULT 'PENDING',
  `approved_by` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `company_details`
--

DROP TABLE IF EXISTS `company_details`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
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
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `customers`
--

DROP TABLE IF EXISTS `customers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `customers` (
  `id` varchar(50) NOT NULL,
  `name` varchar(100) NOT NULL,
  `email` varchar(100) DEFAULT NULL,
  `mobile` varchar(30) DEFAULT NULL,
  `address` text,
  `gstNumber` varchar(20) DEFAULT NULL,
  `opening_balance` decimal(15,2) DEFAULT '0.00',
  `needs_review` tinyint(1) DEFAULT '0',
  `created_by` varchar(50) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `mobile` (`mobile`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `dummy_company_details`
--

DROP TABLE IF EXISTS `dummy_company_details`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
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
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `employees`
--

DROP TABLE IF EXISTS `employees`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
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
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `expenses`
--

DROP TABLE IF EXISTS `expenses`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
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
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `internal_ledgers`
--

DROP TABLE IF EXISTS `internal_ledgers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
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
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `internal_payments`
--

DROP TABLE IF EXISTS `internal_payments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
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
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `inventory`
--

DROP TABLE IF EXISTS `inventory`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
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
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `leaves`
--

DROP TABLE IF EXISTS `leaves`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `leaves` (
  `id` varchar(50) NOT NULL,
  `employee_id` varchar(50) NOT NULL,
  `start_date` date NOT NULL,
  `end_date` date NOT NULL,
  `days` int NOT NULL,
  `reason` varchar(255) NOT NULL,
  `status` enum('PENDING','APPROVED','REJECTED') DEFAULT 'PENDING',
  `month` int NOT NULL,
  `year` int NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `employee_id` (`employee_id`),
  CONSTRAINT `leaves_ibfk_1` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `notification_reads`
--

DROP TABLE IF EXISTS `notification_reads`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `notification_reads` (
  `id` char(36) NOT NULL,
  `notification_id` char(36) NOT NULL,
  `user_id` char(36) NOT NULL,
  `read_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `notification_id` (`notification_id`),
  CONSTRAINT `notification_reads_ibfk_1` FOREIGN KEY (`notification_id`) REFERENCES `notifications` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `notification_targets`
--

DROP TABLE IF EXISTS `notification_targets`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `notification_targets` (
  `id` char(36) NOT NULL,
  `notification_id` char(36) NOT NULL,
  `target_type` varchar(20) NOT NULL,
  `target_value` varchar(50) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `notification_id` (`notification_id`),
  CONSTRAINT `notification_targets_ibfk_1` FOREIGN KEY (`notification_id`) REFERENCES `notifications` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `notifications`
--

DROP TABLE IF EXISTS `notifications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
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
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `payment_entries`
--

DROP TABLE IF EXISTS `payment_entries`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `payment_entries` (
  `id` varchar(50) NOT NULL,
  `order_id` varchar(50) DEFAULT NULL,
  `supplier_id` varchar(50) DEFAULT NULL,
  `amount` decimal(15,2) NOT NULL,
  `payment_date` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `method` enum('CASH','UPI','BANK_TRANSFER','CHEQUE') NOT NULL,
  `reference_number` varchar(100) DEFAULT NULL,
  `remarks` text,
  `created_by` varchar(50) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_payment_order` (`order_id`),
  KEY `fk_payment_supplier` (`supplier_id`),
  CONSTRAINT `fk_payment_order` FOREIGN KEY (`order_id`) REFERENCES `supplier_orders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_payment_supplier` FOREIGN KEY (`supplier_id`) REFERENCES `suppliers` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `references`
--

DROP TABLE IF EXISTS `references`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
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
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `return_items`
--

DROP TABLE IF EXISTS `return_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
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
  `item_index` int NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `fk_ret_item_header` (`return_id`),
  CONSTRAINT `fk_ret_item_header` FOREIGN KEY (`return_id`) REFERENCES `returns` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `returns`
--

DROP TABLE IF EXISTS `returns`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
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
  `customer_id` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `return_number` (`return_number`),
  KEY `fk_ret_sale_id` (`original_sale_id`),
  CONSTRAINT `fk_ret_sale_id` FOREIGN KEY (`original_sale_id`) REFERENCES `sales` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `role_permissions`
--

DROP TABLE IF EXISTS `role_permissions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `role_permissions` (
  `role` varchar(50) NOT NULL,
  `permissions` json NOT NULL,
  PRIMARY KEY (`role`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `salary_advances`
--

DROP TABLE IF EXISTS `salary_advances`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `salary_advances` (
  `id` varchar(50) NOT NULL,
  `employee_id` varchar(50) NOT NULL,
  `amount` decimal(15,2) NOT NULL,
  `reason` varchar(255) NOT NULL,
  `status` enum('PENDING','APPROVED','REJECTED') DEFAULT 'PENDING',
  `month` int NOT NULL,
  `year` int NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `employee_id` (`employee_id`),
  CONSTRAINT `salary_advances_ibfk_1` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `salary_records`
--

DROP TABLE IF EXISTS `salary_records`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `salary_records` (
  `id` varchar(50) NOT NULL,
  `employee_id` varchar(50) NOT NULL,
  `month` int NOT NULL,
  `year` int NOT NULL,
  `base_salary` decimal(10,2) NOT NULL DEFAULT '0.00',
  `total_leaves` int NOT NULL DEFAULT '0',
  `leave_deduction_amount` decimal(10,2) NOT NULL DEFAULT '0.00',
  `advance_taken` decimal(10,2) NOT NULL DEFAULT '0.00',
  `net_payable` decimal(10,2) NOT NULL DEFAULT '0.00',
  `amount_paid` decimal(10,2) NOT NULL DEFAULT '0.00',
  `status` enum('PENDING','PARTIALLY_PAID','PAID') DEFAULT 'PENDING',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_month_year_emp` (`employee_id`,`month`,`year`),
  CONSTRAINT `salary_records_ibfk_1` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `sale_items`
--

DROP TABLE IF EXISTS `sale_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
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
  `item_index` int NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `sale_id` (`sale_id`),
  CONSTRAINT `sale_items_ibfk_1` FOREIGN KEY (`sale_id`) REFERENCES `sales` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `sales`
--

DROP TABLE IF EXISTS `sales`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
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
  `customer_id` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `invoice_number` (`invoice_number`),
  KEY `reference_id` (`reference_id`),
  CONSTRAINT `sales_ibfk_1` FOREIGN KEY (`reference_id`) REFERENCES `references` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `sales_payments`
--

DROP TABLE IF EXISTS `sales_payments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
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
) ENGINE=InnoDB AUTO_INCREMENT=1234 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `settings`
--

DROP TABLE IF EXISTS `settings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `settings` (
  `key` varchar(100) NOT NULL,
  `value` text NOT NULL,
  `group` varchar(50) DEFAULT 'general',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`key`),
  UNIQUE KEY `key` (`key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `supplier_bill_items`
--

DROP TABLE IF EXISTS `supplier_bill_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
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
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `supplier_bills`
--

DROP TABLE IF EXISTS `supplier_bills`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
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
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `supplier_order_items`
--

DROP TABLE IF EXISTS `supplier_order_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
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
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `supplier_orders`
--

DROP TABLE IF EXISTS `supplier_orders`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
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
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `supplier_payments`
--

DROP TABLE IF EXISTS `supplier_payments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
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
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `suppliers`
--

DROP TABLE IF EXISTS `suppliers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `suppliers` (
  `id` varchar(50) NOT NULL,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) DEFAULT NULL,
  `mobile` varchar(20) DEFAULT NULL,
  `address` text,
  `opening_balance` decimal(15,2) DEFAULT '0.00',
  `created_by` varchar(50) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `pan` varchar(15) DEFAULT NULL,
  `gstNumber` varchar(20) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-06-18  6:23:24
