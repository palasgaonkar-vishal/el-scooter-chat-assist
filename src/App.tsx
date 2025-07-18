import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// Pages
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

// Auth Pages
import CustomerLogin from "./pages/auth/CustomerLogin";
import CustomerRegister from "./pages/auth/CustomerRegister";
import AdminLogin from "./pages/auth/AdminLogin";

// Customer Pages
import Dashboard from "./pages/customer/Dashboard";
import Chat from "./pages/customer/Chat";
import OrderStatus from "./pages/customer/OrderStatus";
import Profile from "./pages/customer/Profile";

// Admin Pages
import AdminDashboard from "./pages/admin/AdminDashboard";
import FAQManagement from "./pages/admin/FAQManagement";
import EscalatedQueries from "./pages/admin/EscalatedQueries";
import Analytics from "./pages/admin/Analytics";

// Layouts
import CustomerLayout from "./components/layout/CustomerLayout";
import AdminLayout from "./components/layout/AdminLayout";
import ProtectedRoute from "./components/auth/ProtectedRoute";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Index />} />
          
          {/* Authentication Routes */}
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

          {/* Redirects */}
          <Route path="/admin" element={<Navigate to="/admin/login" replace />} />
          
          {/* 404 - Keep this as the last route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
