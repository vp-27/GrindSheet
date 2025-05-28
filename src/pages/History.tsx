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
    
    // Validate weight is a valid positive number
    const weightValue = parseFloat(editForm.weight);
    if (!editForm.weight || isNaN(weightValue) || weightValue <= 0) {
      toast({
        title: 'Invalid weight',
        description: 'Please enter a valid weight value.',
        variant: 'destructive',
      });
      return;
    }
    
    setIsSubmitting(true);
    
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
          
          return (
            <div key={date} className="relative">
              {/* Date Header */}
              <div className="mb-4">
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  <h2 className="text-lg font-semibold text-foreground">
                    {format(new Date(date), 'EEEE, MMMM d, yyyy')}
                  </h2>
                </div>
              </div>
              
              {/* Day's Workouts Container */}
              <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
                <div className="divide-y divide-border">
                  {dayLogs.map((log, index) => {
                    const exerciseName = getExerciseName(log.exerciseId);
                    const category = getCategoryForExercise(log.exerciseId);
                    const categoryIndex = categories.findIndex(cat => cat.id === category?.id);
                    const categoryColor = categoryIndex >= 0 ? getCategoryColor(categoryIndex) : '#10b981';
                    
                    return (
                      <div 
                        key={log.id} 
                        className="p-5 group transition-all duration-200 hover:bg-muted/20 active:bg-muted/30"
                      >
                        <div className="flex justify-between items-start gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-semibold text-foreground truncate">{exerciseName}</h3>
                              {category && (
                                <div 
                                  className="inline-flex items-center px-1.5 py-0.5 rounded-md text-xs font-medium flex-shrink-0"
                                  style={{ 
                                    // eslint-disable-next-line
                                    backgroundColor: `${categoryColor}15`,
                                    // eslint-disable-next-line
                                    color: categoryColor,
                                    // eslint-disable-next-line
                                    border: `1px solid ${categoryColor}25`
                                  }}
                                >
                                  {category.name}
                                </div>
                              )}
                            </div>
                            
                            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                              <Clock className="w-3 h-3 flex-shrink-0" />
                              <span>{format(new Date(log.timestamp), 'h:mm a')}</span>
                            </div>
                            
                            {log.note && (
                              <div className="text-sm text-muted-foreground p-3 bg-muted/40 rounded-xl border border-border/50">
                                {log.note}
                              </div>
                            )}
                          </div>
                          
                          <div className="flex items-start gap-3 flex-shrink-0">
                            {/* Weight Display */}
                            <div className="text-right">
                              <p className="text-xl font-bold text-foreground">{log.weight}</p>
                              <p className="text-xs text-muted-foreground">lbs</p>
                            </div>
                            
                            {/* Action Buttons - Vertical alignment */}
                            <div className="flex flex-col gap-2">
                              <Button 
                                variant="outline" 
                                size="icon"
                                className="h-9 w-9 rounded-lg border-border/50 hover:bg-muted hover:border-primary/30 transition-all duration-200 shadow-sm" 
                                onClick={() => openEditDialog(log)}
                                aria-label="Edit exercise log"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                              <Button 
                                variant="outline" 
                                size="icon"
                                className="h-9 w-9 rounded-lg border-border/50 text-red-500 hover:text-red-600 hover:bg-red-50 hover:border-red-200 transition-all duration-200 shadow-sm" 
                                onClick={() => handleDelete(log.id)}
                                aria-label="Delete exercise log"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
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
                    onKeyDown={(e) => {
                      // Prevent non-numeric characters except for allowed keys
                      if (!/[0-9.]/.test(e.key) && 
                          !['Backspace', 'Delete', 'Tab', 'Escape', 'Enter', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
                        e.preventDefault();
                      }
                    }}
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
