import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Inventory from "./pages/Inventory";
import Sales from "./pages/Sales";
import Employee from "./pages/Employee";
import Settings from "./pages/Settings";
import References from "./pages/References";
import Login from "./pages/Login";
import { SupplierPage } from "./pages/Supplier";
import { BillingPage } from "./pages/Billing";
import { ProtectedRoute } from "./components/ProtectedRoute";
import Error from "./pages/Error";
import { Expenses } from "./pages/Expense";
import Accounting from "./pages/Accounting";
import InternalLedger from "./pages/InternalLedger";
import CustomerPage from "./pages/Customers";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/unauthorized" element={<Error type="403" />} />
        <Route path="/not-found" element={<Error type="404" />} />

        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="inventory" element={<Inventory />} />
            <Route path="sales" element={<Sales />} />
            <Route path="employees" element={<Employee />} />
            <Route path="suppliers" element={<SupplierPage />} />
            <Route path="billings" element={<BillingPage />} />
            <Route path="settings" element={<Settings />} />
            <Route path="references" element={<References />} />
            <Route path="expenses" element={<Expenses />} />
            <Route path="accounting" element={<Accounting />} />
            <Route path="internal-ledger" element={<InternalLedger />} />
            <Route path="customers" element={<CustomerPage />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/not-found" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
