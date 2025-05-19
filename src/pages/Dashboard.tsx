import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAppContext } from '@/context/AppContext';
import { calculateProgress, getOverallProgressChartData, getCategoryProgressChartData } from '@/utils/progressUtils';
import { AreaChart, BarChart3, Award, ArrowUpRight } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import ProgressChart from '@/components/dashboard/ProgressChart';

const Dashboard = () => {
  const { categories, exercises, exerciseLogs } = useAppContext();
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);

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
      // Overall progress chart (by category)
      return getOverallProgressChartData(exerciseLogs, exercises, categories);
    } else {
      // Category-specific chart (by exercise)
      return getCategoryProgressChartData(exerciseLogs, exercises, selectedCategoryId);
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

  // Navigate to leaderboards page
  const handleViewLeaderboards = () => {
    navigate('/leaderboard');
  };

  return (
    <Layout title="Home">
      <div className="flex flex-col gap-6">
        {/* Category Filter */}
        <div className="flex gap-2 overflow-x-auto pb-2 px-1">
          <Button
            variant={selectedCategoryId === null ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedCategoryId(null)}
            className="rounded-full"
          >
            All
          </Button>
          
          {categories.map(category => (
            <Button
              key={category.id}
              variant={selectedCategoryId === category.id ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategoryId(category.id)}
              className="rounded-full whitespace-nowrap"
            >
              {category.name}
            </Button>
          ))}
        </div>
        
        {/* Progress Chart */}
        <Card className="shadow-sm border border-gray-100 overflow-hidden">
          <CardHeader className="pb-2 bg-gray-50">
            <div className="flex justify-between items-center">
              <CardTitle className="text-lg font-medium text-gray-900">Progress Chart</CardTitle>
              <AreaChart className="text-gray-400 h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent>
            {chartData.length > 0 ? (
              <ProgressChart 
                data={chartData} 
                multiple={true}
                categoryId={selectedCategoryId || undefined}
                weightUnit="lbs"
                showPercentage={false}
              />
            ) : (
              <div className="text-center text-gray-500 py-10">
                No data available for chart. Start logging exercises to see your progress!
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Exercise Progress */}
        <div className="px-1">
          <div className="flex justify-between items-center mb-3">
            <div className="flex items-center gap-2">
              <Dumbbell className="text-gray-500 h-5 w-5" />
              <h2 className="text-lg font-medium text-gray-900">Your Progress</h2>
            </div>
            <Button variant="outline" size="sm" onClick={handleViewLeaderboards} className="border-gray-200 hover:bg-gray-50">
              <Award className="mr-2 h-4 w-4" /> Leaderboards
            </Button>
          </div>
          
          {exerciseProgressItems.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {exerciseProgressItems.map((progress) => (
                <Card 
                  key={progress.exercise.id}
                  className="border-gray-100 hover:shadow-md transition-shadow cursor-pointer overflow-hidden"
                  onClick={() => handleExerciseClick(progress.exercise.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex justify-between items-center">
                      <h3 className="font-medium text-gray-900">{progress.exercise.name}</h3>
                      <div className="font-bold text-lg">{progress.currentWeight} lbs</div>
                    </div>

                    <div className="flex justify-between items-center mt-2 text-sm text-gray-500">
                      <div>Previous: {progress.previousWeight || '-'} lbs</div>
                      
                      {progress.personalRecord === progress.currentWeight && (
                        <div className="text-amber-500 font-medium">PR!</div>
                      )}
                    </div>

                    {progress.percentGainFromPrevious !== undefined && (
                      <div className={`flex items-center mt-1 text-sm ${
                        progress.percentGainFromPrevious > 0 
                          ? "text-green-600" 
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
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="p-8 text-center border-gray-100">
              <p className="text-gray-500">No progress data available yet</p>
            </Card>
          )}
        </div>
        
        {/* Recent Activity */}
        <Card className="shadow-sm border border-gray-100 overflow-hidden">
          <CardHeader className="pb-2 bg-gray-50">
            <div className="flex justify-between items-center">
              <CardTitle className="text-lg font-medium text-gray-900">Recent Workouts</CardTitle>
              <BarChart3 className="text-gray-400 h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {recentLogs.length > 0 ? (
              recentLogs.map(log => {
                const exercise = exercises.find(e => e.id === log.exerciseId);
                const category = categories.find(c => c.id === exercise?.categoryId);
                
                return (
                  <div 
                    key={log.id} 
                    className="p-4 border-b last:border-0 hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => exercise && handleExerciseClick(exercise.id)}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="font-medium text-gray-900">{exercise?.name || 'Unknown Exercise'}</div>
                        <div className="text-sm text-gray-500">
                          {category?.name || 'Uncategorized'} • {new Date(log.timestamp).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">{log.weight} lbs</div>
                        {log.note && <div className="text-xs text-gray-500">{log.note}</div>}
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-8 text-center">
                <p className="text-gray-500">No recent workouts</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

const Dumbbell = (props) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M7 5v14" />
    <path d="M17 5v14" />
    <path d="M3 7h4" />
    <path d="M3 17h4" />
    <path d="M17 7h4" />
    <path d="M17 17h4" />
  </svg>
);

export default Dashboard;
