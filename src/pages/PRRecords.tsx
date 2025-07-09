import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '@/context/useAppContext';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import Layout from '@/components/Layout';
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
import '@/styles/components/pr-records.css';

// Internal component for use within Tournament tab
export const PRRecordsContent: React.FC = () => {
  const { profile } = useAuth();
  const { categories, exercises } = useAppContext();
  const navigate = useNavigate();
  
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
  const [friendsSoloPRs, setFriendsSoloPRs] = useState<any[]>([]);
  const [showSoloPRs, setShowSoloPRs] = useState(false);

  // Handle exercise click navigation
  const handleExerciseClick = (exerciseId: string) => {
    navigate(`/exercise-detail?exercise=${exerciseId}`);
  };

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

  // Calculate friends' solo PRs that can be beaten
  const calculateFriendsSoloPRs = () => {
    if (!profile || users.length === 0 || allExerciseLogs.length === 0) return [];
    
    const friendsSoloPRs: any[] = [];
    const currentUserLogs = allExerciseLogs.filter(log => log.userId === profile.id);
    const friendsLogs = allExerciseLogs.filter(log => log.userId !== profile.id);
    
    // Get friends' PR for each exercise
    exercises.forEach(exercise => {
      if (selectedCategoryId !== 'all' && exercise.categoryId !== selectedCategoryId) return;
      
      // Get current user's best for this exercise
      const currentUserBest = currentUserLogs
        .filter(log => log.exerciseId === exercise.id)
        .reduce((best, log) => log.weight > best ? log.weight : best, 0);
      
      // Get friends' PRs for this exercise
      const friendsPRs = friendsLogs
        .filter(log => log.exerciseId === exercise.id)
        .reduce((prs: any[], log) => {
          const existingPR = prs.find(pr => pr.userId === log.userId);
          if (!existingPR) {
            prs.push({
              userId: log.userId,
              weight: log.weight,
              timestamp: log.timestamp
            });
          } else if (log.weight > existingPR.weight) {
            existingPR.weight = log.weight;
            existingPR.timestamp = log.timestamp;
          }
          return prs;
        }, []);
      
      // Find beatable PRs (friend's PR > current user's best)
      friendsPRs.forEach(pr => {
        if (pr.weight > currentUserBest) {
          const user = users.find(u => u.id === pr.userId);
          if (user) {
            friendsSoloPRs.push({
              exerciseId: exercise.id,
              exerciseName: exercise.name,
              category: categories.find(cat => cat.id === exercise.categoryId),
              friend: user,
              friendPR: pr.weight,
              userBest: currentUserBest,
              deficit: pr.weight - currentUserBest,
              timestamp: pr.timestamp
            });
          }
        }
      });
    });
    
    // Sort by deficit (closest to beat first)
    return friendsSoloPRs.sort((a, b) => a.deficit - b.deficit);
  };

  // Update friends' solo PRs when dependencies change
  useEffect(() => {
    if (users.length > 0 && allExerciseLogs.length > 0 && exercises.length > 0 && categories.length > 0) {
      const soloPRs = calculateFriendsSoloPRs();
      setFriendsSoloPRs(soloPRs);
    }
  }, [users, allExerciseLogs, exercises, categories, selectedCategoryId, profile]);

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
        <div className="apple-health-card mb-6">
          <div className="text-center p-4">
            <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-muted-foreground mb-2">No PR Records Yet</h3>
            <p className="text-sm text-muted-foreground">
              {selectedCategoryId === 'all' 
                ? 'Start logging workouts to see PR champions!'
                : `No PR records in ${getCategoryName(selectedCategoryId)} category yet.`
              }
            </p>
          </div>
        </div>
      );
    }

    return (
      <div className="apple-health-card mb-6 pr-champion-card">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center shadow-md">
            <Crown className="h-6 w-6 text-yellow-900" />
          </div>
          <div className="flex-1">
            <h3 className="apple-health-card-title text-base font-bold text-amber-800 dark:text-amber-200">
              PR Champion{prChampionship.champion ? `: ${prChampionship.champion.name}` : 'ship'}
            </h3>
            <div className="apple-health-card-time">
              <span className="apple-health-card-time-text text-amber-700 dark:text-amber-300">
                {prChampionship.champion 
                  ? `${prChampionship.championCount} PR${prChampionship.championCount !== 1 ? 's' : ''} out of ${prChampionship.totalExercises} exercises`
                  : `${prChampionship.totalExercises} exercises tracked`
                }
              </span>
            </div>
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
      </div>
    );
  };

  // Render friends' solo PR challenge section
  const renderFriendsSoloPRs = () => {
    if (friendsSoloPRs.length === 0) return null;
    
    // Get selected category for styling
    const selectedCategory = selectedCategoryId !== 'all' ? categories.find(cat => cat.id === selectedCategoryId) : null;
    const categoryClass = selectedCategory ? getCategoryKeyByName(selectedCategory.name) : '';
    
    return (
      <div className="mb-6">
        <Button
          variant="outline"
          size="lg"
          onClick={() => setShowSoloPRs(!showSoloPRs)}
          className={`w-full mobile-toggle-button flex items-center justify-between p-4 h-auto ${categoryClass}`}
        >
          <div className="flex items-center gap-3">
            <Zap className={`h-5 w-5 text-orange-600 dark:text-orange-400 ${selectedCategory ? `section-crown ${categoryClass}` : ''}`} />
            <div className="text-left">
              <div className="font-semibold">Friends' PRs to Beat</div>
              <div className="text-sm text-muted-foreground">{friendsSoloPRs.length} challenges available</div>
            </div>
          </div>
          <Badge variant="secondary" className="ml-2">
            {showSoloPRs ? 'Hide' : 'Show'}
          </Badge>
        </Button>
        
        {showSoloPRs && (
          <div className="space-y-3 mt-4">
            {friendsSoloPRs.slice(0, 10).map((challenge, index) => (
              <div 
                key={`${challenge.exerciseId}-${challenge.friend.id}`}
                className={`apple-health-card pr-entry-card ${getCategoryKeyByName(challenge.category?.name || 'back')} challenge-card`}
                onClick={() => handleExerciseClick(challenge.exerciseId)}
              >
                {/* Top row: Exercise name only */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="apple-health-card-title truncate mb-1">{challenge.exerciseName}</h3>
                    <div className="apple-health-card-time">
                      <span className="apple-health-card-time-text">Beat {challenge.friend.name}'s PR</span>
                    </div>
                  </div>
                </div>
                
                {/* Bottom row: Friend avatar + PR challenge info */}
                <div className="flex items-end justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={challenge.friend.avatarUrl} alt={challenge.friend.name} />
                      <AvatarFallback>{challenge.friend.name.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="text-sm">
                      <div className="text-muted-foreground">Your best: {challenge.userBest || 0} lbs</div>
                      <div className="text-xs text-orange-600 dark:text-orange-400 font-medium">
                        Need +{challenge.deficit} lbs to beat
                      </div>
                    </div>
                  </div>
                  
                  {/* Target PR Display */}
                  <div className="text-right">
                    <div className="apple-health-weight-display text-orange-600 dark:text-orange-400">
                      {challenge.friendPR}
                    </div>
                    <p className="apple-health-weight-unit">lbs PR</p>
                  </div>
                </div>
              </div>
            ))}
            
            {friendsSoloPRs.length > 10 && (
              <div className="text-center text-sm text-muted-foreground">
                And {friendsSoloPRs.length - 10} more challenges...
              </div>
            )}
          </div>
        )}
      </div>
    );
  };
  const renderPREntry = (entry: any, index: number) => {
    const exerciseName = getExerciseName(entry.exerciseId!);
    const category = getExerciseCategory(entry.exerciseId!);
    const isCurrentUser = entry.userId === profile?.id;
    const isTie = entry.isTie;
    
    // Get category color for this exercise
    const categoryIndex = category ? categories.findIndex(cat => cat.id === category.id) : -1;
    const categoryColor = categoryIndex >= 0 ? getCategoryChartColors()[categoryIndex % getCategoryChartColors().length] : '#10b981';
    
    return (
      <div 
        key={`${entry.exerciseId}-${entry.userId}`}
        className={`apple-health-card transition-all duration-200 cursor-pointer pr-entry-card ${
          isCurrentUser ? 'category-tinted user-pr' : ''
        } ${getCategoryKeyByName(category?.name || 'back')}`}
        onClick={() => handleExerciseClick(entry.exerciseId!)}
      >
        {/* Top row: Exercise name only */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3 flex-1">
            <div className="flex-1 min-w-0">
              <h3 className="apple-health-card-title truncate mb-1">{exerciseName}</h3>
              <div className="apple-health-card-time">
                {isTie && entry.users ? (
                  <span className="apple-health-card-time-text">{entry.users.length} users tied</span>
                ) : (
                  <span className="apple-health-card-time-text">{entry.user?.name}</span>
                )}
                {isCurrentUser && (
                  <Badge variant="secondary" className="ml-2 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-xs">You</Badge>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom row: User avatars + Weight display */}
        <div className="flex items-end justify-between">
          <div className="flex items-center gap-3">
            {isTie && entry.users ? (
              // Render multiple avatars for ties
              <div className="flex -space-x-2">
                {entry.users.slice(0, 3).map((user: any, userIndex: number) => (
                  <Avatar key={user.id} className="w-8 h-8 border-2 border-background">
                    <AvatarImage src={user.avatarUrl} alt={user.name} />
                    <AvatarFallback>{user.name.charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                ))}
                {entry.users.length > 3 && (
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium text-muted-foreground border-2 border-background">
                    +{entry.users.length - 3}
                  </div>
                )}
              </div>
            ) : (
              <Avatar className="w-8 h-8">
                <AvatarImage src={entry.user?.avatarUrl} alt={entry.user?.name} />
                <AvatarFallback>{entry.user?.name?.charAt(0).toUpperCase()}</AvatarFallback>
              </Avatar>
            )}
          </div>

          {/* Weight Display */}
          <div className="text-right">
            <div className="apple-health-weight-display">
              {entry.value > 0 ? `${entry.value}` : '0'}
            </div>
            <p className="apple-health-weight-unit">lbs</p>
            {isTie && (
              <div className="text-xs text-amber-600 dark:text-amber-400 font-medium flex items-center gap-1 justify-end mt-1">
                <Star className="h-3 w-3" />
                <span>Tied</span>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={`space-y-6 relative transition-all duration-500 ease-out ${contentReady ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
      
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
          const categoryFilterClass = `category-filter-${getCategoryKeyByName(category.name)}`;
          
          return (
            <Button
              key={category.id}
              variant="outline"
              size="sm"
              onClick={() => setSelectedCategoryId(category.id)}
              className={`rounded-2xl px-6 py-3 font-medium whitespace-nowrap transition-all duration-300 transform active:scale-95 ${categoryFilterClass} ${
                isSelected 
                  ? 'category-button-selected' 
                  : 'category-button-unselected'
              }`}
            >
              {category.name}
            </Button>
          );
        })}
      </div>

      {/* PR Champion Summary */}
      {renderPRChampionSummary()}

      {/* Friends' Solo PRs Challenge Section */}
      {friendsSoloPRs.length > 0 && renderFriendsSoloPRs()}

      {/* PR Leaderboard */}
      <div className={`space-y-3 pr-leaderboard-section ${selectedCategoryId !== 'all' ? getCategoryKeyByName(getCategoryName(selectedCategoryId)) : ''}`}>
        {prLeaderboard.length > 0 ? (
          <>
            {prLeaderboard.map((entry, index) => renderPREntry(entry, index))}
          </>
        ) : (
          <div className="apple-health-card">
            <div className="text-center p-4">
              <Target className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-muted-foreground mb-2">No PR Records Found</h3>
              <p className="text-sm text-muted-foreground">
                {selectedCategoryId === 'all' 
                  ? 'No exercise records found. Start logging workouts to see personal records!'
                  : `No records found for ${getCategoryName(selectedCategoryId)} exercises.`
                }
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Standalone page component with Layout wrapper
const PRRecordsPage: React.FC = () => {
  return (
    <Layout title="Records">
      <PRRecordsContent />
    </Layout>
  );
};

export default PRRecordsPage;
