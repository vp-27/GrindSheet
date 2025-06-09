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
  Timer,
  ChevronDown,
  ChevronUp
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
  const [expandedParticipant, setExpandedParticipant] = useState<string | null>(null);

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
    const isExpanded = expandedParticipant === participant.userId;
    
    // Enhanced card styling based on rank
    const getCardStyling = (rank: number, isCurrentUser: boolean) => {
      // Remove the green override for current user to show rank colors
      switch (rank) {
        case 1:
          return 'bg-gradient-to-r from-amber-50 via-yellow-50 to-orange-50 dark:from-amber-950/30 dark:via-yellow-950/30 dark:to-orange-950/30 border-amber-300/50 dark:border-amber-700/50 shadow-lg';
        case 2:
          return 'bg-gradient-to-r from-slate-50 via-gray-50 to-zinc-50 dark:from-slate-950/30 dark:via-gray-950/30 dark:to-zinc-950/30 border-slate-300/50 dark:border-slate-700/50 shadow-md';
        case 3:
          return 'bg-gradient-to-r from-orange-50 via-amber-50 to-yellow-50 dark:from-orange-950/30 dark:via-amber-950/30 dark:to-yellow-950/30 border-orange-300/50 dark:border-orange-700/50 shadow-md';
        default:
          return 'bg-card/80 backdrop-blur-sm border-border/50 hover:bg-card/90 transition-colors';
      }
    };
    
    return (
      <Card 
        key={participant.userId}
        className={`relative rounded-xl ${getCardStyling(participant.rank, isCurrentUser)}`}
      >
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            {/* Position Badge */}
            <div className="flex-shrink-0">
              {renderPositionBadge(participant.rank)}
            </div>

            {/* User Info */}
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <Avatar className="h-10 w-10 ring-2 ring-white dark:ring-gray-800">
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
                    <span className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 px-2 py-0.5 rounded-full font-medium border border-blue-200 dark:border-blue-800">
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
                        className="text-xs px-2 py-0.5 bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300"
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

          {/* Points Breakdown (always visible) */}
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

          {/* Expandable Date Details Toggle */}
          <div className="mt-3 pt-3 border-t border-border/50">
            <button
              onClick={() => setExpandedParticipant(isExpanded ? null : participant.userId)}
              className="w-full flex items-center justify-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <span>Date Details</span>
              {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>

            {/* Expandable Date Breakdown */}
            {isExpanded && (
              <div className="mt-3 space-y-3 text-xs">
                {/* Workout Days */}
                {participant.workoutDays.length > 0 && (
                  <div className="bg-white/20 dark:bg-black/10 rounded p-3">
                    <h4 className="font-medium text-foreground mb-2">Workout Days ({participant.workoutDays.length})</h4>
                    <div className="flex flex-wrap gap-1">
                      {participant.workoutDays.map((date, idx) => (
                        <span key={idx} className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-2 py-1 rounded text-xs">
                          {new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* PR Details */}
                {participant.prDetails.length > 0 && (
                  <div className="bg-white/20 dark:bg-black/10 rounded p-3">
                    <h4 className="font-medium text-foreground mb-2">Personal Records ({participant.prDetails.length})</h4>
                    <div className="space-y-2">
                      {participant.prDetails.map((pr, idx) => (
                        <div key={idx} className="bg-white/10 dark:bg-black/5 rounded p-2">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-medium text-sm text-foreground">{pr.exerciseName}</span>
                            <span className="text-xs text-muted-foreground">
                              {new Date(pr.achievedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-xs">
                            <div className="flex gap-2">
                              <span className="text-muted-foreground">
                                {pr.previousBest > 0 ? `${pr.previousBest}lbs → ` : 'First time: '}
                              </span>
                              <span className="font-bold text-green-600 dark:text-green-400">
                                {pr.weight}lbs
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              {pr.improvementPercent > 0 && (
                                <span className="text-green-600 dark:text-green-400 font-medium">
                                  +{pr.improvementPercent.toFixed(1)}%
                                </span>
                              )}
                              <span className="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 px-2 py-0.5 rounded font-medium">
                                +75 pts
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Badge Details */}
                {participant.badges.length > 0 && (
                  <div className="bg-white/20 dark:bg-black/10 rounded p-3">
                    <h4 className="font-medium text-foreground mb-2">Badges Earned</h4>
                    <div className="space-y-2">
                      {participant.badges.map(badge => (
                        <div key={badge.id} className="bg-white/10 dark:bg-black/5 rounded p-2">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-medium text-sm text-foreground">{badge.name}</span>
                            <span className="text-xs text-muted-foreground">
                              {new Date(badge.earnedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">{badge.description}</span>
                            <span className="bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded text-xs font-medium">
                              +{badge.points} pts
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Consistency Details */}
                {(participant.pointsBreakdown.consistencyPoints > 0 || participant.pointsBreakdown.participationPoints > 0) && (
                  <div className="bg-white/20 dark:bg-black/10 rounded p-3">
                    <h4 className="font-medium text-foreground mb-2">Activity Points</h4>
                    <div className="space-y-2">
                      {participant.pointsBreakdown.participationPoints > 0 && (
                        <div className="bg-white/10 dark:bg-black/5 rounded p-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-foreground">Daily Workouts ({participant.workoutDays.length} days)</span>
                            <span className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-2 py-0.5 rounded text-xs font-medium">
                              +{participant.pointsBreakdown.participationPoints} pts
                            </span>
                          </div>
                        </div>
                      )}
                      {participant.pointsBreakdown.consistencyPoints > 0 && (
                        <div className="bg-white/10 dark:bg-black/5 rounded p-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-foreground">Consistency Bonus (5+ days)</span>
                            <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded text-xs font-medium">
                              +{participant.pointsBreakdown.consistencyPoints} pts
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  // Points guide component
  const PointsGuide = () => (
    <Card className="rounded-xl border-border/50 bg-card/80 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5" />
          Points System Guide
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
              <div className="flex items-center gap-2">
                <Trophy className="h-4 w-4 text-yellow-500" />
                <span className="font-medium">New Personal Record</span>
              </div>
              <span className="font-bold text-yellow-600">{POINTS_CONFIG.PR_ACHIEVEMENT.points} pts</span>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="font-medium">Daily Workout Completion</span>
              </div>
              <span className="font-bold text-green-600">{POINTS_CONFIG.DAILY_WORKOUT.points} pts</span>
            </div>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <div className="flex items-center gap-2">
                <Flame className="h-4 w-4 text-red-500" />
                <span className="font-medium">Consistency Bonus (5+ days)</span>
              </div>
              <span className="font-bold text-red-600">{POINTS_CONFIG.CONSISTENCY_BONUS.points} pts</span>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-orange-500" />
                <span className="font-medium">Weekend Warrior Bonus</span>
              </div>
              <span className="font-bold text-orange-600">+{POINTS_CONFIG.WEEKEND_BONUS.points} bonus</span>
            </div>
          </div>
        </div>
        
        <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 rounded-lg">
          <div className="text-sm text-muted-foreground">
            <strong className="text-foreground">Special Badges:</strong> Earn additional bonus points for achievements like Perfect Week (7 workout days), Category Master (PRs in multiple categories), Consistency King (longest streak), and more special accomplishments throughout the week!
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
    <div className="min-h-screen bg-gradient-to-br from-purple-100 via-blue-50 via-indigo-50 to-amber-50 dark:from-purple-950/40 dark:via-blue-950/30 dark:via-indigo-950/30 dark:to-amber-950/20">
      <Layout title="Tournament">
        <div className="space-y-6 relative">
          {/* Enhanced Header with tournament branding */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {currentTournament && (
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center shadow-lg">
                  <Trophy className="h-6 w-6 text-white" />
                </div>
              )}
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 dark:from-purple-400 dark:to-blue-400 bg-clip-text text-transparent">
                  {currentTournament ? currentTournament.name : 'Tournament'}
                </h1>
                {currentTournament && (
                  <p className="text-sm text-muted-foreground">
                    {currentTournament.participants.length} competitors • {currentTournament.status}
                  </p>
                )}
              </div>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowPointsGuide(!showPointsGuide)}
              className="rounded-xl border-purple-200 dark:border-purple-800 hover:bg-purple-50 dark:hover:bg-purple-950/50"
            >
              <Target className="h-4 w-4 mr-2" />
              Points Guide
            </Button>
          </div>

          {/* Points Guide */}
          {showPointsGuide && <PointsGuide />}

          {/* Tournament Selection with enhanced styling */}
          {tournamentHistory.length > 0 && (
            <div className="flex gap-2 overflow-x-auto pb-2">
              <Button
                variant={selectedTournament?.id === currentTournament?.id ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedTournament(currentTournament)}
                className={`rounded-xl whitespace-nowrap ${
                  selectedTournament?.id === currentTournament?.id 
                    ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white' 
                    : 'border-purple-200 dark:border-purple-800 hover:bg-purple-50 dark:hover:bg-purple-950/50'
                }`}
              >
                Current Week
              </Button>
              {tournamentHistory.map(tournament => (
                <Button
                  key={tournament.id}
                  variant={selectedTournament?.id === tournament.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedTournament(tournament)}
                  className={`rounded-xl whitespace-nowrap ${
                    selectedTournament?.id === tournament.id
                      ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white'
                      : 'border-purple-200 dark:border-purple-800 hover:bg-purple-50 dark:hover:bg-purple-950/50'
                  }`}
                >
                  Week of {new Date(tournament.weekStart).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </Button>
              ))}
            </div>
          )}

          {/* Tournament Leaderboard with enhanced card design */}
          {selectedTournament && (
            <div className="space-y-3">
              {selectedTournament.participants.length > 0 ? (
                selectedTournament.participants.map((participant, index) => 
                  renderParticipant(participant, index)
                )
              ) : (
                <Card className="rounded-xl border-border/50 bg-card/50 backdrop-blur-sm">
                  <CardContent className="p-12 text-center">
                    <Trophy className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-foreground mb-2">No Participants Yet</h3>
                    <p className="text-muted-foreground text-sm">
                      Log a workout to join the tournament!
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>
      </Layout>
    </div>
  );
};

export default TournamentPage;
