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
    
    setIsSubmitting(true);
    
    try {
      await addExerciseLog({
        userId: profile?.id || '',
        exerciseId: exercise.id,
        weight: parseFloat(weight),
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
  
  return (
    <Layout title={exercise.name}>
      <div className="flex flex-col gap-4">
        {/* Header with back button */}
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            className="p-0 h-auto" 
            onClick={() => navigate('/')}
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-semibold">{exercise.name}</h1>
          {category && (
            <span className="text-sm bg-green-100 text-green-800 px-2 py-1 rounded-full">
              {category.name}
            </span>
          )}
        </div>
        
        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-3">
          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardContent className="p-3 flex flex-col items-center justify-center">
              <p className="text-sm text-green-800 font-medium">Current Weight</p>
              <p className="text-xl font-bold text-green-800">
                {progress?.currentWeight || 0} lbs
              </p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200">
            <CardContent className="p-3 flex flex-col items-center justify-center">
              <p className="text-sm text-amber-800 font-medium">Personal Record</p>
              <p className="text-xl font-bold text-amber-800">
                {progress?.personalRecord || 0} lbs
              </p>
            </CardContent>
          </Card>
        </div>
        
        {/* Progress Chart */}
        <Card>
          <CardHeader className="pb-0">
            <CardTitle className="text-lg">Progress History</CardTitle>
          </CardHeader>
          <CardContent>
            <ProgressChart
              data={chartData}
              title={exercise.name}
              exerciseId={exercise.id}
              weightUnit="lbs"
            />
          </CardContent>
        </Card>
        
        {/* Log New Weight Form */}
        <Card className="border-green-200">
          <CardHeader className="pb-0">
            <CardTitle className="text-lg text-green-800">Log New Weight</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="weight" className="text-green-800">Weight (lbs)</Label>
                <Input
                  id="weight"
                  type="number"
                  step="0.5"
                  min="0"
                  value={weight}
                  onChange={e => setWeight(e.target.value)}
                  placeholder="Enter weight"
                  className="border-green-200 focus:border-green-400 focus:ring-green-400"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="note" className="text-green-800">Note (optional)</Label>
                <Textarea
                  id="note"
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  placeholder="Add a note about this set"
                  rows={2}
                  className="border-green-200 focus:border-green-400 focus:ring-green-400"
                />
              </div>
              
              <Button 
                type="submit" 
                className="w-full bg-green-600 hover:bg-green-700" 
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Logging...' : 'Log Weight'}
              </Button>
            </form>
          </CardContent>
        </Card>
        
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