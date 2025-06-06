import React, { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { useAppContext } from '@/context/AppContext';
import { LeaderboardType } from '@/types';
import { getLeaderboard, calculatePRChampionshipSummary } from '@/utils/progressUtils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Trophy, TrendingUp, Crown, Medal, Zap, Target, Award } from 'lucide-react';
import { getCategoryColors, getCategoryKeyByName, getCategoryChartColors } from '@/utils/categoryColors';
import '@/components/ui/category-styles.css';

// Custom CSS for scrollbar hiding consistency
const scrollbarHideStyle = `
  .scrollbar-hide {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
  .scrollbar-hide::-webkit-scrollbar {
    display: none;
  }
`;

// Inject styles if not already present
if (typeof document !== 'undefined' && !document.getElementById('leaderboard-styles')) {
  const style = document.createElement('style');
  style.id = 'leaderboard-styles';
  style.textContent = scrollbarHideStyle;
  document.head.appendChild(style);
}

const Leaderboard: React.FC = () => {
  const { profile } = useAuth();
  const { categories, exercises, exerciseLogs } = useAppContext();
  
  const [leaderboardType, setLeaderboardType] = useState<LeaderboardType>(LeaderboardType.EXERCISE_PR);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all');
  const [selectedExerciseId, setSelectedExerciseId] = useState<string>('all');
  const [users, setUsers] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [allExerciseLogs, setAllExerciseLogs] = useState<any[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(true);

  // Get chart colors for consistent theming
  const chartColors = getCategoryChartColors();
  const getCategoryColor = (categoryIndex: number) => {
    return chartColors[categoryIndex % chartColors.length];
  };

  // Fetch all users (profiles) on mount
  useEffect(() => {
    const fetchUsers = async () => {
      setLoadingUsers(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('id, name, username, avatar_url');
      if (!error && data) {
        setUsers(data.map((u: any) => ({
          id: u.id,
          name: u.name,
          username: u.username,
          avatarUrl: u.avatar_url
        })));
      }
      setLoadingUsers(false);
    };
    fetchUsers();
  }, []);

  // Fetch all exercise logs for leaderboard
  useEffect(() => {
    const fetchLogs = async () => {
      setLoadingLogs(true);
      const { data, error } = await supabase
        .from('exercise_logs')
        .select('*');
      if (!error && data) {
        setAllExerciseLogs(data.map((log: any) => ({
          id: log.id,
          userId: log.user_id,
          exerciseId: log.exercise_id,
          weight: log.weight,
          timestamp: log.timestamp,
          note: log.note,
          weightUnit: log.weight_unit
        })));
      }
      setLoadingLogs(false);
    };
    fetchLogs();
  }, []);

  // Get filtered exercises based on selected category
  const filteredExercises = selectedCategoryId === 'all'
    ? exercises
    : exercises.filter(e => e.categoryId === selectedCategoryId);
  
  // Get exercises that have multiple users (for PR leaderboard)
  const getMultiUserExercises = () => {
    const exerciseUserCounts = new Map<string, Set<string>>();
    allExerciseLogs.forEach(log => {
      if (!exerciseUserCounts.has(log.exerciseId)) {
        exerciseUserCounts.set(log.exerciseId, new Set());
      }
      exerciseUserCounts.get(log.exerciseId)!.add(log.userId);
    });
    
    return filteredExercises.filter(exercise => {
      const userSet = exerciseUserCounts.get(exercise.id);
      return userSet && userSet.size > 1;
    });
  };

  // Get leaderboard data
  const leaderboardData = getLeaderboard(
    allExerciseLogs,
    users,
    leaderboardType,
    selectedExerciseId === 'all' ? undefined : selectedExerciseId,
    selectedCategoryId === 'all' ? undefined : selectedCategoryId
  );

  // Get PR championship summary for overview mode
  const prChampionshipSummary = (leaderboardType === LeaderboardType.EXERCISE_PR && selectedExerciseId === 'all') 
    ? calculatePRChampionshipSummary(allExerciseLogs, users)
    : null;

  // Handle category change
  const handleCategoryChange = (value: string) => {
    setSelectedCategoryId(value);
    
    // If we have an exercise selected but it's not in the new category, clear it
    if (selectedExerciseId !== 'all') {
      const exercise = exercises.find(e => e.id === selectedExerciseId);
      if (exercise && exercise.categoryId !== value && value !== 'all') {
        setSelectedExerciseId('all');
      }
    }
  };

  // Get the title for the current leaderboard
  const getLeaderboardTitle = () => {
    const exerciseName = selectedExerciseId !== 'all' 
      ? exercises.find(e => e.id === selectedExerciseId)?.name
      : 'All Exercises';
      
    switch(leaderboardType) {
      case LeaderboardType.OVERALL_PROGRESS:
        return 'Overall Progress Leaders';
      case LeaderboardType.RECENT_ACHIEVERS:
        return 'Recent Achievers (30 days)';
      case LeaderboardType.EXERCISE_PR:
        return selectedExerciseId === 'all' 
          ? 'Exercise PR Champions' 
          : `${exerciseName} - Personal Records`;
      case LeaderboardType.CONSISTENCY:
        return 'Most Consistent Members';
      default:
        return 'Leaderboard';
    }
  };

  // Get description for the current leaderboard
  const getLeaderboardDescription = () => {
    switch(leaderboardType) {
      case LeaderboardType.OVERALL_PROGRESS:
        return 'Average percentage gain across all exercises';
      case LeaderboardType.RECENT_ACHIEVERS:
        return 'Highest recent achievements in the last 30 days';
      case LeaderboardType.EXERCISE_PR:
        return selectedExerciseId === 'all' 
          ? 'Top personal record holder for each exercise with multiple participants'
          : 'Highest personal records for selected exercise';
      case LeaderboardType.CONSISTENCY:
        return 'Workout frequency percentage over time';
      default:
        return '';
    }
  };

  // Get icon for leaderboard type
  const getLeaderboardIcon = () => {
    switch(leaderboardType) {
      case LeaderboardType.OVERALL_PROGRESS:
        return <TrendingUp className="h-5 w-5 text-green-500" />;
      case LeaderboardType.RECENT_ACHIEVERS:
        return <Zap className="h-5 w-5 text-blue-500" />;
      case LeaderboardType.EXERCISE_PR:
        return <Trophy className="h-5 w-5 text-yellow-500" />;
      case LeaderboardType.CONSISTENCY:
        return <Target className="h-5 w-5 text-orange-500" />;
      default:
        return <Award className="h-5 w-5" />;
    }
  };

  // Render position badge with appropriate styling
  const renderPositionBadge = (position: number) => {
    if (position === 1) {
      return (
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center shadow-md">
          <Crown className="h-4 w-4 text-yellow-900" />
        </div>
      );
    } else if (position === 2) {
      return (
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-300 to-gray-500 flex items-center justify-center shadow-md">
          <Medal className="h-4 w-4 text-gray-700" />
        </div>
      );
    } else if (position === 3) {
      return (
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-600 to-amber-800 flex items-center justify-center shadow-md">
          <Award className="h-4 w-4 text-amber-100" />
        </div>
      );
    } else {
      return (
        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground font-bold text-sm">
          {position}
        </div>
      );
    }
  };

  // Render individual leaderboard entry
  const renderLeaderboardEntry = (entry: any, index: number) => {
    const position = index + 1;
    const user = entry.user || { name: 'Unknown', avatarUrl: undefined };
    const isCurrentUser = user.id === profile?.id;
    const isOverviewMode = leaderboardType === LeaderboardType.EXERCISE_PR && selectedExerciseId === 'all';
    
    // Get exercise name and category for PR overview mode
    const exercise = (isOverviewMode && entry.exerciseId) 
      ? exercises.find(e => e.id === entry.exerciseId)
      : null;
    const exerciseName = exercise?.name;
    const exerciseCategory = exercise?.categoryId ? categories.find(c => c.id === exercise.categoryId) : null;
    
    // Get category color for exercise
    const categoryIndex = exerciseCategory ? categories.findIndex(c => c.id === exerciseCategory.id) : 0;
    const categoryColor = getCategoryColor(categoryIndex);
    
    // Render exercise badge for overview mode
    const renderExerciseBadge = () => {
      if (!isOverviewMode || !exerciseName) {
        return renderPositionBadge(position);
      }
      
      // Show colored exercise badge with trophy
      return (
        <div className="relative">
          <div className="pr-exercise-badge">
            <Trophy className="h-5 w-5 pr-exercise-badge-icon" />
          </div>
          {entry.isTie && (
            <div className="pr-tie-badge">
              <span className="text-xs text-white font-bold">T</span>
            </div>
          )}
        </div>
      );
    };
    
    if (isOverviewMode) {
      // Clean PR overview mode - mobile-friendly design
      const tiedUsers = entry.users || [user];
      const showMultipleAvatars = tiedUsers.length > 1;
      
      // Get category key for proper color mapping
      const categoryKey = exerciseCategory ? getCategoryKeyByName(exerciseCategory.name) : 'arms';
      
      return (
        <div 
          key={entry.exerciseId || index}
          className="pr-overview-entry-clean bg-card hover:bg-muted/50"
        >
          {/* Exercise Name at the Top */}
          <div className="mb-3">
            <div className="flex items-center gap-3 mb-1">
              <h3 className="font-bold text-lg text-foreground flex-1">
                {exerciseName}
              </h3>
              {entry.isTie && (
                <span className="pr-tie-indicator">Tie</span>
              )}
            </div>
            {exerciseCategory && (
              <div>
                <span className={`pr-category-badge-${categoryKey}`}>
                  {exerciseCategory.name}
                </span>
              </div>
            )}
          </div>
          
          {/* User Info and PR Value */}
          <div className="flex items-center justify-between">
            {/* User Avatars */}
            <div className="flex items-center">
              {showMultipleAvatars ? (
                <div className="pr-avatars-overlap-clean">
                  {tiedUsers.map((tiedUser, idx) => (
                    <Avatar key={tiedUser.id} className="pr-avatar-clean h-8 w-8">
                      <AvatarImage src={tiedUser.avatarUrl} alt={tiedUser.name} />
                      <AvatarFallback className="bg-gray-100 text-gray-700 text-sm font-medium">
                        {tiedUser.name?.substring(0, 2).toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                  ))}
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8 border-2 border-white shadow-sm">
                    <AvatarImage src={user.avatarUrl} alt={user.name} />
                    <AvatarFallback className="bg-gray-100 text-gray-700 text-sm font-medium">
                      {user.name?.substring(0, 2).toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <span className="font-semibold text-foreground">
                    {user.name}
                  </span>
                </div>
              )}
            </div>

            {/* PR Value */}
            <div className="text-right">
              <div className="font-bold text-xl text-foreground">
                {entry.value.toFixed(1)}
                <span className="text-sm font-medium text-muted-foreground ml-1">lbs</span>
              </div>
              <div className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                Personal Record
              </div>
            </div>
          </div>
        </div>
      );
    }
    
    // Regular leaderboard entry styling
    return (
      <div 
        key={entry.userId || index}
        className={`group relative p-4 border border-border rounded-2xl transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 ${
          isCurrentUser ? 'bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border-green-200 dark:border-green-800' : 'bg-card hover:bg-muted/50'
        }`}
      >
        <div className="flex items-center gap-4">
          {/* Position Badge */}
          <div className="flex-shrink-0 relative">
            {renderPositionBadge(position)}
          </div>

          {/* User Info */}
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <Avatar className="h-10 w-10">
              <AvatarImage src={user.avatarUrl} alt={user.name} />
              <AvatarFallback className="bg-muted text-muted-foreground">
                {user.name?.substring(0, 2).toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-foreground truncate">
                  {user.name}
                </h3>
                {isCurrentUser && (
                  <span className="text-xs bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 px-2 py-0.5 rounded-full font-medium">
                    You
                  </span>
                )}
              </div>
              {user.username && (
                <p className="text-sm text-muted-foreground truncate">@{user.username}</p>
              )}
            </div>
          </div>

          {/* Value */}
          <div className="text-right flex-shrink-0">
            <div className="font-bold text-lg text-foreground">
              {leaderboardType === LeaderboardType.EXERCISE_PR
                ? `${entry.value.toFixed(1)} lbs`
                : leaderboardType === LeaderboardType.RECENT_ACHIEVERS
                ? `${entry.value.toFixed(1)} lbs`
                : leaderboardType === LeaderboardType.CONSISTENCY
                ? `${entry.value.toFixed(1)}%`
                : `${entry.value.toFixed(1)}%`
              }
            </div>
            {leaderboardType === LeaderboardType.OVERALL_PROGRESS && (
              <div className="text-xs text-muted-foreground">
                avg gain
              </div>
            )}
            {leaderboardType === LeaderboardType.RECENT_ACHIEVERS && (
              <div className="text-xs text-muted-foreground">
                recent best
              </div>
            )}
            {leaderboardType === LeaderboardType.CONSISTENCY && (
              <div className="text-xs text-muted-foreground">
                workout rate
              </div>
            )}
            {leaderboardType === LeaderboardType.EXERCISE_PR && (
              <div className="text-xs text-muted-foreground">
                exercise PR
              </div>
            )}
          </div>
        </div>

        {/* Subtle hover effect */}
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-transparent via-white/5 to-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
      </div>
    );
  };

  // Determine if we are in PR Overview mode (used for keying and logic)
  const isOverviewMode = leaderboardType === LeaderboardType.EXERCISE_PR && selectedExerciseId === 'all';

  return (
    <Layout title="Leaderboard">
      <div className="space-y-6">
        {/* Header Section */}
        <div className="space-y-4">
          {/* Leaderboard Type Selector */}
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            <Button
              variant={leaderboardType === LeaderboardType.EXERCISE_PR ? "default" : "outline"}
              size="sm"
              onClick={() => setLeaderboardType(LeaderboardType.EXERCISE_PR)}
              className="rounded-2xl px-4 py-2 font-medium whitespace-nowrap transition-all duration-300"
            >
              <Trophy className="h-4 w-4 mr-2" />
              PRs
            </Button>
            <Button
              variant={leaderboardType === LeaderboardType.OVERALL_PROGRESS ? "default" : "outline"}
              size="sm"
              onClick={() => setLeaderboardType(LeaderboardType.OVERALL_PROGRESS)}
              className="rounded-2xl px-4 py-2 font-medium whitespace-nowrap transition-all duration-300"
            >
              <TrendingUp className="h-4 w-4 mr-2" />
              Overall
            </Button>
            <Button
              variant={leaderboardType === LeaderboardType.RECENT_ACHIEVERS ? "default" : "outline"}
              size="sm"
              onClick={() => setLeaderboardType(LeaderboardType.RECENT_ACHIEVERS)}
              className="rounded-2xl px-4 py-2 font-medium whitespace-nowrap transition-all duration-300"
            >
              <Zap className="h-4 w-4 mr-2" />
              Recent
            </Button>
            <Button
              variant={leaderboardType === LeaderboardType.CONSISTENCY ? "default" : "outline"}
              size="sm"
              onClick={() => setLeaderboardType(LeaderboardType.CONSISTENCY)}
              className="rounded-2xl px-4 py-2 font-medium whitespace-nowrap transition-all duration-300"
            >
              <Target className="h-4 w-4 mr-2" />
              Consistency
            </Button>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-2 gap-3">
            <Select value={selectedCategoryId} onValueChange={handleCategoryChange}>
              <SelectTrigger className="rounded-2xl border-border">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map(category => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {/* Only show exercise filter for Exercise PR leaderboard */}
            {leaderboardType === LeaderboardType.EXERCISE_PR ? (
              <Select value={selectedExerciseId} onValueChange={setSelectedExerciseId}>
                <SelectTrigger className="rounded-2xl border-border">
                  <SelectValue placeholder="All Exercises" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Exercises</SelectItem>
                  {getMultiUserExercises().map(exercise => (
                    <SelectItem key={exercise.id} value={exercise.id}>
                      {exercise.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <div className="flex items-center justify-center rounded-2xl border border-dashed border-border text-muted-foreground text-sm">
                No exercise filter needed
              </div>
            )}
          </div>
        </div>

        {/* Main Leaderboard */}
        <Card className="rounded-2xl border-border shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-3 text-xl">
              {getLeaderboardIcon()}
              {getLeaderboardTitle()}
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-2">
              {getLeaderboardDescription()}
            </p>
          </CardHeader>
          <CardContent className="p-6 pt-0">
            {loadingUsers || loadingLogs ? (
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className="flex items-center gap-4 p-4 border border-border rounded-2xl animate-pulse">
                    <div className="w-8 h-8 bg-muted rounded-full flex-shrink-0" />
                    <div className="w-10 h-10 bg-muted rounded-full flex-shrink-0" />
                    <div className="flex-1 space-y-2 min-w-0">
                      <div className="h-4 bg-muted rounded-full w-1/3" />
                      <div className="h-3 bg-muted rounded-full w-1/4" />
                    </div>
                    <div className="h-6 bg-muted rounded-full w-20 flex-shrink-0" />
                  </div>
                ))}
              </div>
            ) : leaderboardData.length > 0 ? (
              <div className="space-y-4">
                {/* PR Championship Summary Card (only in overview mode) */}
                {prChampionshipSummary && prChampionshipSummary.champion && (
                  <div className="bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20 border border-yellow-200 dark:border-yellow-800 rounded-2xl p-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center shadow-lg">
                        <Crown className="h-6 w-6 text-yellow-900" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                          Overall PR Champion
                          <span className="text-xs bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300 px-2 py-1 rounded-full font-medium">
                            {prChampionshipSummary.championCount} PRs
                          </span>
                        </h3>
                        <div className="flex items-center gap-3 mt-1">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={prChampionshipSummary.champion.avatarUrl} alt={prChampionshipSummary.champion.name} />
                            <AvatarFallback className="bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300 text-sm">
                              {prChampionshipSummary.champion.name?.substring(0, 2).toUpperCase() || 'U'}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-semibold text-foreground">{prChampionshipSummary.champion.name}</span>
                          <span className="text-sm text-muted-foreground">
                            holds {prChampionshipSummary.championCount} of {prChampionshipSummary.totalExercises} exercise records
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Leaderboard Entries */}
                <div className="space-y-3">
                  {leaderboardData.map((entry, index) => (
                    <div 
                      key={isOverviewMode 
                        ? `exercise-${entry.exerciseId || index}` 
                        : `user-${entry.userId || index}`}
                      className="animate-in slide-in-from-bottom-4 duration-300"
                    >
                      {renderLeaderboardEntry(entry, index)}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-16">
                <div className="relative mb-6">
                  <div className="absolute inset-0 bg-gradient-to-r from-muted via-muted/50 to-muted rounded-full blur-2xl"></div>
                  <Target className="relative w-20 h-20 text-muted-foreground mx-auto" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-3">No Results Found</h3>
                <p className="text-muted-foreground max-w-sm mx-auto leading-relaxed">
                  No data available for this selection. Try adjusting your filters or check back later as more users log their workouts.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Leaderboard;
