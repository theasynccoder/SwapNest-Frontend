// import { Toaster } from "@/components/ui/toaster";
// import { Toaster as Sonner } from "@/components/ui/sonner";
// import { TooltipProvider } from "@/components/ui/tooltip";
// import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
// import { BrowserRouter, Routes, Route } from "react-router-dom";
// import { AuthProvider } from "./contexts/AuthContext";
// import Index from "./pages/Index";
// import Auth from "./pages/Auth";
// import Dashboard from "./pages/Dashboard";
// import Browse from "./pages/Browse";
// import Sell from "./pages/Sell";
// import Messages from "./pages/Messages";
// import Subscription from "./pages/Subscription";
// import ProductDetail from "./pages/ProductDetail";
// import Payment from "./pages/Payment";
// import ListingFee from "./pages/ListingFee";
// import AdminPayments from "./pages/AdminPayments";
// import NotFound from "./pages/NotFound";
// import AdminLogin from "./pages/AdminLogin";
// import AdminDashboard from "./pages/AdminDashboard";

// const queryClient = new QueryClient();

// const App = () => (
//   <QueryClientProvider client={queryClient}>
//     <AuthProvider>
//       <TooltipProvider>
//         <Toaster />
//         <Sonner />
//         <BrowserRouter>
//           <Routes>
//             <Route path="/" element={<Index />} />
//             <Route path="/auth" element={<Auth />} />
//             <Route path="/dashboard" element={<Dashboard />} />
//             <Route path="/browse" element={<Browse />} />
//             <Route path="/product/:id" element={<ProductDetail />} />
//             <Route path="/payment/:id" element={<Payment />} />
//             <Route path="/listing-fee" element={<ListingFee />} />
//             <Route path="/sell" element={<Sell />} />
//             <Route path="/messages" element={<Messages />} />
//             <Route path="/messages/:conversationId" element={<Messages />} />
//             <Route path="/subscription" element={<Subscription />} />
//             <Route path="/admin/payments" element={<AdminPayments />} />
//             <Route path="/admin-login" element={<AdminLogin />} />
//             <Route path="/admin-dashboard" element={<AdminDashboard />} />
//             <Route path="*" element={<NotFound />} />
//           </Routes>
//         </BrowserRouter>
//       </TooltipProvider>
//     </AuthProvider>
//   </QueryClientProvider>
// );

// export default App;

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import VerifyEmail from "./pages/VerifyEmail";
import Dashboard from "./pages/Dashboard";
import Browse from "./pages/Browse";
import Sell from "./pages/Sell";
import Messages from "./pages/Messages";
import Subscription from "./pages/Subscription";
import ProductDetail from "./pages/ProductDetail";
import Payment from "./pages/Payment";
import ListingFee from "./pages/ListingFee";
import AdminPayments from "./pages/AdminPayments";
import NotFound from "./pages/NotFound";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";

const queryClient = new QueryClient();

// Admin Guard Component
const AdminGuard = ({ children }: { children: React.ReactNode }) => {
  const isAdmin = () => {
    const userEmail = localStorage.getItem("user_email");
    const isAdminFlag = localStorage.getItem("is_admin");
    
    return userEmail === "mamughees292@gmail.com" && isAdminFlag === "true";
  };

  if (!isAdmin()) {
    return <Navigate to="/admin-login" replace />;
  }

  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/verify-email" element={<VerifyEmail />} />
            <Route path="/browse" element={<Browse />} />
            <Route path="/product/:id" element={<ProductDetail />} />
            <Route path="/payment/:id" element={<Payment />} />
            <Route path="/listing-fee" element={<ListingFee />} />
            <Route path="/sell" element={<Sell />} />
            <Route path="/messages" element={<Messages />} />
            <Route path="/messages/:conversationId" element={<Messages />} />
            <Route path="/subscription" element={<Subscription />} />
            
            {/* Admin Routes */}
            <Route path="/admin-login" element={<AdminLogin />} />
            
            {/* Protected Admin Routes */}
            <Route path="/admin/payments" element={
              <AdminGuard>
                <AdminPayments />
              </AdminGuard>
            } />
            
            <Route path="/admin-dashboard" element={
              <AdminGuard>
                <AdminDashboard />
              </AdminGuard>
            } />
            
            {/* Redirect admin to payments page (optional) */}
            <Route path="/admin" element={<Navigate to="/admin/payments" />} />
            
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;