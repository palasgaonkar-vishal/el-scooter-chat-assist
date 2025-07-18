
import {
  BrowserRouter as Router,
  Routes,
  Route,
} from "react-router-dom";
import { Toaster } from "sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/auth/ProtectedRoute";

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
import AdminDashboard from "@/pages/admin/AdminDashboard";
import EscalatedQueries from "@/pages/admin/EscalatedQueries";
import FAQManagement from "@/pages/admin/FAQManagement";
import Analytics from "@/pages/admin/Analytics";
import OrderManagement from "@/pages/admin/OrderManagement";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <Toaster />
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<CustomerLogin />} />
            <Route path="/register" element={<CustomerRegister />} />
            <Route path="/admin/login" element={<AdminLogin />} />

            {/* Customer routes */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
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
                <ProtectedRoute adminOnly={true}>
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
    </QueryClientProvider>
  );
}

export default App;
