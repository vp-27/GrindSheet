import React, { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { useAppContext } from '@/context/useAppContext';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
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
  Timer
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
  BADGE_DEFINITIONS 
} from '@/utils/tournamentUtils';
import { supabase } from '@/integrations/supabase/client';

const TournamentPage: React.FC = () => {
  const { profile } = useAuth();
  const { categories, exercises } = useAppContext();
  
  const [currentTournament, setCurrentTournament] = useState<Tournament | null>(null);
  const [tournamentHistory, setTournamentHistory] = useState<Tournament[]>([]);
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [allExerciseLogs, setAllExerciseLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPointsGuide, setShowPointsGuide] = useState(false);

  // Fetch data on mount
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      
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
      
      setLoading(false);
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
      setSelectedTournament(current);
    }
  }, [users, allExerciseLogs, exercises, categories]);

  // Badge icon mapping
  const getBadgeIcon = (badgeType: BadgeType) => {
    switch (badgeType) {
      case BadgeType.FIRST_PR:
        return <Trophy className="h-3 w-3" />;
      case BadgeType.CONSISTENCY_KING:
        return <Crown className="h-3 w-3" />;
      case BadgeType.IMPROVEMENT_STAR:
        return <Star className="h-3 w-3" />;
      case BadgeType.WEEKEND_WARRIOR:
        return <Zap className="h-3 w-3" />;
      case BadgeType.CATEGORY_MASTER:
        return <Target className="h-3 w-3" />;
      case BadgeType.NEWCOMER_BONUS:
        return <CheckCircle className="h-3 w-3" />;
      case BadgeType.PERFECT_WEEK:
        return <Flame className="h-3 w-3" />;
      default:
        return <Award className="h-3 w-3" />;
    }
  };

  // Position badge rendering
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

  // Render participant entry
  const renderParticipant = (participant: TournamentParticipant, index: number) => {
    const isCurrentUser = participant.userId === profile?.id;
    
    return (
      <div 
        key={participant.userId}
        className={`group relative p-4 border border-border rounded-2xl transition-all duration-300 ${
          isCurrentUser 
            ? 'bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border-green-200 dark:border-green-800' 
            : 'bg-card hover:bg-muted/50'
        }`}
      >
        <div className="flex items-center gap-4">
          {/* Position Badge */}
          <div className="flex-shrink-0">
            {renderPositionBadge(participant.rank)}
          </div>

          {/* User Info */}
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <Avatar className="h-10 w-10">
              <AvatarImage src={participant.user.avatarUrl} alt={participant.user.name} />
              <AvatarFallback className="bg-muted text-muted-foreground">
                {participant.user.name?.substring(0, 2).toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-foreground truncate">
                  {participant.user.name}
                </h3>
                {isCurrentUser && (
                  <span className="text-xs bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 px-2 py-0.5 rounded-full font-medium">
                    You
                  </span>
                )}
              </div>
              
              {/* Badges */}
              {participant.badges.length > 0 && (
                <div className="flex gap-1 mt-1 flex-wrap">
                  {participant.badges.slice(0, 3).map(badge => (
                    <Badge 
                      key={badge.id} 
                      variant="secondary" 
                      className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                    >
                      {getBadgeIcon(badge.type)}
                      <span className="ml-1">{badge.name}</span>
                    </Badge>
                  ))}
                  {participant.badges.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{participant.badges.length - 3}
                    </Badge>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Points and Stats */}
          <div className="text-right flex-shrink-0">
            <div className="font-bold text-xl text-foreground">
              {participant.totalPoints}
            </div>
            <div className="text-xs text-muted-foreground">
              points
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {participant.workoutDays.length} workout days
            </div>
          </div>
        </div>

        {/* Points Breakdown (expandable) */}
        <div className="mt-3 pt-3 border-t border-border/50">
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">PRs:</span>
              <span className="font-medium">{participant.pointsBreakdown.prPoints}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Consistency:</span>
              <span className="font-medium">{participant.pointsBreakdown.consistencyPoints}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Participation:</span>
              <span className="font-medium">{participant.pointsBreakdown.participationPoints}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Bonuses:</span>
              <span className="font-medium">{participant.pointsBreakdown.bonusPoints}</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Points guide component
  const PointsGuide = () => (
    <Card className="rounded-2xl border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5" />
          Points System Guide
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3">
          <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2">
              <Trophy className="h-4 w-4 text-yellow-500" />
              <span className="font-medium">New PR</span>
            </div>
            <span className="font-bold text-yellow-600">{POINTS_CONFIG.PR_ACHIEVEMENT.points} pts</span>
          </div>
          
          <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-blue-500" />
              <span className="font-medium">Daily Workout</span>
            </div>
            <span className="font-bold text-blue-600">{POINTS_CONFIG.DAILY_WORKOUT.points} pts</span>
          </div>
          
          <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="font-medium">5+ Days Consistency</span>
            </div>
            <span className="font-bold text-green-600">{POINTS_CONFIG.CONSISTENCY_BONUS.points} pts</span>
          </div>
          
          <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-purple-500" />
              <span className="font-medium">Improvement %</span>
            </div>
            <span className="font-bold text-purple-600">{POINTS_CONFIG.IMPROVEMENT_PERCENT.points} pts per 1%</span>
          </div>
          
          <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-orange-500" />
              <span className="font-medium">Weekend Workouts</span>
            </div>
            <span className="font-bold text-orange-600">+{POINTS_CONFIG.WEEKEND_BONUS.points} bonus</span>
          </div>
        </div>
        
        <div className="mt-4 p-3 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 rounded-lg">
          <h4 className="font-semibold text-sm mb-2">Special Badges</h4>
          <div className="text-sm text-muted-foreground">
            Earn bonus points for achievements like Perfect Week ({BADGE_DEFINITIONS.perfect_week.points} pts), 
            Category Master ({BADGE_DEFINITIONS.category_master.points} pts), and more!
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <Layout title="Tournament">
        <div className="space-y-6">
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
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
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Tournament">
      <div className="space-y-6">
        {/* Header */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Weekly Tournament</h1>
              <p className="text-muted-foreground">Compete with friends and earn points for your achievements</p>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowPointsGuide(!showPointsGuide)}
              className="rounded-2xl"
            >
              <Target className="h-4 w-4 mr-2" />
              Points Guide
            </Button>
          </div>

          {/* Tournament Status */}
          {currentTournament && (
            <Card className="rounded-2xl border-border bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                      <Trophy className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">{currentTournament.name}</h3>
                      <p className="text-sm text-muted-foreground capitalize">{currentTournament.status} Tournament</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1 text-sm text-muted-foreground mb-1">
                      <Users className="h-3 w-3" />
                      {currentTournament.participants.length} participants
                    </div>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Timer className="h-3 w-3" />
                      {currentTournament.status === 'active' ? 'Ends' : 'Ended'} {new Date(currentTournament.weekEnd).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Points Guide */}
        {showPointsGuide && <PointsGuide />}

        {/* Tournament Selection */}
        {tournamentHistory.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-2">
            <Button
              variant={selectedTournament?.id === currentTournament?.id ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedTournament(currentTournament)}
              className="rounded-2xl whitespace-nowrap"
            >
              Current Week
            </Button>
            {tournamentHistory.map(tournament => (
              <Button
                key={tournament.id}
                variant={selectedTournament?.id === tournament.id ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedTournament(tournament)}
                className="rounded-2xl whitespace-nowrap"
              >
                {new Date(tournament.weekStart).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </Button>
            ))}
          </div>
        )}

        {/* Tournament Leaderboard */}
        {selectedTournament && (
          <Card className="rounded-2xl border-border shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Trophy className="h-5 w-5 text-yellow-500" />
                {selectedTournament.name}
                {selectedTournament.status === 'completed' && (
                  <Badge variant="secondary">Completed</Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 pt-0">
              {selectedTournament.participants.length > 0 ? (
                <div className="space-y-3">
                  {selectedTournament.participants.map((participant, index) => 
                    renderParticipant(participant, index)
                  )}
                </div>
              ) : (
                <div className="text-center py-16">
                  <div className="relative mb-6">
                    <div className="absolute inset-0 bg-gradient-to-r from-muted via-muted/50 to-muted rounded-full blur-2xl"></div>
                    <Trophy className="relative w-20 h-20 text-muted-foreground mx-auto" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-3">No Participants Yet</h3>
                  <p className="text-muted-foreground max-w-sm mx-auto leading-relaxed">
                    Be the first to log a workout this week and start earning tournament points!
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
};

export default TournamentPage;
