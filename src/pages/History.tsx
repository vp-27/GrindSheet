/* eslint-disable react/forbid-dom-props, react/no-danger */
import React, { useState, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, isToday, addWeeks, subWeeks, startOfMonth, endOfMonth, getDay, addMonths, subMonths, isSameMonth } from 'date-fns';
import { useDrag } from '@use-gesture/react';
import { useSpring, animated } from '@react-spring/web';
import Layout from '@/components/Layout';
import ExerciseLogCard from '@/components/ExerciseLogCard';
import { Calendar, Activity, Pencil, Trash2, Clock, ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { MobileSlider } from '@/components/ui/mobile-slider';
import { useAppContext } from '@/context/useAppContext';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { getCategoryColors, getCategoryKeyByName, getCategoryChartColors } from '@/utils/categoryColors';
import '@/components/ui/category-styles.css';

const History = () => {
  const { exerciseLogs, exercises, categories, updateExerciseLog, deleteExerciseLog } = useAppContext();
  const { profile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [editLog, setEditLog] = useState(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editForm, setEditForm] = useState({ weight: '', note: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Weekly view state
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [showFullMonth, setShowFullMonth] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  
  // Animation state for smooth transitions
  const [{ x }, api] = useSpring(() => ({ x: 0 }));
  const containerRef = useRef<HTMLDivElement>(null);

  // Use the same color system as the rest of the app
  const chartColors = getCategoryChartColors();
  
  // Get color for a category based on its index
  const getCategoryColor = (categoryIndex: number) => {
    return chartColors[categoryIndex % chartColors.length];
  };

  // Helper to get category color index for CSS classes
  const getCategoryColorIndex = (color: string) => {
    return chartColors.findIndex(c => c === color);
  };

  // Weekly view helper functions - Start on Monday
  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 }); // Start on Monday
  const weekEnd = endOfWeek(currentWeek, { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });
  
  // Full month calendar helpers (for expanded view)
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarDays = eachDayOfInterval({ start: monthStart, end: monthEnd });
  
  const startPadding = getDay(monthStart);
  const paddingDays = Array.from({ length: startPadding }, (_, i) => {
    const date = new Date(monthStart);
    date.setDate(date.getDate() - (startPadding - i));
    return date;
  });
  
  const allCalendarDays = [...paddingDays, ...calendarDays];
  
  // Group logs by date for easy lookup
  const logsByDate = useMemo(() => {
    const grouped = {};
    
    exerciseLogs.forEach(log => {
      const logDate = new Date(log.timestamp);
      const dateKey = format(logDate, 'yyyy-MM-dd');
      
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      
      grouped[dateKey].push(log);
    });
    
    return grouped;
  }, [exerciseLogs]);

  // Get logs for a specific date
  const getLogsForDate = (date: Date) => {
    const dateKey = format(date, 'yyyy-MM-dd');
    return logsByDate[dateKey] || [];
  };

  // Get dominant category and colors for a day
  const getDayInfo = (date: Date) => {
    const logs = getLogsForDate(date);
    if (logs.length === 0) return null;

    // Count exercises by category
    const categoryCount = {};
    logs.forEach(log => {
      const exercise = exercises.find(ex => ex.id === log.exerciseId);
      if (exercise) {
        const category = categories.find(cat => cat.id === exercise.categoryId);
        if (category) {
          categoryCount[category.id] = (categoryCount[category.id] || 0) + 1;
        }
      }
    });

    // Find dominant category
    const dominantCategoryId = Object.keys(categoryCount).reduce((a, b) => 
      categoryCount[a] > categoryCount[b] ? a : b
    );
    
    const dominantCategory = categories.find(cat => cat.id === dominantCategoryId);
    const categoryIndex = categories.findIndex(cat => cat.id === dominantCategoryId);
    const categoryColor = categoryIndex >= 0 ? getCategoryColor(categoryIndex) : '#10b981';

    // Get all unique categories for gradient
    const uniqueCategories = Object.keys(categoryCount).map(catId => {
      const category = categories.find(cat => cat.id === catId);
      const index = categories.findIndex(cat => cat.id === catId);
      return {
        category,
        color: index >= 0 ? getCategoryColor(index) : '#10b981',
        count: categoryCount[catId]
      };
    });

    return {
      dominantCategory,
      dominantColor: categoryColor,
      uniqueCategories,
      totalLogs: logs.length
    };
  };

  // Weekly navigation
  const goToPreviousWeek = () => {
    setCurrentWeek(prev => subWeeks(prev, 1));
    setSelectedDate(null); // Clear selection when changing weeks
    // Trigger smooth slide animation
    api.start({ x: 100, config: { tension: 300, friction: 30 } });
    setTimeout(() => api.start({ x: 0, config: { tension: 300, friction: 30 } }), 150);
  };

  const goToNextWeek = () => {
    setCurrentWeek(prev => addWeeks(prev, 1));
    setSelectedDate(null); // Clear selection when changing weeks
    // Trigger smooth slide animation
    api.start({ x: -100, config: { tension: 300, friction: 30 } });
    setTimeout(() => api.start({ x: 0, config: { tension: 300, friction: 30 } }), 150);
  };

  // Handle day selection
  const handleDayClick = (date: Date) => {
    // If clicking the same date, deselect it
    if (selectedDate && isSameDay(date, selectedDate)) {
      setSelectedDate(null);
    } else {
      setSelectedDate(date);
    }
  };

  // Swipe gesture handling
  const bind = useDrag(
    ({ active, movement: [mx], direction: [xDir], velocity: [vx] }) => {
      // Only trigger on significant swipe (velocity > 0.2 or movement > 50px)
      if (!active && (Math.abs(vx) > 0.2 || Math.abs(mx) > 50)) {
        if (xDir > 0) {
          goToPreviousWeek();
        } else {
          goToNextWeek();
        }
      } else if (active) {
        // Smooth follow during drag
        api.start({ x: mx, immediate: true });
      } else {
        // Snap back if not significant enough
        api.start({ x: 0, config: { tension: 300, friction: 30 } });
      }
    },
    {
      axis: 'x',
      filterTaps: true,
      rubberband: true
    }
  );

  // Monthly navigation (for expanded view)
  const goToPreviousMonth = () => {
    setCurrentMonth(prev => subMonths(prev, 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth(prev => addMonths(prev, 1));
  };

  // Sort dates in descending order for list view
  const sortedDates = useMemo(() => {
    if (selectedDate) {
      // If a day is selected, only show that day's logs
      const selectedDateKey = format(selectedDate, 'yyyy-MM-dd');
      return logsByDate[selectedDateKey] ? [selectedDateKey] : [];
    }
    
    return Object.keys(logsByDate).sort((a, b) => {
      return new Date(b).getTime() - new Date(a).getTime();
    });
  }, [logsByDate, selectedDate]);
  
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

  // Handle exercise card click to view detailed progress
  const handleExerciseClick = (exerciseId) => {
    navigate(`/exercise-detail?exercise=${exerciseId}`);
    // Scroll to top after navigation
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
      <div className="flex flex-col gap-6 pb-6">
        {/* Weekly Overview Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CalendarDays className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-semibold text-foreground">Workout History</h1>
          </div>
          
          <MobileSlider
            options={[
              { id: 'week', label: 'Week' },
              { id: 'month', label: 'Month' }
            ]}
            activeOption={showFullMonth ? 'month' : 'week'}
            onOptionChange={(option) => setShowFullMonth(option === 'month')}
            variant="compact"
            className="history-view-slider"
          />
        </div>

        {/* Empty State */}
        {exerciseLogs.length === 0 && (
          <div className="relative">
            <div className="apple-card p-12 text-center shadow-sm">
              <Activity className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">No Workout History Yet</h3>
              <p className="text-muted-foreground">Start logging exercises to see your complete workout history!</p>
            </div>
          </div>
        )}

        {/* Weekly View (Default) */}
        {exerciseLogs.length > 0 && !showFullMonth && (
          <div className="relative swipe-container">
            {/* Week Navigation */}
            <div className="apple-card p-4 shadow-sm mb-6">
              <div className="flex items-center justify-between mb-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={goToPreviousWeek}
                  className="rounded-xl p-2 transition-all duration-200 active:scale-95"
                  aria-label="Previous week"
                  title="Previous week"
                >
                  <ChevronLeft className="h-5 w-5" />
                </Button>
                
                <h2 className="text-lg font-semibold text-foreground">
                  {format(weekStart, 'MMM d')} - {format(weekEnd, 'MMM d, yyyy')}
                </h2>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={goToNextWeek}
                  className="rounded-xl p-2 transition-all duration-200 active:scale-95"
                  aria-label="Next week"
                  title="Next week"
                >
                  <ChevronRight className="h-5 w-5" />
                </Button>
              </div>

              {/* Weekly Day Cards */}
              <animated.div 
                {...bind()}
                ref={containerRef}
                className="grid grid-cols-7 gap-1 md:gap-1.5 touch-pan-y select-none"
                style={{ 
                  x,
                  cursor: 'grab',
                  touchAction: 'pan-y'
                }}
              >
                {weekDays.map((date, index) => {
                  const dayInfo = getDayInfo(date);
                  const isTodayDate = isToday(date);
                  const hasWorkouts = dayInfo !== null;
                  const isSelected = selectedDate && isSameDay(date, selectedDate);
                  
                  return (
                    <div key={index} className="relative">
                      <div 
                        className={`
                          weekly-day-card
                          ${hasWorkouts ? 'has-workouts' : 'no-workouts'}
                          ${isTodayDate ? 'is-today' : ''}
                          ${isSelected ? 'is-selected' : ''}
                        `}
                        onClick={() => handleDayClick(date)}
                      >
                        {/* Day Header */}
                        <div className="text-center">
                          <div className="weekly-day-label">
                            {format(date, 'EEE')}
                          </div>
                          <div className="weekly-day-number">
                            {format(date, 'd')}
                          </div>
                        </div>

                        {/* Workout Badge */}
                        {hasWorkouts ? (
                          <div className="flex flex-col items-center space-y-2 flex-1 justify-center">
                            {/* Category Badge */}
                            <div 
                              className="weekly-category-badge"
                              style={{ backgroundColor: dayInfo.dominantColor }}
                            >
                              <span>
                                {dayInfo.dominantCategory?.name || 'Mixed'}
                              </span>
                            </div>

                            {/* Activity Dots */}
                            <div className="flex justify-center gap-1">
                              {dayInfo.uniqueCategories.slice(0, 3).map((cat, i) => {
                                const opacity = 0.7 + (cat.count / dayInfo.totalLogs) * 0.3;
                                
                                return (
                                  <div
                                    key={i}
                                    className="weekly-activity-dot"
                                    style={{ 
                                      backgroundColor: cat.color,
                                      opacity: opacity
                                    }}
                                  />
                                );
                              })}
                              {dayInfo.uniqueCategories.length > 3 && (
                                <div className="text-xs text-muted-foreground">
                                  +{dayInfo.uniqueCategories.length - 3}
                                </div>
                              )}
                            </div>

                            {/* Workout Count */}
                            <div className="text-center">
                              <span className="weekly-workout-count">
                                {dayInfo.totalLogs} workout{dayInfo.totalLogs > 1 ? 's' : ''}
                              </span>
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center flex-1">
                            <div className="weekly-rest-indicator">
                              <div className="weekly-rest-dot" />
                            </div>
                            <span className="weekly-rest-text">Rest</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </animated.div>
            </div>
          </div>
        )}

        {/* Full Month View (Expanded) */}
        {exerciseLogs.length > 0 && showFullMonth && (
          <div className="relative">
            {/* Month Navigation */}
            <div className="monthly-calendar-container">
              <div className="monthly-calendar-header">
                <button
                  onClick={goToPreviousMonth}
                  className="monthly-nav-button"
                  aria-label="Previous month"
                  title="Previous month"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                
                <h2 className="monthly-calendar-title">
                  {format(currentMonth, 'MMMM yyyy')}
                </h2>
                
                <button
                  onClick={goToNextMonth}
                  className="monthly-nav-button"
                  aria-label="Next month"
                  title="Next month"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>

              {/* Calendar Grid */}
              <div className="space-y-4">
                {/* Weekday Headers */}
                <div className="monthly-weekday-header">
                  {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                    <div key={day} className="monthly-weekday-label">
                      {day}
                    </div>
                  ))}
                </div>

                {/* Calendar Days */}
                <div className="monthly-calendar-grid">
                  {allCalendarDays.map((date, index) => {
                    const isCurrentMonth = isSameMonth(date, currentMonth);
                    const isTodayDate = isToday(date);
                    const dayInfo = getDayInfo(date);
                    const hasWorkouts = dayInfo !== null;
                    
                    return (
                      <div
                        key={index}
                        className={`
                          monthly-day-card
                          ${isCurrentMonth ? 'current-month' : 'out-of-month'}
                          ${hasWorkouts ? 'has-workouts' : 'no-workouts'}
                          ${isTodayDate ? 'is-today' : ''}
                        `}
                      >
                        <span className="monthly-day-number">
                          {format(date, 'd')}
                        </span>
                        
                        {/* Activity Indicator */}
                        {hasWorkouts && isCurrentMonth && (
                          <div className="monthly-activity-indicator bg-primary" />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* List View - Always Visible Below */}
        {exerciseLogs.length > 0 && (
          <div className="space-y-8">
            {sortedDates.length === 0 && selectedDate && (
              <div className="text-center py-8">
                <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-foreground mb-2">No workouts on this day</h3>
                <p className="text-muted-foreground">Click the selected day again to view all workouts</p>
              </div>
            )}
            
            {sortedDates.map(date => {
              const dayLogs = logsByDate[date];
              const firstLogDate = new Date(dayLogs[0].timestamp);
              
              return (
                <div key={date} className="relative">
                  {/* Date Header */}
                  <div className="mb-4">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-primary" />
                      <h2 className="text-lg font-semibold text-foreground">
                        {format(firstLogDate, 'EEEE, MMMM d, yyyy')}
                      </h2>
                    </div>
                  </div>
                  
                  {/* Day's Workouts Container */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {dayLogs.map((log, index) => {
                      const exerciseName = getExerciseName(log.exerciseId);
                      const category = getCategoryForExercise(log.exerciseId);
                      const categoryIndex = categories.findIndex(cat => cat.id === category?.id);
                      const categoryColor = categoryIndex >= 0 ? getCategoryColor(categoryIndex) : '#10b981';
                      
                      return (
                        <div 
                          key={log.id}
                          className="group cursor-pointer"
                          onClick={() => handleExerciseClick(log.exerciseId)}
                        >
                          <ExerciseLogCard
                            log={log}
                            exerciseName={exerciseName}
                            categoryColor={categoryColor}
                            showExerciseName={true}
                            showDate={true}
                            onEdit={openEditDialog}
                            onDelete={handleDelete}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}

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
                  className="rounded-xl bg-primary active:bg-primary/90 text-primary-foreground shadow-lg transition-all duration-200 active:shadow-xl"
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
