import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Layout from '@/components/Layout';
import ExerciseLogCard from '@/components/ExerciseLogCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useAppContext } from '@/context/useAppContext';
import { useAuth } from '@/context/AuthContext';
import { Trophy, TrendingUp, Clock, Activity, Pencil, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import ProgressChart from '@/components/dashboard/ProgressChart';
import { getProgressChartData, calculateProgress } from '@/utils/progressUtils';
import { getCategoryColors, getCategoryKeyByName, getCategoryChartColors } from '@/utils/categoryColors';
import AnimatedCounter from '@/components/ui/animated-counter';
import '@/styles/index.css';
import AddExerciseModal from '@/components/AddExerciseModal';

const ExerciseDetail = () => {
  const { exercises, categories, exerciseLogs, addExerciseLog, updateExerciseLog, deleteExerciseLog } = useAppContext();
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  
  // Get exerciseId from URL parameters
  const exerciseId = searchParams.get('exercise');
  
  // Form state
  const [weight, setWeight] = useState<string>('');
  const [note, setNote] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Edit dialog state
  const [editLog, setEditLog] = useState(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editForm, setEditForm] = useState({ weight: '', note: '' });
  const [isEditSubmitting, setIsEditSubmitting] = useState(false);
  
  // Chart timeframe state
  const [currentTimeframe, setCurrentTimeframe] = useState<'1W' | '2W' | '1M' | 'ALL'>('1M');
  const [timeframeGain, setTimeframeGain] = useState<number | null>(null);
  const [chartHoverData, setChartHoverData] = useState<any>(null);
  
  // Add state for AddExerciseModal
  const [isAddExerciseModalOpen, setIsAddExerciseModalOpen] = useState(false);
  
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
  
  // Get chart data with timeframe filtering
  const chartData = useMemo(() => {
    if (!exerciseId) return [];
    const data = getProgressChartData(exerciseLogs, exerciseId, currentTimeframe);
    console.log('ExerciseDetail chart data:', data);
    return data;
  }, [exerciseLogs, exerciseId, currentTimeframe]);

  // Get category colors
  const categoryColors = useMemo(() => {
    if (!category) return null;
    const categoryKey = getCategoryKeyByName(category.name);
    return getCategoryColors(categoryKey);
  }, [category]);
  
  // Handle timeframe changes from chart
  const handleTimeframeChange = (timeframe: '1W' | '2W' | '1M' | 'ALL', gain: number | null) => {
    setCurrentTimeframe(timeframe);
    setTimeframeGain(gain);
  };
  
  // Redirect if no exercise ID or invalid ID
  useEffect(() => {
    if (!exerciseId || (!exercise && exercises.length > 0)) {
      navigate('/');
    }
  }, [exerciseId, exercise, exercises, navigate]);
  
  // Scroll to top when component mounts or exercise changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [exerciseId]);
  
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
    
    // Validate weight is a valid number (0 allowed for bodyweight)
    const weightValue = parseFloat(weight);
    if (isNaN(weightValue) || weightValue < 0) {
      toast({
        title: 'Invalid weight',
        description: 'Please enter a valid weight value (0 for bodyweight exercises).',
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

  // Edit dialog handlers
  const openEditDialog = (log) => {
    setEditLog(log);
    setEditForm({ weight: log.weight.toString(), note: log.note || '' });
    setEditDialogOpen(true);
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'weight') {
      // Only allow numeric input (including decimals)
      if (value === '' || /^\d*\.?\d*$/.test(value)) {
        setEditForm({ ...editForm, [name]: value });
      }
    } else {
      setEditForm({ ...editForm, [name]: value });
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editLog) return;
    
    // Validate weight is a valid number (0 allowed for bodyweight)
    const weightValue = parseFloat(editForm.weight);
    if (!editForm.weight || isNaN(weightValue) || weightValue < 0) {
      toast({
        title: 'Invalid weight',
        description: 'Please enter a valid weight value (0 for bodyweight exercises).',
        variant: 'destructive',
      });
      return;
    }
    
    setIsEditSubmitting(true);
    
    try {
      await updateExerciseLog({ 
        ...editLog, 
        weight: weightValue, 
        note: editForm.note 
      });
      
      toast({
        title: 'Log updated',
        description: 'Your exercise log has been successfully updated!',
      });
      
      setEditDialogOpen(false);
      setEditLog(null);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update log. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsEditSubmitting(false);
    }
  };

  const handleDelete = async (logId) => {
    if (window.confirm('Are you sure you want to delete this log? This action cannot be undone.')) {
      try {
        await deleteExerciseLog(logId);
        toast({
          title: 'Log deleted',
          description: 'Your exercise log has been successfully deleted.',
        });
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to delete log. Please try again.',
          variant: 'destructive',
        });
      }
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
    <Layout title={exercise.name} categoryColor={categoryColors?.primary}>
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
          {chartData.length > 0 ? (
            <ProgressChart
              data={chartData}
              exerciseId={exercise.id}
              weightUnit="lbs"
              appleStyle={true}
              blendWithBackground={true}
              customColors={categoryColors ? [categoryColors.primary] : undefined}
              onTimeframeChange={handleTimeframeChange}
              onHoverData={setChartHoverData}
              hideTooltip={true}
              defaultTimeframe="1M"
              timeframe={currentTimeframe}
              disableInternalTimeframeFilter={true}
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
            className="category-background-glow"
            // eslint-disable-next-line react/forbid-dom-props
            style={{ 
              '--category-color': categoryColors?.primary || '#10b981'
            } as React.CSSProperties}
          />
          
          {/* Stats container */}
          <div className="apple-card p-6 shadow-lg">
            <div className="grid grid-cols-2 gap-6">
              {/* Current Weight */}
              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <div 
                    className="category-stats-indicator"
                    // eslint-disable-next-line react/forbid-dom-props
                    style={{ 
                      '--category-color': categoryColors?.primary || '#10b981'
                    } as React.CSSProperties}
                  />
                  <p className="text-sm font-medium text-muted-foreground">
                    {chartHoverData ? format(new Date(chartHoverData.date), 'MMM d') : 'Current'}
                  </p>
                </div>
                <p className="text-3xl font-bold text-foreground">
                  <AnimatedCounter 
                    value={chartHoverData ? chartHoverData.data.weight || 0 : progress?.currentWeight || 0}
                    formatValue={(val) => val % 1 === 0 ? val.toString() : val.toFixed(1)}
                    duration={600}
                    className="tabular-nums"
                  />
                </p>
                <p className="text-sm text-muted-foreground">
                  {chartHoverData ? (
                    <>
                      <AnimatedCounter 
                        value={chartHoverData.data.weight || 0}
                        formatValue={(val) => `${val % 1 === 0 ? val.toString() : val.toFixed(1)} lbs`}
                        duration={400}
                        className="tabular-nums"
                      />
                    </>
                  ) : (
                    'lbs'
                  )}
                </p>
              </div>
              
              {/* Personal Record */}
              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <Trophy className="w-3 h-3 text-amber-500 mr-2" />
                  <p className="text-sm font-medium text-muted-foreground">Record</p>
                </div>
                <p className="text-3xl font-bold text-foreground">
                  <AnimatedCounter 
                    value={progress?.personalRecord || 0}
                    formatValue={(val) => val % 1 === 0 ? val.toString() : val.toFixed(1)}
                    duration={600}
                    className="tabular-nums"
                  />
                </p>
                <p className="text-sm text-muted-foreground">lbs</p>
              </div>
            </div>
            
            {/* Progress indicator */}
            {((timeframeGain !== null && timeframeGain !== 0) || (progress?.percentGainFromStart !== undefined && progress.percentGainFromStart > 0)) && (
              <div className="mt-4 pt-4 border-t border-border/50">
                <div className="flex items-center justify-center gap-2">
                  <TrendingUp className="w-4 h-4 text-teal-500" />
                  <span className="text-sm font-medium text-foreground">
                    {timeframeGain !== null && timeframeGain !== 0 ? (
                      <>
                        {timeframeGain >= 0 ? '+' : ''}
                        <AnimatedCounter 
                          value={timeframeGain}
                          formatValue={(val) => `${val.toFixed(1)}% ${currentTimeframe} progress`}
                          duration={500}
                          className="tabular-nums"
                        />
                      </>
                    ) : (
                      <>
                        +<AnimatedCounter 
                          value={progress?.percentGainFromStart || 0}
                          formatValue={(val) => `${val.toFixed(1)}% total progress`}
                          duration={500}
                          className="tabular-nums"
                        />
                      </>
                    )}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      
        {/* Log New Weight Button - Standalone, not in a card */}
        <div className="flex justify-center mt-3 mb-6">
          <Button 
            className="category-submit-button rounded-full max-w-md w-full mx-auto"
            style={{ 
              '--category-color': categoryColors?.primary || '#10b981',
              '--category-color-rgb': (categoryColors?.primary || '#10b981').replace('#', '').match(/.{2}/g)?.map(hex => parseInt(hex, 16)).join(', ') || '16, 185, 129'
            } as React.CSSProperties}
            onClick={() => setIsAddExerciseModalOpen(true)}
          >
            Log New Weight
          </Button>
          <AddExerciseModal
            isOpen={isAddExerciseModalOpen}
            onOpenChange={setIsAddExerciseModalOpen}
            preselectedExerciseId={exercise?.id}
            preselectedCategoryId={category?.id}
          />
        </div>
        
        {/* Recent Logs */}
        <div className="relative">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-foreground">Recent History</h3>
          </div>
          
          {filteredLogs.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredLogs.slice(0, 6).map(log => {
                const categoryIndex = categories.findIndex(cat => cat.id === category?.id);
                const categoryColor = categoryIndex >= 0 ? getCategoryChartColors()[categoryIndex % getCategoryChartColors().length] : '#10b981';
                
                return (
                  <ExerciseLogCard
                    key={log.id}
                    log={log}
                    categoryColor={categoryColor}
                    showExerciseName={false}
                    showDate={true}
                    onEdit={openEditDialog}
                    onDelete={handleDelete}
                  />
                );
              })}
            </div>
          ) : (
            <div className="apple-card p-12 text-center shadow-sm">
              <Activity className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">No history yet</h3>
              <p className="text-muted-foreground">Log your first weight to start tracking progress!</p>
            </div>
          )}
        </div>

        {/* Edit Exercise Log Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="apple-card sm:max-w-md mobile-dialog">
            <form onSubmit={handleEditSubmit}>
              <DialogHeader className="pb-4">
                <DialogTitle className="text-xl font-semibold mobile-dialog-title">Edit Exercise Log</DialogTitle>
                <DialogDescription className="text-muted-foreground mobile-dialog-description">
                  Update the weight or note for this workout entry.
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-6 py-4 mobile-dialog-content">
                <div className="space-y-2">
                  <Label htmlFor="edit-weight" className="text-sm font-medium text-gray-700 mobile-label">
                    Weight (lbs)
                  </Label>
                  <Input
                    id="edit-weight"
                    name="weight"
                    type="number"
                    step="0.5"
                    min="0"
                    value={editForm.weight}
                    onChange={handleEditChange}
                    onKeyDown={(e) => {
                      // Prevent non-numeric characters except for allowed keys
                      if (!/[0-9.]/.test(e.key) && 
                          !['Backspace', 'Delete', 'Tab', 'Escape', 'Enter', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
                        e.preventDefault();
                      }
                    }}
                    className="rounded-xl border-gray-200/60 bg-white/80 backdrop-blur-sm focus:border-gray-300 focus:ring-0 text-lg h-12 mobile-input"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="edit-note" className="text-sm font-medium text-gray-700 mobile-label">
                    Note (optional)
                  </Label>
                  <Textarea
                    id="edit-note"
                    name="note"
                    value={editForm.note}
                    onChange={handleEditChange}
                    placeholder="Add a note about this workout..."
                    rows={3}
                    className="rounded-xl border-gray-200/60 bg-white/80 backdrop-blur-sm focus:border-gray-300 focus:ring-0 resize-none mobile-textarea"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700 mobile-label">Date & Time</Label>
                  <div className="text-sm text-muted-foreground p-3 bg-muted/50 rounded-xl">
                    {editLog && format(new Date(editLog.timestamp), 'EEEE, MMMM d, yyyy \'at\' h:mm a')}
                  </div>
                </div>
              </div>
              
              <DialogFooter className="pt-4 mobile-dialog-footer">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditDialogOpen(false)}
                  className="rounded-xl mobile-button-secondary"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  className="rounded-xl bg-primary active:bg-primary/90 text-primary-foreground shadow-lg transition-all duration-200 active:shadow-xl mobile-button-primary"
                  disabled={isEditSubmitting}
                >
                  {isEditSubmitting ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Updating...
                    </div>
                  ) : (
                    'Update Log'
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default ExerciseDetail;