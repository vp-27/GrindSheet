import React, { useState, useEffect, useMemo } from 'react';
import Layout from '@/components/Layout';
import { useAppContext } from '@/context/useAppContext';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Trophy, 
  Target, 
  TrendingUp, 
  Calendar, 
  Star, 
  Flame, 
  CheckCircle, 
  Timer,
  Zap,
  Award,
  Crown,
  Medal,
  Activity,
  Plus,
  ChevronRight,
  Clock,
  Users,
  BookOpen
} from 'lucide-react';
import { 
  Tournament, 
  TournamentParticipant,
  BadgeType
} from '@/types';
import { 
  generateCurrentTournament, 
  POINTS_CONFIG,
  BADGE_DEFINITIONS,
  getTournamentCountdown
} from '@/utils/tournamentUtils';
import { supabase } from '@/integrations/supabase/client';
import ProgressTracker from '@/components/ProgressTracker';
import '@/styles/index.css';

const GoalsPage: React.FC = () => {
  const { profile } = useAuth();
  const { categories, exercises, exerciseLogs } = useAppContext();
  
  const [currentTournament, setCurrentTournament] = useState<Tournament | null>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [allExerciseLogs, setAllExerciseLogs] = useState<any[]>([]);
  const [contentReady, setContentReady] = useState(false);
  const [activeTab, setActiveTab] = useState<'goals' | 'challenges' | 'achievements'>('goals');

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

  // Generate tournament when data is available
  useEffect(() => {
    if (users.length > 0 && allExerciseLogs.length > 0 && exercises.length > 0 && categories.length > 0) {
      const current = generateCurrentTournament(users, allExerciseLogs, exercises, categories);
      setCurrentTournament(current);
    }
  }, [users, allExerciseLogs, exercises, categories]);

  // Get current user's tournament data
  const currentUserData = useMemo(() => {
    if (!currentTournament || !profile) return null;
    return currentTournament.participants.find(p => p.user.id === profile.id);
  }, [currentTournament, profile]);

  // Get user's progress trackers
  const progressTrackers = useMemo(() => {
    if (!currentUserData?.progressTrackers) return [];
    return Object.entries(currentUserData.progressTrackers).map(([key, tracker]) => {
      const typedTracker = tracker as any;
      return {
        key,
        current: typedTracker.current,
        goal: typedTracker.goal,
        text: typedTracker.text,
        points: typedTracker.points,
        isAchieved: typedTracker.isAchieved,
        completedAt: typedTracker.completedAt,
        name: typedTracker.text // Use text as name for display
      };
    });
  }, [currentUserData]);

  // Get user's badges
  const userBadges = useMemo(() => {
    if (!currentUserData?.badges) return [];
    return currentUserData.badges;
  }, [currentUserData]);

  // Get badge icon
  const getBadgeIcon = (badgeType: BadgeType) => {
    switch (badgeType) {
      case BadgeType.FIRST_PR: return <Star className="h-4 w-4" />;
      case BadgeType.CONSISTENCY_KING: return <Calendar className="h-4 w-4" />;
      case BadgeType.IMPROVEMENT_STAR: return <TrendingUp className="h-4 w-4" />;
      case BadgeType.WEEKEND_WARRIOR: return <Activity className="h-4 w-4" />;
      case BadgeType.CATEGORY_MASTER: return <Trophy className="h-4 w-4" />;
      case BadgeType.NEWCOMER_BONUS: return <Users className="h-4 w-4" />;
      case BadgeType.PERFECT_WEEK: return <Zap className="h-4 w-4" />;
      case BadgeType.VOLUME_CRUSHER: return <Flame className="h-4 w-4" />;
      case BadgeType.CORE_DESTROYER: return <Award className="h-4 w-4" />;
      default: return <Award className="h-4 w-4" />;
    }
  };

  // Get badge styles
  const getBadgeStyles = (badgeType: BadgeType) => {
    // Default badge colors based on type
    const badgeColors: Record<BadgeType, { bg: string; text: string }> = {
      [BadgeType.FIRST_PR]: { bg: '#10b981', text: 'white' },
      [BadgeType.CONSISTENCY_KING]: { bg: '#3b82f6', text: 'white' },
      [BadgeType.IMPROVEMENT_STAR]: { bg: '#f59e0b', text: 'white' },
      [BadgeType.WEEKEND_WARRIOR]: { bg: '#8b5cf6', text: 'white' },
      [BadgeType.CATEGORY_MASTER]: { bg: '#ef4444', text: 'white' },
      [BadgeType.NEWCOMER_BONUS]: { bg: '#06b6d4', text: 'white' },
      [BadgeType.PERFECT_WEEK]: { bg: '#f97316', text: 'white' },
      [BadgeType.VOLUME_CRUSHER]: { bg: '#ec4899', text: 'white' },
      [BadgeType.CORE_DESTROYER]: { bg: '#84cc16', text: 'white' }
    };
    
    return {
      backgroundColor: badgeColors[badgeType]?.bg || '#6b7280',
      color: badgeColors[badgeType]?.text || 'white'
    };
  };

  // Get badge short name
  const getBadgeShortName = (badgeType: BadgeType) => {
    const badge = BADGE_DEFINITIONS[badgeType];
    return badge?.name || badgeType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  // Get available challenges (PRs to beat)
  const availableChallenges = useMemo(() => {
    if (!currentTournament || !profile) return [];
    
    const challenges = [];
    const currentUser = currentTournament.participants.find(p => p.user.id === profile.id);
    if (!currentUser) return [];

    // Get other users' PRs that current user can beat
    currentTournament.participants.forEach(participant => {
      if (participant.user.id === profile.id) return;
      
      participant.exerciseStats.forEach(stat => {
        const userStat = currentUser.exerciseStats.find(s => s.exerciseId === stat.exerciseId);
        if (userStat && stat.personalRecord > userStat.personalRecord) {
          const exercise = exercises.find(e => e.id === stat.exerciseId);
          const category = categories.find(c => c.id === exercise?.categoryId);
          
          challenges.push({
            exerciseId: stat.exerciseId,
            exerciseName: exercise?.name || 'Unknown Exercise',
            category: category,
            friendName: participant.user.name,
            friendPR: stat.personalRecord,
            userBest: userStat.personalRecord,
            deficit: stat.personalRecord - userStat.personalRecord
          });
        }
      });
    });

    return challenges.sort((a, b) => a.deficit - b.deficit); // Sort by easiest to beat
  }, [currentTournament, profile, exercises, categories]);

  return (
    <Layout title="Goals & Challenges">
      <div className={`space-y-6 transition-opacity duration-500 ${contentReady ? 'opacity-100' : 'opacity-0'}`}>
        {/* Tab Navigation */}
        <div className="flex space-x-1 bg-muted p-1 rounded-lg">
          <Button
            variant={activeTab === 'goals' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('goals')}
            className="flex-1"
          >
            <Target className="h-4 w-4 mr-2" />
            Goals
          </Button>
          <Button
            variant={activeTab === 'challenges' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('challenges')}
            className="flex-1"
          >
            <Trophy className="h-4 w-4 mr-2" />
            Challenges
          </Button>
          <Button
            variant={activeTab === 'achievements' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('achievements')}
            className="flex-1"
          >
            <Award className="h-4 w-4 mr-2" />
            Achievements
          </Button>
        </div>

        {/* Goals Tab */}
        {activeTab === 'goals' && (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Target className="h-5 w-5 mr-2" />
                  Weekly Goals
                </CardTitle>
              </CardHeader>
              <CardContent>
                {progressTrackers.length > 0 ? (
                  <div className="space-y-4">
                    {progressTrackers.map((tracker) => (
                      <div key={tracker.key} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">{tracker.name}</span>
                          <span className="text-sm text-muted-foreground">
                            {tracker.current.toFixed(1)} / {tracker.goal.toFixed(1)}
                          </span>
                        </div>
                        <Progress 
                          value={(tracker.current / tracker.goal) * 100} 
                          className="h-2"
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-4">
                    Start logging exercises to see your weekly goals!
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Progress Tracker Component */}
            {currentUserData && (
              <ProgressTracker 
                progressTrackers={currentUserData.progressTrackers}
                tournament={currentTournament}
                currentUser={currentUserData}
              />
            )}
          </div>
        )}

        {/* Challenges Tab */}
        {activeTab === 'challenges' && (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Trophy className="h-5 w-5 mr-2" />
                  Beat Your Friends' PRs
                </CardTitle>
              </CardHeader>
              <CardContent>
                {availableChallenges.length > 0 ? (
                  <div className="space-y-3">
                    {availableChallenges.slice(0, 10).map((challenge, index) => (
                      <div 
                        key={`${challenge.exerciseId}-${challenge.friendName}`}
                        className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                      >
                        <div className="flex-1">
                          <h4 className="font-medium">{challenge.exerciseName}</h4>
                          <p className="text-sm text-muted-foreground">
                            Beat {challenge.friendName}'s PR of {challenge.friendPR} lbs
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium">
                            +{challenge.deficit} lbs needed
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Your best: {challenge.userBest} lbs
                          </div>
                        </div>
                      </div>
                    ))}
                    {availableChallenges.length > 10 && (
                      <p className="text-sm text-muted-foreground text-center">
                        And {availableChallenges.length - 10} more challenges...
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-4">
                    No challenges available. Keep working out to unlock more!
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Achievements Tab */}
        {activeTab === 'achievements' && (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Award className="h-5 w-5 mr-2" />
                  Your Badges
                </CardTitle>
              </CardHeader>
              <CardContent>
                {userBadges.length > 0 ? (
                  <div className="grid grid-cols-2 gap-3">
                    {userBadges.map((badge, index) => (
                      <div 
                        key={index}
                        className="flex items-center p-3 bg-muted/50 rounded-lg"
                        style={getBadgeStyles(badge.type)}
                      >
                        {getBadgeIcon(badge.type)}
                        <span className="ml-2 text-sm font-medium">
                          {getBadgeShortName(badge.type)}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-4">
                    No badges earned yet. Keep working out to earn achievements!
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Tournament Stats */}
            {currentUserData && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Crown className="h-5 w-5 mr-2" />
                    Tournament Stats
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">
                        {currentUserData.totalPoints}
                      </div>
                      <div className="text-sm text-muted-foreground">Total Points</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">
                        {currentUserData.rank}
                      </div>
                      <div className="text-sm text-muted-foreground">Current Rank</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default GoalsPage;