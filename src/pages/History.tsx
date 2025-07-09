import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, isToday, subDays, isThisWeek, isThisMonth, parseISO } from 'date-fns';
import Layout from '@/components/Layout';
import ExerciseLogCard from '@/components/ExerciseLogCard';
import { Search, Calendar, Activity, Filter, X, TrendingUp, Clock, ChevronDown } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { useAppContext } from '@/context/useAppContext';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { getCategoryChartColors } from '@/utils/categoryColors';
import '@/styles/index.css';

const History = () => {
  const { exerciseLogs, exercises, categories, updateExerciseLog, deleteExerciseLog } = useAppContext();
  const { profile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  // State for filters and search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [timeFilter, setTimeFilter] = useState('all'); // all, week, month, 3months
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  const [showFilters, setShowFilters] = useState(false);
  
  // Edit dialog state
  const [editLog, setEditLog] = useState(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editForm, setEditForm] = useState({ weight: '', note: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get category colors
  const chartColors = getCategoryChartColors();
  const getCategoryColor = (categoryIndex: number) => {
    return chartColors[categoryIndex % chartColors.length];
  };

  // Helper functions
  const getExerciseName = (exerciseId: string) => {
    const exercise = exercises.find(e => e.id === exerciseId);
    return exercise?.name || 'Unknown Exercise';
  };

  const getCategoryForExercise = (exerciseId: string) => {
    const exercise = exercises.find(e => e.id === exerciseId);
    if (!exercise) return null;
    return categories.find(c => c.id === exercise.categoryId);
  };

  // Filter and search logic
  const filteredLogs = useMemo(() => {
    let filtered = [...exerciseLogs];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(log => {
        const exerciseName = getExerciseName(log.exerciseId).toLowerCase();
        const category = getCategoryForExercise(log.exerciseId);
        const categoryName = category?.name.toLowerCase() || '';
        const note = log.note?.toLowerCase() || '';
        
        return exerciseName.includes(query) || 
               categoryName.includes(query) || 
               note.includes(query);
      });
    }

    // Category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(log => {
        const category = getCategoryForExercise(log.exerciseId);
        return category?.id === selectedCategory;
      });
    }

    // Time filter
    if (timeFilter !== 'all') {
      const now = new Date();
      const cutoffDate = new Date();
      
      switch (timeFilter) {
        case 'week':
          cutoffDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          cutoffDate.setMonth(now.getMonth() - 1);
          break;
        case '3months':
          cutoffDate.setMonth(now.getMonth() - 3);
          break;
      }
      
      filtered = filtered.filter(log => {
        const logDate = new Date(log.timestamp);
        return logDate >= cutoffDate;
      });
    }

    // Sort
    filtered.sort((a, b) => {
      const dateA = new Date(a.timestamp);
      const dateB = new Date(b.timestamp);
      return sortOrder === 'newest' 
        ? dateB.getTime() - dateA.getTime()
        : dateA.getTime() - dateB.getTime();
    });

    return filtered;
  }, [exerciseLogs, searchQuery, selectedCategory, timeFilter, sortOrder, exercises, categories]);

  // Group logs by date
  const groupedLogs = useMemo(() => {
    const grouped = {};
    
    filteredLogs.forEach(log => {
      const dateKey = format(new Date(log.timestamp), 'yyyy-MM-dd');
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(log);
    });

    return grouped;
  }, [filteredLogs]);

  // Get sorted dates
  const sortedDates = useMemo(() => {
    return Object.keys(groupedLogs).sort((a, b) => {
      return sortOrder === 'newest' 
        ? new Date(b).getTime() - new Date(a).getTime()
        : new Date(a).getTime() - new Date(b).getTime();
    });
  }, [groupedLogs, sortOrder]);

  // Stats for the header
  const stats = useMemo(() => {
    const totalWorkouts = filteredLogs.length;
    const uniqueDays = new Set(filteredLogs.map(log => format(new Date(log.timestamp), 'yyyy-MM-dd'))).size;
    const recentWorkouts = filteredLogs.filter(log => {
      const logDate = new Date(log.timestamp);
      return logDate >= subDays(new Date(), 7);
    }).length;

    return { totalWorkouts, uniqueDays, recentWorkouts };
  }, [filteredLogs]);

  // Handle exercise click
  const handleExerciseClick = (exerciseId: string) => {
    navigate(`/exercise-detail?exercise=${exerciseId}`);
  };

  // Edit dialog handlers
  const openEditDialog = (log: any) => {
    setEditLog(log);
    setEditForm({ weight: log.weight.toString(), note: log.note || '' });
    setEditDialogOpen(true);
  };

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    if (name === 'weight') {
      if (value === '' || /^\d*\.?\d*$/.test(value)) {
        setEditForm({ ...editForm, [name]: value });
      }
    } else {
      setEditForm({ ...editForm, [name]: value });
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editLog) return;
    
    const weightValue = parseFloat(editForm.weight);
    if (!editForm.weight || isNaN(weightValue) || weightValue < 0) {
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
        description: 'Your exercise log has been updated successfully!',
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

  const handleDelete = async (logId: string) => {
    if (window.confirm('Are you sure you want to delete this log? This action cannot be undone.')) {
      try {
        await deleteExerciseLog(logId);
        toast({
          title: 'Log deleted',
          description: 'Your exercise log has been deleted successfully.',
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

  // Clear all filters
  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setTimeFilter('all');
    setSortOrder('newest');
  };

  const hasActiveFilters = searchQuery || selectedCategory !== 'all' || timeFilter !== 'all' || sortOrder !== 'newest';

  return (
    <Layout title="History">
      <div className="flex flex-col gap-6 pb-6">
        {/* Clean Header with Stats */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-md">
                <Clock className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground font-medium">
                  {stats.totalWorkouts} workout{stats.totalWorkouts !== 1 ? 's' : ''} • {stats.uniqueDays} day{stats.uniqueDays !== 1 ? 's' : ''} • {stats.recentWorkouts} this week
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className="rounded-xl flex items-center gap-2 h-9"
              >
                <Filter className="h-4 w-4" />
                Filter
                {hasActiveFilters && (
                  <div className="ml-1 h-2 w-2 bg-primary rounded-full" />
                )}
              </Button>
              
              {/* Quick stats badge */}
              {stats.totalWorkouts > 0 && (
                <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-muted/50 rounded-xl text-xs text-muted-foreground">
                  <TrendingUp className="h-3 w-3 text-emerald-500" />
                  <span className="font-medium">
                    {Math.round((stats.totalWorkouts / Math.max(stats.uniqueDays, 1)) * 10) / 10}/day
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Apple Health Style Search */}
          <div className="relative">
            <div className="apple-health-card p-0">
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                  <Search className="h-5 w-5 text-muted-foreground/60" />
                </div>
                <input
                  type="text"
                  placeholder="Search exercises, categories, or notes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-12 pl-12 pr-12 text-base bg-transparent border-0 rounded-xl
                           text-foreground placeholder:text-muted-foreground/60
                           transition-all duration-200 ease-out
                           focus:outline-none focus:ring-2 focus:ring-blue-500/30
                           md:text-sm"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-1.5 rounded-lg
                             text-muted-foreground/60 hover:text-muted-foreground hover:bg-muted/30
                             transition-all duration-200 ease-out"
                    aria-label="Clear search"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
              
              {/* Search Results Count */}
              {searchQuery.trim() && (
                <div className="mt-3 text-center">
                  <span className="text-xs text-muted-foreground px-3 py-1.5 bg-muted/40 rounded-full border border-border/30">
                    {filteredLogs.length === 0 ? (
                      <>No results for "{searchQuery}"</>
                    ) : (
                      <>
                        {filteredLogs.length} workout{filteredLogs.length !== 1 ? 's' : ''} found
                      </>
                    )}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Filters Panel */}
          {showFilters && (
            <Card>
              <CardContent className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Category Filter */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Category</Label>
                    <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                      <SelectTrigger className="rounded-xl">
                        <SelectValue placeholder="All categories" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        {categories.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Time Filter */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Time Period</Label>
                    <Select value={timeFilter} onValueChange={setTimeFilter}>
                      <SelectTrigger className="rounded-xl">
                        <SelectValue placeholder="All time" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Time</SelectItem>
                        <SelectItem value="week">Past Week</SelectItem>
                        <SelectItem value="month">Past Month</SelectItem>
                        <SelectItem value="3months">Past 3 Months</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Sort Order */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Sort By</Label>
                    <Select value={sortOrder} onValueChange={(value: 'newest' | 'oldest') => setSortOrder(value)}>
                      <SelectTrigger className="rounded-xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="newest">Newest First</SelectItem>
                        <SelectItem value="oldest">Oldest First</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Clear Filters */}
                {hasActiveFilters && (
                  <div className="mt-4 pt-4 border-t border-border/50">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearFilters}
                      className="rounded-xl flex items-center gap-2"
                    >
                      <X className="h-4 w-4" />
                      Clear All Filters
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Empty State */}
        {exerciseLogs.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <Activity className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">No Workout History</h3>
              <p className="text-muted-foreground">
                Start logging exercises to see your workout history here!
              </p>
            </CardContent>
          </Card>
        )}

        {/* No Results */}
        {exerciseLogs.length > 0 && filteredLogs.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <Search className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">No Results Found</h3>
              <p className="text-muted-foreground mb-4">
                Try adjusting your search or filters to find what you're looking for.
              </p>
              <Button
                variant="outline"
                onClick={clearFilters}
                className="rounded-xl"
              >
                Clear Filters
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Workout History */}
        {filteredLogs.length > 0 && (
          <div className="space-y-8">
            {sortedDates.map(dateKey => {
              const dayLogs = groupedLogs[dateKey];
              // Fix date parsing - use the first log's timestamp to avoid timezone issues
              const date = new Date(dayLogs[0].timestamp);
              const isToday = new Date().toDateString() === date.toDateString();
              const isThisWeekDate = isThisWeek(date);
              
              // Fixed category priority weights
              const categoryWeights = {
                'chest': 3,
                'back': 3,
                'legs': 3,
                'shoulders': 2,
                'arms': 1,
                'core': 0
              };

              // Get unique categories for this day
              const dayCategories = [...new Set(dayLogs.map(log => {
                const category = getCategoryForExercise(log.exerciseId);
                return category?.id;
              }).filter(Boolean))];

              // Sort categories by fixed weight (descending), then alphabetically
              const sortedCategories = dayCategories.sort((a, b) => {
                const categoryA = categories.find(cat => cat.id === a);
                const categoryB = categories.find(cat => cat.id === b);
                const weightA = categoryWeights[categoryA?.name?.toLowerCase()] || 0;
                const weightB = categoryWeights[categoryB?.name?.toLowerCase()] || 0;
                
                if (weightB !== weightA) return weightB - weightA; // Higher weight first
                const nameA = categoryA?.name || '';
                const nameB = categoryB?.name || '';
                return nameA.localeCompare(nameB); // Alphabetical as tiebreaker
              });

              // Create gradient colors for the badge (using sorted order)
              const categoryColors = sortedCategories.map(catId => {
                const categoryIndex = categories.findIndex(cat => cat.id === catId);
                return categoryIndex >= 0 ? getCategoryColor(categoryIndex) : '#10b981';
              });

              // Get category names for badge text (prioritized by fixed weights)
              const categoryNames = sortedCategories.map(catId => 
                categories.find(cat => cat.id === catId)?.name
              ).filter(Boolean);
              
              // Create display text with +X after 3 categories
              const badgeText = categoryNames.length > 3 
                ? `${categoryNames.slice(0, 3).join('/')}+${categoryNames.length - 3}`
                : categoryNames.join('/');

              // Create gradient string
              const gradientBackground = categoryColors.length > 1 
                ? `linear-gradient(45deg, ${categoryColors.join(', ')})`
                : categoryColors[0] || 'transparent';
              
              return (
                <div key={dateKey} className="space-y-4">
                  {/* Date Header with category hint */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-semibold text-foreground">
                        {isToday ? 'Today' : isThisWeekDate ? format(date, 'EEEE') : format(date, 'EEEE, MMM d, yyyy')}
                      </h2>
                    </div>
                    <div 
                      className="px-3 py-1 rounded-full text-xs font-medium text-white shadow-sm"
                      // eslint-disable-next-line react/forbid-dom-props
                      style={{ background: gradientBackground }}
                      title={`${dayLogs.length} workout${dayLogs.length !== 1 ? 's' : ''} • Categories: ${categoryNames.join(', ')}`}
                    >
                      {badgeText}
                    </div>
                  </div>

                  {/* Workout Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {dayLogs.map(log => {
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
                            showDate={false}
                            showTime={true}
                            onEdit={() => openEditDialog(log)}
                            onDelete={() => handleDelete(log.id)}
                          />
                        </div>
                      );
                    })}
                  </div>

                  {/* Workout Count at Bottom */}
                  <div className="text-center">
                    <div className="text-xs text-muted-foreground">
                      {dayLogs.length} workout{dayLogs.length !== 1 ? 's' : ''}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Edit Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <form onSubmit={handleEditSubmit}>
              <DialogHeader>
                <DialogTitle>Edit Exercise Log</DialogTitle>
                <DialogDescription>
                  Update the weight or note for this workout entry.
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="weight">Weight (lbs)</Label>
                  <Input
                    id="weight"
                    name="weight"
                    type="number"
                    step="0.5"
                    min="0"
                    value={editForm.weight}
                    onChange={handleEditChange}
                    className="rounded-xl"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="note">Note (optional)</Label>
                  <Textarea
                    id="note"
                    name="note"
                    value={editForm.note}
                    onChange={handleEditChange}
                    placeholder="Add a note about this workout..."
                    rows={3}
                    className="rounded-xl resize-none"
                  />
                </div>
                
                {editLog && (
                  <div className="space-y-2">
                    <Label>Date & Time</Label>
                    <div className="text-sm text-muted-foreground p-3 bg-muted/50 rounded-xl">
                      {format(new Date(editLog.timestamp), 'EEEE, MMMM d, yyyy \'at\' h:mm a')}
                    </div>
                  </div>
                )}
              </div>
              
              <DialogFooter>
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
                  className="rounded-xl"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Updating...' : 'Update Log'}
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
