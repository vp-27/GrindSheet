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
  History
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
  const [showHistoricalWeeks, setShowHistoricalWeeks] = useState(false);
  const [highlightedSection, setHighlightedSection] = useState<'performance' | 'volume' | 'bonuses' | null>(null);

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

  // 3-category point grouping - more compact and logical
  const getPointBreakdown = (participant: TournamentParticipant) => {
    // Core Performance: PRs, improvements, and competitive
    const performance = participant.pointsBreakdown.prPoints + 
                       participant.pointsBreakdown.improvementPoints +
                       (participant.pointsBreakdown.competitivePoints || 0);
    
    // Volume & Consistency: daily work and habits
    const volume = participant.pointsBreakdown.consistencyPoints + 
                  participant.pointsBreakdown.participationPoints +
                  (participant.pointsBreakdown.exercisePoints || 0) +
                  (participant.pointsBreakdown.varietyPoints || 0);
    
    // Bonuses: achievements and special rewards
    const bonuses = participant.pointsBreakdown.bonusPoints;
    
    return { performance, volume, bonuses };
  };

  // Smart badge filtering - only show most important badges
  const getRelevantBadges = (badges: any[]) => {
    // Priority order for badges
    const priorityOrder = [
      BadgeType.PERFECT_WEEK,
      BadgeType.CONSISTENCY_KING, 
      BadgeType.FIRST_PR,
      BadgeType.VOLUME_CRUSHER,
      BadgeType.WEEKEND_WARRIOR,
      BadgeType.CORE_DESTROYER,
      BadgeType.CATEGORY_MASTER,
      BadgeType.IMPROVEMENT_STAR,
      BadgeType.NEWCOMER_BONUS
    ];
    
    // Sort by priority and take top 3
    return badges
      .sort((a, b) => {
        const aIndex = priorityOrder.indexOf(a.type);
        const bIndex = priorityOrder.indexOf(b.type);
        return aIndex - bIndex;
      })
      .slice(0, 3);
  };

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
        return '7d Streak';
      case BadgeType.IMPROVEMENT_STAR:
        return 'Top Improver';
      case BadgeType.WEEKEND_WARRIOR:
        return 'Weekend';
      case BadgeType.CATEGORY_MASTER:
        return 'All Groups';
      case BadgeType.NEWCOMER_BONUS:
        return 'New';
      case BadgeType.PERFECT_WEEK:
        return 'Perfect';
      case BadgeType.VOLUME_CRUSHER:
        return 'High Volume';
      case BadgeType.CORE_DESTROYER:
        return 'Core Focus';
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

  // Render participant entry with simplified design
  const renderParticipant = (participant: TournamentParticipant, index: number) => {
    const isCurrentUser = participant.userId === profile?.id;
    const isExpanded = expandedParticipant === participant.userId;
    const winningStreak = selectedTournament ? getWinningStreakForTournament(participant.userId, selectedTournament) : 0;
    const pointBreakdown = getPointBreakdown(participant);
    const relevantBadges = getRelevantBadges(participant.badges);
    
    // Enhanced card styling based on rank
    const getCardStyling = (rank: number, isCurrentUser: boolean) => {
      switch (rank) {
        case 1:
          return 'bg-gradient-to-r from-amber-50 via-yellow-50 to-orange-50 dark:from-amber-950/30 dark:via-yellow-950/30 dark:to-orange-950/30 border-amber-300/50 dark:border-amber-700/50 shadow-lg';
        case 2:
          return 'apple-card border-gray-300/30 dark:border-gray-600/30';
        case 3:
          return 'apple-card border-orange-300/30 dark:border-orange-600/30';
        default:
          return isCurrentUser ? 'apple-card border-blue-300/50 dark:border-blue-600/50' : 'apple-card';
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
                  {isCurrentUser && (
                    <Badge className="text-xs px-2 py-0.5 bg-blue-100/80 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 rounded-full border border-blue-200 dark:border-blue-700/50 flex-shrink-0">
                      You
                    </Badge>
                  )}
                </div>
                
                {/* Top 3 badges only */}
                <div className="flex gap-1 mt-1 flex-wrap">
                  {/* Winning streak badge */}
                  {participant.rank === 1 && winningStreak >= 2 && (
                    <Badge className="text-xs bg-gradient-to-r from-orange-100/80 to-red-100/80 text-orange-700 dark:from-orange-900/30 dark:to-red-900/30 dark:text-orange-300 px-2 py-0.5 rounded-full border border-orange-200 dark:border-orange-700/50 flex-shrink-0 flex items-center gap-1">
                      <Flame className="w-2.5 h-2.5" />
                      <span>{winningStreak}x</span>
                    </Badge>
                  )}
                  
                  {/* Top 3 relevant badges */}
                  {relevantBadges.map(badge => (
                    <Badge 
                      key={badge.id} 
                      className={`text-xs px-2 py-0.5 rounded-full border flex-shrink-0 flex items-center gap-1 ${getBadgeStyles(badge.type)}`}
                    >
                      {getBadgeIcon(badge.type)}
                      <span className="font-medium">{getBadgeShortName(badge.type)}</span>
                    </Badge>
                  ))}
                  
                  {/* Show "+X more" if there are additional badges */}
                  {participant.badges.length > 3 && (
                    <Badge className="text-xs px-2 py-0.5 bg-gray-100/80 text-gray-600 dark:bg-gray-900/30 dark:text-gray-400 rounded-full border border-gray-200 dark:border-gray-700/50 flex-shrink-0">
                      +{participant.badges.length - 3} more
                    </Badge>
                  )}
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
                pts • {participant.workoutDays.length}d
              </div>
            </div>
          </div>

          {/* 3-Category Points Breakdown - Compact Layout */}
          <div className="mt-3 pt-3 border-t border-border/30 transition-all duration-300">
            <div className="grid grid-cols-3 gap-3 text-sm">
              <div 
                className="flex flex-col items-center text-center cursor-pointer p-2 rounded-lg transition-all duration-200 hover:bg-amber-50/50 dark:hover:bg-amber-950/20"
                onClick={() => {
                  const isExpanded = expandedParticipant === participant.userId;
                  if (!isExpanded) {
                    setExpandedParticipant(participant.userId);
                  }
                  setHighlightedSection(highlightedSection === 'performance' ? null : 'performance');
                }}
              >
                <span className="text-xs text-muted-foreground mb-1">Performance</span>
                <span className="font-bold text-lg bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
                  <AnimatedCounter
                    value={pointBreakdown.performance}
                    duration={600}
                  />
                </span>
                <span className="text-xs text-muted-foreground">PRs & Competition</span>
              </div>
              <div 
                className="flex flex-col items-center text-center cursor-pointer p-2 rounded-lg transition-all duration-200 hover:bg-blue-50/50 dark:hover:bg-blue-950/20"
                onClick={() => {
                  const isExpanded = expandedParticipant === participant.userId;
                  if (!isExpanded) {
                    setExpandedParticipant(participant.userId);
                  }
                  setHighlightedSection(highlightedSection === 'volume' ? null : 'volume');
                }}
              >
                <span className="text-xs text-muted-foreground mb-1">Volume</span>
                <span className="font-bold text-lg bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  <AnimatedCounter
                    value={pointBreakdown.volume}
                    duration={600}
                  />
                </span>
                <span className="text-xs text-muted-foreground">Work & Consistency</span>
              </div>
              <div 
                className="flex flex-col items-center text-center cursor-pointer p-2 rounded-lg transition-all duration-200 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20"
                onClick={() => {
                  const isExpanded = expandedParticipant === participant.userId;
                  if (!isExpanded) {
                    setExpandedParticipant(participant.userId);
                  }
                  setHighlightedSection(highlightedSection === 'bonuses' ? null : 'bonuses');
                }}
              >
                <span className="text-xs text-muted-foreground mb-1">Bonuses</span>
                <span className="font-bold text-lg bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                  <AnimatedCounter
                    value={pointBreakdown.bonuses}
                    duration={600}
                  />
                </span>
                <span className="text-xs text-muted-foreground">Achievements</span>
              </div>
            </div>
          </div>

          {/* Expandable Details Toggle */}
          <div className="mt-3 pt-3 border-t border-border/30">
            <button
              onClick={() => setExpandedParticipant(isExpanded ? null : participant.userId)}
              className={`w-full flex items-center justify-center gap-2 text-sm font-medium transition-all duration-300 ease-out py-2 px-3 rounded-xl ${
                isExpanded 
                  ? 'text-blue-600 dark:text-blue-400 bg-blue-50/80 dark:bg-blue-900/20' 
                  : 'text-muted-foreground bg-muted/30 hover:bg-muted/50'
              }`}
            >
              <span className="text-xs">{isExpanded ? 'Hide Details' : 'Show Details'}</span>
              <div className={`transition-transform duration-300 ease-out ${isExpanded ? 'rotate-180' : 'rotate-0'}`}>
                <ChevronDown className="w-3 h-3" />
              </div>
            </button>

            {/* Expandable Detail Section - Unified Single Card */}
            <div className={`overflow-hidden transition-all duration-500 ease-out ${
              isExpanded ? 'max-h-[1000px] opacity-100 mt-3' : 'max-h-0 opacity-0 mt-0'
            }`}>
              <div className="space-y-3 text-sm">
                {/* Unified Point Breakdown - Single Cohesive Card */}
                <div className="bg-gradient-to-br from-white to-slate-50/50 dark:from-slate-900/50 dark:to-slate-800/30 rounded-2xl p-5 border border-slate-200/50 dark:border-slate-700/50 shadow-sm">
                  <h4 className="font-bold text-foreground mb-4 flex items-center gap-2 text-base">
                    <TrendingUp className="h-5 w-5 text-blue-600" />
                    Complete Point Breakdown
                  </h4>
                  
                  <div className="space-y-4">
                    {/* Performance Items */}
                    {(participant.prDetails.length > 0 || participant.pointsBreakdown.improvementPoints > 0 || (participant.pointsBreakdown.competitivePoints || 0) > 0) && (
                      <div className={`transition-all duration-300 ${highlightedSection === 'performance' ? 'ring-2 ring-amber-400/50 bg-amber-50/30 dark:bg-amber-950/20 p-3 rounded-xl' : ''}`}>
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-3 h-3 rounded-full bg-gradient-to-r from-amber-500 to-orange-500"></div>
                          <span className="font-semibold text-amber-800 dark:text-amber-200 text-sm">Performance</span>
                          <span className="ml-auto font-bold text-amber-800 dark:text-amber-200 bg-amber-100/60 dark:bg-amber-900/30 px-2 py-1 rounded-lg text-xs">
                            {pointBreakdown.performance} pts
                          </span>
                        </div>
                        
                        {/* Personal Records */}
                        {participant.prDetails.map((pr, idx) => (
                          <div key={`pr-${idx}`} className="flex justify-between items-center py-2 px-3 bg-amber-50/30 dark:bg-amber-950/15 rounded-lg border-l-2 border-amber-400 dark:border-amber-600">
                            <div className="flex-1">
                              <div className="font-medium text-foreground text-sm">{pr.exerciseName} PR</div>
                              <div className="text-xs text-muted-foreground">
                                {pr.previousBest > 0 ? `${pr.previousBest}→${pr.weight}lbs` : `${pr.weight}lbs (first time)`}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-bold text-amber-700 dark:text-amber-300 text-sm">+75pts</div>
                            </div>
                          </div>
                        ))}

                        {/* Improvement Gains */}
                        {participant.prDetails.filter(pr => pr.improvementPercent > 0).map((pr, idx) => (
                          <div key={`improvement-${idx}`} className="flex justify-between items-center py-2 px-3 bg-amber-50/30 dark:bg-amber-950/15 rounded-lg border-l-2 border-amber-400 dark:border-amber-600">
                            <div className="flex-1">
                              <div className="font-medium text-foreground text-sm">{pr.exerciseName} Improvement</div>
                              <div className="text-xs text-green-600 dark:text-green-400 font-medium">
                                +{pr.improvementPercent.toFixed(1)}% gain
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-bold text-amber-700 dark:text-amber-300 text-sm">+{Math.min(Math.floor(pr.improvementPercent * 2), 50)}pts</div>
                            </div>
                          </div>
                        ))}

                        {/* Competitive Bonuses */}
                        {participant.competitiveDetails && participant.competitiveDetails.map((comp, idx) => (
                          <div key={`comp-${idx}`} className="flex justify-between items-center py-2 px-3 bg-amber-50/30 dark:bg-amber-950/15 rounded-lg border-l-2 border-amber-400 dark:border-amber-600">
                            <div className="flex-1">
                              <div className="font-medium text-foreground text-sm">
                                Beat {comp.targetUser || 'Friend'}: {comp.exerciseName}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {comp.type} victory
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-bold text-amber-700 dark:text-amber-300 text-sm">+{comp.points}pts</div>
                            </div>
                          </div>
                        ))}

                        <div className="border-t border-slate-200/50 dark:border-slate-700/50 pt-3 mt-3"></div>
                      </div>
                    )}

                    {/* Volume & Consistency Items */}
                    <div className={`transition-all duration-300 ${highlightedSection === 'volume' ? 'ring-2 ring-blue-400/50 bg-blue-50/30 dark:bg-blue-950/20 p-3 rounded-xl' : ''}`}>
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-3 h-3 rounded-full bg-gradient-to-r from-blue-500 to-purple-500"></div>
                        <span className="font-semibold text-blue-800 dark:text-blue-200 text-sm">Volume & Consistency</span>
                        <span className="ml-auto font-bold text-blue-800 dark:text-blue-200 bg-blue-100/60 dark:bg-blue-900/30 px-2 py-1 rounded-lg text-xs">
                          {pointBreakdown.volume} pts
                        </span>
                      </div>
                    
                    {/* Daily Workouts */}
                    {participant.workoutDays.slice(0, 7).map((day, idx) => {
                      // Parse the YYYY-MM-DD format to avoid timezone shifts
                      const [year, month, dayOfMonth] = day.split('-').map(Number);
                      const workoutDate = new Date(year, month - 1, dayOfMonth); // month is 0-indexed
                      const dayName = workoutDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
                      const isWeekend = workoutDate.getDay() === 0 || workoutDate.getDay() === 6;
                      return (
                        <div key={`workout-${idx}`} className="flex justify-between items-center py-2 px-3 bg-blue-50/30 dark:bg-blue-950/15 rounded-lg border-l-2 border-blue-400 dark:border-blue-600">
                          <div className="flex-1">
                            <div className="font-medium text-foreground text-sm">
                              {dayName} Workout
                              {isWeekend && <span className="text-orange-500 ml-2">🌅</span>}
                            </div>
                            {isWeekend && <div className="text-xs text-orange-600 dark:text-orange-400">Weekend bonus included</div>}
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-blue-700 dark:text-blue-300 text-sm">
                              +{6 + (isWeekend ? 8 : 0)}pts
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    {/* Exercise Volume */}
                    {(participant.exerciseStats?.totalExercises || 0) > 0 && (
                      <div className="flex justify-between items-center py-2 px-3 bg-blue-50/30 dark:bg-blue-950/15 rounded-lg border-l-2 border-blue-400 dark:border-blue-600">
                        <div className="flex-1">
                          <div className="font-medium text-foreground text-sm">Exercise Volume</div>
                          <div className="text-xs text-muted-foreground">{participant.exerciseStats?.totalExercises || 0} exercises • 8pts each</div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-blue-700 dark:text-blue-300 text-sm">+{(participant.exerciseStats?.totalExercises || 0) * 8}pts</div>
                        </div>
                      </div>
                    )}

                    {/* Consistency Bonus */}
                    {participant.pointsBreakdown.consistencyPoints > 0 && (
                      <div className="flex justify-between items-center py-2 px-3 bg-blue-50/30 dark:bg-blue-950/15 rounded-lg border-l-2 border-blue-400 dark:border-blue-600">
                        <div className="flex-1">
                          <div className="font-medium text-foreground text-sm">Consistency Bonus</div>
                          <div className="text-xs text-green-600 dark:text-green-400">5+ workout days achieved!</div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-blue-700 dark:text-blue-300 text-sm">+60pts</div>
                        </div>
                      </div>
                    )}

                    {/* Variety Bonuses */}
                    {(participant.pointsBreakdown.varietyPoints || 0) > 0 && participant.exerciseStats?.varietyDays && participant.exerciseStats.varietyDays.map((day, idx) => {
                      // Parse the YYYY-MM-DD format to avoid timezone shifts
                      const [year, month, dayOfMonth] = day.date.split('-').map(Number);
                      const varietyDate = new Date(year, month - 1, dayOfMonth); // month is 0-indexed
                      const dayName = varietyDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
                      return (
                        <div key={`variety-${idx}`} className="flex justify-between items-center py-2 px-3 bg-blue-50/30 dark:bg-blue-950/15 rounded-lg border-l-2 border-blue-400 dark:border-blue-600">
                          <div className="flex-1">
                            <div className="font-medium text-foreground text-sm">{dayName} Variety Bonus</div>
                            <div className="text-xs text-muted-foreground">{day.exerciseCount} exercises • +4pts per exercise beyond 2nd</div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-blue-700 dark:text-blue-300 text-sm">+{day.bonus}pts</div>
                          </div>
                        </div>
                      );
                    })}
                    </div>

                    {/* Achievement Bonuses */}
                    {participant.badges.length > 0 && (
                      <div className={`transition-all duration-300 ${highlightedSection === 'bonuses' ? 'ring-2 ring-emerald-400/50 bg-emerald-50/30 dark:bg-emerald-950/20 p-3 rounded-xl' : ''}`}>
                        <div className="border-t border-slate-200/50 dark:border-slate-700/50 pt-3 mt-3"></div>
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-3 h-3 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500"></div>
                          <span className="font-semibold text-emerald-800 dark:text-emerald-200 text-sm">Achievement Bonuses</span>
                          <span className="ml-auto font-bold text-emerald-800 dark:text-emerald-200 bg-emerald-100/60 dark:bg-emerald-900/30 px-2 py-1 rounded-lg text-xs">
                            {pointBreakdown.bonuses} pts
                          </span>
                        </div>
                        
                        {participant.badges.map(badge => (
                          <div key={badge.id} className="flex justify-between items-center py-2 px-3 bg-emerald-50/30 dark:bg-emerald-950/15 rounded-lg border-l-2 border-emerald-400 dark:border-emerald-600">
                            <div className="flex items-center gap-3 flex-1">
                              <div className="flex-shrink-0">
                                {getBadgeIcon(badge.type)}
                              </div>
                              <div>
                                <div className="font-medium text-foreground text-sm">{BADGE_DEFINITIONS[badge.type].name}</div>
                                <div className="text-xs text-muted-foreground">{BADGE_DEFINITIONS[badge.type].description}</div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-bold text-emerald-700 dark:text-emerald-300 text-sm">+{badge.points}pts</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Quick Summary Footer */}
                  <div className="mt-6 pt-4 border-t border-slate-200/50 dark:border-slate-700/50">
                    <div className="grid grid-cols-4 gap-4 text-xs text-center">
                      <div>
                        <div className="font-semibold text-foreground">{participant.prDetails.length}</div>
                        <div className="text-muted-foreground">PRs Set</div>
                      </div>
                      <div>
                        <div className="font-semibold text-foreground">{participant.exerciseStats?.totalExercises || 0}</div>
                        <div className="text-muted-foreground">Exercises</div>
                      </div>
                      <div>
                        <div className="font-semibold text-foreground">{participant.workoutDays.length}/7</div>
                        <div className="text-muted-foreground">Days</div>
                      </div>
                      <div>
                        <div className="font-semibold text-foreground">{participant.badges.length}</div>
                        <div className="text-muted-foreground">Badges</div>
                      </div>
                    </div>
                  </div>
                </div>
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
          {/* Main Navigation Slider */}
          <MobileSlider
            options={[
              { id: 'tournament', label: 'Tournament' },
              { id: 'records', label: 'PR Records' }
            ]}
            activeOption={activeTab}
            onOptionChange={(optionId) => setActiveTab(optionId as 'tournament' | 'records')}
            variant="compact"
            headerTitle={true}
          />
          
          {/* Action Buttons - Only for Tournament */}
          {activeTab === 'tournament' && (
            <div className="flex items-center gap-2">
              {/* Countdown Badge */}
              {countdown.text && (
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
              
              {/* Rulebook Button */}
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowPointsGuide(true)}
                className="rounded-full h-10 w-10 p-0 border-2"
              >
                <BookOpen className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      }
    >
      <div className={`space-y-6 relative transition-all duration-500 ease-out ${contentReady ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
        
        {/* Tournament Content */}
        {activeTab === 'tournament' && (
          <>
            {/* Dynamic Rulebook Modal */}
            <TournamentRulebook 
              isOpen={showPointsGuide} 
              onClose={() => setShowPointsGuide(false)} 
            />

            {/* Current Tournament Leaderboard */}
            {selectedTournament && (
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

            {/* Historical Tournaments - Always visible */}
            {(currentTournament || tournamentHistory.length > 0) && (
              <Card className="apple-card mt-8">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <History className="h-5 w-5 text-muted-foreground" />
                    <h3 className="text-lg font-semibold text-foreground">Tournament History</h3>
                  </div>
                  
                  <div className="flex gap-3 overflow-x-auto pb-3 scrollbar-hide">
                    {/* Current Tournament Button */}
                    {currentTournament && (
                      <Button
                        variant={selectedTournament?.id === currentTournament?.id ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSelectedTournament(currentTournament)}
                        className={`rounded-2xl whitespace-nowrap transition-all duration-300 font-medium px-4 py-2 ${
                          selectedTournament?.id === currentTournament?.id
                            ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white border-0 shadow-md'
                            : 'border border-muted-foreground/20 text-muted-foreground hover:text-foreground hover:border-foreground/30'
                        }`}
                      >
                        Current Week
                      </Button>
                    )}
                    
                    {/* Past Tournament Buttons */}
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
                        className={`rounded-2xl whitespace-nowrap transition-all duration-300 font-medium px-4 py-2 ${
                          selectedTournament?.id === tournament.id
                            ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white border-0 shadow-md'
                            : 'border border-muted-foreground/20 text-muted-foreground hover:text-foreground hover:border-foreground/30 opacity-75'
                        }`}
                      >
                        {new Date(tournament.weekStart).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>
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
