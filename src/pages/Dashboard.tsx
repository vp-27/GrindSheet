import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAppContext } from '@/context/AppContext';
import { calculateProgress, getOverallProgressChartData, getExerciseProgressChartData } from '@/utils/progressUtils';
import { TrendingUp, Clock, Trophy, ArrowUpRight, Activity, Zap } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import ProgressChart from '@/components/dashboard/ProgressChart';
import { getCategoryColors, getCategoryKeyByName, getCategoryChartColors } from '@/utils/categoryColors';
import { format } from 'date-fns';
import '@/components/ui/category-styles.css';

const Dashboard = () => {
  const { categories, exercises, exerciseLogs } = useAppContext();
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'recent' | 'pr' | 'progress'>('recent');

  // Use the same color system as the rest of the app
  const chartColors = getCategoryChartColors();
  
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
              <h2 className="text-xl font-bold text-foreground mb-2">
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
          
          {/* Category Filter Buttons */}
          <div className="relative">
            <div className="flex gap-3 overflow-x-auto pb-2 px-1 py-2 scrollbar-hide">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedCategoryId(null)}
                className={`rounded-2xl px-6 py-3 font-medium transition-all duration-300 whitespace-nowrap transform hover:scale-105 ${
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
                    className={`rounded-2xl px-6 py-3 font-medium whitespace-nowrap transition-all duration-300 transform hover:scale-105 ${
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
            
            {/* Sort Controls - visually distinct from category filters */}
            <div className="flex items-center gap-1 bg-muted/50 rounded-lg p-1">
              <button
                onClick={() => setSortBy('recent')}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                  sortBy === 'recent' 
                    ? 'bg-background text-foreground shadow-sm' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Recent
              </button>
              <button
                onClick={() => setSortBy('pr')}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                  sortBy === 'pr' 
                    ? 'bg-background text-foreground shadow-sm' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                PRs
              </button>
              <button
                onClick={() => setSortBy('progress')}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                  sortBy === 'progress' 
                    ? 'bg-background text-foreground shadow-sm' 
                    : 'text-muted-foreground hover:text-foreground'
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
                
                return (
                  <div 
                    key={progress.exercise.id}
                    className="group cursor-pointer"
                    onClick={() => handleExerciseClick(progress.exercise.id)}
                  >
                    {/* Main card */}
                    <div className="relative bg-card rounded-2xl border border-border p-4 shadow-sm group-hover:shadow-lg transition-all duration-300 group-hover:-translate-y-1">
                      {/* Top row: Exercise name + Current weight */}
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="font-semibold text-foreground text-lg leading-tight flex-1 min-w-0 pr-2">
                          {progress.exercise.name}
                        </h3>
                        <div className="text-right flex-shrink-0">
                          <p className="text-2xl font-bold text-foreground">{progress.currentWeight} lbs</p>
                        </div>
                      </div>

                      {/* Second row: Previous weight + Progress % and PR */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="text-sm text-muted-foreground">
                          {progress.previousWeight ? `Previous: ${progress.previousWeight} lbs` : 'First log'}
                        </div>
                        <div className="flex items-center gap-2">
                          {progress.percentGainFromPrevious !== undefined && (
                            <div className={`flex items-center text-sm font-medium ${
                              progress.percentGainFromPrevious > 0 
                                ? "text-emerald-600" 
                                : "text-red-500"
                            }`}>
                              {progress.percentGainFromPrevious > 0 ? (
                                <>
                                  <ArrowUpRight className="h-3 w-3 mr-1" />
                                  +{progress.percentGainFromPrevious.toFixed(1)}%
                                </>
                              ) : progress.percentGainFromPrevious < 0 ? (
                                <>
                                  <ArrowUpRight className="h-3 w-3 mr-1 transform rotate-90" />
                                  {progress.percentGainFromPrevious.toFixed(1)}%
                                </>
                              ) : (
                                '0%'
                              )}
                            </div>
                          )}
                          {isPersonalRecord && (
                            <div className="flex items-center gap-1 bg-amber-50 text-amber-700 px-2 py-1 rounded-lg text-xs font-medium">
                              <Trophy className="w-3 h-3" />
                              PR
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Category badge */}
                      <div className="flex justify-start">
                        {/* eslint-disable-next-line */}
                        <div 
                          className="category-badge text-xs"
                          style={{ 
                            '--category-color': categoryColor,
                            '--category-color-rgb': categoryColor.replace('#', '').match(/.{2}/g)?.map(hex => parseInt(hex, 16)).join(', ') || '16, 185, 129'
                          } as React.CSSProperties}
                        >
                          {categories.find(cat => cat.id === progress.exercise.categoryId)?.name}
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
