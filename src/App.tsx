
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/contexts/AuthContext";
import { Toaster } from "@/components/ui/toaster";
import ProtectedRoute from "./components/auth/ProtectedRoute";

// Pages
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

// Customer Pages
import CustomerLogin from "./pages/auth/CustomerLogin";
import CustomerRegister from "./pages/auth/CustomerRegister";
import Dashboard from "./pages/customer/Dashboard";
import Chat from "./pages/customer/Chat";
import OrderStatus from "./pages/customer/OrderStatus";
import Profile from "./pages/customer/Profile";

// Admin Pages
import AdminLogin from "./pages/auth/AdminLogin";
import AdminDashboard from "./pages/admin/AdminDashboard";
import FAQManagement from "./pages/admin/FAQManagement";
import EscalatedQueries from "./pages/admin/EscalatedQueries";
import Analytics from "./pages/admin/Analytics";

// Layouts
import CustomerLayout from "./components/layout/CustomerLayout";
import AdminLayout from "./components/layout/AdminLayout";

import "./App.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<CustomerLogin />} />
            <Route path="/register" element={<CustomerRegister />} />
            <Route path="/admin/login" element={<AdminLogin />} />

            {/* Customer Protected Routes */}
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <CustomerLayout />
              </ProtectedRoute>
            }>
              <Route index element={<Dashboard />} />
            </Route>
            
            <Route path="/chat" element={
              <ProtectedRoute>
                <CustomerLayout />
              </ProtectedRoute>
            }>
              <Route index element={<Chat />} />
            </Route>
            
            <Route path="/order-status" element={
              <ProtectedRoute>
                <CustomerLayout />
              </ProtectedRoute>
            }>
              <Route index element={<OrderStatus />} />
            </Route>
            
            <Route path="/profile" element={
              <ProtectedRoute>
                <CustomerLayout />
              </ProtectedRoute>
            }>
              <Route index element={<Profile />} />
            </Route>

            {/* Admin Protected Routes */}
            <Route path="/admin/dashboard" element={
              <ProtectedRoute adminOnly={true}>
                <AdminLayout />
              </ProtectedRoute>
            }>
              <Route index element={<AdminDashboard />} />
            </Route>
            
            <Route path="/admin/faq" element={
              <ProtectedRoute adminOnly={true}>
                <AdminLayout />
              </ProtectedRoute>
            }>
              <Route index element={<FAQManagement />} />
            </Route>
            
            <Route path="/admin/queries" element={
              <ProtectedRoute adminOnly={true}>
                <AdminLayout />
              </ProtectedRoute>
            }>
              <Route index element={<EscalatedQueries />} />
            </Route>
            
            <Route path="/admin/analytics" element={
              <ProtectedRoute adminOnly={true}>
                <AdminLayout />
              </ProtectedRoute>
            }>
              <Route index element={<Analytics />} />
            </Route>

            {/* Catch all route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
          <Toaster />
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
