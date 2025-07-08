import React, { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { useAppContext } from '@/context/useAppContext';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { MobileSlider } from '@/components/ui/mobile-slider';
import AnimatedCounter from '@/components/ui/animated-counter';
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
  Plus
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
  getTournamentCountdown
} from '@/utils/tournamentUtils';
import { supabase } from '@/integrations/supabase/client';
import PRRecordsPage, { PRRecordsContent } from './PRRecords';
import '@/styles/index.css';

const TournamentPage: React.FC = () => {
  const { profile } = useAuth();
  const { categories, exercises } = useAppContext();
  
  const [currentTournament, setCurrentTournament] = useState<Tournament | null>(null);
  const [tournamentHistory, setTournamentHistory] = useState<Tournament[]>([]);
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [allExerciseLogs, setAllExerciseLogs] = useState<any[]>([]);
  const [showPointsGuide, setShowPointsGuide] = useState(false);
  const [expandedParticipant, setExpandedParticipant] = useState<string | null>(null);
  const [contentReady, setContentReady] = useState(false);

  // Tab state for switching between tournament and PR records
  const [activeTab, setActiveTab] = useState<'tournament' | 'records'>('tournament');
  
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
      
      // Small delay to allow smooth entrance animation
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
      setSelectedTournament(current);
    }
  }, [users, allExerciseLogs, exercises, categories]);

  // Update countdown periodically
  useEffect(() => {
    const updateCountdown = () => {
      if (selectedTournament) {
        const countdownData = getTournamentCountdown(selectedTournament.weekEnd);
        setCountdown(countdownData);
      }
    };

    // Update immediately
    updateCountdown();

    // Update every minute
    const interval = setInterval(updateCountdown, 60000);

    return () => clearInterval(interval);
  }, [selectedTournament]);

  // Badge icon and short name mapping
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
      case BadgeType.VOLUME_CRUSHER:
        return <Activity className="h-3 w-3" />;
      case BadgeType.CORE_DESTROYER:
        return <Target className="h-3 w-3" />;
      default:
        return <Award className="h-3 w-3" />;
    }
  };

  // Badge short names for compact display
  const getBadgeShortName = (badgeType: BadgeType) => {
    switch (badgeType) {
      case BadgeType.FIRST_PR:
        return 'PR';
      case BadgeType.CONSISTENCY_KING:
        return '7d';
      case BadgeType.IMPROVEMENT_STAR:
        return 'Star';
      case BadgeType.WEEKEND_WARRIOR:
        return 'Weekend';
      case BadgeType.CATEGORY_MASTER:
        return 'Master';
      case BadgeType.NEWCOMER_BONUS:
        return 'New';
      case BadgeType.PERFECT_WEEK:
        return 'Perfect';
      case BadgeType.VOLUME_CRUSHER:
        return 'Volume';
      case BadgeType.CORE_DESTROYER:
        return 'Core';
      default:
        return 'Badge';
    }
  };

  // Badge color scheme for consistent styling
  const getBadgeStyles = (badgeType: BadgeType) => {
    switch (badgeType) {
      case BadgeType.FIRST_PR:
        return 'bg-amber-100/80 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-700/50';
      case BadgeType.CONSISTENCY_KING:
        return 'bg-blue-100/80 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700/50';
      case BadgeType.IMPROVEMENT_STAR:
        return 'bg-purple-100/80 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-700/50';
      case BadgeType.WEEKEND_WARRIOR:
        return 'bg-orange-100/80 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-700/50';
      case BadgeType.CATEGORY_MASTER:
        return 'bg-green-100/80 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700/50';
      case BadgeType.NEWCOMER_BONUS:
        return 'bg-teal-100/80 text-teal-700 border-teal-200 dark:bg-teal-900/30 dark:text-teal-300 dark:border-teal-700/50';
      case BadgeType.PERFECT_WEEK:
        return 'bg-red-100/80 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-700/50';
      case BadgeType.VOLUME_CRUSHER:
        return 'bg-indigo-100/80 text-indigo-700 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-700/50';
      case BadgeType.CORE_DESTROYER:
        return 'bg-emerald-100/80 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-700/50';
      default:
        return 'bg-gray-100/80 text-gray-700 border-gray-200 dark:bg-gray-900/30 dark:text-gray-300 dark:border-gray-700/50';
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

  // Calculate winning streak for participant up to a specific tournament
  const getWinningStreakForTournament = (participantUserId: string, targetTournament: Tournament) => {
    if (!tournamentHistory || tournamentHistory.length === 0) return 0;
    
    let streak = 0;
    const allTournaments = [targetTournament, ...tournamentHistory];
    const sortedTournaments = allTournaments.sort((a, b) => 
      new Date(b.weekStart).getTime() - new Date(a.weekStart).getTime()
    );
    
    // Find the target tournament in the sorted list
    const targetIndex = sortedTournaments.findIndex(t => t.id === targetTournament.id);
    if (targetIndex === -1) return 0;
    
    // Check from the target tournament backwards through history
    for (let i = targetIndex; i < sortedTournaments.length; i++) {
      const tournament = sortedTournaments[i];
      if (tournament.participants.length === 0) break;
      
      const winner = tournament.participants.find(p => p.rank === 1);
      if (winner?.userId === participantUserId) {
        streak++;
      } else {
        break;
      }
    }
    
    return streak;
  };

  // Render participant entry
  const renderParticipant = (participant: TournamentParticipant, index: number) => {
    const isCurrentUser = participant.userId === profile?.id;
    const isExpanded = expandedParticipant === participant.userId;
    const winningStreak = selectedTournament ? getWinningStreakForTournament(participant.userId, selectedTournament) : 0;
    
    // Enhanced card styling based on rank
    const getCardStyling = (rank: number, isCurrentUser: boolean) => {
      // Remove the green override for current user to show rank colors
      switch (rank) {
        case 1:
          return 'bg-gradient-to-r from-amber-50 via-yellow-50 to-orange-50 dark:from-amber-950/30 dark:via-yellow-950/30 dark:to-orange-950/30 border-amber-300/50 dark:border-amber-700/50 shadow-lg';
        case 2:
          return 'apple-card';
        case 3:
          return 'apple-card';
        default:
          return 'apple-card';
      }
    };
    
    return (
      <Card 
        key={participant.userId}
        className={`relative rounded-2xl transition-all duration-500 ease-out transform ${getCardStyling(participant.rank, isCurrentUser)} ${
          isExpanded ? 'scale-[1.01] shadow-xl' : 'shadow-md'
        }`}
      >
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            {/* Position Badge */}
            <div className="flex-shrink-0">
              {renderPositionBadge(participant.rank)}
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
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-semibold text-sm text-foreground truncate">
                    {participant.user.name}
                  </h3>
                </div>
                
                {/* All badges together - Show all badges with consistent styling */}
                <div className="flex gap-1 mt-1 flex-wrap">
                  {/* You badge */}
                  {isCurrentUser && (
                    <Badge className="text-xs px-2 py-0.5 bg-blue-100/80 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 rounded-full border border-blue-200 dark:border-blue-700/50 flex-shrink-0">
                      You
                    </Badge>
                  )}
                  
                  {/* Winning streak badge */}
                  {participant.rank === 1 && winningStreak >= 2 && (
                    <Badge className="text-xs bg-gradient-to-r from-orange-100/80 to-red-100/80 text-orange-700 dark:from-orange-900/30 dark:to-red-900/30 dark:text-orange-300 px-2 py-0.5 rounded-full border border-orange-200 dark:border-orange-700/50 flex-shrink-0 flex items-center gap-1">
                      <Flame className="w-2.5 h-2.5" />
                      <span>{winningStreak}x</span>
                    </Badge>
                  )}
                  
                  {/* Regular badges - Show ALL badges with consistent styling */}
                  {participant.badges.map(badge => (
                    <Badge 
                      key={badge.id} 
                      className={`text-xs px-2 py-0.5 rounded-full border flex-shrink-0 flex items-center gap-1 ${getBadgeStyles(badge.type)}`}
                    >
                      {getBadgeIcon(badge.type)}
                      <span className="font-medium">{getBadgeShortName(badge.type)}</span>
                    </Badge>
                  ))}
                </div>
              </div>
            </div>

            {/* Points and Stats - Compact */}
            <div className="text-right flex-shrink-0">
              <div className="font-bold text-lg text-foreground">
                <AnimatedCounter
                  value={participant.totalPoints}
                  duration={800}
                />
              </div>
              <div className="text-xs text-muted-foreground">
                pts
              </div>
              <div className="text-xs text-muted-foreground">
                {participant.workoutDays.length}d
              </div>
            </div>
          </div>

          {/* Points Breakdown (always visible) - More compact with NEW system */}
          <div className="mt-3 pt-3 border-t border-border/30 transition-all duration-300">
            <div className="grid grid-cols-3 gap-2 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground text-xs">PRs:</span>
                <span className="font-medium bg-amber-100/80 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 px-2 py-0.5 rounded text-xs border border-amber-200 dark:border-amber-700/50">
                  {selectedTournament?.id === currentTournament?.id ? (
                    <AnimatedCounter
                      value={participant.pointsBreakdown.prPoints}
                      duration={600}
                    />
                  ) : (
                    participant.pointsBreakdown.prPoints
                  )}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground text-xs">Volume:</span>
                <span className="font-medium bg-blue-100/80 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded text-xs border border-blue-200 dark:border-blue-700/50">
                  {selectedTournament?.id === currentTournament?.id ? (
                    <AnimatedCounter
                      value={participant.pointsBreakdown.exercisePoints || 0}
                      duration={600}
                    />
                  ) : (
                    participant.pointsBreakdown.exercisePoints || 0
                  )}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground text-xs">Improve:</span>
                <span className="font-medium bg-indigo-100/80 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded text-xs border border-indigo-200 dark:border-indigo-700/50">
                  {selectedTournament?.id === currentTournament?.id ? (
                    <AnimatedCounter
                      value={participant.pointsBreakdown.improvementPoints}
                      duration={600}
                    />
                  ) : (
                    participant.pointsBreakdown.improvementPoints
                  )}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground text-xs">Daily:</span>
                <span className="font-medium bg-orange-100/80 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 px-2 py-0.5 rounded text-xs border border-orange-200 dark:border-orange-700/50">
                  {selectedTournament?.id === currentTournament?.id ? (
                    <AnimatedCounter
                      value={participant.pointsBreakdown.participationPoints}
                      duration={600}
                    />
                  ) : (
                    participant.pointsBreakdown.participationPoints
                  )}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground text-xs">Variety:</span>
                <span className="font-medium bg-purple-100/80 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded text-xs border border-purple-200 dark:border-purple-700/50">
                  {selectedTournament?.id === currentTournament?.id ? (
                    <AnimatedCounter
                      value={participant.pointsBreakdown.varietyPoints || 0}
                      duration={600}
                    />
                  ) : (
                    participant.pointsBreakdown.varietyPoints || 0
                  )}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground text-xs">Comp:</span>
                <span className="font-medium bg-teal-100/80 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300 px-2 py-0.5 rounded text-xs border border-teal-200 dark:border-teal-700/50">
                  {selectedTournament?.id === currentTournament?.id ? (
                    <AnimatedCounter
                      value={participant.pointsBreakdown.competitivePoints || 0}
                      duration={600}
                    />
                  ) : (
                    participant.pointsBreakdown.competitivePoints || 0
                  )}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground text-xs">Consist:</span>
                <span className="font-medium bg-green-100/80 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-2 py-0.5 rounded text-xs border border-green-200 dark:border-green-700/50">
                  {selectedTournament?.id === currentTournament?.id ? (
                    <AnimatedCounter
                      value={participant.pointsBreakdown.consistencyPoints}
                      duration={600}
                    />
                  ) : (
                    participant.pointsBreakdown.consistencyPoints
                  )}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground text-xs">Bonus:</span>
                <span className="font-medium bg-pink-100/80 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300 px-2 py-0.5 rounded text-xs border border-pink-200 dark:border-pink-700/50">
                  {selectedTournament?.id === currentTournament?.id ? (
                    <AnimatedCounter
                      value={participant.pointsBreakdown.bonusPoints}
                      duration={600}
                    />
                  ) : (
                    participant.pointsBreakdown.bonusPoints
                  )}
                </span>
              </div>
            </div>
          </div>

          {/* Expandable Date Details Toggle - More compact */}
          <div className="mt-3 pt-3 border-t border-border/30">
            <button
              onClick={() => setExpandedParticipant(isExpanded ? null : participant.userId)}
              className={`w-full flex items-center justify-center gap-2 text-sm font-medium transition-all duration-300 ease-out py-2 px-3 rounded-xl ${
                isExpanded 
                  ? 'text-blue-600 dark:text-blue-400 bg-blue-50/80 dark:bg-blue-900/20' 
                  : 'text-muted-foreground bg-muted/30 active:bg-muted/50'
              }`}
            >
              <span className="text-xs">{isExpanded ? 'Hide Details' : 'Show Details'}</span>
              <div className={`transition-transform duration-300 ease-out ${isExpanded ? 'rotate-180' : 'rotate-0'}`}>
                <ChevronDown className="w-3 h-3" />
              </div>
            </button>

            {/* Expandable Date Breakdown with smooth animation - Clean receipt style */}
            <div className={`overflow-hidden transition-all duration-500 ease-out ${
              isExpanded ? 'max-h-[2000px] opacity-100 mt-3' : 'max-h-0 opacity-0 mt-0'
            }`}>
              <div className="space-y-4 text-sm">
                {/* Personal Records Section */}
                {participant.prDetails.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <span className="bg-amber-100/80 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 px-2 py-0.5 rounded text-xs font-medium border border-amber-200 dark:border-amber-700/50">PRs</span>
                      <span className="text-xs text-muted-foreground">({participant.prDetails.length})</span>
                    </div>
                    <div className="space-y-2 ml-4">
                      {participant.prDetails.map((pr, idx) => (
                        <div key={idx} className="flex justify-between items-start text-xs">
                          <div className="flex-1">
                            <div className="font-medium text-foreground">{pr.exerciseName}</div>
                            <div className="text-muted-foreground">
                              {pr.previousBest > 0 ? `${pr.previousBest}lbs → ${pr.weight}lbs` : `First time: ${pr.weight}lbs`}
                              {pr.improvementPercent > 0 && (
                                <span className="text-green-600 dark:text-green-400 font-medium ml-1">
                                  (+{pr.improvementPercent.toFixed(1)}%)
                                </span>
                              )}
                            </div>
                          </div>
                          <span className="bg-amber-100/80 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 px-2 py-0.5 rounded text-xs font-medium border border-amber-200 dark:border-amber-700/50">+75pts</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Improvement Section */}
                {participant.pointsBreakdown.improvementPoints > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <span className="bg-blue-100/80 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded text-xs font-medium border border-blue-200 dark:border-blue-700/50">Improvement</span>
                    </div>
                    <div className="space-y-2 ml-4">
                      {participant.prDetails.filter(pr => pr.improvementPercent > 0).map((pr, idx) => (
                        <div key={idx} className="flex justify-between items-start text-xs">
                          <div className="flex-1">
                            <div className="font-medium text-foreground">{pr.exerciseName}</div>
                            <div className="text-green-600 dark:text-green-400 font-medium">
                              {pr.improvementPercent.toFixed(1)}% improvement
                            </div>
                          </div>
                          <span className="bg-blue-100/80 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded text-xs font-medium border border-blue-200 dark:border-blue-700/50">
                            +{Math.min(Math.floor(pr.improvementPercent * 2), 50)}pts
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Variety Bonus Section */}
                {(participant.pointsBreakdown.varietyPoints || 0) > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <span className="bg-purple-100/80 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded text-xs font-medium border border-purple-200 dark:border-purple-700/50">Variety</span>
                    </div>
                    <div className="space-y-2 ml-4">
                      <div className="flex justify-between items-center text-xs">
                        <div>
                          <div className="font-medium text-foreground">Exercise variety bonus</div>
                          <div className="text-muted-foreground">+3 pts for each exercise beyond 2nd per day</div>
                        </div>
                        <span className="bg-purple-100/80 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded text-xs font-medium border border-purple-200 dark:border-purple-700/50">+{participant.pointsBreakdown.varietyPoints || 0}pts</span>
                      </div>
                      {participant.exerciseStats?.varietyDays && participant.exerciseStats.varietyDays.length > 0 && (
                        <div className="text-xs text-muted-foreground mt-2">
                          <div className="font-medium mb-1">🎯 High-volume days:</div>
                          {participant.exerciseStats.varietyDays.map((day, idx) => {
                            const [year, month, dayNum] = day.date.split('-').map(Number);
                            const date = new Date(year, month - 1, dayNum);
                            return (
                              <div key={idx} className="flex justify-between items-center">
                                <span>{date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}: {day.exerciseCount} exercises</span>
                                <span className="text-purple-600 dark:text-purple-400 font-medium">+{day.bonus}pts</span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Competition Section */}
                {participant.competitiveDetails && participant.competitiveDetails.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <span className="bg-teal-100/80 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300 px-2 py-0.5 rounded text-xs font-medium border border-teal-200 dark:border-teal-700/50">Competition</span>
                      <span className="text-xs text-muted-foreground">({participant.competitiveDetails.length})</span>
                    </div>
                    <div className="space-y-2 ml-4">
                      {participant.competitiveDetails.map((comp, idx) => (
                        <div key={idx} className="flex justify-between items-start text-xs">
                          <div className="flex-1">
                            <div className="font-medium text-foreground">{comp.type}</div>
                            <div className="text-muted-foreground">
                              {comp.exerciseName}
                              {comp.targetUser && ` vs ${comp.targetUser}`}
                            </div>
                          </div>
                          <span className="bg-purple-100/80 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded text-xs font-medium border border-purple-200 dark:border-purple-700/50">+{comp.points}pts</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Exercise Volume Section */}
                {(participant.pointsBreakdown.exercisePoints || 0) > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <span className="bg-blue-100/80 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded text-xs font-medium border border-blue-200 dark:border-blue-700/50">Volume</span>
                      <span className="text-xs text-muted-foreground">({participant.exerciseStats?.totalExercises || 0} total)</span>
                    </div>
                    <div className="space-y-2 ml-4">
                      <div className="flex justify-between items-center text-xs">
                        <div>
                          <div className="font-medium text-foreground">Exercise volume points</div>
                          <div className="text-muted-foreground">{participant.exerciseStats?.totalExercises || 0} exercises × 5 points</div>
                        </div>
                        <span className="bg-blue-100/80 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded text-xs font-medium border border-blue-200 dark:border-blue-700/50">+{participant.pointsBreakdown.exercisePoints || 0}pts</span>
                      </div>
                      {participant.exerciseStats && (
                        <div className="text-xs text-muted-foreground">
                          <div>• {participant.exerciseStats.uniqueExercises} unique exercises</div>
                          <div>• {participant.exerciseStats.averageExercisesPerDay.toFixed(1)} avg per workout</div>
                          {participant.exerciseStats.coreExercises > 0 && (
                            <div>• {participant.exerciseStats.coreExercises} core exercises 🔥</div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Competition Section */}
                {participant.competitiveDetails && participant.competitiveDetails.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <span className="bg-teal-100/80 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300 px-2 py-0.5 rounded text-xs font-medium border border-teal-200 dark:border-teal-700/50">Competition</span>
                      <span className="text-xs text-muted-foreground">({participant.competitiveDetails.length})</span>
                    </div>
                    <div className="space-y-2 ml-4">
                      {participant.competitiveDetails.map((comp, idx) => (
                        <div key={idx} className="flex justify-between items-start text-xs">
                          <div className="flex-1">
                            <div className="font-medium text-foreground">{comp.type}</div>
                            <div className="text-muted-foreground">
                              {comp.exerciseName}
                              {comp.targetUser && ` vs ${comp.targetUser}`}
                            </div>
                          </div>
                          <span className="bg-teal-100/80 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300 px-2 py-0.5 rounded text-xs font-medium border border-teal-200 dark:border-teal-700/50">+{comp.points}pts</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Daily Workouts Section - Updated */}
                {participant.pointsBreakdown.participationPoints > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <span className="bg-orange-100/80 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 px-2 py-0.5 rounded text-xs font-medium border border-orange-200 dark:border-orange-700/50">Daily</span>
                      <span className="text-xs text-muted-foreground">({participant.workoutDays.length} days)</span>
                    </div>
                    <div className="space-y-2 ml-4">
                      <div className="flex justify-between items-center text-xs">
                        <div>
                          <div className="font-medium text-foreground">Daily workout base</div>
                          <div className="text-muted-foreground">8 points per day (min 2 exercises required)</div>
                        </div>
                        <span className="bg-orange-100/80 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 px-2 py-0.5 rounded text-xs font-medium border border-orange-200 dark:border-orange-700/50">+{participant.pointsBreakdown.participationPoints}pts</span>
                      </div>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {participant.workoutDays.map((date, idx) => {
                          const [year, month, day] = date.split('-').map(Number);
                          const localDate = new Date(year, month - 1, day);
                          return (
                            <span key={idx} className="bg-muted/50 text-muted-foreground px-2 py-0.5 rounded text-xs border border-border/30">
                              {localDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {/* Consistency Section */}
                {participant.pointsBreakdown.consistencyPoints > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <span className="bg-green-100/80 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-2 py-0.5 rounded text-xs font-medium border border-green-200 dark:border-green-700/50">Consistency</span>
                    </div>
                    <div className="ml-4">
                      <div className="flex justify-between items-center text-xs">
                        <div>
                          <div className="font-medium text-foreground">5+ workout days bonus</div>
                          <div className="text-muted-foreground">Extra points for consistency</div>
                        </div>
                        <span className="bg-green-100/80 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-2 py-0.5 rounded text-xs font-medium border border-green-200 dark:border-green-700/50">+{participant.pointsBreakdown.consistencyPoints}pts</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Bonus Section (Badges) - Enhanced with clearer display */}
                {participant.badges.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <span className="bg-gradient-to-r from-pink-100/80 to-purple-100/80 dark:from-pink-900/30 dark:to-purple-900/30 text-pink-700 dark:text-pink-300 px-2 py-0.5 rounded text-xs font-medium border border-pink-200 dark:border-pink-700/50">
                        Bonus
                      </span>
                      <span className="text-xs text-muted-foreground">({participant.badges.length} badge{participant.badges.length !== 1 ? 's' : ''})</span>
                    </div>
                    <div className="space-y-2 ml-4">
                      {participant.badges.map(badge => (
                        <div key={badge.id} className="flex justify-between items-start text-xs">
                          <div className="flex items-start gap-2 flex-1">
                            <div className={`p-1 rounded-lg border ${getBadgeStyles(badge.type)}`}>
                              {getBadgeIcon(badge.type)}
                            </div>
                            <div className="flex-1">
                              <div className="font-medium text-foreground flex items-center gap-2">
                                {badge.name}
                                <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${getBadgeStyles(badge.type)}`}>
                                  {getBadgeShortName(badge.type)}
                                </span>
                              </div>
                              <div className="text-muted-foreground text-[11px] mt-0.5">{badge.description}</div>
                            </div>
                          </div>
                          <span className="bg-gradient-to-r from-pink-100/80 to-purple-100/80 dark:from-pink-900/30 dark:to-purple-900/30 text-pink-700 dark:text-pink-300 px-2 py-0.5 rounded text-xs font-medium border border-pink-200 dark:border-pink-700/50 ml-2">
                            +{badge.points}pts
                          </span>
                        </div>
                      ))}
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

  return (
    <Layout 
      title=""
      headerSlider={
        <div className="flex items-center justify-between w-full">
          {/* Thick Slider as Title */}
          <MobileSlider
            options={[
              { id: 'tournament', label: 'Tournament' },
              { id: 'records', label: 'PR Records' }
            ]}
            activeOption={activeTab}
            onOptionChange={(optionId) => setActiveTab(optionId as 'tournament' | 'records')}
            variant="compact"
            className="text-xl font-bold scale-90"
          />
          
          {/* Countdown Badge - Only for Tournament */}
          {activeTab === 'tournament' && countdown.text && (
            <div className={`
              px-3 py-1 rounded-full font-medium text-xs
              ${countdown.urgency === 'low' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' : ''}
              ${countdown.urgency === 'medium' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300' : ''}
              ${countdown.urgency === 'high' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300' : ''}
              ${countdown.urgency === 'critical' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' : ''}
              ${countdown.urgency === 'ended' ? 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300' : ''}
            `}>
              {countdown.text}
            </div>
          )}
        </div>
      }
    >
      <div className={`space-y-6 relative transition-all duration-500 ease-out ${contentReady ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
        
        {/* Tournament Content */}
        {activeTab === 'tournament' && (
          <>
            {/* Floating Rules Button */}
            <div className="fixed bottom-24 right-4 z-40">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowPointsGuide(!showPointsGuide)}
                className="rounded-full w-12 h-12 p-0 shadow-lg border-2 bg-background/95 backdrop-blur-sm transition-all duration-200 hover:scale-105"
              >
                {showPointsGuide ? (
                  <span className="text-lg">×</span>
                ) : (
                  <span className="text-xs font-bold">?</span>
                )}
              </Button>
            </div>

            {/* Rules Modal - Duolingo-inspired */}
            {showPointsGuide && (
              <Card className="apple-card">
                <CardHeader className="pb-6">
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <span className="text-2xl">📋</span>
                    Tournament Rules
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-2">
                    How to earn points and win the weekly competition!
                  </p>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Main Point Categories */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                      <Trophy className="h-4 w-4 text-amber-500" />
                      Core Activities
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Personal Records */}
                      <div className="bg-amber-100/80 dark:bg-amber-900/30 rounded-xl p-4 border border-amber-200 dark:border-amber-700/50">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="p-1.5 rounded-lg bg-amber-200/80 dark:bg-amber-800/50">
                            <Trophy className="h-4 w-4 text-amber-700 dark:text-amber-300" />
                          </div>
                          <span className="font-semibold text-amber-800 dark:text-amber-200">Personal Record (PR)</span>
                        </div>
                        <div className="mb-2">
                          <span className="text-3xl font-bold text-amber-700 dark:text-amber-300">{POINTS_CONFIG.PR_ACHIEVEMENT.points}</span>
                          <span className="text-sm text-amber-600 dark:text-amber-400 ml-2">points</span>
                        </div>
                        <p className="text-sm text-amber-700 dark:text-amber-300">
                          Beat your previous best weight on any exercise
                        </p>
                      </div>

                      {/* Exercise Points */}
                      <div className="bg-blue-100/80 dark:bg-blue-900/30 rounded-xl p-4 border border-blue-200 dark:border-blue-700/50">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="p-1.5 rounded-lg bg-blue-200/80 dark:bg-blue-800/50">
                            <Activity className="h-4 w-4 text-blue-700 dark:text-blue-300" />
                          </div>
                          <span className="font-semibold text-blue-800 dark:text-blue-200">Per Exercise</span>
                        </div>
                        <div className="mb-2">
                          <span className="text-3xl font-bold text-blue-700 dark:text-blue-300">{POINTS_CONFIG.EXERCISE_COMPLETED.points}</span>
                          <span className="text-sm text-blue-600 dark:text-blue-400 ml-2">points each</span>
                        </div>
                        <p className="text-sm text-blue-700 dark:text-blue-300">
                          Every exercise you complete gives points
                        </p>
                      </div>

                      {/* Daily Workouts */}
                      <div className="bg-orange-100/80 dark:bg-orange-900/30 rounded-xl p-4 border border-orange-200 dark:border-orange-700/50">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="p-1.5 rounded-lg bg-orange-200/80 dark:bg-orange-800/50">
                            <CheckCircle className="h-4 w-4 text-orange-700 dark:text-orange-300" />
                          </div>
                          <span className="font-semibold text-orange-800 dark:text-orange-200">Daily Workout</span>
                        </div>
                        <div className="mb-2">
                          <span className="text-3xl font-bold text-orange-700 dark:text-orange-300">{POINTS_CONFIG.DAILY_WORKOUT_BASE.points}</span>
                          <span className="text-sm text-orange-600 dark:text-orange-400 ml-2">base points</span>
                        </div>
                        <p className="text-sm text-orange-700 dark:text-orange-300">
                          Complete 2+ exercises in a day (prevents lazy 1-exercise days!)
                        </p>
                      </div>

                      {/* Exercise Variety */}
                      <div className="bg-purple-100/80 dark:bg-purple-900/30 rounded-xl p-4 border border-purple-200 dark:border-purple-700/50">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="p-1.5 rounded-lg bg-purple-200/80 dark:bg-purple-800/50">
                            <Plus className="h-4 w-4 text-purple-700 dark:text-purple-300" />
                          </div>
                          <span className="font-semibold text-purple-800 dark:text-purple-200">Variety Bonus</span>
                        </div>
                        <div className="mb-2">
                          <span className="text-3xl font-bold text-purple-700 dark:text-purple-300">{POINTS_CONFIG.EXERCISE_VARIETY_BONUS.points}</span>
                          <span className="text-sm text-purple-600 dark:text-purple-400 ml-2">per extra exercise</span>
                        </div>
                        <p className="text-sm text-purple-700 dark:text-purple-300">
                          3rd, 4th, 5th+ exercises get bonus points
                        </p>
                      </div>

                      {/* Improvement Points */}
                      <div className="bg-blue-100/80 dark:bg-blue-900/30 rounded-xl p-4 border border-blue-200 dark:border-blue-700/50">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="p-1.5 rounded-lg bg-blue-200/80 dark:bg-blue-800/50">
                            <TrendingUp className="h-4 w-4 text-blue-700 dark:text-blue-300" />
                          </div>
                          <span className="font-semibold text-blue-800 dark:text-blue-200">Improvement Bonus</span>
                        </div>
                        <div className="mb-2">
                          <span className="text-3xl font-bold text-blue-700 dark:text-blue-300">2</span>
                          <span className="text-sm text-blue-600 dark:text-blue-400 ml-2">per 1% improvement</span>
                        </div>
                        <p className="text-sm text-blue-700 dark:text-blue-300">
                          Extra points for % improvement on PRs (max 50 per exercise)
                        </p>
                      </div>

                      {/* Consistency Bonus */}
                      <div className="bg-green-100/80 dark:bg-green-900/30 rounded-xl p-4 border border-green-200 dark:border-green-700/50">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="p-1.5 rounded-lg bg-green-200/80 dark:bg-green-800/50">
                            <Calendar className="h-4 w-4 text-green-700 dark:text-green-300" />
                          </div>
                          <span className="font-semibold text-green-800 dark:text-green-200">Consistency Bonus</span>
                        </div>
                        <div className="mb-2">
                          <span className="text-3xl font-bold text-green-700 dark:text-green-300">{POINTS_CONFIG.CONSISTENCY_BONUS.points}</span>
                          <span className="text-sm text-green-600 dark:text-green-400 ml-2">points</span>
                        </div>
                        <p className="text-sm text-green-700 dark:text-green-300">
                          Work out 5+ days in a week
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Special Features */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                      <Zap className="h-4 w-4 text-purple-500" />
                      Special Features
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Competitive Bonuses */}
                      <div className="bg-purple-100/80 dark:bg-purple-900/30 rounded-xl p-4 border border-purple-200 dark:border-purple-700/50">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="p-1.5 rounded-lg bg-purple-200/80 dark:bg-purple-800/50">
                            <Users className="h-4 w-4 text-purple-700 dark:text-purple-300" />
                          </div>
                          <span className="font-semibold text-purple-800 dark:text-purple-200">Competitive Bonuses</span>
                        </div>
                        <div className="space-y-1 mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xl font-bold text-purple-700 dark:text-purple-300">20</span>
                            <span className="text-sm text-purple-600 dark:text-purple-400">Takeover</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xl font-bold text-purple-700 dark:text-purple-300">10</span>
                            <span className="text-sm text-purple-600 dark:text-purple-400">Close Win (&lt;5%)</span>
                          </div>
                        </div>
                        <p className="text-sm text-purple-700 dark:text-purple-300">
                          Beat friends' PRs for extra points
                        </p>
                      </div>

                      {/* Achievement Badges */}
                      <div className="bg-pink-100/80 dark:bg-pink-900/30 rounded-xl p-4 border border-pink-200 dark:border-pink-700/50">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="p-1.5 rounded-lg bg-pink-200/80 dark:bg-pink-800/50">
                            <Star className="h-4 w-4 text-pink-700 dark:text-pink-300" />
                          </div>
                          <span className="font-semibold text-pink-800 dark:text-pink-200">Achievement Badges</span>
                        </div>
                        <div className="mb-2">
                          <span className="text-2xl font-bold text-pink-700 dark:text-pink-300">5-100</span>
                          <span className="text-sm text-pink-600 dark:text-pink-400 ml-2">points</span>
                        </div>
                        <div className="space-y-1 text-sm text-pink-700 dark:text-pink-300">
                          <div className="flex items-center gap-2">
                            <Zap className="h-3 w-3" />
                            <span>Weekend Warrior (20pts)</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Crown className="h-3 w-3" />
                            <span>Consistency King (50pts)</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Activity className="h-3 w-3" />
                            <span>Volume Crusher (35pts) - 3.5+ avg exercises/workout</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Target className="h-3 w-3" />
                            <span>Core Destroyer (30pts) - 6+ core exercises/week</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Flame className="h-3 w-3" />
                            <span>Perfect Week (100pts)</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Tournament Info */}
                  <div className="border-t border-border/30 pt-6">
                    <div className="bg-gradient-to-r from-blue-50/50 to-purple-50/50 dark:from-blue-950/30 dark:to-purple-950/30 rounded-xl p-4 border border-blue-200/50 dark:border-blue-700/30">
                      <div className="flex items-center gap-2 mb-3">
                        <Crown className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        <span className="text-lg font-semibold text-foreground">Weekly Tournament</span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">Schedule: Monday - Sunday</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Trophy className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">Winner: Most total points</span>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Timer className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">Auto-resets every Monday</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">Compete with friends</span>
                          </div>
                        </div>
                      </div>
                      <div className="mt-4 p-3 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 rounded-lg border border-emerald-200/50 dark:border-emerald-700/30">
                        <div className="flex items-center gap-2 mb-2">
                          <Target className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                          <span className="font-semibold text-emerald-800 dark:text-emerald-200 text-sm">Core Focus Bonus</span>
                        </div>
                        <p className="text-xs text-emerald-700 dark:text-emerald-300">
                          Get <strong>+{POINTS_CONFIG.CORE_FOCUS_BONUS.points} extra points</strong> for each core exercise (abs, planks, etc.) to help tackle those beer bellies! 🍺➡️💪
                        </p>
                      </div>
                    </div>
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
              </div>            )}

            {/* Tournament Leaderboard */}
            {selectedTournament && (
              <div className="space-y-4 staggered-cards">
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
          </>
        )}

        {/* PR Records Content */}
        {activeTab === 'records' && (
          <PRRecordsContent />
        )}

      </div>
    </Layout>
  );
};

export default TournamentPage;
