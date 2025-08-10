import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/hooks/useAuth";
import Index from "./pages/Index";
import NGODetail from "./pages/NGODetail";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import NGODashboard from "./pages/NGODashboard";
import VendorDashboard from "./pages/VendorDashboard";
import UserDashboard from "./pages/UserDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import AdminTransactionManagement from "./pages/AdminTransactionManagement";
import PasswordReset from "./pages/PasswordReset";
import HowItWorks from "./pages/HowItWorks";
import About from "./pages/About";
import Contact from "./pages/Contact";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/ngo/:id" element={<NGODetail />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/user-dashboard" element={<UserDashboard />} />
            <Route path="/ngo-dashboard" element={<NGODashboard />} />
            <Route path="/vendor-dashboard" element={<VendorDashboard />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/transactions" element={<AdminTransactionManagement />} />
            <Route path="/password-reset" element={<PasswordReset />} />
            <Route path="/how-it-works" element={<HowItWorks />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/tax-benefits" element={<Index />} />
            <Route path="/impact-stories" element={<Index />} />
            <Route path="/partner-with-us" element={<Index />} />
            <Route path="/verification-process" element={<Index />} />
            <Route path="/support" element={<Index />} />
            <Route path="/help-center" element={<Index />} />
            <Route path="/privacy-policy" element={<Index />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
