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
import GoalsPage from "./pages/Goals";
import ScrollToTop from './utils/ScrollToTop';
import './styles/index.css';
import './styles/components/page-transitions.css';
import LoadingOverlay from '@/components/LoadingOverlay';
import { useAppContext } from '@/context/useAppContext';
import React, { useState, useEffect } from 'react';

const queryClient = new QueryClient();

const AppWithLoader = () => {
  const [showOverlay, setShowOverlay] = useState(true); // Always true on mount
  const { appReady } = useAppContext();

  // Set theme-color meta tag while loader is visible
  useEffect(() => {
    const meta = document.querySelector('meta[name="theme-color"]');
    if (showOverlay) {
      if (meta) meta.setAttribute('content', '#00ddc4');
      else {
        const newMeta = document.createElement('meta');
        newMeta.name = 'theme-color';
        newMeta.content = '#00ddc4';
        document.head.appendChild(newMeta);
      }
    }
    // When loader is hidden, let ThemeProvider restore the color
    // (ThemeProvider will run its effect on theme change)
  }, [showOverlay]);

  useEffect(() => {
    if (appReady && showOverlay) {
      setShowOverlay(false);
    }
  }, [appReady, showOverlay]);

  return (
    <>
      <LoadingOverlay show={showOverlay} />
      <Toaster />
      <Sonner />
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/exercise-detail" element={<ExerciseDetail />} />
        <Route path="/history" element={<History />} />
        <Route path="/tournament" element={<Tournament />} />
        <Route path="/pr-records" element={<PRRecords />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/goals" element={<GoalsPage />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
};

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true
        }}
      >
        <ScrollToTop />
        <TooltipProvider>
          <ThemeProvider>
            <AuthProvider>
              <AppProvider>
                <AppWithLoader />
              </AppProvider>
            </AuthProvider>
          </ThemeProvider>
        </TooltipProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

export default App;
