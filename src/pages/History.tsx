import React, { useState, useMemo } from 'react';
import { format } from 'date-fns';
import Layout from '@/components/Layout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Pencil, Trash2, Activity, Clock } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useAppContext } from '@/context/AppContext';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { getCategoryColors, getCategoryKeyByName, getCategoryChartColors } from '@/utils/categoryColors';

const History = () => {
  const { exerciseLogs, exercises, categories, updateExerciseLog, deleteExerciseLog } = useAppContext();
  const { profile } = useAuth();
  const { toast } = useToast();
  const [editLog, setEditLog] = useState(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editForm, setEditForm] = useState({ weight: '', note: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Use the same color system as the rest of the app
  const chartColors = getCategoryChartColors();
  
  // Get color for a category based on its index
  const getCategoryColor = (categoryIndex: number) => {
    return chartColors[categoryIndex % chartColors.length];
  };

  // Group logs by date
  const logsByDate = useMemo(() => {
    const grouped = {};
    
    exerciseLogs.forEach(log => {
      const date = format(new Date(log.timestamp), 'yyyy-MM-dd');
      
      if (!grouped[date]) {
        grouped[date] = [];
      }
      
      grouped[date].push(log);
    });
    
    return grouped;
  }, [exerciseLogs]);
  
  // Sort dates in descending order
  const sortedDates = useMemo(() => {
    return Object.keys(logsByDate).sort((a, b) => {
      return new Date(b).getTime() - new Date(a).getTime();
    });
  }, [logsByDate]);
  
  // Find exercise and category names
  const getExerciseName = (exerciseId) => {
    const exercise = exercises.find(e => e.id === exerciseId);
    return exercise?.name || 'Unknown Exercise';
  };
  
  const getCategoryForExercise = (exerciseId) => {
    const exercise = exercises.find(e => e.id === exerciseId);
    if (!exercise) return null;
    
    const category = categories.find(c => c.id === exercise.categoryId);
    return category;
  };

  // Edit dialog handlers
  const openEditDialog = (log) => {
    setEditLog(log);
    setEditForm({ weight: log.weight, note: log.note || '' });
    setEditDialogOpen(true);
  };

  const handleEditChange = (e) => {
    setEditForm({ ...editForm, [e.target.name]: e.target.value });
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editLog) return;
    
    setIsSubmitting(true);
    
    try {
      await updateExerciseLog({ 
        ...editLog, 
        weight: Number(editForm.weight), 
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
      setIsSubmitting(false);
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

  return (
    <Layout title="History">
      <div className="flex flex-col gap-8 pb-6">
        {/* Header Section */}
        <div className="relative">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-foreground mb-2">Workout History</h1>
            <p className="text-muted-foreground">Track all your workout sessions and progress over time</p>
          </div>
        </div>
        
        {sortedDates.length === 0 && (
          <div className="relative">
            <div className="backdrop-blur-sm bg-card/90 rounded-2xl border p-12 text-center shadow-sm">
              <Activity className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">No Workout History Yet</h3>
              <p className="text-muted-foreground">Start logging exercises to see your complete workout history!</p>
            </div>
          </div>
        )}
        
        {sortedDates.map(date => {
          const dayLogs = logsByDate[date];
          const totalWorkouts = dayLogs.length;
          
          // Get unique categories for this day
          const dayCategories = useMemo(() => {
            const uniqueCategories = new Map();
            dayLogs.forEach(log => {
              const category = getCategoryForExercise(log.exerciseId);
              if (category) {
                uniqueCategories.set(category.id, category);
              }
            });
            return Array.from(uniqueCategories.values());
          }, [dayLogs]);
          
          return (
            <div key={date} className="relative">
              {/* Date Header */}
              <div className="flex flex-col gap-3 mb-4">
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  <h2 className="text-lg font-semibold text-foreground">
                    {format(new Date(date), 'EEEE, MMMM d, yyyy')}
                  </h2>
                </div>
                
                {/* Workout count and category badges */}
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-xs font-medium px-3 py-1.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                    {totalWorkouts} workout{totalWorkouts !== 1 ? 's' : ''}
                  </span>
                  
                  {/* Category indicators */}
                  {dayCategories.map((category, catIndex) => {
                    const categoryIndex = categories.findIndex(cat => cat.id === category.id);
                    const colorClasses = [
                      'bg-blue-500/10 text-blue-600 border-blue-200',
                      'bg-emerald-500/10 text-emerald-600 border-emerald-200', 
                      'bg-purple-500/10 text-purple-600 border-purple-200',
                      'bg-orange-500/10 text-orange-600 border-orange-200',
                      'bg-pink-500/10 text-pink-600 border-pink-200',
                      'bg-cyan-500/10 text-cyan-600 border-cyan-200',
                      'bg-yellow-500/10 text-yellow-600 border-yellow-200',
                      'bg-red-500/10 text-red-600 border-red-200'
                    ];
                    const categoryColorClass = categoryIndex >= 0 ? colorClasses[categoryIndex % colorClasses.length] : 'bg-emerald-500/10 text-emerald-600 border-emerald-200';
                    
                    return (
                      <span 
                        key={category.id}
                        className={`text-xs font-medium px-2.5 py-1 rounded-full border ${categoryColorClass}`}
                      >
                        {category.name}
                      </span>
                    );
                  })}
                </div>
              </div>
              
              {/* Day's Workouts Container */}
              <div className="backdrop-blur-sm bg-card/90 rounded-2xl border shadow-sm overflow-hidden">
                <div className="divide-y divide-border/50">
                  {dayLogs.map((log, index) => {
                    const exerciseName = getExerciseName(log.exerciseId);
                    const category = getCategoryForExercise(log.exerciseId);
                    const categoryIndex = categories.findIndex(cat => cat.id === category?.id);
                    const categoryColor = categoryIndex >= 0 ? getCategoryColor(categoryIndex) : '#10b981';
                    
                    // Get Tailwind-safe color classes based on category index
                    const colorClasses = [
                      'bg-blue-500',
                      'bg-emerald-500', 
                      'bg-purple-500',
                      'bg-orange-500',
                      'bg-pink-500',
                      'bg-cyan-500',
                      'bg-yellow-500',
                      'bg-red-500'
                    ];
                    const categoryColorClass = categoryIndex >= 0 ? colorClasses[categoryIndex % colorClasses.length] : 'bg-emerald-500';
                    
                    return (
                      <div 
                        key={log.id} 
                        className="p-4 sm:p-5 group transition-all duration-200 hover:bg-muted/30 active:bg-muted/40"
                      >
                        <div className="flex justify-between items-start gap-3 sm:gap-4">
                          <div className="flex items-start gap-3 flex-1 min-w-0">
                            {/* Category indicator */}
                            <div 
                              className={`w-3 h-3 rounded-full mt-1.5 flex-shrink-0 ${categoryColorClass}`}
                            />
                            
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-foreground truncate text-sm sm:text-base">{exerciseName}</h3>
                              
                              <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground mt-1">
                                <Clock className="w-3 h-3" />
                                <span>{format(new Date(log.timestamp), 'h:mm a')}</span>
                                {category && (
                                  <>
                                    <span>•</span>
                                    <span className="truncate">{category.name}</span>
                                  </>
                                )}
                              </div>
                              
                              {log.note && (
                                <div className="text-xs sm:text-sm text-muted-foreground mt-2 p-2 bg-muted/50 rounded-lg">
                                  {log.note}
                                </div>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex items-start gap-2 sm:gap-3">
                            {/* Weight Display */}
                            <div className="text-right">
                              <p className="text-lg sm:text-xl font-bold text-foreground">{log.weight}</p>
                              <p className="text-xs text-muted-foreground">lbs</p>
                            </div>
                            
                            {/* Action Buttons - Mobile optimized */}
                            <div className="flex flex-col gap-2">
                              <Button 
                                variant="outline" 
                                size="icon"
                                className="h-11 w-11 sm:h-10 sm:w-10 rounded-xl border-border hover:bg-muted hover:border-primary/30 transition-colors shadow-sm touch-manipulation" 
                                onClick={() => openEditDialog(log)}
                                aria-label="Edit exercise log"
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="outline" 
                                size="icon"
                                className="h-11 w-11 sm:h-10 sm:w-10 rounded-xl border-border text-red-500 hover:text-red-600 hover:bg-red-50 hover:border-red-200 transition-colors shadow-sm touch-manipulation" 
                                onClick={() => handleDelete(log.id)}
                                aria-label="Delete exercise log"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}

        {/* Edit Exercise Log Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <form onSubmit={handleEditSubmit}>
              <DialogHeader className="pb-4">
                <DialogTitle className="text-xl font-semibold">Edit Exercise Log</DialogTitle>
                <DialogDescription className="text-muted-foreground">
                  Update the weight or note for this workout entry.
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-6 py-4">
                <div className="space-y-2">
                  <Label htmlFor="weight" className="text-sm font-medium text-gray-700">
                    Weight (lbs)
                  </Label>
                  <Input
                    id="weight"
                    name="weight"
                    type="number"
                    step="0.5"
                    min="0"
                    value={editForm.weight}
                    onChange={handleEditChange}
                    className="rounded-xl border-gray-200/60 bg-white/80 backdrop-blur-sm focus:border-gray-300 focus:ring-0 text-lg h-12"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="note" className="text-sm font-medium text-gray-700">
                    Note (optional)
                  </Label>
                  <Textarea
                    id="note"
                    name="note"
                    value={editForm.note}
                    onChange={handleEditChange}
                    placeholder="Add a note about this workout..."
                    rows={3}
                    className="rounded-xl border-gray-200/60 bg-white/80 backdrop-blur-sm focus:border-gray-300 focus:ring-0 resize-none"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">Date & Time</Label>
                  <div className="text-sm text-muted-foreground p-3 bg-muted/50 rounded-xl">
                    {editLog && format(new Date(editLog.timestamp), 'EEEE, MMMM d, yyyy \'at\' h:mm a')}
                  </div>
                </div>
              </div>
              
              <DialogFooter className="pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditDialogOpen(false)}
                  className="rounded-xl"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  className="rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg transition-all duration-200 hover:shadow-xl"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
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

export default History;
