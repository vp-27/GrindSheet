import React, { useState, useEffect } from 'react';
import { useAppContext } from '@/context/useAppContext';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { 
  Trophy, 
  Crown, 
  Medal,
  Star,
  Target,
  Users,
  Flame,
  Zap
} from 'lucide-react';
import { LeaderboardType } from '@/types';
import { 
  getLeaderboard, 
  calculatePRChampionshipSummary
} from '@/utils/progressUtils';
import { getCategoryChartColors, getCategoryKeyByName, getCategoryColors } from '@/utils/categoryColors';
import { supabase } from '@/integrations/supabase/client';

const PRRecordsPage: React.FC = () => {
  const { profile } = useAuth();
  const { categories, exercises } = useAppContext();
  
  const [users, setUsers] = useState<any[]>([]);
  const [allExerciseLogs, setAllExerciseLogs] = useState<any[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all');
  const [contentReady, setContentReady] = useState(false);
  const [prLeaderboard, setPrLeaderboard] = useState<any[]>([]);
  const [prChampionship, setPrChampionship] = useState<any>({
    champion: null,
    championCount: 0,
    totalExercises: 0,
    summary: []
  });

  // Fetch data on mount
  useEffect(() => {
    const fetchData = async () => {
      // Fetch users
      const { data: usersData, error: usersError } = await supabase
        .from('profiles')
        .select('id, name, username, avatar_url');
      
      if (!usersError && usersData) {
        setUsers(usersData.map((u: any) => ({
          id: u.id,
          name: u.name,
          username: u.username,
          avatarUrl: u.avatar_url
        })));
      }

      // Fetch all exercise logs
      const { data: logsData, error: logsError } = await supabase
        .from('exercise_logs')
        .select('*');
      
      if (!logsError && logsData) {
        const formattedLogs = logsData.map((log: any) => ({
          id: log.id,
          userId: log.user_id,
          exerciseId: log.exercise_id,
          weight: log.weight,
          timestamp: log.timestamp,
          note: log.note,
          weightUnit: log.weight_unit
        }));
        setAllExerciseLogs(formattedLogs);
      }
      
      // Small delay to allow smooth entrance animation
      setTimeout(() => setContentReady(true), 50);
    };

    fetchData();
  }, []);

  // Update PR data when dependencies change
  useEffect(() => {
    if (users.length > 0 && allExerciseLogs.length > 0 && exercises.length > 0 && categories.length > 0) {
      const categoryId = selectedCategoryId === 'all' ? undefined : selectedCategoryId;
      
      // Get PR leaderboard
      const leaderboard = getLeaderboard(
        allExerciseLogs,
        users,
        LeaderboardType.EXERCISE_PR,
        undefined, // exerciseId
        categoryId,
        exercises
      );
      setPrLeaderboard(leaderboard);
      
      // Get PR championship summary
      const championship = calculatePRChampionshipSummary(
        allExerciseLogs,
        users,
        exercises,
        categoryId
      );
      setPrChampionship(championship);
    }
  }, [users, allExerciseLogs, exercises, categories, selectedCategoryId]);

  // Get exercise name by ID
  const getExerciseName = (exerciseId: string) => {
    const exercise = exercises.find(ex => ex.id === exerciseId);
    return exercise?.name || 'Unknown Exercise';
  };

  // Get category name by ID
  const getCategoryName = (categoryId: string) => {
    const category = categories.find(cat => cat.id === categoryId);
    return category?.name || 'Unknown Category';
  };

  // Get exercise category
  const getExerciseCategory = (exerciseId: string) => {
    const exercise = exercises.find(ex => ex.id === exerciseId);
    if (!exercise) return null;
    return categories.find(cat => cat.id === exercise.categoryId);
  };

  // Render PR champion summary card
  const renderPRChampionSummary = () => {
    if (!prChampionship.champion && prChampionship.summary.length === 0) {
      return (
        <Card className="mb-6">
          <CardContent className="p-6 text-center">
            <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-muted-foreground mb-2">No PR Records Yet</h3>
            <p className="text-sm text-muted-foreground">
              {selectedCategoryId === 'all' 
                ? 'Start logging workouts to see PR champions!'
                : `No PR records in ${getCategoryName(selectedCategoryId)} category yet.`
              }
            </p>
          </CardContent>
        </Card>
      );
    }

    return (
      <Card className="mb-6 pr-overview-entry regular bg-gradient-to-br from-amber-50/80 to-yellow-50/80 dark:from-amber-950/30 dark:to-yellow-950/30 border-amber-200/50 dark:border-amber-800/50">
        <CardContent className="p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center shadow-md">
              <Crown className="h-6 w-6 text-yellow-900" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-amber-800 dark:text-amber-200">
                PR Champion{prChampionship.champion ? `: ${prChampionship.champion.name}` : 'ship'}
              </h3>
              <p className="text-sm text-amber-700 dark:text-amber-300">
                {prChampionship.champion 
                  ? `${prChampionship.championCount} PR${prChampionship.championCount !== 1 ? 's' : ''} out of ${prChampionship.totalExercises} exercises`
                  : `${prChampionship.totalExercises} exercises tracked`
                }
              </p>
            </div>
          </div>
          
          {prChampionship.summary.length > 0 && (
            <div className="space-y-2">
              {prChampionship.summary.slice(0, 3).map((item, index) => (
                <div key={item.user.id} className="flex items-center gap-3 p-2 rounded-lg bg-amber-100/50 dark:bg-amber-900/20">
                  <div className="flex items-center gap-2">
                    {index === 0 && <Crown className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />}
                    {index === 1 && <Medal className="h-4 w-4 text-gray-500" />}
                    {index === 2 && <Trophy className="h-4 w-4 text-amber-600" />}
                    {index > 2 && <span className="w-4 h-4 flex items-center justify-center text-xs font-bold text-muted-foreground">#{index + 1}</span>}
                  </div>
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={item.user.avatarUrl} alt={item.user.name} />
                    <AvatarFallback>{item.user.name.charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="font-medium text-sm text-amber-800 dark:text-amber-200">{item.user.name}</div>
                  </div>
                  <Badge variant="secondary" className="bg-amber-200/80 dark:bg-amber-800/50 text-amber-800 dark:text-amber-200">
                    {item.prCount} PR{item.prCount !== 1 ? 's' : ''}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  // Render individual PR entry
  const renderPREntry = (entry: any, index: number) => {
    const exerciseName = getExerciseName(entry.exerciseId!);
    const category = getExerciseCategory(entry.exerciseId!);
    const isCurrentUser = entry.userId === profile?.id;
    const isTie = entry.isTie;
    
    return (
      <Card 
        key={`${entry.exerciseId}-${entry.userId}`}
        className={`pr-overview-entry transition-all duration-300 ${
          isCurrentUser 
            ? 'regular bg-gradient-to-br from-blue-50/80 to-indigo-50/80 dark:from-blue-950/30 dark:to-indigo-950/30 border-blue-200/50 dark:border-blue-800/50' 
            : 'regular'
        }`}
      >
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            {/* Position Indicator */}
            <div className="flex items-center gap-2">
              {index === 0 && (
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center shadow-md">
                  <Crown className="h-4 w-4 text-yellow-900" />
                </div>
              )}
              {index === 1 && (
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-300 to-gray-500 flex items-center justify-center shadow-md">
                  <Medal className="h-4 w-4 text-gray-700" />
                </div>
              )}
              {index === 2 && (
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-600 to-amber-800 flex items-center justify-center shadow-md">
                  <Trophy className="h-4 w-4 text-amber-100" />
                </div>
              )}
              {index > 2 && (
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground font-bold text-sm">
                  {index + 1}
                </div>
              )}
            </div>

            {/* User Info */}
            <div className="flex items-center gap-3 flex-1">
              {isTie && entry.users ? (
                // Render multiple avatars for ties
                <div className="flex -space-x-2">
                  {entry.users.slice(0, 3).map((user: any, userIndex: number) => (
                    <Avatar key={user.id} className="w-10 h-10 border-2 border-background">
                      <AvatarImage src={user.avatarUrl} alt={user.name} />
                      <AvatarFallback>{user.name.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                  ))}
                  {entry.users.length > 3 && (
                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-xs font-medium text-muted-foreground border-2 border-background">
                      +{entry.users.length - 3}
                    </div>
                  )}
                </div>
              ) : (
                <Avatar className="w-10 h-10">
                  <AvatarImage src={entry.user?.avatarUrl} alt={entry.user?.name} />
                  <AvatarFallback>{entry.user?.name?.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
              )}
              
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-foreground flex items-center gap-2">
                  {isTie && entry.users ? (
                    <span>{entry.users.length} users tied</span>
                  ) : (
                    <span>{entry.user?.name}</span>
                  )}
                  {isCurrentUser && (
                    <Badge variant="secondary" className="bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300">You</Badge>
                  )}
                </div>
                <div className="text-sm text-muted-foreground truncate">{exerciseName}</div>
                {category && (
                  <Badge 
                    variant="outline" 
                    className="text-xs mt-1"
                    style={{
                      '--category-color': getCategoryColors(getCategoryKeyByName(category.name)).primary
                    } as React.CSSProperties}
                  >
                    {category.name}
                  </Badge>
                )}
              </div>
            </div>

            {/* Weight Display */}
            <div className="text-right">
              <div className="text-lg font-bold text-foreground">
                {entry.value > 0 ? `${entry.value}` : '0'}
                <span className="text-sm font-normal text-muted-foreground ml-1">lbs</span>
              </div>
              {isTie && (
                <div className="text-xs text-amber-600 dark:text-amber-400 font-medium flex items-center gap-1">
                  <Star className="h-3 w-3" />
                  <span>Tied</span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className={`space-y-6 relative transition-all duration-500 ease-out ${contentReady ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-sm">
          <Medal className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">Personal Records</h1>
          <p className="text-sm text-muted-foreground">Best lifts across all exercises</p>
        </div>
      </div>

      {/* Category Filter Buttons */}
      <div className="flex gap-3 overflow-x-auto pb-2 px-1 py-2 scrollbar-hide">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setSelectedCategoryId('all')}
          className={`rounded-2xl px-6 py-3 font-medium transition-all duration-300 whitespace-nowrap transform active:scale-95 ${
            selectedCategoryId === 'all' 
              ? 'all-button-selected' 
              : 'all-button-unselected'
          }`}
        >
          All
        </Button>
        
        {categories.map((category, index) => {
          const categoryColor = getCategoryChartColors()[index % getCategoryChartColors().length];
          const isSelected = selectedCategoryId === category.id;
          
          return (
            <Button
              key={category.id}
              variant="outline"
              size="sm"
              onClick={() => setSelectedCategoryId(category.id)}
              className={`rounded-2xl px-6 py-3 font-medium whitespace-nowrap transition-all duration-300 transform active:scale-95 ${
                isSelected 
                  ? 'category-button-selected' 
                  : 'category-button-unselected'
              }`}
              style={{
                '--category-color': categoryColor,
                '--category-color-rgb': categoryColor.replace('#', '').match(/.{2}/g)?.map(hex => parseInt(hex, 16)).join(', ') || '16, 185, 129'
              } as React.CSSProperties}
            >
              {category.name}
            </Button>
          );
        })}
      </div>

      {/* PR Champion Summary */}
      {renderPRChampionSummary()}

      {/* PR Leaderboard */}
      <div className="space-y-3">
        {prLeaderboard.length > 0 ? (
          <>
            <div className="flex items-center gap-2 mb-4">
              <Trophy className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              <h2 className="text-lg font-bold text-foreground">Exercise PR Leaders</h2>
              <Badge variant="secondary">{prLeaderboard.length} exercises</Badge>
            </div>
            {prLeaderboard.map((entry, index) => renderPREntry(entry, index))}
          </>
        ) : (
          <Card>
            <CardContent className="p-8 text-center">
              <Target className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-muted-foreground mb-2">No PR Records Found</h3>
              <p className="text-sm text-muted-foreground">
                {selectedCategoryId === 'all' 
                  ? 'No exercise records found. Start logging workouts to see personal records!'
                  : `No records found for ${getCategoryName(selectedCategoryId)} exercises.`
                }
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default PRRecordsPage;
