import React, { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { useAppContext } from '@/context/AppContext';
import { LeaderboardType } from '@/types';
import { getLeaderboard } from '@/utils/progressUtils';
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
  
  const [leaderboardType, setLeaderboardType] = useState<LeaderboardType>(LeaderboardType.MAX_WEIGHT);
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
  
  // Get leaderboard data
  const leaderboardData = getLeaderboard(
    allExerciseLogs,
    users,
    leaderboardType,
    selectedExerciseId === 'all' ? undefined : selectedExerciseId,
    selectedCategoryId === 'all' ? undefined : selectedCategoryId
  );
  
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
      case LeaderboardType.MAX_WEIGHT:
        return selectedExerciseId === 'all' 
          ? 'Personal Records' 
          : `${exerciseName} - Personal Records`;
      case LeaderboardType.ALLTIME_GAIN:
        return selectedExerciseId === 'all'
          ? 'All-Time Gains' 
          : `${exerciseName} - All-Time Gains`;
      case LeaderboardType.RECENT_GAIN:
        return selectedExerciseId === 'all'
          ? 'Recent Gains (30 days)' 
          : `${exerciseName} - Recent Gains`;
      default:
        return 'Leaderboard';
    }
  };

  // Get icon for leaderboard type
  const getLeaderboardIcon = () => {
    switch(leaderboardType) {
      case LeaderboardType.MAX_WEIGHT:
        return <Trophy className="h-5 w-5 text-yellow-500" />;
      case LeaderboardType.ALLTIME_GAIN:
        return <TrendingUp className="h-5 w-5 text-green-500" />;
      case LeaderboardType.RECENT_GAIN:
        return <Zap className="h-5 w-5 text-blue-500" />;
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
    
    return (
      <div 
        key={entry.userId || index}
        className={`group relative p-4 border border-border rounded-2xl transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 ${
          isCurrentUser ? 'bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border-green-200 dark:border-green-800' : 'bg-card hover:bg-muted/50'
        }`}
      >
        <div className="flex items-center gap-4">
          {/* Position Badge */}
          <div className="flex-shrink-0">
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
              {leaderboardType === LeaderboardType.MAX_WEIGHT
                ? `${entry.value.toFixed(1)} lbs`
                : `${entry.value.toFixed(1)}%`
              }
            </div>
            {leaderboardType !== LeaderboardType.MAX_WEIGHT && (
              <div className="text-xs text-muted-foreground">
                ({entry.value.toFixed(1)} lbs gain)
              </div>
            )}
          </div>
        </div>

        {/* Subtle hover effect */}
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-transparent via-white/5 to-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
      </div>
    );
  };

  return (
    <Layout title="Leaderboard">
      <div className="space-y-6">
        {/* Header Section */}
        <div className="space-y-4">
          {/* Leaderboard Type Selector */}
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            <Button
              variant={leaderboardType === LeaderboardType.MAX_WEIGHT ? "default" : "outline"}
              size="sm"
              onClick={() => setLeaderboardType(LeaderboardType.MAX_WEIGHT)}
              className="rounded-2xl px-4 py-2 font-medium whitespace-nowrap transition-all duration-300"
            >
              <Trophy className="h-4 w-4 mr-2" />
              PR Leaders
            </Button>
            <Button
              variant={leaderboardType === LeaderboardType.ALLTIME_GAIN ? "default" : "outline"}
              size="sm"
              onClick={() => setLeaderboardType(LeaderboardType.ALLTIME_GAIN)}
              className="rounded-2xl px-4 py-2 font-medium whitespace-nowrap transition-all duration-300"
            >
              <TrendingUp className="h-4 w-4 mr-2" />
              All-Time
            </Button>
            <Button
              variant={leaderboardType === LeaderboardType.RECENT_GAIN ? "default" : "outline"}
              size="sm"
              onClick={() => setLeaderboardType(LeaderboardType.RECENT_GAIN)}
              className="rounded-2xl px-4 py-2 font-medium whitespace-nowrap transition-all duration-300"
            >
              <Zap className="h-4 w-4 mr-2" />
              Recent
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
            
            <Select value={selectedExerciseId} onValueChange={setSelectedExerciseId}>
              <SelectTrigger className="rounded-2xl border-border">
                <SelectValue placeholder="All Exercises" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Exercises</SelectItem>
                {filteredExercises.map(exercise => (
                  <SelectItem key={exercise.id} value={exercise.id}>
                    {exercise.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Main Leaderboard */}
        <Card className="rounded-2xl border-border shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-3 text-xl">
              {getLeaderboardIcon()}
              {getLeaderboardTitle()}
            </CardTitle>
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
              <div className="space-y-3">
                {leaderboardData.map((entry, index) => (
                  <div 
                    key={entry.userId || index}
                    className="animate-in slide-in-from-bottom-4 duration-300"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    {renderLeaderboardEntry(entry, index)}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <div className="relative mb-6">
                  <div className="absolute inset-0 bg-gradient-to-r from-muted via-muted/50 to-muted rounded-full blur-2xl"></div>
                  <Target className="relative w-20 h-20 text-muted-foreground mx-auto" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-3">No Results Found</h3>
                <p className="text-muted-foreground max-w-sm mx-auto leading-relaxed">
                  {leaderboardType === LeaderboardType.MAX_WEIGHT && selectedExerciseId === 'all'
                    ? "Select an exercise above to view personal record leaders and start competing!"
                    : "No data available for this selection. Try adjusting your filters or check back later as more users log their workouts."
                  }
                </p>
                {leaderboardType === LeaderboardType.MAX_WEIGHT && selectedExerciseId === 'all' && (
                  <div className="mt-6">
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="rounded-2xl"
                      onClick={() => {
                        if (filteredExercises.length > 0) {
                          setSelectedExerciseId(filteredExercises[0].id);
                        }
                      }}
                    >
                      View {filteredExercises[0]?.name || 'Exercise'} Leaders
                    </Button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Leaderboard;
