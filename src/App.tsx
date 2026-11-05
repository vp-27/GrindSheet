import { lazy, Suspense, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppProvider } from "@/context/AppContext";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { ThemeProvider } from "@/context/ThemeContext";
import Auth from "@/pages/Auth";
import PWAStatus from "@/components/PWAStatus";
import ScrollToTop from "@/utils/ScrollToTop";
import "@/styles/index.css";

const Dashboard = lazy(() => import("@/pages/Dashboard"));
const History = lazy(() => import("@/pages/History"));
const ExerciseDetail = lazy(() => import("@/pages/ExerciseDetail"));
const Tournament = lazy(() => import("@/pages/Tournament"));
const PRRecords = lazy(() => import("@/pages/PRRecords"));
const Settings = lazy(() => import("@/pages/Settings"));
const NotFound = lazy(() => import("@/pages/NotFound"));
const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1 } },
});

function Protected({ children }: { children: ReactNode }) {
  const { user, loading, isPasswordRecovery } = useAuth();
  if (loading) return <PageLoading />;
  if (isPasswordRecovery) return <Navigate to="/reset-password" replace />;
  return user ? children : <Navigate to="/auth" replace />;
}
function PageLoading() {
  return (
    <div className="page-loading" role="status">
      <span className="page-loading-dot" />
      Loading GrindSheet…
    </div>
  );
}
function AppRoutes() {
  const { user, isDemo } = useAuth();
  const { pathname } = useLocation();
  return (
    <>
      <PWAStatus />
      <AppProvider
        key={`${isDemo ? "demo" : "account"}:${user?.id ?? "guest"}`}
      >
        <Toaster />
        <Suspense fallback={<PageLoading />}>
          <Routes>
            <Route path="/auth" element={<Auth key={pathname} />} />
            <Route path="/reset-password" element={<Auth key={pathname} />} />
            <Route
              path="/"
              element={
                <Protected>
                  <Dashboard />
                </Protected>
              }
            />
            <Route
              path="/history"
              element={
                <Protected>
                  <History />
                </Protected>
              }
            />
            <Route
              path="/exercise-detail"
              element={
                <Protected>
                  <ExerciseDetail />
                </Protected>
              }
            />
            <Route
              path="/tournament"
              element={
                <Protected>
                  <Tournament />
                </Protected>
              }
            />
            <Route
              path="/pr-records"
              element={
                <Protected>
                  <PRRecords />
                </Protected>
              }
            />
            <Route
              path="/settings"
              element={
                <Protected>
                  <Settings />
                </Protected>
              }
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </AppProvider>
    </>
  );
}
export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      >
        <ScrollToTop />
        <TooltipProvider>
          <ThemeProvider>
            <AuthProvider>
              <AppRoutes />
            </AuthProvider>
          </ThemeProvider>
        </TooltipProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
