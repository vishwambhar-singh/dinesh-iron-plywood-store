-- Create Database
CREATE DATABASE IF NOT EXISTS inventory_management_system;
USE inventory_management_system;

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET FOREIGN_KEY_CHECKS = 0;

-- =========================
-- COMPANY DETAILS
-- =========================
DROP TABLE IF EXISTS company_details;

CREATE TABLE company_details (
  id INT NOT NULL,
  name VARCHAR(255),
  email VARCHAR(255),
  mobile VARCHAR(20),
  address TEXT,
  logo_url TEXT,
  gst_number VARCHAR(20),
  pan_number VARCHAR(20),
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CHECK (id = 1)
);

INSERT INTO company_details VALUES (
  1,
  'CityScene Global',
  'citysceneglobal@gmail.com',
  '7689999377',
  'Jaipur, Rajasthan, India',
  'https://res.cloudinary.com/demo/image/upload/sample.png',
  '27ABCDE1234F1Z5',
  'ABCDE1234F',
  CURRENT_TIMESTAMP
);

-- =========================
-- EMPLOYEES
-- =========================
DROP TABLE IF EXISTS employees;

CREATE TABLE employees (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  mobile VARCHAR(20) NOT NULL,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(50),
  salary DECIMAL(10,2) DEFAULT 0.00,
  permissions JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO employees VALUES
('3280180a','Ashish','ashish@gmail.com','7482907681','$2b$10$hash','ADMIN',25000,'["/"]',CURRENT_TIMESTAMP),
('86589449','Abhishek','asaini9926@gmail.com','9602799926','$2b$10$hash','ADMIN',22000,'["/"]',CURRENT_TIMESTAMP);

-- =========================
-- CUSTOMERS
-- =========================
DROP TABLE IF EXISTS customers;

CREATE TABLE customers (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100),
  mobile VARCHAR(20),
  address TEXT,
  gstNumber VARCHAR(20),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =========================
-- INVENTORY
-- =========================
DROP TABLE IF EXISTS inventory;

CREATE TABLE inventory (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  hsn VARCHAR(20),
  category VARCHAR(50),
  unit VARCHAR(50),
  available_stock DECIMAL(15,2) DEFAULT 0,
  buying_price DECIMAL(10,2) DEFAULT 0,
  selling_price DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =========================
-- SALES
-- =========================
DROP TABLE IF EXISTS sales;

CREATE TABLE sales (
  id VARCHAR(50) PRIMARY KEY,
  invoice_number VARCHAR(50) UNIQUE,
  customer_name VARCHAR(255),
  sale_date DATE,
  subtotal DECIMAL(12,2),
  total_amount DECIMAL(12,2),
  amount_paid DECIMAL(12,2),
  balance DECIMAL(12,2),
  payment_status ENUM('PENDING','PARTIALLY_PAID','PAID') DEFAULT 'PENDING',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =========================
-- SALE ITEMS
-- =========================
DROP TABLE IF EXISTS sale_items;

CREATE TABLE sale_items (
  id VARCHAR(50) PRIMARY KEY,
  sale_id VARCHAR(50),
  product_id VARCHAR(50),
  name VARCHAR(255),
  qty DECIMAL(15,2),
  price DECIMAL(12,2),
  FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE
);

-- =========================
-- SUPPLIERS
-- =========================
DROP TABLE IF EXISTS suppliers;

CREATE TABLE suppliers (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(255),
  mobile VARCHAR(20),
  address TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =========================
-- EXPENSES
-- =========================
DROP TABLE IF EXISTS expenses;

CREATE TABLE expenses (
  id VARCHAR(50) PRIMARY KEY,
  category VARCHAR(50),
  amount DECIMAL(15,2),
  method ENUM('CASH','ONLINE','BANK','CARD') DEFAULT 'CASH',
  date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =========================
-- SETTINGS
-- =========================
DROP TABLE IF EXISTS settings;

CREATE TABLE settings (
  `key` VARCHAR(100) PRIMARY KEY,
  value TEXT,
  `group` VARCHAR(50),
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

INSERT INTO settings VALUES
('customer_credit_days','15','credit_terms',CURRENT_TIMESTAMP),
('supplier_credit_days','50','credit_terms',CURRENT_TIMESTAMP);

SET FOREIGN_KEY_CHECKS = 1;