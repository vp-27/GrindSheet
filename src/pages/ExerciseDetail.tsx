import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useAppContext } from '@/context/AppContext';
import { useAuth } from '@/context/AuthContext';
import { ChevronLeft, Trophy, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import ProgressChart from '@/components/dashboard/ProgressChart';
import { getProgressChartData, calculateProgress } from '@/utils/progressUtils';
import { getCategoryColors, getCategoryKeyByName } from '@/utils/categoryColors';

const ExerciseDetail = () => {
  const { exercises, categories, exerciseLogs, addExerciseLog } = useAppContext();
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  
  // Get exerciseId from URL params
  const exerciseId = searchParams.get('exercise');
  
  // Form state
  const [weight, setWeight] = useState<string>('');
  const [note, setNote] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Get the exercise details
  const exercise = useMemo(() => {
    return exercises.find(ex => ex.id === exerciseId);
  }, [exercises, exerciseId]);
  
  // Get the category
  const category = useMemo(() => {
    if (!exercise) return null;
    return categories.find(cat => cat.id === exercise.categoryId);
  }, [categories, exercise]);
  
  // Get exercise logs for this exercise
  const filteredLogs = useMemo(() => {
    if (!exerciseId) return [];
    
    return exerciseLogs
      .filter(log => log.exerciseId === exerciseId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [exerciseLogs, exerciseId]);
  
  // Calculate progress data
  const progress = useMemo(() => {
    if (!exercise) return null;
    return calculateProgress(exerciseLogs, exercise.id, exercise);
  }, [exerciseLogs, exercise]);
  
  // Get chart data
  const chartData = useMemo(() => {
    if (!exerciseId) return [];
    return getProgressChartData(exerciseLogs, exerciseId);
  }, [exerciseLogs, exerciseId]);

  // Get category colors
  const categoryColors = useMemo(() => {
    if (!category) return null;
    const categoryKey = getCategoryKeyByName(category.name);
    return getCategoryColors(categoryKey);
  }, [category]);
  
  // Redirect if no exercise ID or invalid ID
  useEffect(() => {
    if (!exerciseId || (!exercise && exercises.length > 0)) {
      navigate('/');
    }
  }, [exerciseId, exercise, exercises, navigate]);
  
  // Handle form submission to log weight
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!weight || !exercise) {
      toast({
        title: 'Missing information',
        description: 'Please enter a weight value.',
        variant: 'destructive',
      });
      return;
    }
    
    // Validate weight is a valid positive number
    const weightValue = parseFloat(weight);
    if (isNaN(weightValue) || weightValue <= 0) {
      toast({
        title: 'Invalid weight',
        description: 'Please enter a valid weight value.',
        variant: 'destructive',
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      await addExerciseLog({
        userId: profile?.id || '',
        exerciseId: exercise.id,
        weight: weightValue,
        note: note,
        weightUnit: 'lbs' // Always use lbs now
      });
      
      toast({
        title: 'Weight logged',
        description: 'Your weight has been successfully logged!',
      });
      
      // Reset form
      setWeight('');
      setNote('');
      
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to log weight. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (!exercise) {
    return (
      <Layout title="Loading...">
        <div className="flex justify-center items-center h-64">
          <p>Loading exercise data...</p>
        </div>
      </Layout>
    );
  }
  
  // Get selected category color for subtle background tinting
  const selectedCategoryColor = useMemo(() => {
    if (!category || !categoryColors) return null;
    return categoryColors.primary;
  }, [category, categoryColors]);

  return (
    <Layout title={exercise.name}>
      {/* Subtle background tint based on selected category - Apple style */}
      {selectedCategoryColor && (
        <div 
          className="fixed inset-0 pointer-events-none transition-all duration-700 ease-out z-0"
          style={{
            background: `radial-gradient(ellipse 100% 60% at 50% 0%, ${selectedCategoryColor}15 0%, ${selectedCategoryColor}08 40%, transparent 70%)`,
          }}
        />
      )}
      
      <div className="relative flex flex-col gap-8 pb-6 z-10">
        {/* Header with back button and category badge */}
        <div className="flex items-center justify-between">
          <Button 
            variant="ghost" 
            className="p-2 h-auto rounded-full hover:bg-muted transition-colors" 
            onClick={() => navigate('/')}
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          {category && categoryColors && (
            <div className="flex items-center gap-2">
              <span 
                className="text-xs font-semibold px-3 py-1.5 rounded-full border backdrop-blur-sm"
                style={{ 
                  backgroundColor: `${categoryColors.primary}15`,
                  borderColor: `${categoryColors.primary}30`,
                  color: categoryColors.primary 
                }}
              >
                {category.name}
              </span>
            </div>
          )}
        </div>
        
        {/* Progress Chart Section - Embedded in background */}
        <div className="relative -mx-4 px-4">
          {chartData.length > 0 ? (
            <ProgressChart
              data={chartData}
              exerciseId={exercise.id}
              weightUnit="lbs"
              appleStyle={true}
              blendWithBackground={true}
              customColors={categoryColors ? [categoryColors.primary] : undefined}
            />
          ) : (
            <div className="text-center text-muted-foreground py-16">
              <TrendingUp className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg font-medium mb-2">No progress data yet</p>
              <p>Log your first weight to start tracking progress!</p>
            </div>
          )}
        </div>
        
        {/* Current Weight and PR Stats Section */}
        <div className="relative">
          {/* Background blur effect */}
          <div 
            className="absolute inset-0 rounded-3xl opacity-20 blur-xl"
            style={{ backgroundColor: categoryColors?.primary || '#10b981' }}
          />
          
          {/* Stats container */}
          <div className="relative backdrop-blur-sm bg-card/80 rounded-3xl border shadow-lg p-6">
            <div className="grid grid-cols-2 gap-6">
              {/* Current Weight */}
              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <div 
                    className="w-3 h-3 rounded-full mr-2"
                    style={{ backgroundColor: categoryColors?.primary || '#10b981' }}
                  />
                  <p className="text-sm font-medium text-muted-foreground">Current</p>
                </div>
                <p className="text-3xl font-bold text-foreground">
                  {progress?.currentWeight || 0}
                </p>
                <p className="text-sm text-muted-foreground">lbs</p>
              </div>
              
              {/* Personal Record */}
              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <Trophy className="w-3 h-3 text-amber-500 mr-2" />
                  <p className="text-sm font-medium text-muted-foreground">Record</p>
                </div>
                <p className="text-3xl font-bold text-foreground">
                  {progress?.personalRecord || 0}
                </p>
                <p className="text-sm text-muted-foreground">lbs</p>
              </div>
            </div>
            
            {/* Progress indicator */}
            {progress?.percentGainFromStart !== undefined && progress.percentGainFromStart > 0 && (
              <div className="mt-4 pt-4 border-t border-border/50">
                <div className="flex items-center justify-center gap-2">
                  <TrendingUp className="w-4 h-4 text-green-500" />
                  <span className="text-sm font-medium text-foreground">
                    +{progress.percentGainFromStart.toFixed(1)}% total progress
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      
        {/* Log New Weight Form */}
        <div className="relative">
          {/* Subtle background glow */}
          <div 
            className="absolute inset-0 rounded-2xl opacity-10 blur-lg"
            style={{ backgroundColor: categoryColors?.primary || '#10b981' }}
          />
          
          <div className="relative backdrop-blur-sm bg-card/90 rounded-2xl border border-border/30 p-6 shadow-sm">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-foreground">Log New Weight</h3>
              <p className="text-sm text-muted-foreground">Record your latest workout progress</p>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="weight" className="text-sm font-medium text-foreground">
                  Weight (lbs)
                </Label>
                <Input
                  id="weight"
                  type="number"
                  step="0.5"
                  min="0"
                  value={weight}
                  onChange={e => {
                    const value = e.target.value;
                    // Only allow numeric input (including decimals)
                    if (value === '' || /^\d*\.?\d*$/.test(value)) {
                      setWeight(value);
                    }
                  }}
                  onKeyDown={(e) => {
                    // Prevent non-numeric characters except for allowed keys
                    if (!/[0-9.]/.test(e.key) && 
                        !['Backspace', 'Delete', 'Tab', 'Escape', 'Enter', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
                      e.preventDefault();
                    }
                  }}
                  placeholder="Enter weight"
                  className="rounded-xl border-border/60 bg-background/80 backdrop-blur-sm focus:border-primary focus:ring-0 text-lg h-12"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="note" className="text-sm font-medium text-foreground">
                  Note (optional)
                </Label>
                <Textarea
                  id="note"
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  placeholder="Add a note about this set..."
                  rows={3}
                  className="rounded-xl border-border/60 bg-background/80 backdrop-blur-sm focus:border-primary focus:ring-0 resize-none"
                />
              </div>
              
              <Button 
                type="submit" 
                className="w-full h-12 rounded-xl font-medium text-white shadow-lg transition-all duration-200 hover:shadow-xl active:scale-[0.98]"
                style={{ 
                  backgroundColor: categoryColors?.primary || '#10b981',
                  boxShadow: `0 4px 20px ${categoryColors?.primary || '#10b981'}30`
                }}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Logging...
                  </div>
                ) : (
                  'Log Weight'
                )}
              </Button>
            </form>
          </div>
        </div>
        
        {/* Recent Logs */}
        <Card>
          <CardHeader className="pb-0">
            <CardTitle className="text-lg">Recent History</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {filteredLogs.length > 0 ? (
              filteredLogs.slice(0, 5).map(log => {
                return (
                  <div key={log.id} className="p-4 border-b last:border-0">
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="text-sm text-muted-foreground">
                          {format(new Date(log.timestamp), 'EEEE, MMMM d, yyyy')}
                        </div>
                        {log.note && (
                          <div className="text-sm mt-1">{log.note}</div>
                        )}
                      </div>
                      <div className="font-bold">{log.weight} lbs</div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center p-6">
                <p>No history yet. Log your first weight!</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default ExerciseDetail;