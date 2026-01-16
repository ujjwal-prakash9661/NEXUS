import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import SecuritySettings from "./pages/SecuritySettings";
import AdminDashboard from "./pages/AdminDashboard";
import { AdminRoute } from "./components/auth/AdminRoute";
import NotFound from "./pages/NotFound";
import { FaceMonitorProvider } from "@/contexts/FaceMonitorContext";
import { GlobalFaceMonitor } from "@/components/security/GlobalFaceMonitor";
import AuthPageWithProvider from "./pages/AuthPage";
import { WebRTCProvider } from "@/components/nexus/WebRTCProvider";

const queryClient = new QueryClient();

import ProtectedRoute from "@/components/auth/ProtectedRoute";

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <FaceMonitorProvider>
            <GlobalFaceMonitor />
            <WebRTCProvider>
              <Routes>
                {/* Public Routes */}
                <Route path="/login" element={<AuthPageWithProvider defaultTab="login" />} />
                <Route path="/register" element={<AuthPageWithProvider defaultTab="register" />} />

                {/* Protected Routes */}
                <Route
                  path="/"
                  element={
                    <ProtectedRoute>
                      <Index />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute>
                      <Index />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/settings/*"
                  element={
                    <ProtectedRoute>
                      <SecuritySettings />
                    </ProtectedRoute>
                  }
                />

                {/* Admin routes (Already have built-in checks, but wrapping is safer) */}
                <Route element={<AdminRoute />}>
                  <Route path="/admin" element={<AdminDashboard />} />
                </Route>

                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </WebRTCProvider>
          </FaceMonitorProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
