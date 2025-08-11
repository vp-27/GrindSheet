import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAppContext } from '@/context/useAppContext';
import { calculateProgress, getOverallProgressChartData, getExerciseProgressChartData } from '@/utils/progressUtils';
import { generateCurrentTournament } from '@/utils/tournamentUtils';
import { TrendingUp, Clock, Trophy, ChevronRight, Activity, Zap, Search, X, Filter, TrendingDown, Target, Users } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import ProgressChart from '@/components/dashboard/ProgressChart';
import ChartWithLoader from '@/components/dashboard/ChartWithLoader';
import ChartTooltipCard from '@/components/dashboard/ChartTooltipCard';
import { getCategoryColors, getCategoryKeyByName, getCategoryChartColors } from '@/utils/categoryColors';
import { format } from 'date-fns';
import { Tournament } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import AnimatedCounter from '@/components/ui/animated-counter';
import { MobileSlider } from '@/components/ui/mobile-slider';
import '@/styles/index.css';
import { Input } from '@/components/ui/input'; // Import Input
import { Progress } from '@/components/ui/progress'; // Import Progress for circular rings
import '@/styles/components/search.css'; // Import search styles
import '@/styles/components/weekly-recommendation-widget.css'; // Import weekly recommendation widget styles

const Dashboard = () => {
  const { categories, exercises, exerciseLogs, loading } = useAppContext();
  const { profile } = useAuth();
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'recent' | 'pr' | 'progress'>('recent');
  const [currentTournament, setCurrentTournament] = useState<Tournament | null>(null);
  const [tournamentInitialized, setTournamentInitialized] = useState(false);
  const [chartHoverData, setChartHoverData] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isProgressDropdownOpen, setIsProgressDropdownOpen] = useState(false);
  const [dynamicPercentGain, setDynamicPercentGain] = useState<number | null>(null); // NEW
  const [chartTimeframe, setChartTimeframe] = useState<'2W' | '1M' | 'ALL'>('2W'); // NEW

  // Refs and state for the animated category filter
  const [indicatorStyle, setIndicatorStyle] = useState({});
  const filterContainerRef = useRef<HTMLDivElement>(null);
  const buttonRefs = useRef<{[key: string]: HTMLButtonElement | null}>({});
  // Track if user has interacted with the slider to prevent initial animation
  const [hasInteracted, setHasInteracted] = useState(false);

  // Use the same color system as the rest of the app
  const chartColors = getCategoryChartColors();

  // This effect updates the sliding indicator for the category filter
  useEffect(() => {
    const activeId = selectedCategoryId ?? 'all';
    const activeButton = buttonRefs.current[activeId];
    if (activeButton) {
      const activeColor = selectedCategoryId
        ? getCategoryColor(categories.findIndex(cat => cat.id === selectedCategoryId))
        : 'hsl(var(--primary))';
      setIndicatorStyle({
        transform: `translateX(${activeButton.offsetLeft}px)`,
        width: `${activeButton.offsetWidth}px`,
        backgroundColor: activeColor,
        transition: hasInteracted ? 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)' : 'none',
      });
      activeButton.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    }
  }, [selectedCategoryId, categories, hasInteracted]);

  // Generate tournament data with better state management
  useEffect(() => {
    const generateTournament = async () => {
      // Don't start until we have all necessary data
      if (!exercises.length || !categories.length) {
        return;
      }
      
      try {
        // Fetch users from Supabase
        const { data: usersData, error: usersError } = await supabase.from('profiles').select('id, name, username, avatar_url');
        
        if (usersError || !usersData) {
          setCurrentTournament(null);
          setTournamentInitialized(true);
          return;
        }

        const users = usersData.map((u: any) => ({
          id: u.id,
          name: u.name,
          username: u.username,
          avatarUrl: u.avatar_url
        }));

        // Fetch ALL exercise logs for tournament calculation (not just current user's)
        const { data: allLogsData, error: logsError } = await supabase
          .from('exercise_logs')
          .select('*');
        
        if (logsError || !allLogsData) {
          setCurrentTournament(null);
          setTournamentInitialized(true);
          return;
        }

        const allExerciseLogs = allLogsData.map((log: any) => ({
          id: log.id,
          userId: log.user_id,
          exerciseId: log.exercise_id,
          weight: log.weight,
          timestamp: log.timestamp,
          note: log.note,
          weightUnit: log.weight_unit
        }));

        const tournament = generateCurrentTournament(users, allExerciseLogs, exercises, categories);
        setCurrentTournament(tournament);
        setTournamentInitialized(true);
      } catch (error) {
        console.error('Error generating tournament:', error);
        setCurrentTournament(null);
        setTournamentInitialized(true);
      }
    };

    // Only generate when we have all data and haven't initialized yet
    if (exercises.length > 0 && categories.length > 0 && !tournamentInitialized) {
      generateTournament();
    }
  }, [exercises, categories, tournamentInitialized]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isProgressDropdownOpen && !(event.target as Element).closest('.progress-dropdown-container')) {
        setIsProgressDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isProgressDropdownOpen]);

  // Get color for a category based on its index
  const getCategoryColor = (categoryIndex: number) => {
    return chartColors[categoryIndex % chartColors.length];
  };

  // Calculate weekly category progress for recommendation widget
  const weeklyCategories = useMemo(() => {
    if (!exerciseLogs || !exercises || !categories || !profile || 
        exerciseLogs.length === 0 || exercises.length === 0 || categories.length === 0) return [];
    
    const userLogs = exerciseLogs.filter(log => log.userId === profile.id);
    
    // Get start of current week (Monday)
    const now = new Date();
    const currentDay = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const daysFromMonday = currentDay === 0 ? 6 : currentDay - 1; // If Sunday, go back 6 days to Monday
    const mondayThisWeek = new Date(now);
    mondayThisWeek.setDate(now.getDate() - daysFromMonday);
    mondayThisWeek.setHours(0, 0, 0, 0); // Start of Monday
    
    // Get logs from this week and today specifically
    const recentLogs = userLogs.filter(log => new Date(log.timestamp) >= mondayThisWeek);
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayLogs = userLogs.filter(log => {
      const logDate = new Date(log.timestamp);
      const logDateOnly = new Date(logDate.getFullYear(), logDate.getMonth(), logDate.getDate());
      return logDateOnly.getTime() === today.getTime();
    });
    
    return categories.map((category, index) => {
      const categoryExercises = exercises.filter(ex => ex.categoryId === category.id);
      const categoryLogs = recentLogs.filter(log => 
        categoryExercises.some(ex => ex.id === log.exerciseId)
      );
      const todayCategoryLogs = todayLogs.filter(log => 
        categoryExercises.some(ex => ex.id === log.exerciseId)
      );
      
      const hasActivity = categoryLogs.length > 0;
      const completedThisWeek = categoryLogs.length > 0; // Check mark shows if worked out this week
      const color = getCategoryColor(index);
      
      // Calculate category performance (average percentage loss/gain)
      let averagePerformanceChange = 0;
      let exercisesWithLosses = 0;
      let significantLoss = false;
      
      if (categoryExercises.length > 0) {
        const progressData = categoryExercises.map(exercise => 
          calculateProgress(userLogs, exercise.id, exercise)
        ).filter(progress => 
          progress.percentGainFromPrevious !== undefined && 
          progress.previousWeight !== undefined
        );
        
        if (progressData.length > 0) {
          const totalChange = progressData.reduce((sum, progress) => 
            sum + (progress.percentGainFromPrevious || 0), 0
          );
          averagePerformanceChange = totalChange / progressData.length;
          
          // Count exercises with losses > 3%
          exercisesWithLosses = progressData.filter(progress => 
            (progress.percentGainFromPrevious || 0) < -3
          ).length;
          
          // Significant loss if average loss > 5% or multiple exercises declining
          significantLoss = averagePerformanceChange < -5 || 
                           (exercisesWithLosses >= 2 && averagePerformanceChange < -2);
        }
      }
      
      return {
        id: category.id,
        name: category.name,
        hasActivity,
        completedThisWeek,
        color,
        exerciseCount: categoryLogs.length,
        exercises: categoryExercises,
        averagePerformanceChange,
        exercisesWithLosses,
        significantLoss
      };
    });
  }, [exerciseLogs, exercises, categories, profile]);

  // Handle checklist click - navigate to main page to show exercises
  const handleChecklistClick = () => {
    navigate('/');
  };

  // Filter logs based on selected category
  const filteredLogs = useMemo(() => {
    if (!selectedCategoryId) {
      return exerciseLogs;
    }
    
    const categoryExercises = exercises.filter(
      exercise => exercise.categoryId === selectedCategoryId
    ).map(exercise => exercise.id);
    
    return exerciseLogs.filter(log => 
      categoryExercises.includes(log.exerciseId)
    );
  }, [exerciseLogs, exercises, selectedCategoryId]);

  // Get chart data based on selection
  const chartData = useMemo(() => {
    if (!selectedCategoryId) {
      // Overall progress chart (by category) - show percentage growth
      // For timeframes other than ALL, pass windowStartDate so all lines start at 0%
      if (chartTimeframe !== 'ALL') {
        // Find the cutoff date for the selected timeframe
        const now = new Date();
        const cutoffDate = new Date();
        switch (chartTimeframe) {
          case '2W':
            cutoffDate.setDate(now.getDate() - 14);
            break;
          case '1M':
            cutoffDate.setMonth(now.getMonth() - 1);
            break;
        }
        return getOverallProgressChartData(exerciseLogs, exercises, categories, cutoffDate);
      }
      return getOverallProgressChartData(exerciseLogs, exercises, categories);
    } else {
      // Get all exercises in this category (not just those with current logs - needed for backfill)
      const categoryExercises = exercises.filter(e => e.categoryId === selectedCategoryId);
      
      // Category-specific chart (by exercise) - show percentage growth
      if (chartTimeframe !== 'ALL') {
        const now = new Date();
        const cutoffDate = new Date();
        switch (chartTimeframe) {
          case '2W':
            cutoffDate.setDate(now.getDate() - 14);
            break;
          case '1M':
            cutoffDate.setMonth(now.getMonth() - 1);
            break;
        }
        return getExerciseProgressChartData(exerciseLogs, categoryExercises, selectedCategoryId, cutoffDate);
      }
      return getExerciseProgressChartData(exerciseLogs, categoryExercises, selectedCategoryId);
    }
  }, [exerciseLogs, exercises, categories, selectedCategoryId, chartTimeframe]);

  // Calculate progress for each exercise with sorting and search filtering
  const exerciseProgressItems = useMemo(() => {
    const items = [];
    
    // If a category is selected, only include exercises from that category
    const relevantExercises = selectedCategoryId
      ? exercises.filter(e => e.categoryId === selectedCategoryId)
      : exercises;
    
    // Calculate progress for each exercise
    relevantExercises.forEach(exercise => {
      const progress = calculateProgress(exerciseLogs, exercise.id, exercise);
      
      // Only include exercises with actual logs (check for exercise logs rather than weight > 0)
      const exerciseLogsForThis = exerciseLogs.filter(log => log.exerciseId === exercise.id);
      if (exerciseLogsForThis.length > 0) {
        // Add the most recent log timestamp for sorting
        const mostRecentLog = exerciseLogsForThis.reduce((latest, log) => 
          new Date(log.timestamp) > new Date(latest.timestamp) ? log : latest
        );
        
        items.push({
          ...progress,
          lastLogTimestamp: mostRecentLog.timestamp
        });
      }
    });
    
    // Filter by search query
    const filteredItems = searchQuery.trim() 
      ? items.filter(item => 
          item.exercise.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          categories.find(cat => cat.id === item.exercise.categoryId)?.name.toLowerCase().includes(searchQuery.toLowerCase())
        )
      : items;
    
    // Sort based on selected sort method
    return filteredItems.sort((a, b) => {
      switch (sortBy) {
        case 'recent':
          // Sort by most recent activity
          return new Date(b.lastLogTimestamp).getTime() - new Date(a.lastLogTimestamp).getTime();
        case 'pr':
          // Sort by exercises with recent PRs first, then by highest current weight
          const aHasPR = a.personalRecord === a.currentWeight && a.previousWeight && a.currentWeight > a.previousWeight;
          const bHasPR = b.personalRecord === b.currentWeight && b.previousWeight && b.currentWeight > b.previousWeight;
          
          if (aHasPR && !bHasPR) return -1;
          if (!aHasPR && bHasPR) return 1;
          if (aHasPR && bHasPR) {
            // Both have PRs, sort by highest current weight
            return b.currentWeight - a.currentWeight;
          }
          // Neither has PR, sort by highest current weight
          return b.currentWeight - a.currentWeight;
        case 'progress':
          // Sort by highest percentage gain from start
          const gainA = a.percentGainFromStart || 0;
          const gainB = b.percentGainFromStart || 0;
          return gainB - gainA;
        default:
          return 0;
      }
    });
  }, [exercises, exerciseLogs, selectedCategoryId, sortBy, searchQuery, categories]);

  // Remove the recentLogs useMemo as we're integrating it into the main progress section

  // Handle exercise card click to view detailed progress
  const handleExerciseClick = (exerciseId) => {
    navigate(`/exercise-detail?exercise=${exerciseId}`);
    // Scroll to top after navigation
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Get selected category info
  const selectedCategory = selectedCategoryId 
    ? categories.find(cat => cat.id === selectedCategoryId) 
    : null;

  // Get selected category color for subtle background tinting
  const selectedCategoryColor = useMemo(() => {
    if (!selectedCategoryId) return null;
    const categoryIndex = categories.findIndex(cat => cat.id === selectedCategoryId);
    return categoryIndex >= 0 ? getCategoryColor(categoryIndex) : null;
  }, [selectedCategoryId, categories]);

  // Get the header title (without percentage)
  const headerTitle = selectedCategoryId ? 
    `${categories.find(c => c.id === selectedCategoryId)?.name} Progress` : 
    "Overall Progress";

  // --- Streak Calculation (Duolingo-style, local time safe) ---
  // Helper: get local YYYY-MM-DD string
  const getLocalDateString = (date: Date | string) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.getFullYear() + '-' + (d.getMonth()+1).toString().padStart(2,'0') + '-' + d.getDate().toString().padStart(2,'0');
  };

  // Each log is a workout for a day. We'll count unique days with logs (local time)
  const logDates = Array.from(new Set(
    exerciseLogs.map(log => getLocalDateString(log.timestamp))
  ));

  // Sort dates descending (most recent first)
  logDates.sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

  // Get today's and yesterday's local date string
  const todayStr = getLocalDateString(new Date());
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = getLocalDateString(yesterday);

  // Debug: print log dates and today
  if (process.env.NODE_ENV !== 'production') {
    // eslint-disable-next-line no-console
    console.log('Streak debug:', { logDates, todayStr, yesterdayStr });
  }

  // Determine if user has logged today (local time)
  const hasLoggedToday = logDates.length > 0 && logDates[0] === todayStr;

  // Calculate streak: consecutive days up to today (if logged today), or up to yesterday (if not)
  let streak = 0;
  if (logDates.length > 0) {
    let expectedDate = new Date();
    if (!hasLoggedToday) {
      // If not logged today, start from yesterday
      expectedDate.setDate(expectedDate.getDate() - 1);
    }
    expectedDate.setHours(0,0,0,0);
    let expectedStr = getLocalDateString(expectedDate);
    for (let i = 0; i < logDates.length; i++) {
      if (logDates[i] === expectedStr) {
        streak++;
        expectedDate.setDate(expectedDate.getDate() - 1);
        expectedStr = getLocalDateString(expectedDate);
      } else {
        break;
      }
    }
  }
  // If no logs or streak broken, streak is 0

  // --- Streak Indicator UI (Duolingo-style) ---
  // Colored if logged today, gray if not, number always shows streak (unless 0)
  const StreakIndicator = (
    <div className="flex items-center gap-2 group select-none" title={streak > 0 ? `🔥 ${streak} day streak!` : 'No active streak'}>
      <span
        className={
          streak > 0 && hasLoggedToday
            ? 'text-amber-500 drop-shadow-md text-2xl transition-colors'
            : 'text-gray-400 dark:text-gray-600 text-2xl transition-colors'
        }
        style={{ filter: streak > 0 && hasLoggedToday ? 'drop-shadow(0 0 6px #fbbf24)' : 'none' }}
      >
        {/* Fire SVG for more control, fallback to emoji */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
          className="w-7 h-7 align-middle"
        >
          <path d="M12.7 2.1a1 1 0 0 0-1.4 0c-2.2 2.1-3.7 4.7-4.3 7.6C6.2 10.2 6 11.1 6 12c0 3.3 2.7 6 6 6s6-2.7 6-6c0-.9-.2-1.8-.4-2.3-.6-2.9-2.1-5.5-4.3-7.6zM12 20c-4.4 0-8-3.6-8-8 0-1.2.3-2.3.7-3.3.2-.5.7-.7 1.2-.5.5.2.7.7.5 1.2C6.1 10.2 6 11.1 6 12c0 3.3 2.7 6 6 6s6-2.7 6-6c0-.9-.1-1.8-.4-2.6-.2-.5 0-1 .5-1.2.5-.2 1 .1 1.2.5.4 1 .7 2.1.7 3.3 0 4.4-3.6 8-8 8z" />
        </svg>
      </span>
      <span
        className={
          streak > 0 && hasLoggedToday
            ? 'text-lg font-bold text-amber-600 dark:text-amber-400 drop-shadow-sm'
            : 'text-lg font-bold text-gray-400 dark:text-gray-600'
        }
        style={{ minWidth: 18, textAlign: 'center' }}
      >
        {streak}
      </span>
    </div>
  );

  // Data ready check: all main data loaded and tournament initialized
  const dataReady = categories.length > 0 && exercises.length > 0 && exerciseLogs.length >= 0 && tournamentInitialized;

  // Only show overlay if not seen in this session
  const [showOverlay, setShowOverlay] = useState(() => {
    return !window.sessionStorage.getItem('hasSeenDashboard');
  });

  useEffect(() => {
    if (dataReady && showOverlay) {
      setShowOverlay(false);
      window.sessionStorage.setItem('hasSeenDashboard', 'true');
    }
  }, [dataReady, showOverlay]);

  const { setAppReady } = useAppContext();

  // When all data and UI is ready, signal app is ready
  useEffect(() => {
    // Data is ready if chartData and exerciseProgressItems are loaded and not showing placeholders
    const dashboardReady = chartData && chartData.length > 0 && exerciseProgressItems && exerciseProgressItems.length > 0;
    if (dashboardReady) {
      setAppReady(true);
    }
  }, [chartData, exerciseProgressItems, setAppReady]);

  // State for expandable search
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Handle search expansion
  const handleSearchToggle = () => {
    setIsSearchExpanded(!isSearchExpanded);
    if (!isSearchExpanded) {
      // Focus the input after expansion animation
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 200);
    }
  };

  // Close search when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isSearchExpanded && !(event.target as Element).closest('.expandable-search-overlay')) {
        setIsSearchExpanded(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isSearchExpanded]);

  // Handle search clear
  const handleSearchClear = () => {
    setSearchQuery('');
    setIsSearchExpanded(false); // Also hide/collapse the search bar
  };

  return (
    <>
      {/* Category background tinting - positioned outside Layout for proper viewport positioning */}
      {selectedCategoryColor && (
        <div 
          className={`category-background-tint-bottom ${isDark ? 'dark-mode' : ''}`}
          style={{
            '--category-color-rgb': selectedCategoryColor.replace('#', '').match(/.{2}/g)?.map(hex => parseInt(hex, 16)).join(', ') || '16, 185, 129'
          } as React.CSSProperties}
        />
      )}
      <Layout title={headerTitle} categoryColor={selectedCategoryColor} headerStreak={StreakIndicator}>
        <div className="relative">
          <div className="relative flex flex-col pb-6 z-10">
          {/* Progress Chart Section - Embedded in background */}
          <div className="relative -mx-4 px-4">
            {/* Show percentage gain if available - with inline chart slider */}
            {dynamicPercentGain !== null && (
              <div className="mb-2 flex items-center justify-between">
                  <div className="text-2xl font-bold" style={
                    dynamicPercentGain >= 0
                      ? isDark
                        ? { color: '#14b8a6' } // dark mode: brand teal
                        : { color: '#119488' } // light mode: darkened brand teal
                      : { color: '#ef4444' }
                  }>
                    {dynamicPercentGain >= 0 ? '+' : ''}
                    <AnimatedCounter 
                      value={dynamicPercentGain} 
                      formatValue={(val) => `${val.toFixed(1)}%`}
                      duration={600}
                      className="tabular-nums"
                    />
                  </div>
                  {/* Inline chart timeframe controls */}
                  <div className="flex-shrink-0">
                    <MobileSlider
                      options={[
                        { id: '2W', label: '2W' },
                        { id: '1M', label: '1M' },
                        { id: 'ALL', label: 'ALL' }
                      ]}
                      activeOption={chartTimeframe}
                      onOptionChange={(optionId) => setChartTimeframe(optionId as '2W' | '1M' | 'ALL')}
                      variant="compact"
                    />
                  </div>
                </div>
              )}
              <ChartWithLoader
                data={chartData}
                loading={loading || !exercises.length || !categories.length}
                multiple={true}
                categoryId={selectedCategoryId || undefined}
                weightUnit="lbs"
                showPercentage={!selectedCategoryId}
                appleStyle={true}
                blendWithBackground={true}
                customColors={chartColors}
                onHoverData={setChartHoverData}
                onTimeframeChange={(tf, gain) => {
                  setChartTimeframe(tf as '2W' | '1M' | 'ALL');
                  setDynamicPercentGain(gain);
                }}
                hideTooltip={true}
                hideTimeframeControls={true}
                timeframe={chartTimeframe}
                disableInternalTimeframeFilter={true} // NEW: let parent handle windowing
              />
            </div>

            {/* Chart Tooltip - Positioned above weekly recommendation widget */}
            <div className="relative z-50">
              {chartHoverData && (
                <div className="tooltip-card-enter-active absolute -top-2 left-1/2 -translate-x-1/2">
                  <ChartTooltipCard 
                    hoverData={chartHoverData}
                    showPercentage={!selectedCategoryId}
                    weightUnit="lbs"
                    multiple={true}
                    customColors={chartColors}
                  />
                </div>
              )}
            </div>

            {/* Weekly Category Checklist */}
            <div className="mt-3 -mx-4 px-4">
              {loading || !exerciseLogs || !exercises || !categories || !profile || 
               categories.length === 0 || exercises.length === 0 || weeklyCategories.length === 0 ? (
                /* Loading State */
                <div className="apple-health-card animate-pulse">
                  <div className="p-2">
                    <div className="flex items-center justify-center">
                      <div className="flex items-center gap-2">
                        {[...Array(4)].map((_, i) => (
                          <div key={i} className="flex flex-col items-center gap-0.5">
                            <div className="w-5 h-5 bg-muted/40 rounded-full"></div>
                            <div className="h-2.5 w-5 bg-muted/30 rounded"></div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* Weekly Checklist */
                <div 
                  className="apple-health-card weekly-recommendation-card--gradient group cursor-pointer transition-all duration-200 hover:shadow-lg active:scale-[0.99]"
                  onClick={handleChecklistClick}
                  style={{
                    '--category-colors': weeklyCategories.map(cat => cat.color).join(', '),
                    '--category-color': '#10b981',
                    '--category-color-rgb': '16, 185, 129'
                  } as React.CSSProperties}
                >
                  <div className="p-2">
                    {/* Compact checklist section */}
                    <div className="flex items-center justify-center">
                      <div className="flex items-center gap-3 justify-between w-full max-w-sm">
                        {weeklyCategories.map((category) => (
                          <div key={category.id} className="flex flex-col items-center gap-1">
                            {category.significantLoss && !category.hasActivity ? (
                              // Warning icon replaces the circle entirely
                              <div className="w-5 h-5 flex items-center justify-center">
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  viewBox="0 0 24 24"
                                  fill="currentColor"
                                  className="w-5 h-5 text-amber-500"
                                >
                                  <path fillRule="evenodd" d="M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.4 3.003zM12 8.25a.75.75 0 01.75.75v3.75a.75.75 0 01-1.5 0V9a.75.75 0 01.75-.75zm0 8.25a.75.75 0 100-1.5.75.75 0 000 1.5z" clipRule="evenodd" />
                                </svg>
                              </div>
                            ) : (
                              // Normal circle (completed or incomplete)
                              <div 
                                className={`w-5 h-5 rounded-full border-2 transition-all duration-300 weekly-category-circle relative ${
                                  category.hasActivity ? 'active' : 'inactive'
                                }`}
                                style={category.hasActivity ? {
                                  '--circle-bg-color': category.color,
                                  '--circle-shadow-color': `${category.color}20`
                                } as React.CSSProperties : {}}
                              >
                                {category.completedThisWeek && (
                                  <div className="absolute inset-0 flex items-center justify-center">
                                    <svg
                                      xmlns="http://www.w3.org/2000/svg"
                                      viewBox="0 0 24 24"
                                      fill="currentColor"
                                      className="w-3 h-3 text-white"
                                    >
                                      <path fillRule="evenodd" d="M19.916 4.626a.75.75 0 01.208 1.04l-9 13.5a.75.75 0 01-1.154.114l-6-6a.75.75 0 011.06-1.06l5.353 5.353 8.493-12.739a.75.75 0 011.04-.208z" clipRule="evenodd" />
                                    </svg>
                                  </div>
                                )}
                              </div>
                            )}
                            <span className="text-xs text-muted-foreground font-medium text-center leading-tight max-w-14">
                              {category.name}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Controls Island (Sticky Category Selector/Filter Bar) */}
            <div className="control-panel mt-3 relative sticky top-4 z-30">
              {/* Compact Category Filter with History Button */}
              <div className="relative bg-muted p-1 rounded-2xl">
                <div 
                  ref={filterContainerRef}
                  className="relative flex gap-1 overflow-x-auto scrollbar-hide"
                >
                  <div className="category-filter-indicator" style={indicatorStyle} />
                
                {/* History Button */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/history')}
                  className="category-filter-button px-3 py-2.5 flex-shrink-0"
                >
                  <Clock className="h-4 w-4" />
                </Button>
                
                {/* Divider */}
                <div className="category-filter-divider" />
                
                <Button
                  ref={(el) => (buttonRefs.current['all'] = el)}
                  onClick={() => {
                    setSelectedCategoryId(null);
                    setHasInteracted(true);
                  }}
                  variant="ghost"
                  size="sm"
                  className={`category-filter-button px-5 py-2.5 ${
                    selectedCategoryId === null ? 'selected' : ''
                  }`}
                >
                  All
                </Button>
                {categories.map((category, index) => {
                  const isSelected = selectedCategoryId === category.id;
                  const categoryColor = getCategoryColor(index);
                  const isLast = index === categories.length - 1;
                  return (
                    <Button
                      ref={(el) => (buttonRefs.current[category.id] = el)}
                      key={category.id}
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedCategoryId(category.id);
                        setHasInteracted(true);
                      }}
                      className={`category-filter-button px-5 py-2.5${isSelected ? ' selected' : ''}${isLast ? ' category-filter-button--last' : ''}`}
                      style={!isSelected ? { color: categoryColor } : {}}
                    >
                      {category.name}
                    </Button>
                  );
                })}
              </div>
              

                {/* Expandable Search Overlay */}
                <div className={`expandable-search-overlay ${isSearchExpanded ? 'search-active' : ''}`}>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleSearchToggle}
                    className={`search-icon-button ${isSearchExpanded ? 'search-hidden' : 'search-visible'}`}
                  >
                    <Search className="h-4 w-4" />
                  </Button>
                  <div className={`expandable-search-input ${isSearchExpanded ? 'search-expanded' : 'search-collapsed'}`}>
                    <input
                      ref={searchInputRef}
                      type="text"
                      placeholder="Search exercises..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="expandable-search-field"
                    />
                    {searchQuery && (
                      <button
                        onClick={handleSearchClear}
                        className="search-clear-button"
                        aria-label="Clear search"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>



          {/* Exercise Progress Grid */}
        <div className="relative exercise-grid-container mt-4">
          {/* Combined Search and Filter Bar -- THIS IS NOW MOVED */}
          
          {exerciseProgressItems.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 staggered-cards">
              {exerciseProgressItems.map((progress, index) => {
                const categoryColor = getCategoryColor(
                  categories.findIndex(cat => cat.id === progress.exercise.categoryId)
                );
                // Only show PR if:
                // 1. Not the first log (has previous weight)
                // 2. Current weight is actually higher than previous weight
                // 3. Current weight equals personal record
                const isPersonalRecord = progress.personalRecord === progress.currentWeight && 
                                        progress.previousWeight && 
                                        progress.currentWeight > progress.previousWeight;
                
                // Format last activity time
                const lastLogDate = new Date(progress.lastLogTimestamp);
                const now = new Date();
                const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
                const logDate = new Date(lastLogDate.getFullYear(), lastLogDate.getMonth(), lastLogDate.getDate());
                
                let timeDisplay = '';
                if (logDate.getTime() === today.getTime()) {
                  timeDisplay = format(lastLogDate, 'h:mm a');
                } else if (logDate.getTime() === yesterday.getTime()) {
                  timeDisplay = 'Yesterday';
                } else {
                  timeDisplay = format(lastLogDate, 'MMM d');
                }
                
                // Create mini chart data (last 5 data points)
                const exerciseLogsForThis = exerciseLogs
                  .filter(log => log.exerciseId === progress.exercise.id)
                  .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
                  .slice(-5);
                
                const miniChartData = exerciseLogsForThis.map(log => ({
                  weight: log.weight,
                  timestamp: log.timestamp
                }));
                
                return (
                  <div 
                    key={`${selectedCategoryId || 'all'}-${progress.exercise.id}`}
                    className="group cursor-pointer"
                    onClick={() => handleExerciseClick(progress.exercise.id)}
                  >
                    {/* Apple Health Style Card */}
                    {/* eslint-disable-next-line */}
                    <div 
                      className={`apple-health-card ${miniChartData.length <= 1 ? 'compact' : ''} ${selectedCategoryId ? 'category-tinted' : ''}`}
                      style={{
                        '--category-color': categoryColor,
                        '--category-color-rgb': categoryColor.replace('#', '').match(/.{2}/g)?.map(hex => parseInt(hex, 16)).join(', ') || '16, 185, 129'
                      } as React.CSSProperties}
                    >
                      {/* Top row: Category-colored exercise name + Time with arrow */}
                      <div className={`flex items-start justify-between ${miniChartData.length <= 1 ? 'mb-3' : 'mb-2'}`}>
                        <h3 className="apple-health-card-title">
                          {progress.exercise.name}
                        </h3>
                        <div className="apple-health-card-time">
                          <span className="apple-health-card-time-text">{timeDisplay}</span>
                          <ChevronRight className="apple-health-card-arrow" />
                        </div>
                      </div>

                      {/* Mini Progress Chart - Only show if we have trend data */}
                      {miniChartData.length > 1 && (
                        <div className="apple-health-mini-chart mb-1">
                          <div className="w-full h-full relative">
                            <svg className="w-full h-full" viewBox="0 0 100 24" preserveAspectRatio="none">
                              <defs>
                                <linearGradient id={`gradient-${progress.exercise.id}`} x1="0%" y1="0%" x2="0%" y2="100%">
                                  {/* eslint-disable-next-line */}
                                  <stop offset="0%" style={{ stopColor: categoryColor, stopOpacity: 0.3 }} />
                                  {/* eslint-disable-next-line */}
                                  <stop offset="100%" style={{ stopColor: categoryColor, stopOpacity: 0.05 }} />
                                </linearGradient>
                              </defs>
                              {/* Create path for the mini chart */}
                              {(() => {
                                const maxWeight = Math.max(...miniChartData.map(d => d.weight));
                                const minWeight = Math.min(...miniChartData.map(d => d.weight));
                                const weightRange = maxWeight - minWeight || 1;
                                
                                const points = miniChartData.map((data, i) => {
                                  const x = (i / (miniChartData.length - 1)) * 100;
                                  const y = 20 - ((data.weight - minWeight) / weightRange) * 16;
                                  return `${x},${y}`;
                                }).join(' ');
                                
                                const pathD = `M ${points.split(' ').map((point, i) => 
                                  i === 0 ? `M ${point}` : `L ${point}`
                                ).join(' ')}`;
                                
                                const fillPath = `${pathD} L 100,20 L 0,20 Z`;
                                
                                return (
                                  <>
                                    <path
                                      d={fillPath}
                                      fill={`url(#gradient-${progress.exercise.id})`}
                                    />
                                    {/* eslint-disable-next-line */}
                                    <path
                                      d={pathD}
                                      fill="none"
                                      stroke={categoryColor}
                                      strokeWidth="1.5"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                    />
                                  </>
                                );
                              })()}
                            </svg>
                          </div>
                        </div>
                      )}

                      {/* Bottom row: Current weight and stats */}
                      <div className="flex items-end justify-between">
                        <div>
                          <div className="apple-health-weight-display flex items-baseline gap-1">
                            <AnimatedCounter 
                              value={progress.currentWeight} 
                              formatValue={(val) => val % 1 === 0 ? val.toString() : val.toFixed(1)}
                              duration={600}
                              className="tabular-nums"
                            />
                            <span className="apple-health-weight-unit">lbs</span>
                          </div>
                        </div>
                        
                        <div className="flex flex-col items-end gap-1">
                          {isPersonalRecord && (
                            <div className="flex items-center gap-1 text-sm font-medium">
                              <span className="font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
                                PR
                              </span>
                            </div>
                          )}
                          {miniChartData.length === 1 && (
                            <div className="text-muted-foreground text-sm font-medium">
                              First log
                            </div>
                          )}
                          {progress.percentGainFromPrevious !== undefined && progress.percentGainFromPrevious !== 0 && (
                            <div className="flex items-center gap-1 text-sm font-medium" style={
                              progress.percentGainFromPrevious > 0
                                ? isDark
                                  ? { color: '#14b8a6' }
                                  : { color: '#119488' }
                                : { color: '#ef4444' }
                            }>
                              {progress.percentGainFromPrevious > 0 ? (
                                <TrendingUp className="w-3 h-3" />
                              ) : (
                                <TrendingDown className="w-3 h-3" />
                              )}
                              <AnimatedCounter 
                                value={progress.percentGainFromPrevious} 
                                formatValue={(val) => `${val.toFixed(1)}%`}
                                duration={500}
                                className="tabular-nums"
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className={`glass-card rounded-2xl p-12 text-center ${selectedCategoryId ? 'category-tinted' : ''}`}>
              {searchQuery.trim() ? (
                <>
                  <Search className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">No exercises found</h3>
                  <p className="text-muted-foreground mb-4">
                    No exercises match "{searchQuery}"
                  </p>
                  <Button 
                    variant="outline" 
                    onClick={() => setSearchQuery('')}
                    className="mt-2"
                  >
                    Clear search
                  </Button>
                </>
              ) : (
                <>
                  <Activity className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">No Progress Data Yet</h3>
                  <p className="text-muted-foreground">Start logging your workouts to see amazing progress charts!</p>
                </>
              )}
            </div>
          )}
        </div>
                </div>
        </div>
      </Layout>
    </>
  );
};

export default Dashboard;
