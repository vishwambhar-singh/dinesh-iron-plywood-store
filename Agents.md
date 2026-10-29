# Global Development Rules & Engineering Standards: Plydecore Inventory Management

These rules apply to all software development, architecture, debugging, refactoring, database design, backend, frontend, DevOps, and deployment work in **Plydecore Inventory Management (Ply Decore Sales / PDS)** unless explicitly overridden.

---

## 1. Production-Ready Code Over MVPs

Never build intentionally disposable, toy, mock, or MVP-quality implementations.

Every feature added or touched must be production-ready:
* **End-to-End Completeness**: If a button, table, column, or modal exists on screen, its database schema, backend API routes, validation, and real-time state synchronization must be 100% complete and working.
* **No Placeholders or Dead Ends**: Never leave `// TODO: implement later`, empty handlers, dummy data, or unhandled errors.
* **Clean Architecture**: Separation of concerns across controllers, routes, database transactions, UI components, and state stores.
* **Maintainability & Typing**: Strict TypeScript types on the frontend, clean ES modules on the backend, and proper database constraints.
* **Resilient Failure Handling**: Graceful degradation, informative user feedback, and safe rollbacks on failures.

Do not over-engineer simple features; use the cleanest, simplest architecture that is genuinely production-safe and robust.

---

## 2. The Dual-Reality Architecture: Formal (Pakka) vs. Informal (Actual / Kaccha)

