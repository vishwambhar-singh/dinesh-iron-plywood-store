# Dinesh Iron Plywood Store — Inventory Management System

Advanced inventory, billing, and accounting system for Dinesh Iron Plywood Store.

## Architecture
- **Frontend:** React 19 + TypeScript + Vite + Chakra UI
- **Backend:** Node.js + Express 5 (ESM) + MySQL
- **Auth:** JWT + bcrypt
- **PDF:** @react-pdf/renderer

## Setup

### 1. Database
```bash
mysql -u root -p -e "CREATE DATABASE dinesh_iron_plywood_db CHARACTER SET utf8mb4;"
mysql -u root -p dinesh_iron_plywood_db < backend/schema/init.sql
```

### 2. Backend
```bash
cd backend
cp .env.example .env      # Fill in your DB credentials and JWT secret
npm install
npm run migrate           # Run database migrations
npm run dev               # http://localhost:5000
```

### 3. Frontend
```bash
cd frontend
npm install
npm run dev               # http://localhost:5173
```

## First Login
Default admin credentials are set in ackend/config/users.json.
**Change the password immediately after first login.**

## Client Configuration
After first login, go to Settings to configure:
- Company name, address, phone
- GST number
- Invoice prefix and numbering
- Bank account details
