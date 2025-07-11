import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAppContext } from '@/context/useAppContext';
import { calculateProgress, getOverallProgressChartData, getExerciseProgressChartData } from '@/utils/progressUtils';
import { generateCurrentTournament } from '@/utils/tournamentUtils';
import { TrendingUp, Clock, Trophy, ChevronRight, Activity, Zap, Search, X, ChevronDown } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import ProgressChart from '@/components/dashboard/ProgressChart';
import ChartTooltipCard from '@/components/dashboard/ChartTooltipCard';
import { getCategoryColors, getCategoryKeyByName, getCategoryChartColors } from '@/utils/categoryColors';
import { format } from 'date-fns';
import { Tournament } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import AnimatedCounter from '@/components/ui/animated-counter';
import { MobileSlider } from '@/components/ui/mobile-slider';
import '@/styles/index.css';
import { Input } from '@/components/ui/input'; // Import Input

const Dashboard = () => {
  const { categories, exercises, exerciseLogs } = useAppContext();
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

  // Use the same color system as the rest of the app
  const chartColors = getCategoryChartColors();

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
      // Only include exercises in this category that have logs
      const categoryExercisesWithLogs = exercises.filter(
        e => e.categoryId === selectedCategoryId && exerciseLogs.some(log => log.exerciseId === e.id)
      );
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
        return getExerciseProgressChartData(exerciseLogs, categoryExercisesWithLogs, selectedCategoryId, cutoffDate);
      }
      return getExerciseProgressChartData(exerciseLogs, categoryExercisesWithLogs, selectedCategoryId);
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

  // Get progress type display name
  const getProgressDisplayName = (sortType: string) => {
    switch (sortType) {
      case 'recent':
        return 'My Excercises';
      case 'pr':
        return 'PR Progress';
      case 'progress':
        return 'Growth Progress';
      default:
        return 'My Excercises';
    }
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

  return (
    <Layout title={headerTitle} categoryColor={selectedCategoryColor}>
      <div className="relative">
        {/* Enhanced category background tinting - visible in both light and dark modes */}
        {selectedCategoryColor && (
          <div 
            className={`category-background-tint ${isDark ? 'dark-mode' : ''}`}
            style={{
              '--category-color-rgb': selectedCategoryColor.replace('#', '').match(/.{2}/g)?.map(hex => parseInt(hex, 16)).join(', ') || '16, 185, 129'
            } as React.CSSProperties}
          />
        )}
        <div className="relative flex flex-col pb-6 z-10">
          {/* Progress Chart Section - Embedded in background */}
          <div className="relative -mx-4 px-4">
            {/* Show percentage gain if available - with inline chart slider */}
            {dynamicPercentGain !== null && (
              <div className="mb-4 flex items-center justify-between">
                  <div className={`text-2xl font-bold ${dynamicPercentGain >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
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
              {chartData.length > 0 ? (
                <ProgressChart 
                  data={chartData} 
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
              ) : (
                <div className="text-center text-muted-foreground py-16">
                  <Activity className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-lg font-medium mb-2">No data available yet</p>
                  <p>Start logging exercises to see your progress!</p>
                </div>
              )}
            </div>

            {/* Chart Tooltip - Closer to chart */}
            <div className="relative z-20">
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
          
          {/* Category Filter Buttons */}
          <div className="relative mt-4">
            <div className="flex gap-3 overflow-x-auto pb-2 px-1 py-2 scrollbar-hide">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedCategoryId(null)}
                className={`rounded-2xl px-6 py-3 font-medium transition-all duration-300 whitespace-nowrap transform active:scale-95 ${
                  selectedCategoryId === null 
                    ? 'all-button-selected' 
                    : 'all-button-unselected'
                }`}
              >
                All
              </Button>
              
              {categories.map((category, index) => {
                const categoryColor = getCategoryColor(index);
                const isSelected = selectedCategoryId === category.id;
                
                return (
                  <Button
                    key={category.id}
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedCategoryId(category.id)}
                    className={`rounded-2xl px-6 py-3 font-medium whitespace-nowrap transition-all duration-300 transform active:scale-95 ${
                      isSelected 
                        ? 'category-button-selected' 
                        : 'category-button-unselected'
                    }`}
                    style={{
                      '--category-color': categoryColor,
                      '--category-color-rgb': categoryColor.replace('#', '').match(/.{2}/g)?.map(hex => parseInt(hex, 16)).join(', ') || '16, 185, 129'
                    } as React.CSSProperties}
                  >
                  {category.name}
                </Button>
              );              })}
            </div>
          </div>

          {/* Exercise Progress Grid */}
        <div className="relative exercise-grid-container mt-4">
          {/* Progress Title with Inline Dropdown + Expandable Search */}
          <div className="mb-4 space-y-4">
            {/* Progress Dropdown & History Link */}
            <div className="flex justify-between items-center">
              <div className="relative progress-dropdown-container">
                <button
                  onClick={() => setIsProgressDropdownOpen(!isProgressDropdownOpen)}
                  className="flex items-center gap-2 text-xl font-bold text-foreground active:scale-95 transition-transform duration-150"
                >
                  <span>{getProgressDisplayName(sortBy)}</span>
                  <ChevronDown className={`h-5 w-5 transition-transform duration-200 ${isProgressDropdownOpen ? 'rotate-180' : ''}`} />
                </button>
                
                {isProgressDropdownOpen && (
                  <div className="absolute top-full left-0 mt-2 bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-gray-200/50 dark:border-gray-700/50 backdrop-blur-md z-50 min-w-48 progress-dropdown">
                    <div className="p-2">
                      {[
                        { id: 'recent', label: 'My Excercises', icon: Clock },
                        { id: 'pr', label: 'PR Progress', icon: Trophy },
                        { id: 'progress', label: 'Growth Progress', icon: TrendingUp }
                      ].map((option) => {
                        const Icon = option.icon;
                        return (
                          <button
                            key={option.id}
                            onClick={() => {
                              setSortBy(option.id as 'recent' | 'pr' | 'progress');
                              setIsProgressDropdownOpen(false);
                            }}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 active:scale-95 ${
                              sortBy === option.id
                                ? 'bg-primary text-primary-foreground'
                                : 'text-foreground active:bg-gray-100 dark:active:bg-gray-800'
                            }`}
                          >
                            <Icon className="h-4 w-4" />
                            <span className="font-medium">{option.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/history')}
                className="text-sm font-medium text-primary"
              >
                View Full History
              </Button>
            </div>

            {/* Redesigned Search Bar */}
            <div className="relative search-bar-wrapper">
              <div className="search-bar-icon">
                <Search className="h-4 w-4" />
              </div>
              <input
                type="text"
                placeholder="Search exercises..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-bar-input"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="search-bar-clear"
                  aria-label="Clear search"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
          
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
                    key={progress.exercise.id}
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
                      <div className={`flex items-start justify-between ${miniChartData.length <= 1 ? 'mb-6' : 'mb-4'}`}>
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
                        <div className="apple-health-mini-chart">
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
                          <div className="apple-health-weight-display">
                            <AnimatedCounter 
                              value={progress.currentWeight} 
                              formatValue={(val) => val % 1 === 0 ? val.toString() : val.toFixed(1)}
                              duration={600}
                              className="tabular-nums"
                            />
                          </div>
                          <p className="apple-health-weight-unit">lbs</p>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {progress.percentGainFromPrevious !== undefined && progress.percentGainFromPrevious !== 0 && (
                            <div className={`apple-health-progress-badge ${
                              progress.percentGainFromPrevious > 0 ? 'positive' : 'negative'
                            }`}>
                              {progress.percentGainFromPrevious > 0 ? '+' : ''}
                              <AnimatedCounter 
                                value={progress.percentGainFromPrevious} 
                                formatValue={(val) => `${val.toFixed(1)}%`}
                                duration={500}
                                className="tabular-nums"
                              />
                            </div>
                          )}
                          {isPersonalRecord && (
                            <div className="apple-health-pr-badge">
                              <Trophy className="apple-health-pr-badge-icon" />
                              PR
                            </div>
                          )}
                          {miniChartData.length === 1 && (
                            <div className="apple-health-first-log-badge">
                              First log
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
  );
};

export default Dashboard;
