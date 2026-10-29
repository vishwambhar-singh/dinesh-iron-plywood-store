import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Employees from './pages/Employees';
import StaffManagement from './pages/StaffManagement';
import Suppliers from './pages/Suppliers';
import Customers from './pages/Customers';
import ItemGenerator from './pages/ItemGenerator';
import PakkaInvoices from './pages/PakkaInvoices';
import ActualAccounting from './pages/ActualAccounting';
import MappingConfigurator from './pages/MappingConfigurator';
import Settings from './pages/Settings';
import Cashbook from './pages/Cashbook';
import BillingTerminal from './pages/BillingTerminal';
import InventoryStock from './pages/InventoryStock';
import AdjustmentLogs from './pages/AdjustmentLogs';
import DualEntities from './pages/DualEntities';
import { useAuthStore } from './store/useAuthStore';

// Base Protective Wrapper
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const token = useAuthStore(state => state.token);
  if (!token) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

// Role-based Protective Wrapper
const RoleProtectedRoute = ({ children, roles }: { children: React.ReactNode, roles: string[] }) => {
  const { token, user } = useAuthStore();
  if (!token) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user?.role || '')) {
    if (user?.role === 'GODOWN') return <Navigate to="/actual" replace />;
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
};

function App() {
  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route index element={
              <RoleProtectedRoute roles={['ADMIN', 'ACCOUNTANT']}>
                <Dashboard />
              </RoleProtectedRoute>
            } />
            <Route path="employees" element={<RoleProtectedRoute roles={['ADMIN', 'GODOWN']}><Employees /></RoleProtectedRoute>} />
            <Route path="staff" element={<RoleProtectedRoute roles={['ADMIN', 'ACCOUNTANT', 'GODOWN']}><StaffManagement /></RoleProtectedRoute>} />
            <Route path="suppliers" element={<Suppliers />} />
            <Route path="customers" element={<Customers />} />
            <Route path="dual-entities" element={<RoleProtectedRoute roles={['ADMIN', 'ACCOUNTANT']}><DualEntities /></RoleProtectedRoute>} />
            <Route path="inventory" element={<ItemGenerator />} />
            <Route path="live-stock" element={<InventoryStock />} />

            {/* Pakka Panel - ADMIN ONLY */}
            <Route path="billing" element={<RoleProtectedRoute roles={['ADMIN']}><BillingTerminal panelMode="PAKKA" /></RoleProtectedRoute>} />
            <Route path="pakka" element={<RoleProtectedRoute roles={['ADMIN']}><PakkaInvoices /></RoleProtectedRoute>} />
            <Route path="pakka-cashbook" element={<RoleProtectedRoute roles={['ADMIN']}><Cashbook panelMode="PAKKA" /></RoleProtectedRoute>} />
            <Route path="adjustment-logs" element={<RoleProtectedRoute roles={['ADMIN', 'ACCOUNTANT']}><AdjustmentLogs /></RoleProtectedRoute>} />

            {/* Actual Panel - Accessible to ADMIN, GODOWN, and ACCOUNTANT */}
            <Route path="actual" element={<RoleProtectedRoute roles={['ADMIN', 'GODOWN', 'ACCOUNTANT']}><ActualAccounting /></RoleProtectedRoute>} />
            <Route path="actual-cashbook" element={<RoleProtectedRoute roles={['ADMIN', 'GODOWN', 'ACCOUNTANT']}><Cashbook panelMode="ACTUAL" /></RoleProtectedRoute>} />

            {/* Mapping Configurator */}
            <Route path="mappings" element={<RoleProtectedRoute roles={['ADMIN', 'GODOWN', 'ACCOUNTANT']}><MappingConfigurator /></RoleProtectedRoute>} />

            {/* Settings */}
            <Route path="settings" element={<RoleProtectedRoute roles={['ADMIN']}><Settings /></RoleProtectedRoute>} />
          </Route>

        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;
