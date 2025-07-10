import React, { useState, useEffect, useMemo } from 'react';
import Layout from '@/components/Layout';
import { useAppContext } from '@/context/useAppContext';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { MobileSlider } from '@/components/ui/mobile-slider';
import AnimatedCounter from '@/components/ui/animated-counter';
import TournamentRulebook from '@/components/TournamentRulebook';
import { 
  Trophy, 
  Crown, 
  Medal, 
  Award, 
  Zap, 
  Target,
  TrendingUp,
  Calendar,
  Users,
  Star,
  Flame,
  CheckCircle,
  Timer,
  ChevronDown,
  ChevronUp,
  Activity,
  Plus,
  BookOpen,
  Flag,
  Clock,
  Mountain,
  Gauge,
  Gift
} from 'lucide-react';
import { 
  Tournament, 
  TournamentParticipant,
  BadgeType
} from '@/types';
import { 
  generateCurrentTournament, 
  generateTournamentHistory,
  POINTS_CONFIG,
  BADGE_DEFINITIONS,
  getTournamentCountdown,
  NEW_EXERCISE_BONUS
} from '@/utils/tournamentUtils';
import { supabase } from '@/integrations/supabase/client';
import { calculateProgress } from '@/utils/progressUtils';
import '@/styles/index.css';

