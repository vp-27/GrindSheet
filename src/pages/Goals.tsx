import React, { useState, useEffect, useMemo } from 'react';
import Layout from '@/components/Layout';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Target, 
  Zap, 
  Trophy, 
  Crown, 
  Flame, 
  TrendingUp, 
  Activity, 
  Calendar,
  Users,
  Award,
  Star,
  ChevronRight,
  CheckCircle,
  Plus,
  BarChart3
} from 'lucide-react';
import { useAppContext } from '@/context/useAppContext';
import { useAuth } from '@/context/AuthContext';
import { getGoalProgressTrackersForUser, getFriendsSoloPRs, BADGE_DEFINITIONS } from '@/utils/tournamentUtils';
import ProgressTracker from '@/components/ProgressTracker';
import { ProgressTrackers, BadgeType } from '@/types';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { calculateProgress } from '@/utils/progressUtils';
import { getCategoryChartColors } from '@/utils/categoryColors';
import { useNavigate } from 'react-router-dom';

// Helper to get exercise name from id
function getExerciseName(exerciseId: string, exercises: any[]) {
  const ex = exercises.find(e => e.id === exerciseId);
  return ex ? ex.name : 'Exercise';
}

// Helper to get user streak (similar to Dashboard logic)
function getUserStreak(exerciseLogs: any[]) {
  if (!exerciseLogs || exerciseLogs.length === 0) return 0;
  
  const getLocalDateString = (date: Date | string) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.getFullYear() + '-' + (d.getMonth()+1).toString().padStart(2,'0') + '-' + d.getDate().toString().padStart(2,'0');
  };

  const logDates = Array.from(new Set(
    exerciseLogs.map(log => getLocalDateString(log.timestamp))
  )).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

  const todayStr = getLocalDateString(new Date());
  const hasLoggedToday = logDates.length > 0 && logDates[0] === todayStr;

  let streak = 0;
  if (logDates.length > 0) {
    let expectedDate = new Date();
    if (!hasLoggedToday) {
      expectedDate.setDate(expectedDate.getDate() - 1);
    }
    expectedDate.setHours(0,0,0,0);
    let expectedStr = getLocalDateString(expectedDate);
    for (let i = 0; i < logDates.length; i++) {
      if (logDates[i] === expectedStr) {
        streak++;
        expectedDate.setDate(expectedDate.getDate() - 1);
        expectedStr = getLocalDateString(expectedDate);
      } else {
        break;
      }
    }
  }
  return streak;
}


