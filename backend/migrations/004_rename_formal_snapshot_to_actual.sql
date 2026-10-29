-- Migration: Rename new_formal_snapshot to new_actual_snapshot in bill_change_requests table
ALTER TABLE `bill_change_requests` CHANGE `new_formal_snapshot` `new_actual_snapshot` json NOT NULL;
