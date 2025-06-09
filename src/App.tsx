import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppProvider } from "@/context/AppContext";
import { AuthProvider } from "@/context/AuthContext";
import { ThemeProvider } from "@/context/ThemeContext";
import Dashboard from "./pages/Dashboard";
import AddExercise from "./pages/AddExercise";
import History from "./pages/History";
import ExerciseDetail from "./pages/ExerciseDetail";
import Leaderboard from "./pages/Leaderboard";
import Tournament from "./pages/Tournament";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";
import Auth from "./pages/Auth";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <TooltipProvider>
        <ThemeProvider>
          <AuthProvider>
            <AppProvider>
              <Toaster />
              <Sonner />
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/add-exercise" element={<AddExercise />} />
                <Route path="/exercise-detail" element={<ExerciseDetail />} />
                <Route path="/history" element={<History />} />
                <Route path="/leaderboard" element={<Leaderboard />} />
                <Route path="/tournament" element={<Tournament />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/auth" element={<Auth />} />
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
