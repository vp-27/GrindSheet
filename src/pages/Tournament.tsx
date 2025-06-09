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
  BadgeType,
  LeaderboardType 
} from '@/types';
import { 
  generateCurrentTournament, 
  generateTournamentHistory,
  POINTS_CONFIG,
  BADGE_DEFINITIONS 
} from '@/utils/tournamentUtils';
import { 
  getLeaderboard, 
  calculatePRChampionshipSummary, 
  calculateCategoryProgressLeaders 
} from '@/utils/progressUtils';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { getCategoryChartColors, getCategoryKeyByName, getCategoryColors } from '@/utils/categoryColors';
import { supabase } from '@/integrations/supabase/client';
import '@/components/ui/category-styles.css';

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

  // PR Leaderboard state
  const [activeTab, setActiveTab] = useState<'tournament' | 'records'>('tournament');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all');

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
      <div className="space-y-6 relative">
        {/* Clean Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center shadow-sm">
              <Trophy className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">
                {currentTournament ? currentTournament.name : 'Tournament'}
              </h1>
              {currentTournament && (
                <p className="text-sm text-muted-foreground">
                  {currentTournament.participants.length} competitors
                </p>
              )}
            </div>
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setShowPointsGuide(!showPointsGuide)}
            className="rounded-2xl transition-all duration-200"
          >
            {showPointsGuide ? (
              <div className="flex items-center gap-2">
                <span className="text-xs">×</span>
                <span>Close</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4" />
                <span>Guide</span>
              </div>
            )}
          </Button>
        </div>

          {/* Streamlined Points Guide */}
          {showPointsGuide && (
            <Card className="rounded-2xl bg-card/80 backdrop-blur-sm border-border/50">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Target className="h-4 w-4" />
                  How Points Are Earned
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Trophy className="h-4 w-4 text-yellow-500" />
                      <span className="text-sm font-semibold">Personal Record</span>
                    </div>
                    <div className="mb-2">
                      <span className="text-2xl font-bold text-yellow-600">{POINTS_CONFIG.PR_ACHIEVEMENT.points}</span>
                      <span className="text-sm text-muted-foreground ml-1">points</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Beat your previous best weight on any exercise
                    </p>
                  </div>
                  
                  <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm font-semibold">Daily Workout</span>
                    </div>
                    <div className="mb-2">
                      <span className="text-2xl font-bold text-green-600">{POINTS_CONFIG.DAILY_WORKOUT.points}</span>
                      <span className="text-sm text-muted-foreground ml-1">points</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Log at least one exercise on any day
                    </p>
                  </div>
                  
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Flame className="h-4 w-4 text-blue-500" />
                      <span className="text-sm font-semibold">Consistency Bonus</span>
                    </div>
                    <div className="mb-2">
                      <span className="text-2xl font-bold text-blue-600">{POINTS_CONFIG.CONSISTENCY_BONUS.points}</span>
                      <span className="text-sm text-muted-foreground ml-1">points</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Work out 5 or more days in the week
                    </p>
                  </div>
                  
                  <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Star className="h-4 w-4 text-purple-500" />
                      <span className="text-sm font-semibold">Special Badges</span>
                    </div>
                    <div className="mb-2">
                      <span className="text-2xl font-bold text-purple-600">5-25</span>
                      <span className="text-sm text-muted-foreground ml-1">points</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Weekend Warrior, First PR, Perfect Week, etc.
                    </p>
                  </div>
                </div>
                
                <div className="border-t border-border/50 pt-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Crown className="h-4 w-4 text-amber-500" />
                    <span className="text-sm font-semibold text-foreground">Weekly Tournament</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Compete with friends every week (Monday-Sunday). Most points wins! 
                    Tournament resets automatically each Monday.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Simplified Tournament Selection */}
          {tournamentHistory.length > 0 && (
            <div className="flex gap-2 overflow-x-auto pb-2">
              <Button
                variant={selectedTournament?.id === currentTournament?.id ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedTournament(currentTournament)}
                className="rounded-2xl whitespace-nowrap"
              >
                Current
              </Button>
              {tournamentHistory
                .slice()
                .reverse()
                .map(tournament => (
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

          {/* Clean Tab System */}
          <div className="bg-muted/20 p-1 rounded-2xl">
            <div className="grid grid-cols-2 gap-1">
              <Button
                variant={activeTab === 'tournament' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setActiveTab('tournament')}
                className={`rounded-xl transition-all duration-200 ${
                  activeTab === 'tournament'
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'hover:bg-background/50'
                }`}
              >
                <Trophy className="h-4 w-4 mr-2" />
                Tournament
              </Button>
              <Button
                variant={activeTab === 'records' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setActiveTab('records')}
                className={`rounded-xl transition-all duration-200 ${
                  activeTab === 'records'
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'hover:bg-background/50'
                }`}
              >
                <Medal className="h-4 w-4 mr-2" />
                PR Records
              </Button>
            </div>
          </div>

          {/* Tournament Leaderboard */}
          {activeTab === 'tournament' && selectedTournament && (
            <div className="space-y-3">
              {selectedTournament.participants.length > 0 ? (
                selectedTournament.participants.map((participant, index) => 
                  renderParticipant(participant, index)
                )
              ) : (
                <Card className="rounded-2xl border-border/50 bg-card/50 backdrop-blur-sm">
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

          {/* PR Records Section with Apple-esque Design */}
          {activeTab === 'records' && (
            <div className="space-y-4">
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

              {/* PR Records Content */}
              {(() => {
                const leaderboardData = getLeaderboard(
                  allExerciseLogs,
                  users,
                  LeaderboardType.EXERCISE_PR,
                  undefined, // Always show all exercises
                  selectedCategoryId === 'all' ? undefined : selectedCategoryId
                );

                if (leaderboardData.length === 0) {
                  return (
                    <Card className="rounded-2xl border-border/50 bg-card/50 backdrop-blur-sm">
                      <CardContent className="p-12 text-center">
                        <Trophy className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-foreground mb-2">No Records Found</h3>
                        <p className="text-muted-foreground text-sm">
                          No data available for this selection. Start logging workouts to see PR records!
                        </p>
                      </CardContent>
                    </Card>
                  );
                }

                return (
                  <div className="space-y-3">
                    {/* PR Championship Summary - always show when no specific category selected */}
                    {selectedCategoryId === 'all' && (() => {
                      const prChampionshipSummary = calculatePRChampionshipSummary(allExerciseLogs, users);
                      return prChampionshipSummary && prChampionshipSummary.champion ? (
                        <Card className="rounded-2xl bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20 border border-yellow-200 dark:border-yellow-800">
                          <CardContent className="p-4">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center shadow-sm">
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
                          </CardContent>
                        </Card>
                      ) : null;
                    })()}
                    
                    {/* PR Records List with Apple Health style cards */}
                    {leaderboardData.map((entry, index) => {
                      const position = index + 1;
                      const user = entry.user || { id: '', name: 'Unknown', username: '', avatarUrl: undefined };
                      const isCurrentUser = user.id === profile?.id;
                      const isOverviewMode = true; // Always show overview mode since we removed exercise filtering
                      
                      // Get exercise details for overview mode
                      const exercise = (isOverviewMode && entry.exerciseId) 
                        ? exercises.find(e => e.id === entry.exerciseId)
                        : null;
                      const exerciseName = exercise?.name;
                      const exerciseCategory = exercise?.categoryId ? categories.find(c => c.id === exercise.categoryId) : null;
                      
                      if (isOverviewMode) {
                        // Apple Health style overview cards
                        const tiedUsers = entry.users || [user];
                        const showMultipleAvatars = tiedUsers.length > 1;
                        
                        // Get category color for the exercise title
                        const categoryKey = exerciseCategory ? getCategoryKeyByName(exerciseCategory.name) : 'default';
                        const categoryColors = getCategoryColors(categoryKey);
                        
                        return (
                          <Card 
                            key={entry.exerciseId || index}
                            className="rounded-2xl bg-card/80 backdrop-blur-sm border-border/50 hover:bg-card/90 transition-colors"
                            style={{
                              '--category-color': categoryColors.primary
                            } as React.CSSProperties}
                          >
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between mb-3">
                                <div>
                                  <h3 className="font-bold text-lg apple-health-card-title">
                                    {exerciseName}
                                  </h3>
                                  {exerciseCategory && (
                                    <span className="text-xs text-muted-foreground font-medium">
                                      {exerciseCategory.name}
                                    </span>
                                  )}
                                </div>
                                {entry.isTie && (
                                  <span className="text-xs bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300 px-2 py-1 rounded-full font-medium">
                                    Tie
                                  </span>
                                )}
                              </div>
                              
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  {showMultipleAvatars ? (
                                    <div className="flex -space-x-2">
                                      {tiedUsers.map((tiedUser, idx) => (
                                        <Avatar key={tiedUser.id} className="h-8 w-8 border-2 border-white shadow-sm">
                                          <AvatarImage src={tiedUser.avatarUrl} alt={tiedUser.name} />
                                          <AvatarFallback className="bg-gray-100 text-gray-700 text-sm font-medium">
                                            {tiedUser.name?.substring(0, 2).toUpperCase() || 'U'}
                                          </AvatarFallback>
                                        </Avatar>
                                      ))}
                                    </div>
                                  ) : (
                                    <div className="flex items-center gap-3">
                                      <Avatar className="h-8 w-8">
                                        <AvatarImage src={user.avatarUrl} alt={user.name} />
                                        <AvatarFallback className="bg-muted text-muted-foreground text-sm font-medium">
                                          {user.name?.substring(0, 2).toUpperCase() || 'U'}
                                        </AvatarFallback>
                                      </Avatar>
                                      <span className="font-semibold text-foreground">
                                        {user.name}
                                      </span>
                                    </div>
                                  )}
                                </div>

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
                            </CardContent>
                          </Card>
                        );
                      }
                    })}
                  </div>
                );
              })()}
            </div>
          )}

        </div>
      </Layout>
  );
};

export default TournamentPage;
