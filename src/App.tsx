import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppProvider } from "@/context/AppContext";
import { AuthProvider } from "@/context/AuthContext";
import { ThemeProvider } from "@/context/ThemeContext";
import Dashboard from "./pages/Dashboard";
import History from "./pages/History";
import ExerciseDetail from "./pages/ExerciseDetail";
import Tournament from "./pages/Tournament";
import PRRecords from "./pages/PRRecords";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";
import Auth from "./pages/Auth";
import ToastDemo from "./pages/ToastDemo";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true
      }}
    >
      <TooltipProvider>
        <ThemeProvider>
          <AuthProvider>
            <AppProvider>
              <Toaster />
              <Sonner />
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/exercise-detail" element={<ExerciseDetail />} />
                <Route path="/history" element={<History />} />
                <Route path="/tournament" element={<Tournament />} />
                <Route path="/pr-records" element={<PRRecords />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/toast-demo" element={<ToastDemo />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </AppProvider>
          </AuthProvider>
        </ThemeProvider>
      </TooltipProvider>
    </BrowserRouter>
  </QueryClientProvider>
);

export default App;
