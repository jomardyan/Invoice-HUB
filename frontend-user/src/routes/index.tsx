import { Routes, Route, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { CircularProgress, Box } from '@mui/material';
import ProtectedRoute from '../components/ProtectedRoute';
import MainLayout from '../components/templates/MainLayout';
import AuthLayout from '../components/templates/AuthLayout';

// Lazy load pages for better performance
const Login = lazy(() => import('../pages/Auth/Login'));
const Register = lazy(() => import('../pages/Auth/Register'));
const Dashboard = lazy(() => import('../pages/Dashboard'));
const InvoiceList = lazy(() => import('../pages/Invoices/InvoiceList'));
const InvoiceCreate = lazy(() => import('../pages/Invoices/InvoiceCreate'));
const InvoiceEdit = lazy(() => import('../pages/Invoices/InvoiceEdit'));
const InvoiceDetail = lazy(() => import('../pages/Invoices/InvoiceDetail'));
const CustomerList = lazy(() => import('../pages/Customers/CustomerList'));
const CustomerDetail = lazy(() => import('../pages/Customers/CustomerDetail'));
const ProductList = lazy(() => import('../pages/Products/ProductList'));
const ProductDetail = lazy(() => import('../pages/Products/ProductDetail'));
const PaymentList = lazy(() => import('../pages/Payments/PaymentList'));
const Reports = lazy(() => import('../pages/Reports'));
const Templates = lazy(() => import('../pages/Templates'));
const Notifications = lazy(() => import('../pages/Notifications'));
const Integrations = lazy(() => import('../pages/Integrations'));
const Settings = lazy(() => import('../pages/Settings/Settings'));

// Loading component
const LoadingFallback = () => (
  <Box
    display="flex"
    justifyContent="center"
    alignItems="center"
    minHeight="100vh"
  >
    <CircularProgress />
  </Box>
);

function AppRoutes() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <Routes>
        {/* Public routes */}
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Route>

        {/* Protected routes */}
        <Route
          path="/:tenantId"
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          <Route path="dashboard" element={<Dashboard />} />
          
          {/* Invoice routes */}
          <Route path="invoices">
            <Route index element={<InvoiceList />} />
            <Route path="create" element={<InvoiceCreate />} />
            <Route path="edit/:id" element={<InvoiceEdit />} />
            <Route path="view/:id" element={<InvoiceDetail />} />
          </Route>

          {/* Customer routes */}
          <Route path="customers">
            <Route index element={<CustomerList />} />
            <Route path="view/:id" element={<CustomerDetail />} />
          </Route>

          {/* Product routes */}
          <Route path="products">
            <Route index element={<ProductList />} />
            <Route path="view/:id" element={<ProductDetail />} />
          </Route>

          {/* Payment routes */}
          <Route path="payments">
            <Route index element={<PaymentList />} />
          </Route>

          {/* Reports */}
          <Route path="reports" element={<Reports />} />

          {/* Templates */}
          <Route path="templates" element={<Templates />} />

          {/* Notifications */}
          <Route path="notifications" element={<Notifications />} />

          {/* Integrations */}
          <Route path="integrations" element={<Integrations />} />

          {/* Settings */}
          <Route path="settings" element={<Settings />} />
        </Route>

        {/* Default redirect */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Suspense>
  );
}

export default AppRoutes;
