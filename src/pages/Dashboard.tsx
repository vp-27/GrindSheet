
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import ProgressChart from '@/components/dashboard/ProgressChart';
import ProgressCard from '@/components/dashboard/ProgressCard';
import CategoryFilter from '@/components/dashboard/CategoryFilter';
import { useAppContext } from '@/context/AppContext';
import { calculateProgress, getProgressChartData } from '@/utils/progressUtils';
import { Exercise, Progress } from '@/types';

const Dashboard: React.FC = () => {
  const { 
    currentUser, 
    exercises, 
    exerciseLogs,
    categories,
    selectedCategory,
    setSelectedCategory,
    setSelectedExercise
  } = useAppContext();
  
  const [selectedExerciseForChart, setSelectedExerciseForChart] = useState<Exercise | null>(null);
  const navigate = useNavigate();
  
  // Filter logs for the current user
  const userLogs = exerciseLogs.filter(log => log.userId === currentUser.id);
  
  // Filter exercises by selected category
  const filteredExercises = selectedCategory
    ? exercises.filter(ex => ex.categoryId === selectedCategory.id)
    : exercises;
  
  // Calculate progress for each exercise
  const progressItems: Progress[] = filteredExercises.map(exercise => 
    calculateProgress(userLogs, exercise.id, exercise)
  ).filter(progress => progress.currentWeight > 0) // Only show exercises with logged weights
  .sort((a, b) => {
    // Sort by most recent first (based on timestamp of the latest log)
    const aLogs = userLogs
      .filter(log => log.exerciseId === a.exercise.id)
      .sort((x, y) => new Date(y.timestamp).getTime() - new Date(x.timestamp).getTime());
      
    const bLogs = userLogs
      .filter(log => log.exerciseId === b.exercise.id)
      .sort((x, y) => new Date(y.timestamp).getTime() - new Date(x.timestamp).getTime());
      
    if (aLogs.length === 0) return 1;
    if (bLogs.length === 0) return -1;
    
    return new Date(bLogs[0].timestamp).getTime() - new Date(aLogs[0].timestamp).getTime();
  });

  // Prepare chart data based on selection
  const getChartData = () => {
    if (selectedExerciseForChart) {
      // Single exercise chart
      return getProgressChartData(userLogs, selectedExerciseForChart.id);
    } else if (selectedCategory) {
      // Multiple exercises in category chart
      const categoryExercises = exercises.filter(ex => ex.categoryId === selectedCategory.id);
      
      // Get all unique dates from logs for these exercises
      const allDates = new Set<string>();
      categoryExercises.forEach(exercise => {
        const exerciseLogs = userLogs.filter(log => log.exerciseId === exercise.id);
        exerciseLogs.forEach(log => {
          allDates.add(new Date(log.timestamp).toLocaleDateString());
        });
      });

      // Create a map of dates
      const dateArray = Array.from(allDates).sort((a, b) => 
        new Date(a).getTime() - new Date(b).getTime()
      );

      // For each exercise, map its progress over these dates
      const multiData: Record<string, any>[] = [];
      
      dateArray.forEach(date => {
        const dataPoint: Record<string, any> = { date };
        
        categoryExercises.forEach(exercise => {
          const logsOnDate = userLogs.filter(log => 
            log.exerciseId === exercise.id && 
            new Date(log.timestamp).toLocaleDateString() === date
          );
          
          if (logsOnDate.length > 0) {
            // Use the latest log for that date
            dataPoint[exercise.name] = logsOnDate[0].weight;
          }
        });
        
        multiData.push(dataPoint);
      });
      
      return multiData;
    } else {
      // Overall percentage gain chart across all exercises
      // Get the oldest log date for each exercise as starting point
      const exerciseStartPoints: Record<string, { date: Date, weight: number }> = {};
      
      userLogs.forEach(log => {
        if (!exerciseStartPoints[log.exerciseId] || 
            new Date(log.timestamp) < exerciseStartPoints[log.exerciseId].date) {
          exerciseStartPoints[log.exerciseId] = {
            date: new Date(log.timestamp),
            weight: log.weight
          };
        }
      });
      
      // Get all unique dates from logs
      const allDates = userLogs.map(log => new Date(log.timestamp).toLocaleDateString());
      const uniqueDates = Array.from(new Set(allDates)).sort((a, b) => 
        new Date(a).getTime() - new Date(b).getTime()
      );
      
      // Calculate percentage gain for each date
      const percentageData = uniqueDates.map((date, index) => {
        // Get logs for this date
        const logsOnDate = userLogs.filter(log => 
          new Date(log.timestamp).toLocaleDateString() === date
        );
        
        // Calculate total percentage gain across all exercises for this date
        let totalGain = 0;
        let exerciseCount = 0;
        
        logsOnDate.forEach(log => {
          const startPoint = exerciseStartPoints[log.exerciseId];
          if (startPoint && startPoint.weight > 0) {
            // Calculate percentage gain from starting weight
            const percentGain = ((log.weight - startPoint.weight) / startPoint.weight) * 100;
            totalGain += percentGain;
            exerciseCount++;
          }
        });
        
        // Average percentage gain across all exercises
        const avgGain = exerciseCount > 0 ? totalGain / exerciseCount : 0;
        
        // If it's the first date, set gain to 0 as baseline
        const percentGain = index === 0 ? 0 : avgGain;
        
        return {
          date,
          percentGain: parseFloat(percentGain.toFixed(2))
        };
      });
      
      return percentageData;
    }
  };
  
  const chartData = getChartData();
  
  const chartTitle = selectedExerciseForChart 
    ? `Progress: ${selectedExerciseForChart.name}`
    : selectedCategory
    ? `Progress: ${selectedCategory.name} Exercises`
    : "Overall Progress";
  
  const handleSelectCategory = (categoryId: string | null) => {
    setSelectedCategory(categoryId ? categories.find(c => c.id === categoryId) || null : null);
    setSelectedExerciseForChart(null);
  };
  
  const handleExerciseClick = (exercise: Exercise) => {
    setSelectedExerciseForChart(exercise);
  };
  
  const handleExerciseLogClick = (exercise: Exercise) => {
    setSelectedExercise(exercise);
    navigate('/add-exercise');
  };
  
  return (
    <Layout title="Dashboard">
      <div className="flex flex-col gap-4 pb-16">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Welcome, {currentUser.name}</h1>
        </div>
        
        {/* Progress Chart */}
        <ProgressChart 
          data={chartData} 
          title={chartTitle}
          multiple={selectedCategory !== null && selectedExerciseForChart === null}
          showPercentage={!selectedCategory && !selectedExerciseForChart}
          exerciseId={selectedExerciseForChart?.id}
        />
        
        {/* Category Filter */}
        <CategoryFilter 
          categories={categories} 
          selectedCategoryId={selectedCategory?.id || null} 
          onSelectCategory={handleSelectCategory} 
        />
        
        {/* Progress Cards */}
        {progressItems.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No exercises logged yet. Tap the + button to log your first exercise!
          </div>
        ) : (
          <div className="grid gap-4">
            {progressItems.map((progress) => (
              <ProgressCard 
                key={progress.exercise.id} 
                progress={progress}
                onClick={() => {
                  handleExerciseClick(progress.exercise);
                  handleExerciseLogClick(progress.exercise);
                }}
              />
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Dashboard;
