-- Migration: Add actual_amount column to cashbook_transactions
-- Purpose: Separate Pakka vs Actual amounts in cashbook tracking
-- Date: 2026-04-28
-- Author: Kilo AI Refactor

-- Add actual_amount column if it doesn't exist
ALTER TABLE cashbook_transactions
ADD COLUMN IF NOT EXISTS actual_amount DECIMAL(15, 2) DEFAULT 0.00 AFTER pakka_amount;

-- Update existing automatic entries to split amounts correctly
-- For existing entries where actual_amount is NULL, set it to 0
UPDATE cashbook_transactions
SET actual_amount = 0
WHERE actual_amount IS NULL;

-- Note: Existing entries have pakka_amount = amount (if not set) — this is correct for historical data

-- Done
