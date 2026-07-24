import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/context/AuthContext";
import { AuthGuard } from "@/components/auth/AuthGuard";
import Index from "./pages/Index";
import ShareOfWallet from "./pages/ShareOfWallet";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import VerifyEmail from "./pages/VerifyEmail";
import Onboarding from "./pages/Onboarding";
import Join from "./pages/Join";
import SysAdmin from "./pages/SysAdmin";
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
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            {/* Destino do redirect do backend após validar o token de verificação.
                Público: o link pode ser aberto de um navegador sem sessão. */}
            <Route path="/email-verificado" element={<VerifyEmail />} />
            {/* Onboarding: requer autenticação, mas não requer org */}
            <Route
              path="/onboarding"
              element={
                <AuthGuard requireOrg={false}>
                  <Onboarding />
                </AuthGuard>
              }
            />
            {/* Join: público — Join.tsx lida internamente com usuário autenticado ou não */}
            <Route path="/join" element={<Join />} />
            {/* Painel do sistema: requer autenticação, sem necessidade de org */}
            <Route
              path="/sysadmin"
              element={
                <AuthGuard requireOrg={false}>
                  <SysAdmin />
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
            {/* Share of Wallet: módulo independente, requer autenticação + org */}
            <Route
              path="/share-of-wallet"
              element={
                <AuthGuard>
                  <ShareOfWallet />
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
