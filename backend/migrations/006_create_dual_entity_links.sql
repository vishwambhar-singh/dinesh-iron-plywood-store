-- Migration 006: Create Dual Entity Links Table
CREATE TABLE IF NOT EXISTS dual_entity_links (
    id VARCHAR(50) NOT NULL,
    customer_id VARCHAR(50) NOT NULL,
    supplier_id VARCHAR(50) NOT NULL,
    notes TEXT,
    created_by VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_customer (customer_id),
    UNIQUE KEY uq_supplier (supplier_id),
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
