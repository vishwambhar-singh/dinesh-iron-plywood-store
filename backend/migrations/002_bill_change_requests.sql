-- Migration: Add bill_change_requests table for Formal → Actual approval workflow
CREATE TABLE IF NOT EXISTS `bill_change_requests` (
  `id` varchar(50) NOT NULL,
  `bill_type` enum('SALE','PURCHASE') NOT NULL,
  `formal_id` varchar(50) NOT NULL,
  `voucher_no` varchar(50) DEFAULT NULL,
  `status` enum('PENDING','ACCEPTED','REJECTED') NOT NULL DEFAULT 'PENDING',
  `old_actual_snapshot` json NOT NULL,
  `new_formal_snapshot` json NOT NULL,
  `changed_by` varchar(100) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `resolved_at` timestamp NULL DEFAULT NULL,
  `resolved_by` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_formal_id_type_status` (`formal_id`, `bill_type`, `status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
