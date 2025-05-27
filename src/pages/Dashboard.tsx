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

const Dashboard = () => {
  const { categories, exercises, exerciseLogs } = useAppContext();
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);

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
      // Category-specific chart (by exercise) - show percentage growth
      return getExerciseProgressChartData(exerciseLogs, exercises, selectedCategoryId);
    }
  }, [exerciseLogs, exercises, categories, selectedCategoryId]);

  // Calculate progress for each exercise
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
        items.push(progress);
      }
    });
    
    // Sort by highest percentage gain
    return items.sort((a, b) => {
      const gainA = a.percentGainFromStart || 0;
      const gainB = b.percentGainFromStart || 0;
      return gainB - gainA;
    });
  }, [exercises, exerciseLogs, selectedCategoryId]);

  // Get recent logs (last 5)
  const recentLogs = useMemo(() => {
    return [...filteredLogs]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 5);
  }, [filteredLogs]);

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
      <>
        {/* Subtle background tint based on selected category - Apple style */}
        {selectedCategoryColor && (
          <div 
            className="fixed inset-0 pointer-events-none transition-all duration-700 ease-out z-0"
            style={{
              // eslint-disable-next-line
              background: `radial-gradient(ellipse 100% 60% at 50% 0%, ${selectedCategoryColor}15 0%, ${selectedCategoryColor}08 40%, transparent 70%)`,
            }}
          />
        )}
        
        <div className="relative flex flex-col gap-8 pb-6 z-10">
          {/* Progress Chart Section - Embedded in background */}
          <div className="relative -mx-4 px-4">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                {selectedCategoryId ? 
                  `${categories.find(c => c.id === selectedCategoryId)?.name} Progress` : 
                  "Overall Progress"
                }
              </h2>
              <p className="text-gray-600">
                {selectedCategoryId ? 
                  "Weight progression across exercises in this category" :
                  "Percentage growth across all categories"
                }
              </p>
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
              <div className="text-center text-gray-500 py-16">
                <Activity className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-lg font-medium mb-2">No data available yet</p>
                <p>Start logging exercises to see your progress!</p>
              </div>
            )}
          </div>
          
          {/* Category Filter Buttons */}
          <div className="relative">
            <div className="flex gap-3 overflow-x-auto pb-2 px-1 py-2 scrollbar-hide">
              <Button
                variant={selectedCategoryId === null ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategoryId(null)}
                className={`rounded-2xl px-6 py-3 font-medium transition-all duration-300 whitespace-nowrap ${
                  selectedCategoryId === null 
                    ? 'bg-gradient-to-r from-gray-700 to-gray-900 text-white shadow-lg hover:shadow-xl transform hover:scale-105' 
                    : 'bg-white border-gray-200 hover:bg-gray-50 hover:border-gray-300 hover:shadow-md'
                }`}
              >
                All Categories
              </Button>
              
              {categories.map((category, index) => {
                const categoryColor = getCategoryColor(index);
                const isSelected = selectedCategoryId === category.id;
                
                return (                  <Button
                    key={category.id}
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedCategoryId(category.id)}                  className={`rounded-2xl px-6 py-3 font-medium whitespace-nowrap transition-all duration-300 transform hover:scale-105 ${
                    isSelected 
                      ? 'text-white border-transparent shadow-lg hover:shadow-xl ring-2 ring-white/20' 
                      : 'bg-white border-gray-200 hover:bg-gray-50 hover:border-gray-300 hover:shadow-md'
                  }`}
                  style={{
                    // eslint-disable-next-line
                    backgroundColor: isSelected ? categoryColor : undefined,
                    // eslint-disable-next-line
                    color: isSelected ? 'white' : categoryColor,
                    // eslint-disable-next-line
                    borderColor: isSelected ? categoryColor : undefined,
                    // eslint-disable-next-line
                    boxShadow: isSelected ? `0 4px 20px ${categoryColor}40` : undefined
                  }}
                  >
                  {category.name}
                </Button>
              );
            })}
          </div>
        </div>

        {/* Exercise Progress Grid */}
        <div className="relative">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-2">Your Progress</h2>
            <p className="text-gray-600">Track your latest achievements and improvements</p>
          </div>
          
          {exerciseProgressItems.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {exerciseProgressItems.map((progress, index) => {
                const categoryColor = getCategoryColor(
                  categories.findIndex(cat => cat.id === progress.exercise.categoryId)
                );
                const isPersonalRecord = progress.personalRecord === progress.currentWeight;
                
                return (
                  <div 
                    key={progress.exercise.id}
                    className="group cursor-pointer"
                    onClick={() => handleExerciseClick(progress.exercise.id)}
                  >
                    {/* Main card */}
                    <div className="relative bg-white rounded-2xl border border-gray-200 p-5 shadow-sm group-hover:shadow-lg transition-all duration-300 group-hover:-translate-y-1">
                      {/* Header with category dot */}
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full"
                            style={{ 
                              // eslint-disable-next-line
                              backgroundColor: categoryColor 
                            }}
                          />
                          <h3 className="font-semibold text-gray-900 truncate">{progress.exercise.name}</h3>
                        </div>
                        {isPersonalRecord && (
                          <div className="flex items-center gap-1 bg-amber-50 text-amber-700 px-2 py-1 rounded-lg text-xs font-medium">
                            <Trophy className="w-3 h-3" />
                            PR
                          </div>
                        )}
                      </div>

                      {/* Current Weight Display */}
                      <div className="mb-4">
                        <p className="text-sm text-gray-500 mb-1">Current Weight</p>
                        <p className="text-2xl font-bold text-gray-900">{progress.currentWeight} lbs</p>
                      </div>

                      {/* Progress Stats */}
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Previous:</span>
                          <span className="font-medium">{progress.previousWeight || '-'} lbs</span>
                        </div>
                        
                        {progress.percentGainFromPrevious !== undefined && (
                          <div className="flex items-center justify-between">
                            <span className="text-gray-500 text-sm">Progress:</span>
                            <div className={`flex items-center text-sm font-medium ${
                              progress.percentGainFromPrevious > 0 
                                ? "text-emerald-600" 
                                : progress.percentGainFromPrevious < 0 
                                  ? "text-red-500" 
                                  : "text-gray-500"
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
                                'No change'
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center shadow-sm">
              <Activity className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-700 mb-2">No Progress Data Yet</h3>
              <p className="text-gray-500">Start logging your workouts to see amazing progress charts!</p>
            </div>
          )}
        </div>
        
        {/* Recent Activity Section */}
        <div className="relative">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-2">Recent Workouts</h2>
            <p className="text-gray-600">Your latest training sessions and achievements</p>
          </div>
          
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            {recentLogs.length > 0 ? (
              <div className="divide-y divide-gray-100">
                  {recentLogs.map((log, index) => {
                    const exercise = exercises.find(e => e.id === log.exerciseId);
                    const category = categories.find(c => c.id === exercise?.categoryId);
                    const categoryColor = getCategoryColor(
                      categories.findIndex(cat => cat.id === exercise?.categoryId)
                    );
                    
                    return (
                      <div 
                        key={log.id} 
                        className="p-5 hover:bg-gray-50/50 cursor-pointer transition-all duration-200 group"
                        onClick={() => exercise && handleExerciseClick(exercise.id)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            {/* Category indicator */}
                            <div 
                              className="w-3 h-3 rounded-full group-hover:scale-110 transition-transform"
                              style={{ 
                                // eslint-disable-next-line
                                backgroundColor: categoryColor 
                              }}
                            />
                            <div>
                              <h4 className="font-semibold text-gray-900 group-hover:text-gray-700 transition-colors">
                                {exercise?.name || 'Unknown Exercise'}
                              </h4>
                              <div className="flex items-center gap-2 text-sm text-gray-500">
                                <span>{category?.name || 'Uncategorized'}</span>
                                <span>•</span>
                                <Clock className="w-3 h-3" />
                                <span>{format(new Date(log.timestamp), 'MMM d, yyyy')}</span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="text-right">
                            <p className="font-bold text-lg text-gray-900">{log.weight} lbs</p>
                            {log.note && (
                              <p className="text-xs text-gray-500 mt-1 max-w-32 truncate">{log.note}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-12 text-center">
                  <Clock className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">No Recent Workouts</h3>
                  <p className="text-gray-500">Start your fitness journey by logging your first workout!</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </>
    </Layout>
  );
};

export default Dashboard;
