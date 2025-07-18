import {
  BrowserRouter as Router,
  Routes,
  Route,
} from "react-router-dom";
import { Toaster } from "sonner";
import { QueryClient } from "@tanstack/react-query";

import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

import Index from "@/pages/Index";
import CustomerLogin from "@/pages/auth/CustomerLogin";
import CustomerRegister from "@/pages/auth/CustomerRegister";
import AdminLogin from "@/pages/auth/AdminLogin";
import NotFound from "@/pages/NotFound";

import CustomerLayout from "@/components/layout/CustomerLayout";
import Dashboard from "@/pages/customer/Dashboard";
import Profile from "@/pages/customer/Profile";
import FAQ from "@/pages/customer/FAQ";
import Chat from "@/pages/customer/Chat";
import OrderStatus from "@/pages/customer/OrderStatus";

import AdminLayout from "@/components/layout/AdminLayout";
import AdminDashboard from "@/pages/admin/Dashboard";
import EscalatedQueries from "@/pages/admin/EscalatedQueries";
import FAQManagement from "@/pages/admin/FAQManagement";
import Analytics from "@/pages/admin/Analytics";
import OrderManagement from "@/pages/admin/OrderManagement";

function App() {
  return (
    <QueryClient>
      <AuthProvider>
        <Router>
          <Toaster />
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<Index />} />
            <Route path="/auth/customer-login" element={<CustomerLogin />} />
            <Route path="/auth/customer-register" element={<CustomerRegister />} />
            <Route path="/auth/admin-login" element={<AdminLogin />} />

            {/* Customer routes */}
            <Route
              path="/customer"
              element={
                <ProtectedRoute requiredRole="customer">
                  <CustomerLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Dashboard />} />
              <Route path="profile" element={<Profile />} />
              <Route path="faq" element={<FAQ />} />
              <Route path="chat" element={<Chat />} />
              <Route path="orders" element={<OrderStatus />} />
            </Route>

            {/* Admin routes */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute requiredRole="admin">
                  <AdminLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<AdminDashboard />} />
              <Route path="escalated-queries" element={<EscalatedQueries />} />
              <Route path="orders" element={<OrderManagement />} />
              <Route path="faq" element={<FAQManagement />} />
              <Route path="analytics" element={<Analytics />} />
            </Route>

            {/* 404 route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Router>
      </AuthProvider>
    </QueryClient>
  );
}

export default App;