const GoalsPage: React.FC = () => {
  const { profile } = useAuth();
  const { categories, exercises, exerciseLogs } = useAppContext();
  const navigate = useNavigate();
  const [progressTrackers, setProgressTrackers] = useState<ProgressTrackers | null>(null);
  const [friendsToBeat, setFriendsToBeat] = useState<any[]>([]);
  const [showFriendsSection, setShowFriendsSection] = useState(false);
  const [selectedGoalCategory, setSelectedGoalCategory] = useState<'daily' | 'weekly' | 'competitive'>('daily');

  // Get color system
  const chartColors = getCategoryChartColors();
  const getCategoryColor = (categoryIndex: number) => {
    return chartColors[categoryIndex % chartColors.length];
  };

  // Helper function for achievement icons (moved before useMemo hooks)
  const getAchievementIcon = (key: string) => {
    switch (key) {
      case 'setPR': return <Trophy className="w-4 h-4" />;
      case 'consistency': return <Calendar className="w-4 h-4" />;
      case 'beatFriend': return <Zap className="w-4 h-4" />;
      case 'volumeCrusher': return <Activity className="w-4 h-4" />;
      case 'coreDestroyer': return <Target className="w-4 h-4" />;
      case 'weekendWarrior': return <Star className="w-4 h-4" />;
      default: return <Award className="w-4 h-4" />;
    }
  };

  // Always show goals, even if logs are empty
  useEffect(() => {
    if (profile && exercises && categories) {
      const trackers = getGoalProgressTrackersForUser(profile, exerciseLogs || [], exercises, categories);
      setProgressTrackers(trackers);
    }
  }, [profile, exerciseLogs, exercises, categories]);

  // Get friends to beat (solo PRs)
  useEffect(() => {
    if (profile && exerciseLogs && exercises && categories) {
      const friendsSoloPRs = getFriendsSoloPRs(profile, exerciseLogs, exercises, categories);
      setFriendsToBeat(friendsSoloPRs);
    }
  }, [profile, exerciseLogs, exercises, categories]);

  // Calculate user statistics
  const userStats = useMemo(() => {
    if (!exerciseLogs || !exercises || !categories) return null;
    
    const userLogs = exerciseLogs.filter(log => log.userId === profile?.id);
    const streak = getUserStreak(userLogs);
    
    // Get PRs this month
    const thisMonth = new Date();
    thisMonth.setDate(1);
    const prsThisMonth = userLogs.filter(log => {
      const logDate = new Date(log.timestamp);
      return logDate >= thisMonth;
    }).length;

    // Calculate total weight lifted
    const totalWeight = userLogs.reduce((sum, log) => sum + log.weight, 0);
    
    // Get worked categories this week
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - 7);
    const recentLogs = userLogs.filter(log => new Date(log.timestamp) >= weekStart);
    const categoriesWorked = new Set(recentLogs.map(log => {
      const exercise = exercises.find(ex => ex.id === log.exerciseId);
      return exercise?.categoryId;
    }).filter(Boolean)).size;

    return {
      streak,
      prsThisMonth,
      totalWeight,
      categoriesWorked,
      totalExercises: userLogs.length,
      uniqueExercises: new Set(userLogs.map(log => log.exerciseId)).size
    };
  }, [exerciseLogs, exercises, categories, profile]);

  // Smart goal suggestions based on user data
  const smartGoals = useMemo(() => {
    if (!exerciseLogs || !exercises || !categories || !profile) return [];
    
    const userLogs = exerciseLogs.filter(log => log.userId === profile.id);
    const suggestions = [];

    // Streak-based goals
    const streak = getUserStreak(userLogs);
    if (streak === 0) {
      suggestions.push({
        id: 'start-streak',
        title: 'Start Your Journey',
        description: 'Log your first workout to begin building momentum',
        icon: <Flame className="w-5 h-5" />,
        gradient: 'from-orange-500 to-red-500',
        action: () => navigate('/'),
        priority: 10
      });
    } else if (streak < 3) {
      suggestions.push({
        id: 'extend-streak',
        title: `Extend Your ${streak}-Day Streak`,
        description: 'Keep the momentum going! Aim for a 7-day streak',
        icon: <Flame className="w-5 h-5" />,
        gradient: 'from-orange-500 to-red-500',
        action: () => navigate('/'),
        priority: 8
      });
    } else if (streak >= 7) {
      suggestions.push({
        id: 'streak-master',
        title: 'Streak Master!',
        description: `Amazing ${streak}-day streak! Can you hit ${streak + 7} days?`,
        icon: <Crown className="w-5 h-5" />,
        gradient: 'from-yellow-500 to-orange-500',
        action: () => navigate('/'),
        priority: 6
      });
    }

    // Category completion goals
    const recentLogs = userLogs.filter(log => {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return new Date(log.timestamp) >= weekAgo;
    });
    const workedCategories = new Set(recentLogs.map(log => {
      const exercise = exercises.find(ex => ex.id === log.exerciseId);
      return exercise?.categoryId;
    }).filter(Boolean));
    
    if (workedCategories.size < categories.length) {
      const unworkedCategories = categories.filter(cat => !workedCategories.has(cat.id));
      const nextCategory = unworkedCategories[0];
      suggestions.push({
        id: 'complete-categories',
        title: 'Try New Groups',
        description: `${nextCategory?.name || 'Missing groups'} + ${unworkedCategories.length - 1} more`,
        icon: <Target className="w-5 h-5" />,
        gradient: 'from-emerald-500 to-teal-500',
        action: () => {
          // Navigate to home and scroll to the category
          navigate('/');
          // Small delay to ensure page loads, then scroll to category
          setTimeout(() => {
            const categoryElement = document.querySelector(`[data-category-id="${nextCategory?.id}"]`);
            if (categoryElement) {
              categoryElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
          }, 100);
        },
        priority: 7
      });
    }

    // PR opportunity goals
    if (userLogs.length > 10) {
      const oldestLogs = userLogs.filter(log => {
        const monthAgo = new Date();
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        return new Date(log.timestamp) < monthAgo;
      });
      
      if (oldestLogs.length > 0) {
        // Find the user's strongest exercise to suggest for PR attempt
        const exerciseStats = userLogs.reduce((acc, log) => {
          if (!acc[log.exerciseId]) {
            acc[log.exerciseId] = { maxWeight: 0, count: 0 };
          }
          acc[log.exerciseId].maxWeight = Math.max(acc[log.exerciseId].maxWeight, log.weight);
          acc[log.exerciseId].count++;
          return acc;
        }, {} as Record<string, { maxWeight: number; count: number }>);
        
        const topExercise = Object.entries(exerciseStats)
          .sort((a, b) => b[1].count - a[1].count)[0];
        const exerciseName = exercises.find(ex => ex.id === topExercise?.[0])?.name || 'your best';
        
        suggestions.push({
          id: 'set-new-pr',
          title: 'Beat Your PR',
          description: `Push ${exerciseName} further`,
          icon: <Trophy className="w-5 h-5" />,
          gradient: 'from-amber-500 to-orange-500',
          action: () => navigate(`/exercise-detail?exercise=${topExercise?.[0]}`),
          priority: 5
        });
      }
    }

    // Competition goals
    if (friendsToBeat.length > 0) {
      suggestions.push({
        id: 'beat-friends',
        title: 'Competitive Edge',
        description: `${friendsToBeat.length} friends' records are within reach!`,
        icon: <Zap className="w-5 h-5" />,
        gradient: 'from-purple-500 to-pink-500',
        action: () => setShowFriendsSection(true),
        priority: 4
      });
    }

    // Volume goals
    const thisWeek = userLogs.filter(log => {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return new Date(log.timestamp) >= weekAgo;
    });
    
    if (thisWeek.length < 15) {
      suggestions.push({
        id: 'volume-challenge',
        title: 'Hit Your Volume',
        description: `${thisWeek.length}/15 this week`,
        icon: <Activity className="w-5 h-5" />,
        gradient: 'from-blue-500 to-purple-500',
        action: () => {
          navigate('/');
          // Add a toast or visual indicator
          setTimeout(() => {
            const addButton = document.querySelector('[data-add-exercise-button]');
            if (addButton) {
              (addButton as HTMLElement).focus();
            }
          }, 100);
        },
        priority: 3
      });
    }

    return suggestions.sort((a, b) => b.priority - a.priority).slice(0, 3);
  }, [exerciseLogs, exercises, categories, profile, friendsToBeat, navigate]);

  // Recent achievements (last week's completed goals)
  const recentAchievements = useMemo(() => {
    if (!progressTrackers) return [];
    
    const achievements = [];
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    
    Object.entries(progressTrackers).forEach(([key, tracker]) => {
      if (tracker.isAchieved && tracker.completedAt) {
        const completedDate = new Date(tracker.completedAt);
        if (completedDate >= weekAgo) {
          achievements.push({
            id: key,
            title: tracker.text,
            points: tracker.points,
            completedAt: completedDate,
            icon: getAchievementIcon(key)
          });
        }
      }
    });
    
    return achievements.sort((a, b) => b.completedAt.getTime() - a.completedAt.getTime()).slice(0, 4);
  }, [progressTrackers]);

  // Category progress rings data
  const categoryRings = useMemo(() => {
    if (!exerciseLogs || !exercises || !categories || !profile) return [];
    
    const userLogs = exerciseLogs.filter(log => log.userId === profile.id);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const recentLogs = userLogs.filter(log => new Date(log.timestamp) >= weekAgo);
    
    return categories.map((category, index) => {
      const categoryExercises = exercises.filter(ex => ex.categoryId === category.id);
      const categoryLogs = recentLogs.filter(log => 
        categoryExercises.some(ex => ex.id === log.exerciseId)
      );
      
      const uniqueExercises = new Set(categoryLogs.map(log => log.exerciseId)).size;
      const maxPossible = Math.min(categoryExercises.length, 3); // Cap at 3 for reasonable goals
      const progress = maxPossible > 0 ? (uniqueExercises / maxPossible) * 100 : 0;
      
      return {
        id: category.id,
        name: category.name,
        progress: Math.min(progress, 100),
        current: uniqueExercises,
        goal: maxPossible,
        color: getCategoryColor(index),
        exerciseCount: categoryLogs.length
      };
    });
  }, [exerciseLogs, exercises, categories, profile, getCategoryColor]);

  // Motivational card if no logs
  const showMotivation = !exerciseLogs || exerciseLogs.length === 0;

  return (
    <Layout title="Goals">
      <div className="flex flex-col gap-6 pb-6">
        {/* Smart Goals Header Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-foreground">Recommended for You</h2>
            {userStats && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Flame className={`w-4 h-4 ${userStats.streak > 0 ? 'text-orange-500' : 'text-gray-400'}`} />
                <span>{userStats.streak}d streak</span>
              </div>
            )}
          </div>
          
          {/* Smart Goal Suggestions - Compact Grid */}
          <div className="grid grid-cols-3 gap-2">
            {smartGoals.map((goal) => (
              <Card 
                key={goal.id} 
                className="apple-health-card cursor-pointer active:opacity-80 transition-all duration-200"
                onClick={goal.action}
              >
                <CardContent className="p-3">
                  <div className="flex flex-col items-center text-center gap-2">
                    <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${goal.gradient} flex items-center justify-center text-white shadow-sm`}>
                      {React.cloneElement(goal.icon as React.ReactElement, { className: 'w-4 h-4' })}
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-sm font-semibold text-foreground truncate leading-tight">{goal.title}</h3>
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{goal.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* User Stats Cards */}
        {userStats && userStats.totalExercises > 0 && (
          <div className="grid grid-cols-2 gap-3">
            <Card className="apple-health-card">
              <CardContent className="p-4 text-center">
                <div className="flex items-center justify-center w-8 h-8 mx-auto mb-2 rounded-full bg-gradient-to-br from-blue-500 to-purple-500">
                  <BarChart3 className="w-4 h-4 text-white" />
                </div>
                <div className="text-2xl font-bold text-foreground">{userStats.totalWeight}</div>
                <div className="text-xs text-muted-foreground">Total Weight</div>
              </CardContent>
            </Card>
            
            <Card className="apple-health-card">
              <CardContent className="p-4 text-center">
                <div className="flex items-center justify-center w-8 h-8 mx-auto mb-2 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500">
                  <Target className="w-4 h-4 text-white" />
                </div>
                <div className="text-2xl font-bold text-foreground">{userStats.categoriesWorked}</div>
                <div className="text-xs text-muted-foreground">Groups This Week</div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Category Progress Rings */}
        {categoryRings.length > 0 && userStats && userStats.totalExercises > 0 && (
          <Card className="apple-health-card">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4">Weekly Muscle Group Progress</h3>
              <div className="grid grid-cols-2 gap-4">
                {categoryRings.map((ring) => (
                  <div key={ring.id} className="flex items-center gap-3">
                    <div className="relative w-12 h-12 flex-shrink-0">
                      <svg className="w-12 h-12 transform -rotate-90" viewBox="0 0 40 40">
                        <circle
                          cx="20"
                          cy="20"
                          r="16"
                          stroke="currentColor"
                          strokeWidth="3"
                          fill="none"
                          className="text-gray-200 dark:text-gray-700"
                        />
                        <circle
                          cx="20"
                          cy="20"
                          r="16"
                          stroke={ring.color}
                          strokeWidth="3"
                          fill="none"
                          strokeDasharray={`${ring.progress * 1.005} 100.48`}
                          className="transition-all duration-500"
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span 
                          className="text-xs font-bold"
                          style={{'--ring-color': ring.color, color: 'var(--ring-color)'} as React.CSSProperties}
                        >
                          {ring.current}
                        </span>
                      </div>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium text-foreground truncate">{ring.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {ring.current}/{ring.goal} exercises
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recent Achievements */}
        {recentAchievements.length > 0 && (
          <Card className="apple-health-card">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-500" />
                Recent Achievements
              </h3>
              <div className="space-y-3">
                {recentAchievements.map((achievement) => (
                  <div key={achievement.id} className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 border border-amber-200/50 dark:border-amber-800/30">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-white flex-shrink-0">
                      {achievement.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-foreground truncate">{achievement.title}</div>
                      <div className="text-sm text-amber-600 dark:text-amber-400">
                        +{achievement.points} points • {achievement.completedAt.toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Weekly Progress Section */}
        <Card className="apple-health-card">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-500" />
              Weekly Challenges
            </h3>
            {progressTrackers && Object.keys(progressTrackers).length > 0 ? (
              <ProgressTracker progressTrackers={progressTrackers} />
            ) : (
              <div className="text-muted-foreground text-center py-8">
                <Target className="w-12 h-12 mx-auto mb-2" />
                <div className="mb-2">No challenges yet. Start logging exercises to unlock goals!</div>
                <Button variant="default" className="mt-2" onClick={() => navigate('/')}>
                  Log Exercise
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Friends to Beat Section */}
        {friendsToBeat.length > 0 && (
          <Card className="apple-health-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Users className="w-5 h-5 text-purple-500" />
                  Friends to Beat
                </h3>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setShowFriendsSection(!showFriendsSection)}
                  className="text-purple-600 dark:text-purple-400"
                >
                  {showFriendsSection ? 'Hide' : `Show ${friendsToBeat.length}`}
                </Button>
              </div>
              {showFriendsSection && (
                <div className="space-y-3">
                  {friendsToBeat.slice(0, 5).map((pr, idx) => (
                    <div key={idx} className="flex items-center justify-between rounded-xl bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 border border-purple-200/50 dark:border-purple-800/30 p-3">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={pr.friendAvatarUrl} />
                          <AvatarFallback>{pr.friendName?.[0] || '?'}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-semibold text-foreground">{pr.exerciseName}</div>
                          <div className="text-xs text-muted-foreground">
                            {pr.friendName} PR: <span className="font-bold text-purple-600 dark:text-purple-400">{pr.friendPR}</span>
                          </div>
                        </div>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => navigate(`/exercise-detail?exercise=${pr.exerciseId}`)}
                        className="border-purple-300 text-purple-600 dark:border-purple-700 dark:text-purple-400"
                      >
                        Beat This
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Motivational Card if no logs */}
        {showMotivation && (
          <Card className="apple-health-card">
            <CardContent className="p-12 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
                <Target className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Ready to Crush Your Goals?</h3>
              <p className="text-muted-foreground mb-4">
                Log your first exercise to unlock personalized challenges, progress tracking, and achievements.
              </p>
              <Button variant="default" onClick={() => navigate('/')}>
                <Plus className="w-4 h-4 mr-2" />
                Log First Exercise
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Placeholder for Future Features */}
        <Card className="apple-health-card border-dashed border-2 border-gray-300 dark:border-gray-700">
          <CardContent className="p-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
              <Zap className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">More Goals Coming Soon</h3>
            <div className="space-y-1 text-muted-foreground text-sm">
              <p>• Custom goal creation</p>
              <p>• Monthly challenges</p>
              <p>• Team competitions</p>
              <p>• Progress photos</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default GoalsPage; 