const GoalsPage: React.FC = () => {
  const { profile } = useAuth();
  const { categories, exercises, exerciseLogs } = useAppContext();
  
  const [currentTournament, setCurrentTournament] = useState<Tournament | null>(null);
  const [tournamentHistory, setTournamentHistory] = useState<Tournament[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [allExerciseLogs, setAllExerciseLogs] = useState<any[]>([]);
  const [showPointsGuide, setShowPointsGuide] = useState(false);
  const [contentReady, setContentReady] = useState(false);
  const [activeTab, setActiveTab] = useState<'challenges' | 'achievements' | 'leaderboard'>('challenges');
  
  // Countdown state
  const [countdown, setCountdown] = useState<{
    text: string;
    urgency: 'low' | 'medium' | 'high' | 'critical' | 'ended';
    timeLeft: number;
  }>({ text: '', urgency: 'low', timeLeft: 0 });

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
      
      setTimeout(() => setContentReady(true), 50);
    };

    fetchData();
  }, []);

  // Generate tournaments when data is available
  useEffect(() => {
    if (users.length > 0 && allExerciseLogs.length > 0 && exercises.length > 0 && categories.length > 0) {
      const current = generateCurrentTournament(users, allExerciseLogs, exercises, categories);
      const history = generateTournamentHistory(users, allExerciseLogs, exercises, categories, 4);
      
      setCurrentTournament(current);
      setTournamentHistory(history);
    }
  }, [users, allExerciseLogs, exercises, categories]);

  // Update countdown periodically
  useEffect(() => {
    const updateCountdown = () => {
      if (currentTournament) {
        const countdownData = getTournamentCountdown(currentTournament.weekEnd);
        setCountdown(countdownData);
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 60000);
    return () => clearInterval(interval);
  }, [currentTournament]);

  // Calculate personal goals and challenges
  const personalChallenges = useMemo(() => {
    if (!profile?.id || !exercises.length || !exerciseLogs.length) return [];

    const userLogs = exerciseLogs.filter(log => log.userId === profile.id);
    const challenges = [];

    // Weekly consistency challenge
    const thisWeekLogs = userLogs.filter(log => {
      const logDate = new Date(log.timestamp);
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      weekStart.setHours(0, 0, 0, 0);
      return logDate >= weekStart;
    });
    
    const uniqueDaysThisWeek = new Set(
      thisWeekLogs.map(log => new Date(log.timestamp).toDateString())
    ).size;

    challenges.push({
      id: 'weekly-consistency',
      title: '7 Day Streak',
      description: 'Log workouts on 7 different days this week',
      type: 'consistency',
      progress: uniqueDaysThisWeek,
      target: 7,
      icon: Flame,
      reward: '50 points',
      status: uniqueDaysThisWeek >= 7 ? 'completed' : 'active'
    });

    // Category mastery challenge
    const categoriesWithLogs = new Set(
      userLogs.map(log => {
        const exercise = exercises.find(e => e.id === log.exerciseId);
        return exercise?.categoryId;
      }).filter(Boolean)
    ).size;

    challenges.push({
      id: 'category-master',
      title: 'All Categories',
      description: 'Log exercises from all muscle groups',
      type: 'variety',
      progress: categoriesWithLogs,
      target: categories.length,
      icon: Target,
      reward: '75 points',
      status: categoriesWithLogs >= categories.length ? 'completed' : 'active'
    });

    // PR challenge
    const recentPRs = exercises.map(exercise => {
      const progress = calculateProgress(userLogs, exercise.id, exercise);
      return progress.personalRecord === progress.currentWeight && 
             progress.previousWeight && 
             progress.currentWeight > progress.previousWeight;
    }).filter(Boolean).length;

    challenges.push({
      id: 'pr-hunter',
      title: 'PR Hunter',
      description: 'Set 3 personal records this week',
      type: 'performance',
      progress: recentPRs,
      target: 3,
      icon: Trophy,
      reward: '100 points',
      status: recentPRs >= 3 ? 'completed' : 'active'
    });

    return challenges;
  }, [profile?.id, exercises, exerciseLogs, categories]);

  // Get current user's tournament participant data
  const currentUserParticipant = currentTournament?.participants.find(
    p => p.userId === profile?.id
  );

  // Achievement badges from tournament system
  const achievementBadges = currentUserParticipant?.badges || [];

  return (
    <Layout title="Goals & Challenges">
      <div className="flex flex-col gap-6 pb-6">
        {/* Tournament Status Header */}
        {currentTournament && (
          <Card className="bg-gradient-to-r from-blue-50 via-purple-50 to-pink-50 dark:from-blue-950/30 dark:via-purple-950/30 dark:to-pink-950/30 border-blue-200/50 dark:border-blue-700/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-bold text-foreground">Weekly Tournament</h2>
                  <p className="text-sm text-muted-foreground">
                    {countdown.text}
                  </p>
                </div>
                {currentUserParticipant && (
                  <div className="text-right">
                    <div className="text-2xl font-bold text-foreground">
                      <AnimatedCounter value={currentUserParticipant.totalPoints} duration={800} />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Rank #{currentUserParticipant.rank} of {currentTournament.participants.length}
                    </p>
                  </div>
                )}
              </div>
              
              {currentUserParticipant && (
                <div className="grid grid-cols-3 gap-4 pt-4 border-t border-border/30">
                  <div className="text-center">
                    <div className="text-lg font-bold text-amber-600 dark:text-amber-400">
                      {currentUserParticipant.pointsBreakdown?.prPoints + currentUserParticipant.pointsBreakdown?.improvementPoints + currentUserParticipant.pointsBreakdown?.competitivePoints || 0}
                    </div>
                    <p className="text-xs text-muted-foreground">Performance</p>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                      {currentUserParticipant.pointsBreakdown?.consistencyPoints + currentUserParticipant.pointsBreakdown?.participationPoints || 0}
                    </div>
                    <p className="text-xs text-muted-foreground">Consistency</p>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-green-600 dark:text-green-400">
                      {currentUserParticipant.pointsBreakdown?.bonusPoints || 0}
                    </div>
                    <p className="text-xs text-muted-foreground">Bonuses</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Tab Navigation */}
        <div className="flex gap-3 overflow-x-auto pb-2 px-1 py-2 scrollbar-hide">
          {[
            { id: 'challenges', label: 'Challenges', icon: Flag },
            { id: 'achievements', label: 'Achievements', icon: Award },
            { id: 'leaderboard', label: 'Leaderboard', icon: Trophy }
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <Button
                key={tab.id}
                variant="outline"
                size="sm"
                onClick={() => setActiveTab(tab.id as any)}
                className={`rounded-2xl px-6 py-3 font-medium transition-all duration-300 whitespace-nowrap transform active:scale-95 flex items-center gap-2 ${
                  activeTab === tab.id 
                    ? 'bg-primary text-primary-foreground border-primary' 
                    : 'hover:bg-muted'
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </Button>
            );
          })}
        </div>

        {/* Content based on active tab */}
        {activeTab === 'challenges' && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground">Personal Challenges</h3>
            {personalChallenges.map((challenge) => {
              const Icon = challenge.icon;
              const progressPercentage = Math.min((challenge.progress / challenge.target) * 100, 100);
              
              return (
                <Card key={challenge.id} className={`${
                  challenge.status === 'completed' 
                    ? 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800' 
                    : ''
                }`}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        <div className={`p-2 rounded-lg ${
                          challenge.status === 'completed'
                            ? 'bg-green-100 dark:bg-green-900/30'
                            : 'bg-muted'
                        }`}>
                          <Icon className={`h-5 w-5 ${
                            challenge.status === 'completed'
                              ? 'text-green-600 dark:text-green-400'
                              : 'text-muted-foreground'
                          }`} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold text-foreground">{challenge.title}</h4>
                            {challenge.status === 'completed' && (
                              <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mb-3">
                            {challenge.description}
                          </p>
                          
                          {/* Progress bar */}
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">
                                {challenge.progress} / {challenge.target}
                              </span>
                              <span className="text-primary font-medium">
                                {challenge.reward}
                              </span>
                            </div>
                            <div className="w-full bg-muted rounded-full h-2">
                              <div 
                                className={`h-2 rounded-full transition-all duration-500 ${
                                  challenge.status === 'completed'
                                    ? 'bg-green-500'
                                    : 'bg-primary'
                                }`}
                                style={{ width: `${progressPercentage}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {activeTab === 'achievements' && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground">Your Achievements</h3>
            {achievementBadges.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {achievementBadges.map((badge, index) => {
                  const badgeDefinition = BADGE_DEFINITIONS[badge.type];
                  return (
                    <Card key={badge.id} className="bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-950/30 dark:to-yellow-950/30 border-amber-200 dark:border-amber-800">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                            <Award className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-foreground">
                              {badgeDefinition?.name || badge.type}
                            </h4>
                            <p className="text-sm text-muted-foreground">
                              {badgeDefinition?.description || 'Achievement unlocked!'}
                            </p>
                            <div className="text-xs text-amber-600 dark:text-amber-400 font-medium mt-1">
                              +{badgeDefinition?.points || 0} points
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <Award className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">No Achievements Yet</h3>
                  <p className="text-muted-foreground">
                    Complete challenges and participate in tournaments to earn achievement badges!
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {activeTab === 'leaderboard' && currentTournament && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground">Tournament Leaderboard</h3>
            {currentTournament.participants.map((participant, index) => {
              const isCurrentUser = participant.userId === profile?.id;
              
              return (
                <Card key={participant.userId} className={`${
                  isCurrentUser ? 'border-blue-300/50 dark:border-blue-600/50' : ''
                } ${
                  participant.rank === 1 
                    ? 'bg-gradient-to-r from-amber-50 via-yellow-50 to-orange-50 dark:from-amber-950/30 dark:via-yellow-950/30 dark:to-orange-950/30 border-amber-300/50 dark:border-amber-700/50'
                    : ''
                }`}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      {/* Position */}
                      <div className="flex-shrink-0">
                        {participant.rank === 1 ? (
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center shadow-md">
                            <Crown className="h-4 w-4 text-yellow-900" />
                          </div>
                        ) : participant.rank === 2 ? (
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-300 to-gray-500 flex items-center justify-center shadow-md">
                            <Medal className="h-4 w-4 text-gray-700" />
                          </div>
                        ) : participant.rank === 3 ? (
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-600 to-amber-800 flex items-center justify-center shadow-md">
                            <Award className="h-4 w-4 text-amber-100" />
                          </div>
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground font-bold text-sm">
                            {participant.rank}
                          </div>
                        )}
                      </div>

                      {/* User Info */}
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <Avatar className="h-8 w-8 ring-1 ring-white dark:ring-gray-800">
                          <AvatarImage src={participant.user.avatarUrl} alt={participant.user.name} />
                          <AvatarFallback className="bg-muted text-muted-foreground text-xs">
                            {participant.user.name?.substring(0, 2).toUpperCase() || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold text-sm text-foreground truncate">
                              {participant.user.name}
                            </h4>
                            {isCurrentUser && (
                              <Badge className="text-xs px-2 py-0.5 bg-blue-100/80 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 rounded-full border border-blue-200 dark:border-blue-700/50">
                                You
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {participant.workoutDays.length} workout days
                          </p>
                        </div>
                      </div>

                      {/* Points */}
                      <div className="text-right flex-shrink-0">
                        <div className="font-bold text-lg text-foreground">
                          <AnimatedCounter value={participant.totalPoints} duration={800} />
                        </div>
                        <p className="text-xs text-muted-foreground">points</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Points Guide Button */}
        <div className="flex justify-center pt-4">
          <Button
            variant="outline"
            onClick={() => setShowPointsGuide(true)}
            className="flex items-center gap-2"
          >
            <BookOpen className="h-4 w-4" />
            Point System Guide
          </Button>
        </div>

        {/* Tournament Rulebook Modal */}
        <TournamentRulebook 
          isOpen={showPointsGuide}
          onClose={() => setShowPointsGuide(false)}
        />
      </div>
    </Layout>
  );
};

export default GoalsPage;