The foundational architecture of Plydecore Inventory Management is built on two parallel operational dimensions that must be respected across every table, route, ledger, and UI view:

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    PLYDECORE INVENTORY MANAGEMENT SYSTEM                        │
├──────────────────────────────────────┬──────────────────────────────────────────┤
│         FORMAL REGISTRY (PAKKA)      │         INTERNAL GODOWN (ACTUAL/KACCHA)  │
├──────────────────────────────────────┼──────────────────────────────────────────┤
│ • Brand: Ply Decore Sales (Green)    │ • Brand: PDS Internal (Amber)            │
│ • Legal GST Tax Invoices             │ • Ground-Reality Godown Delivery Chits   │
│ • Statutory Tax Computation          │ • Actual Buying/Selling Prices & Margins │
│   (CGST, SGST, IGST, HSN brackets)   │ • Real Physical Stock Movement           │
│ • Official Suppliers & Customers     │ • Godown Deduction Commissions           │
│ • Tax Ledger: `ledger_formal_pakka`  │ • Actual Ledger: `ledger_internal_actual`│
│ • Formal Cashbook & Bank Vouchers    │ • Internal Godown Cashbook               │
│ • Role Access: ADMIN, ACCOUNTANT     │ • Role Access: ADMIN, GODOWN, ACCOUNTANT │
└──────────────────────────────────────┴──────────────────────────────────────────┘
```

### Core Principles for Dual Modes:
1. **Zero Contamination**:
   * Never leak or mix Informal/Actual values (unbilled cash, actual rates, godown commissions) into Formal tax invoices or GST ledgers.
   * Formal numbers must strictly balance according to statutory GST calculations and official tax invoices.
2. **Dual Balances on Every Financial Entity**:
   * Both `customers` and `suppliers` maintain two independent balance realities:
     - `opening_balance_pakka` vs. `opening_balance_actual`
     - Formal ledger balances vs. Internal godown balances.
   * New financial aggregates must always account for both modes separately.
3. **Role & Surface Isolation**:
   * `GODOWN` personnel must never see Formal tax margins, statutory billing desks, or official tax ledgers unless explicitly permitted.
   * The UI must visibly distinguish the active mode using established design tokens (Green indicator for Formal Registry, Amber/Gold indicator for Internal Godown).

---

## 3. Dual-Entity Architecture: Parties Operating as Both Customer & Supplier

In real-world plywood and laminate trading, many business entities are **both** customers (we sell goods to them) and suppliers (they supply raw materials, laminates, or hardware to us).

### System Rules for Dual Entities ("Both"):
1. **Entity Identification & Association**:
   * The system must recognize when an entity operates in both capacities, either via an explicit linkage, dual-role designation, or synchronized identification (matching PAN/GST/mobile/link ID).
   * A single business partner must never be lost in silos where customer transactions are invisible to supplier procurement.
2. **Unified Dual Entity Profile & 360° Hub**:
   * Users must be able to view a consolidated profile for "Both" parties containing:
     - Combined Account Summary (Total Receivable as Customer, Total Payable as Supplier, and Net Position).
     - Unified Transaction History (Customer Invoices + Supplier Bills, chronological & searchable).
     - Consolidated Payment Logs (Receipts from them + Payments to them).
     - Separate tabs for Formal (Pakka) vs. Informal (Actual) breakdowns.
3. **Contra Settlements & Mutual Offsetting**:
   * The system must support **Contra Reconciliation**: offsetting receivables against payables (e.g., Supplier owes ₹50,000 for sales, we owe ₹70,000 for purchases → Net Payable ₹20,000).
   * Every contra adjustment must generate linked contra accounting vouchers (`accounting_vouchers` with `voucher_type = 'CONTRA'`) with full audit narrations.
   * Contra adjustments must respect mode boundaries: Pakka contra entries affect only Formal ledgers; Actual contra entries affect only Internal ledgers.
4. **Export & Statement Integrity**:
   * PDF and Excel statements for dual entities must clearly show:
     - Customer Ledger (Debits, Credits, Balance)
     - Supplier Ledger (Debits, Credits, Balance)
     - Combined Net Settlement Ledger with clear audit reference numbers.

---

## 4. Understand Before Coding

Never jump straight into writing or modifying code.

First thoroughly understand:
* **The Business Requirement**: What operational problem is being solved for Ply Decore Sales?
* **Existing System & Data Flow**: How `billingRoutes`, `customerRoutes`, `supplierRoutes`, and `cashbookRoutes` currently function.
* **Database Dependencies**: Check existing columns, foreign keys, enums, and indexing in `backend/schema/init.sql` and `backend/migrations/`.
* **Side Effects**: Will modifying a customer ledger affect the cashbook, stock valuation, or GST reports?
* **Reuse First**: Check existing utilities, modals, PDF generators (`StatementPDF.tsx`), and data tables before writing new components.
* Never rewrite functional code simply for subjective aesthetic reasons.

---

## 5. Minimal and Focused Changes

Make the smallest, cleanest change that correctly and comprehensively solves the problem.

Avoid:
* Rewriting entire files when touching 10-20 lines is sufficient.
* Modifying unrelated routes, components, or configurations.
* Introducing unnecessary third-party libraries when existing tools (`uuid`, `mysql2`, `chakra-ui`, `lucide-react`, `date-fns`) suffice.
* Making arbitrary schema changes without a versioned migration file.

Every change must have a clear, traceable justification.

---

## 6. Architecture and Separation of Concerns

Keep responsibilities well-defined and isolated:

### Backend (`/backend`):
* **Routes (`/routes`)**: Define HTTP paths, methods, role middleware, and route-level validation.
* **Controllers (`/controllers`)**: Handle request extraction, input validation, transaction management, and response formatting.
* **Database Pool (`/config/db.js`)**: Always use pooled connections with parameterized queries.
* **Migrations (`/migrations`)**: Any schema adjustment must be documented in a sequenced migration script (e.g., `006_add_dual_entity_support.sql`).

### Frontend (`/frontend`):
* **Pages (`/pages`)**: Coordinate view state, fetch data, and arrange page-level layout.
* **Components (`/components`)**: Reusable, presentation-focused UI widgets (tables, modals, diff cards, badges).
* **Store (`/store`)**: Global application and auth state (`useAuthStore`).
* **Utils & Hooks (`/utils`, `/hooks`)**: Pure helper functions (currency formatting, date formatting, keyboard shortcuts).

---

## 7. Database Integrity & Migration Standards

1. **Transactional Safety (`BEGIN ... COMMIT / ROLLBACK`)**:
   * Any operation modifying multiple tables (e.g., creating a sale + inserting items + updating ledger + logging price change) **MUST** execute inside a MySQL database transaction (`const conn = await pool.getConnection(); await conn.beginTransaction(); ...`).
2. **Numeric Precision**:
   * All monetary amounts and balances must use `DECIMAL(15, 2)`.
   * All quantities must use `DECIMAL(15, 2)` to support fractional units if needed.
   * Never store currency as floating-point numbers.
3. **Foreign Keys & Cascades**:
   * Respect existing foreign key constraints.
   * Never hard-delete records that have associated ledger, invoice, or voucher history. Use soft deletion or inactivation (`is_active = 0`).
4. **Migrations**:
   * Never edit production databases directly without creating a corresponding SQL migration file in `backend/migrations/`.

---

## 8. Strong Error Handling & Validation

1. **Untrusted Input**: Treat all user and external API input as untrusted. Validate types, required fields, and acceptable ranges before querying the database.
2. **Meaningful Error Responses**:
   * Backend APIs must return structured JSON: `{ error: 'Descriptive human-readable error message' }`.
   * Include proper HTTP status codes (`400 Bad Request`, `401 Unauthorized`, `403 Forbidden`, `404 Not Found`, `409 Conflict`, `500 Internal Server Error`).
3. **Graceful UI Handling**:
   * UI components must display clear banners, toasts, or inline alerts instead of crashing or showing blank screens.
   * Use loading skeletons or spinner indicators (`Loader2`) during async network operations.
4. **Never Swallow Errors**: Always log server-side errors with `console.error` and provide recoverable states where possible.

---

## 9. Security by Default

1. **Authentication & Authorization**:
   * All non-auth endpoints must require a valid JWT token verified via `authMiddleware`.
   * Role-based permissions (`ADMIN`, `ACCOUNTANT`, `GODOWN`) must be enforced on both the backend API and frontend routing (`RoleProtectedRoute`).
2. **SQL Injection Prevention**:
   * **MANDATORY**: Use parameterized queries (`pool.query('SELECT ... WHERE id = ?', [id])`).
   * Never concatenate raw user input into SQL queries.
3. **Secret & Key Discipline**:
   * Never commit secrets, credentials, `.env` files, or `.pem` SSH keys into version control.
   * Store all sensitive credentials in `backend/.env`.

---

## 10. Frontend Quality & User Experience Standards

1. **Dual Visual Identity**:
   * **Formal Mode**: Dark slate headers, green brand badges (`Formal Registry`), official document nomenclature.
   * **Internal / Actual Mode**: Amber/gold accents (`Internal Godown`), godown-friendly fast-entry inputs.
2. **High-Density Keyboard-Friendly Layout**:
   * This is an operational inventory & billing system used by busy clerks and accountants.
   * Maintain fast keyboard shortcuts (`Alt+1..6`, `Ctrl/Cmd+K`, `Escape`, `Enter`).
   * Keep tables compact, data-dense, well-padded, and easily searchable.
3. **Component Reusability**:
   * Use standard components: `DataTable`, `Modal`, `DownloadStatementBtn`, `Badge`.
   * Standardize date formatting with `formatToDDMMYY`.

---

## 11. Final Engineering Checklist

Before declaring any feature or bug fix complete, verify:

1. [ ] **Dual Mode Checked**: Does this work correctly in Formal (Pakka) mode? Does it work correctly in Informal (Actual) mode?
2. [ ] **Zero Data Leakage**: Are formal and informal financials properly separated?
3. [ ] **Dual Entity Consistency**: If this touches a party that is both customer and supplier, are both ledgers kept consistent?
4. [ ] **Transaction Atomicity**: Are multi-table writes wrapped in database transactions?
5. [ ] **Role Permissions**: Can an unauthorized role (e.g., `GODOWN`) bypass this in the API?
6. [ ] **UI Responsiveness & Polish**: Are there visual glitches, broken styles, or missing loading states?
7. [ ] **Tested with Real Data**: Has the endpoint or page been tested with real database data?

---

## Engineering Principle

Always optimize in this exact order:

$$\text{Correctness} \longrightarrow \text{Financial Accuracy} \longrightarrow \text{Security} \longrightarrow \text{Reliability} \longrightarrow \text{Maintainability} \longrightarrow \text{UX \& Speed}$$

Build software that is dependable, mathematically accurate, and clean enough for any engineer to maintain and extend with confidence.
