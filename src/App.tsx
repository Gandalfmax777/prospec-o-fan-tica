import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/context/AuthContext";
import { AuthGuard } from "@/components/auth/AuthGuard";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Onboarding from "./pages/Onboarding";
import Join from "./pages/Join";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <AuthProvider>
        <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            {/* Onboarding: requer autenticação, mas não requer org */}
            <Route
              path="/onboarding"
              element={
                <AuthGuard requireOrg={false}>
                  <Onboarding />
                </AuthGuard>
              }
            />
            {/* Join: requer autenticação, mas não requer org */}
            <Route
              path="/join"
              element={
                <AuthGuard requireOrg={false}>
                  <Join />
                </AuthGuard>
              }
            />
            {/* App principal: requer autenticação + org */}
            <Route
              path="/"
              element={
                <AuthGuard>
                  <Index />
                </AuthGuard>
              }
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
