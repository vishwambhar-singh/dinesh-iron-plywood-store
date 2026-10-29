-- Migration: Add is_active column to suppliers and customers tables
-- Purpose: Support active/inactive status filtering and soft deletion
-- Date: 2026-07-20

ALTER TABLE `suppliers` ADD COLUMN `is_active` tinyint(1) NOT NULL DEFAULT '1';
ALTER TABLE `customers` ADD COLUMN `is_active` tinyint(1) NOT NULL DEFAULT '1';
