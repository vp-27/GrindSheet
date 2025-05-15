
import React, { useState } from 'react';
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
  
  // Get chart data for selected exercise or first exercise if none selected
  const selectedExerciseId = selectedExerciseForChart?.id || (progressItems.length > 0 ? progressItems[0].exercise.id : "");
  const chartData = selectedExerciseId 
    ? getProgressChartData(userLogs, selectedExerciseId)
    : [];
  
  const chartTitle = selectedExerciseForChart 
    ? `Progress: ${selectedExerciseForChart.name}`
    : progressItems.length > 0
    ? `Progress: ${progressItems[0].exercise.name}`
    : "Progress";
  
  const handleSelectCategory = (categoryId: string | null) => {
    setSelectedCategory(categoryId ? categories.find(c => c.id === categoryId) || null : null);
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
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Welcome, {currentUser.name}</h1>
        </div>
        
        {/* Progress Chart */}
        <ProgressChart 
          data={chartData} 
          title={chartTitle} 
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
