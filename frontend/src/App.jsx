import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { SocketProvider } from './contexts/SocketContext';
import ProtectedRoute from './components/common/ProtectedRoute';
import DashboardLayout from './components/layout/DashboardLayout';
import LoginPage from './pages/LoginPage';
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import ManagerDashboardPage from './pages/manager/ManagerDashboardPage';
import CustomerDashboardPage from './pages/customer/CustomerDashboardPage';

// CRM Pages
import CustomerListPage from './pages/crm/CustomerListPage';
import CustomerDetailPage from './pages/crm/CustomerDetailPage';
import LeadKanbanPage from './pages/crm/LeadKanbanPage';
import AppointmentsPage from './pages/crm/AppointmentsPage';

// Project Pages
import ProjectListPage from './pages/projects/ProjectListPage';
import ProjectDetailPage from './pages/projects/ProjectDetailPage';

// Design & Quotation Pages
import DesignManagementPage from './pages/designs/DesignManagementPage';
import QuotationBuilderPage from './pages/quotations/QuotationBuilderPage';

// Financial & Inventory Pages
import PaymentManagementPage from './pages/payments/PaymentManagementPage';
import InventoryDashboardPage from './pages/inventory/InventoryDashboardPage';

// Enterprise & Support Pages
import StaffManagementPage from './pages/employees/StaffManagementPage';
import AnalyticsDashboardPage from './pages/analytics/AnalyticsDashboardPage';
import SupportWarrantyPage from './pages/support/SupportWarrantyPage';

// Root redirector based on authenticated role
const RootRedirect = () => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'ADMIN') return <Navigate to="/admin" replace />;
  if (user.role === 'MANAGER') return <Navigate to="/manager" replace />;
  return <Navigate to="/customer" replace />;
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SocketProvider>
          <Routes>
            {/* Public Auth */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/" element={<RootRedirect />} />

            {/* Admin Routes */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <DashboardLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<AdminDashboardPage />} />
              <Route path="customers" element={<CustomerListPage />} />
              <Route path="customers/:id" element={<CustomerDetailPage />} />
              <Route path="leads" element={<LeadKanbanPage />} />
              <Route path="appointments" element={<AppointmentsPage />} />
              <Route path="projects" element={<ProjectListPage />} />
              <Route path="projects/:id" element={<ProjectDetailPage />} />
              <Route path="designs" element={<DesignManagementPage />} />
              <Route path="quotations" element={<QuotationBuilderPage />} />
              <Route path="payments" element={<PaymentManagementPage />} />
              <Route path="inventory" element={<InventoryDashboardPage />} />
              <Route path="employees" element={<StaffManagementPage />} />
              <Route path="analytics" element={<AnalyticsDashboardPage />} />
              <Route path="support" element={<SupportWarrantyPage />} />
              <Route path="*" element={<AdminDashboardPage />} />
            </Route>

            {/* Manager Routes */}
            <Route
              path="/manager"
              element={
                <ProtectedRoute allowedRoles={['MANAGER']}>
                  <DashboardLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<ManagerDashboardPage />} />
              <Route path="crm" element={<LeadKanbanPage />} />
              <Route path="customers" element={<CustomerListPage />} />
              <Route path="customers/:id" element={<CustomerDetailPage />} />
              <Route path="appointments" element={<AppointmentsPage />} />
              <Route path="projects" element={<ProjectListPage />} />
              <Route path="projects/:id" element={<ProjectDetailPage />} />
              <Route path="stages" element={<ProjectListPage />} />
              <Route path="designs" element={<DesignManagementPage />} />
              <Route path="quotations" element={<QuotationBuilderPage />} />
              <Route path="inventory" element={<InventoryDashboardPage />} />
              <Route path="support" element={<SupportWarrantyPage />} />
              <Route path="*" element={<ManagerDashboardPage />} />
            </Route>

            {/* Customer Routes */}
            <Route
              path="/customer"
              element={
                <ProtectedRoute allowedRoles={['CUSTOMER']}>
                  <DashboardLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<CustomerDashboardPage />} />
              <Route path="timeline" element={<CustomerDashboardPage />} />
              <Route path="designs" element={<DesignManagementPage />} />
              <Route path="quotations" element={<QuotationBuilderPage />} />
              <Route path="payments" element={<PaymentManagementPage />} />
              <Route path="warranty" element={<SupportWarrantyPage />} />
              <Route path="support" element={<SupportWarrantyPage />} />
              <Route path="*" element={<CustomerDashboardPage />} />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </SocketProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
