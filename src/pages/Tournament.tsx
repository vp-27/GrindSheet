import React, { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { useAppContext } from '@/context/useAppContext';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { MobileSlider } from '@/components/ui/mobile-slider';
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
          return 'bg-gradient-to-r from-slate-50 via-gray-50 to-zinc-50 dark:from-slate-950/30 dark:via-gray-950/30 dark:to-zinc-950/30 border-slate-300/50 dark:border-slate-700/50 shadow-md';
        default:
          return 'apple-card interactive';
      }
    };
    
    return (
      <Card 
        key={participant.userId}
        className={`relative rounded-3xl transition-all duration-500 ease-out transform ${getCardStyling(participant.rank, isCurrentUser)} ${
          isExpanded ? 'scale-[1.02] shadow-xl' : 'shadow-md'
        }`}
      >
        <CardContent className="p-6">
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
                    <span className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 px-3 py-1 rounded-full font-medium border border-blue-200 dark:border-blue-800">
                      You
                    </span>
                  )}
                </div>
                
                {/* Badges */}
                {participant.badges.length > 0 && (
                  <div className="flex gap-2 mt-2 flex-wrap">
                    {participant.badges.slice(0, 3).map(badge => (
                      <Badge 
                        key={badge.id} 
                        variant="secondary" 
                        className="text-xs px-3 py-1 bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 rounded-full border-0"
                      >
                        {getBadgeIcon(badge.type)}
                        <span className="ml-1">{badge.name}</span>
                      </Badge>
                    ))}
                    {participant.badges.length > 3 && (
                      <Badge variant="outline" className="text-xs rounded-full px-3 py-1">
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
          <div className="mt-4 pt-4 border-t border-border/30 transition-all duration-300">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">PRs:</span>
                <span className="font-medium bg-yellow-100/50 dark:bg-yellow-900/20 px-2 py-1 rounded-lg">
                  {participant.pointsBreakdown.prPoints}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Improvement:</span>
                <span className="font-medium bg-blue-100/50 dark:bg-blue-900/20 px-2 py-1 rounded-lg">
                  {participant.pointsBreakdown.improvementPoints}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Competitive:</span>
                <span className="font-medium bg-purple-100/50 dark:bg-purple-900/20 px-2 py-1 rounded-lg">
                  {participant.pointsBreakdown.competitivePoints || 0}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Consistency:</span>
                <span className="font-medium bg-green-100/50 dark:bg-green-900/20 px-2 py-1 rounded-lg">
                  {participant.pointsBreakdown.consistencyPoints}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Participation:</span>
                <span className="font-medium bg-orange-100/50 dark:bg-orange-900/20 px-2 py-1 rounded-lg">
                  {participant.pointsBreakdown.participationPoints}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Bonuses:</span>
                <span className="font-medium bg-pink-100/50 dark:bg-pink-900/20 px-2 py-1 rounded-lg">
                  {participant.pointsBreakdown.bonusPoints}
                </span>
              </div>
            </div>
          </div>

          {/* Expandable Date Details Toggle */}
          <div className="mt-4 pt-4 border-t border-border/30">
            <button
              onClick={() => setExpandedParticipant(isExpanded ? null : participant.userId)}
              className={`w-full flex items-center justify-center gap-2 text-sm font-medium transition-all duration-300 ease-out py-3 px-4 rounded-2xl ${
                isExpanded 
                  ? 'text-blue-600 dark:text-blue-400 bg-blue-50/80 dark:bg-blue-900/20' 
                  : 'text-muted-foreground bg-muted/30 active:bg-muted/50'
              }`}
            >
              <span>{isExpanded ? 'Hide Details' : 'Show Details'}</span>
              <div className={`transition-transform duration-300 ease-out ${isExpanded ? 'rotate-180' : 'rotate-0'}`}>
                <ChevronDown className="w-4 h-4" />
              </div>
            </button>

            {/* Expandable Date Breakdown with smooth animation */}
            <div className={`overflow-hidden transition-all duration-500 ease-out ${
              isExpanded ? 'max-h-[2000px] opacity-100 mt-4' : 'max-h-0 opacity-0 mt-0'
            }`}>
              <div className="space-y-4 text-sm">
                {/* Workout Days */}
                {participant.workoutDays.length > 0 && (
                  <div className="bg-white/20 dark:bg-black/10 rounded-2xl p-4">
                    <h4 className="font-medium text-foreground mb-3">Workout Days ({participant.workoutDays.length})</h4>
                    <div className="flex flex-wrap gap-2">
                      {participant.workoutDays.map((date, idx) => {
                        // Parse YYYY-MM-DD format to avoid timezone shifts
                        const [year, month, day] = date.split('-').map(Number);
                        const localDate = new Date(year, month - 1, day); // month is 0-indexed
                        return (
                          <span key={idx} className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-3 py-2 rounded-xl text-xs font-medium">
                            {localDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* PR Details */}
                {participant.prDetails.length > 0 && (
                  <div className="bg-white/20 dark:bg-black/10 rounded-2xl p-4">
                    <h4 className="font-medium text-foreground mb-3">Personal Records ({participant.prDetails.length})</h4>
                    <div className="space-y-3">
                      {participant.prDetails.map((pr, idx) => (
                        <div key={idx} className="bg-white/10 dark:bg-black/5 rounded-xl p-3">
                          <div className="flex items-center justify-between mb-2">
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
                              <span className="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 px-3 py-1 rounded-full font-medium">
                                +75 pts
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Competitive Bonuses */}
                {participant.competitiveDetails && participant.competitiveDetails.length > 0 && (
                  <div className="bg-white/20 dark:bg-black/10 rounded-2xl p-4">
                    <h4 className="font-medium text-foreground mb-3">Competitive Bonuses</h4>
                    <div className="space-y-3">
                      {participant.competitiveDetails.map((comp, idx) => (
                        <div key={idx} className="bg-white/10 dark:bg-black/5 rounded-xl p-3 flex items-center justify-between">
                          <span>
                            <span className="font-medium text-sm text-foreground">{comp.type}</span>
                            {comp.exerciseName && (
                              <span className="ml-2 text-foreground">({comp.exerciseName})</span>
                            )}
                            {comp.targetUser && (
                              <span className="ml-2 text-muted-foreground">vs {comp.targetUser}</span>
                            )}
                          </span>
                          <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-3 py-1 rounded-full text-xs font-medium">
                            +{comp.points} pts
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Badge Details */}
                {participant.badges.length > 0 && (
                  <div className="bg-white/20 dark:bg-black/10 rounded-2xl p-4">
                    <h4 className="font-medium text-foreground mb-3">Badges Earned</h4>
                    <div className="space-y-3">
                      {participant.badges.map(badge => (
                        <div key={badge.id} className="bg-white/10 dark:bg-black/5 rounded-xl p-3">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium text-sm text-foreground">{badge.name}</span>
                            <span className="text-xs text-muted-foreground">
                              {new Date(badge.earnedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">{badge.description}</span>
                            <span className="bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-3 py-1 rounded-full text-xs font-medium">
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
                  <div className="bg-white/20 dark:bg-black/10 rounded-xl p-4">
                    <h4 className="font-medium text-foreground mb-3">Activity Points</h4>
                    <div className="space-y-3">
                      {participant.pointsBreakdown.participationPoints > 0 && (
                        <div className="bg-white/10 dark:bg-black/5 rounded-lg p-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-foreground">Daily Workouts ({participant.workoutDays.length} days)</span>
                            <span className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-3 py-1 rounded-full text-xs font-medium">
                              +{participant.pointsBreakdown.participationPoints} pts
                            </span>
                          </div>
                        </div>
                      )}
                      {participant.pointsBreakdown.consistencyPoints > 0 && (
                        <div className="bg-white/10 dark:bg-black/5 rounded-lg p-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-foreground">Consistency Bonus (5+ days)</span>
                            <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-3 py-1 rounded-full text-xs font-medium">
                              +{participant.pointsBreakdown.consistencyPoints} pts
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
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
              <div key={i} className="flex items-center gap-4 p-6 border border-border rounded-3xl animate-pulse backdrop-blur-sm bg-white/50 dark:bg-black/20">
                <div className="w-8 h-8 bg-muted rounded-full flex-shrink-0" />
                <div className="w-10 h-10 bg-muted rounded-full flex-shrink-0" />
                <div className="flex-1 space-y-3 min-w-0">
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
    <Layout title={activeTab === 'records' ? 'PR Records' : 'Tournament'}>
      <div className="space-y-6 relative">
        {/* Clean Tab System using MobileSlider */}
        <MobileSlider
          options={[
            { id: 'tournament', label: 'Tournament' },
            { id: 'records', label: 'PR Records' }
          ]}
          activeOption={activeTab}
          onOptionChange={(optionId) => setActiveTab(optionId as 'tournament' | 'records')}
          variant="default"
          className="mb-6"
        />

        {/* Tournament-specific header and controls */}
        {activeTab === 'tournament' && (
          <>
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
              <Card className="apple-card">
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
                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <TrendingUp className="h-4 w-4 text-blue-500" />
                        <span className="text-sm font-semibold">Improvement</span>
                      </div>
                      <div className="mb-2">
                        <span className="text-2xl font-bold text-blue-600">2</span>
                        <span className="text-sm text-muted-foreground ml-1">points per 1% improvement (max 50 per exercise)</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Earn points for every percent you improve your PR in a week
                      </p>
                    </div>
                    <div className="bg-pink-50 dark:bg-pink-900/20 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Award className="h-4 w-4 text-pink-500" />
                        <span className="text-sm font-semibold">Competitive Bonuses</span>
                      </div>
                      <div className="mb-2">
                        <span className="text-2xl font-bold text-pink-600">20</span>
                        <span className="text-sm text-muted-foreground ml-1">Takeover</span>
                        <span className="text-2xl font-bold text-pink-600 ml-4">10</span>
                        <span className="text-sm text-muted-foreground ml-1">Close Win</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Takeover: Beat a friend’s PR in a shared exercise. Close Win: Beat a friend’s PR by less than 5%.
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
                    <div className="bg-orange-50 dark:bg-orange-900/20 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Flame className="h-4 w-4 text-orange-500" />
                        <span className="text-sm font-semibold">First Time PR</span>
                      </div>
                      <div className="mb-2">
                        <span className="text-2xl font-bold text-orange-600">10</span>
                        <span className="text-sm text-muted-foreground ml-1">points</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        First time logging an exercise (not as much as a true PR)
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

            {/* Tournament Week Selection with blue-purple design */}
            {(currentTournament || tournamentHistory.length > 0) && (
              <div className="flex gap-3 overflow-x-auto pb-3 px-1 scrollbar-hide">
                {/* Current Tournament Button */}
                {currentTournament && (
                  <Button
                    variant={selectedTournament?.id === currentTournament?.id ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedTournament(currentTournament)}
                    className={`rounded-3xl whitespace-nowrap transition-all duration-400 ease-out font-medium px-6 py-3 transform active:scale-95 ${
                      selectedTournament?.id === currentTournament?.id
                        ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white border-0 shadow-lg scale-105'
                        : 'border-2 border-blue-200/60 dark:border-blue-800/60 text-blue-600 dark:text-blue-400 bg-blue-50/30 dark:bg-blue-900/10 backdrop-blur-sm'
                    }`}
                  >
                    Current
                  </Button>
                )}
                
                {/* Past Tournament Buttons - filter out current tournament to avoid duplicates */}
                {tournamentHistory
                  .filter(tournament => tournament.id !== currentTournament?.id)
                  .slice()
                  .reverse()
                  .map(tournament => (
                  <Button
                    key={tournament.id}
                    variant={selectedTournament?.id === tournament.id ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedTournament(tournament)}
                    className={`rounded-3xl whitespace-nowrap transition-all duration-400 ease-out font-medium px-6 py-3 transform active:scale-95 ${
                      selectedTournament?.id === tournament.id
                        ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white border-0 shadow-lg scale-105'
                        : 'border-2 border-blue-200/60 dark:border-blue-800/60 text-blue-600 dark:text-blue-400 bg-blue-50/30 dark:bg-blue-900/10 backdrop-blur-sm opacity-75'
                    }`}
                  >
                    {new Date(tournament.weekStart).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </Button>
                ))}
              </div>
            )}
          </>
        )}

        {/* PR Records-specific header */}
        {activeTab === 'records' && (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-sm">
              <Medal className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">Personal Records</h1>
              <p className="text-sm text-muted-foreground">Best lifts across all exercises</p>
            </div>
          </div>
        )}

          {/* Tournament Leaderboard */}
          {activeTab === 'tournament' && selectedTournament && (
            <div className="space-y-4">
              {selectedTournament.participants.length > 0 ? (
                selectedTournament.participants.map((participant, index) => 
                  renderParticipant(participant, index)
                )
              ) : (
                <Card className="apple-card rounded-3xl">
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
                  selectedCategoryId === 'all' ? undefined : selectedCategoryId,
                  exercises
                );

                if (leaderboardData.length === 0) {
                  return (
                    <Card className="apple-card">
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
                    {/* PR Championship Summary - Overall or Category-specific */}
                    {(() => {
                      if (selectedCategoryId === 'all') {
                        // Overall PR Champion
                        const prChampionshipSummary = calculatePRChampionshipSummary(allExerciseLogs, users, exercises);
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
                      } else {
                        // Category-specific PR Champion
                        const categoryPRSummary = calculatePRChampionshipSummary(allExerciseLogs, users, exercises, selectedCategoryId);
                        const selectedCategory = categories.find(cat => cat.id === selectedCategoryId);
                        const categoryKey = selectedCategory ? getCategoryKeyByName(selectedCategory.name) : 'default';
                        const categoryColors = getCategoryColors(categoryKey);
                        
                        return categoryPRSummary && categoryPRSummary.champion ? (
                          <Card 
                            className="rounded-3xl border pr-champion-card"
                            style={{
                              '--category-color': categoryColors.primary,
                              '--category-color-rgb': (categoryColors.primary || '#10b981').replace('#', '').match(/.{2}/g)?.map(hex => parseInt(hex, 16)).join(', ') || '16, 185, 129'
                            } as React.CSSProperties}
                          >
                            <CardContent className="p-6">
                              <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-md pr-champion-icon">
                                  <Crown className="h-6 w-6 text-white" />
                                </div>
                                <div className="flex-1">
                                  <h3 className="text-lg font-bold text-foreground flex items-center gap-3">
                                    {selectedCategory?.name} PR Champion
                                    <span className="text-xs px-3 py-1 rounded-full font-medium pr-champion-badge">
                                      {categoryPRSummary.championCount} PRs
                                    </span>
                                  </h3>
                                  <div className="flex items-center gap-3 mt-2">
                                    <Avatar className="h-8 w-8">
                                      <AvatarImage src={categoryPRSummary.champion.avatarUrl} alt={categoryPRSummary.champion.name} />
                                      <AvatarFallback className="text-sm pr-champion-avatar">
                                        {categoryPRSummary.champion.name?.substring(0, 2).toUpperCase() || 'U'}
                                      </AvatarFallback>
                                    </Avatar>
                                    <span className="font-semibold text-foreground">{categoryPRSummary.champion.name}</span>
                                    <span className="text-sm text-muted-foreground">
                                      holds {categoryPRSummary.championCount} of {categoryPRSummary.totalExercises} {selectedCategory?.name.toLowerCase()} records
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ) : null;
                      }
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
                            className="apple-card interactive"
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
