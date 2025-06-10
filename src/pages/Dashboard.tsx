import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAppContext } from '@/context/useAppContext';
import { calculateProgress, getOverallProgressChartData, getExerciseProgressChartData } from '@/utils/progressUtils';
import { generateCurrentTournament } from '@/utils/tournamentUtils';
import { TrendingUp, Clock, Trophy, ChevronRight, Activity, Zap } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import ProgressChart from '@/components/dashboard/ProgressChart';
import TournamentStatusCard from '@/components/dashboard/TournamentStatusCard';
import { getCategoryColors, getCategoryKeyByName, getCategoryChartColors } from '@/utils/categoryColors';
import { format } from 'date-fns';
import { Tournament } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import '@/components/ui/category-styles.css';

const Dashboard = () => {
  const { categories, exercises, exerciseLogs } = useAppContext();
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'recent' | 'pr' | 'progress'>('recent');
  const [currentTournament, setCurrentTournament] = useState<Tournament | null>(null);
  const [tournamentLoading, setTournamentLoading] = useState(true);
  const [tournamentInitialized, setTournamentInitialized] = useState(false);

  // Use the same color system as the rest of the app
  const chartColors = getCategoryChartColors();

  // Generate tournament data with better state management
  useEffect(() => {
    const generateTournament = async () => {
      // Don't start loading until we have all necessary data
      if (!exercises.length || !categories.length) {
        return;
      }

      setTournamentLoading(true);
      
      try {
        // Fetch users from Supabase
        const { data: usersData, error: usersError } = await supabase.from('profiles').select('id, name, username, avatar_url');
        
        if (usersError || !usersData) {
          setCurrentTournament(null);
          setTournamentLoading(false);
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
          setTournamentLoading(false);
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
        setTournamentLoading(false);
        setTournamentInitialized(true);
      } catch (error) {
        console.error('Error generating tournament:', error);
        setCurrentTournament(null);
        setTournamentLoading(false);
        setTournamentInitialized(true);
      }
    };

    // Only generate when we have all data and haven't initialized yet
    if (exercises.length > 0 && categories.length > 0 && !tournamentInitialized) {
      generateTournament();
    }
  }, [exercises, categories, tournamentInitialized]);
  
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
      return getOverallProgressChartData(exerciseLogs, exercises, categories);
    } else {
      // Only include exercises in this category that have logs
      const categoryExercisesWithLogs = exercises.filter(
        e => e.categoryId === selectedCategoryId && exerciseLogs.some(log => log.exerciseId === e.id)
      );
      // Category-specific chart (by exercise) - show percentage growth
      return getExerciseProgressChartData(exerciseLogs, categoryExercisesWithLogs, selectedCategoryId);
    }
  }, [exerciseLogs, exercises, categories, selectedCategoryId]);

  // Calculate progress for each exercise with sorting
  const exerciseProgressItems = useMemo(() => {
    const items = [];
    
    // If a category is selected, only include exercises from that category
    const relevantExercises = selectedCategoryId
      ? exercises.filter(e => e.categoryId === selectedCategoryId)
      : exercises;
    
    // Calculate progress for each exercise
    relevantExercises.forEach(exercise => {
      const progress = calculateProgress(exerciseLogs, exercise.id, exercise);
      
      // Only include exercises with data
      if (progress.currentWeight > 0) {
        // Add the most recent log timestamp for sorting
        const exerciseLogsForThis = exerciseLogs.filter(log => log.exerciseId === exercise.id);
        const mostRecentLog = exerciseLogsForThis.reduce((latest, log) => 
          new Date(log.timestamp) > new Date(latest.timestamp) ? log : latest
        );
        
        items.push({
          ...progress,
          lastLogTimestamp: mostRecentLog.timestamp
        });
      }
    });
    
    // Sort based on selected sort method
    return items.sort((a, b) => {
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
  }, [exercises, exerciseLogs, selectedCategoryId, sortBy]);

  // Remove the recentLogs useMemo as we're integrating it into the main progress section

  // Handle exercise card click to view detailed progress
  const handleExerciseClick = (exerciseId) => {
    navigate(`/exercise-detail?exercise=${exerciseId}`);
    // Scroll to top after navigation
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Get selected category color for subtle background tinting
  const selectedCategoryColor = useMemo(() => {
    if (!selectedCategoryId) return null;
    const categoryIndex = categories.findIndex(cat => cat.id === selectedCategoryId);
    return categoryIndex >= 0 ? getCategoryColor(categoryIndex) : null;
  }, [selectedCategoryId, categories]);

  return (
    <Layout title="Home">
      <div className="relative">
        {/* Subtle bottom category tinting */}
        {selectedCategoryColor && (
          // eslint-disable-next-line
          <div 
            className="fixed inset-0 pointer-events-none z-0"
            style={{
              background: `linear-gradient(to top, ${selectedCategoryColor}15 0%, ${selectedCategoryColor}08 25%, ${selectedCategoryColor}03 50%, ${selectedCategoryColor}01 75%, transparent 100%)`
            }}
          />
        )}
        
        <div className="relative flex flex-col gap-8 pb-6 z-10">
          {/* Progress Chart Section - Embedded in background */}
          <div className="relative -mx-4 px-4">
            <div className="mb-6">
              <h2 
                className={`text-xl font-bold mb-2 ${selectedCategoryId ? 'category-title' : 'text-foreground'}`}
                style={selectedCategoryColor ? {
                  '--category-color': selectedCategoryColor,
                  color: 'var(--category-color)'
                } as React.CSSProperties : undefined}
              >
                {selectedCategoryId ? 
                  `${categories.find(c => c.id === selectedCategoryId)?.name} Progress` : 
                  "Overall Progress"
                }
              </h2>
            </div>
            
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
              />
            ) : (
              <div className="text-center text-muted-foreground py-16">
                <Activity className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-lg font-medium mb-2">No data available yet</p>
                <p>Start logging exercises to see your progress!</p>
              </div>
            )}
          </div>

          {/* Tournament Status Card */}
          <TournamentStatusCard 
            tournament={currentTournament}
            currentUserId={profile?.id || ''}
            loading={tournamentLoading}
            initialized={tournamentInitialized}
          />
          
          {/* Category Filter Buttons */}
          <div className="relative">
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
        <div className="relative">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-xl font-bold text-foreground">Your Progress</h2>
            
            {/* Compact Sort Controls - smaller and more integrated */}
            <div className="flex items-center gap-0.5 bg-background/80 backdrop-blur-sm rounded-lg p-0.5 shadow-sm border border-border/50">
              <button
                onClick={() => setSortBy('recent')}
                className={`px-2 py-1 text-xs font-medium rounded-md transition-all active:scale-95 ${
                  sortBy === 'recent' 
                    ? 'bg-foreground text-background shadow-sm' 
                    : 'text-muted-foreground'
                }`}
              >
                Recent
              </button>
              <button
                onClick={() => setSortBy('pr')}
                className={`px-2 py-1 text-xs font-medium rounded-md transition-all active:scale-95 ${
                  sortBy === 'pr' 
                    ? 'bg-foreground text-background shadow-sm' 
                    : 'text-muted-foreground'
                }`}
              >
                PRs
              </button>
              <button
                onClick={() => setSortBy('progress')}
                className={`px-2 py-1 text-xs font-medium rounded-md transition-all active:scale-95 ${
                  sortBy === 'progress' 
                    ? 'bg-foreground text-background shadow-sm' 
                    : 'text-muted-foreground'
                }`}
              >
                Progress
              </button>
            </div>
          </div>
          
          {exerciseProgressItems.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
                      className={`apple-health-card ${miniChartData.length <= 1 ? 'compact' : ''}`}
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
                          <p className="apple-health-weight-display">{progress.currentWeight}</p>
                          <p className="apple-health-weight-unit">lbs</p>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {progress.percentGainFromPrevious !== undefined && progress.percentGainFromPrevious !== 0 && (
                            <div className={`apple-health-progress-badge ${
                              progress.percentGainFromPrevious > 0 ? 'positive' : 'negative'
                            }`}>
                              {progress.percentGainFromPrevious > 0 ? '+' : ''}{progress.percentGainFromPrevious.toFixed(1)}%
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
            <div className="bg-card rounded-2xl border border-border p-12 text-center shadow-sm">
              <Activity className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">No Progress Data Yet</h3>
              <p className="text-muted-foreground">Start logging your workouts to see amazing progress charts!</p>
            </div>
          )}
        </div>
        
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;
