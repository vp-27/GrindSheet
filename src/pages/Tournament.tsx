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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  ChevronDown,
  ChevronUp,
  Clock,
  ChevronRight
} from 'lucide-react';
import { TOURNAMENT_ICONS, TOURNAMENT_GRADIENTS } from '@/utils/tournamentIcons';
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
import PRRecordsPage, { PRRecordsContent } from './PRRecords';
import '@/styles/index.css';

// Harsh roast lines for zero-point users
const harshRoasts = [
  "Your gym card is just a keychain accessory at this point.",
  "You log more rest days than workouts.",
  "If laziness was a sport, you'd be world champ.",
  "Your muscles are in witness protection.",
  "Even your shadow skips leg day.",
  "You're the reason the dumbbells collect dust.",
  "Your PR? Personal Retreat.",
  "The only thing you're lifting is expectations—then dropping them.",
  "You've got more excuses than reps.",
  "Your gains are missing—have you checked the lost and found?",
  "You rest so much, your Fitbit thinks you're dead.",
  "The treadmill misses you. It told me.",
  "You're the before photo in every ad.",
  "Your sweat glands filed for unemployment.",
  "You're one workout away from a comeback. And you keep missing it.",
  "If you worked out as much as you talk about it, you'd be in first place.",
  "Your gym shoes are in mint condition.",
  "Even the yoga mats are judging you.",
  "You're the before image in before and after.",
  "Your biceps are on a milk carton—missing since January."
];

// Store roast messages globally to persist across navigation
const roastStorage = {
  zeroPointsRoast: null as string | null,
  secondPlaceRoast: null as string | null,
  lastTournamentId: null as string | null
};

const IOSPillSwitcher: React.FC<{
  activeTab: 'tournament' | 'records';
  onTabChange: (tab: 'tournament' | 'records') => void;
}> = ({ activeTab, onTabChange }) => {
  // Sliding UI logic
  // We'll use refs to measure button positions for the slider
  const tournamentRef = React.useRef<HTMLButtonElement>(null);
  const recordsRef = React.useRef<HTMLButtonElement>(null);
  const [sliderStyle, setSliderStyle] = React.useState<React.CSSProperties>({});

  React.useEffect(() => {
    const activeRef = activeTab === 'tournament' ? tournamentRef : recordsRef;
    if (activeRef.current) {
      setSliderStyle({
        left: activeRef.current.offsetLeft,
        width: activeRef.current.offsetWidth,
        transition: 'left 0.25s cubic-bezier(0.4,0,0.2,1), width 0.25s cubic-bezier(0.4,0,0.2,1)'
      });
    }
  }, [activeTab]);

  return (
    <div className="w-full flex justify-center">
      <div className="relative flex bg-slate-100/80 dark:bg-slate-800/80 rounded-full p-1 shadow-inner w-[340px] max-w-full h-10 backdrop-blur-md">
        {/* Sliding indicator */}
        <div
          className="absolute left-0 rounded-full bg-white dark:bg-slate-700 shadow-md transition-all duration-300 border border-slate-200/50 dark:border-slate-600/50 top-0.5 bottom-0.5 h-[calc(100%-4px)]"
          style={sliderStyle}
        />
        <button
          ref={tournamentRef}
          className={`flex-1 px-6 py-1.5 rounded-full text-sm font-medium transition-all duration-200 focus:outline-none z-10 ${
            activeTab === 'tournament'
              ? 'text-slate-900 dark:text-slate-100'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
          onClick={() => onTabChange('tournament')}
          aria-pressed={activeTab === 'tournament'}
        >
          Tournament
        </button>
        <button
          ref={recordsRef}
          className={`flex-1 px-6 py-1.5 rounded-full text-sm font-medium transition-all duration-200 focus:outline-none z-10 ${
            activeTab === 'records'
              ? 'text-slate-900 dark:text-slate-100'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
          onClick={() => onTabChange('records')}
          aria-pressed={activeTab === 'records' ? 'true' : 'false'}
        >
          PR Records
        </button>
      </div>
    </div>
  );
};

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
  const [expandedBadgesParticipantId, setExpandedBadgesParticipantId] = useState<string | null>(null);
  const [contentReady, setContentReady] = useState(false);
  const [showHistoricalWeeks, setShowHistoricalWeeks] = useState(false);
  const [highlightedSection, setHighlightedSection] = useState<'performance' | 'volume' | 'bonuses' | null>(null);
  const [rulebookSection, setRulebookSection] = useState<string | null>(null);
  const [highlightRulebookItem, setHighlightRulebookItem] = useState<string | null>(null);

  // Tab state for switching between tournament and PR records
  const [activeTab, setActiveTab] = useState<'tournament' | 'records'>('tournament');
  
  // Countdown state
  const [countdown, setCountdown] = useState<{
    text: string;
    urgency: 'low' | 'medium' | 'high' | 'critical' | 'ended';
    timeLeft: number;
  }>({ text: '', urgency: 'low', timeLeft: 0 });

  // Reset roast storage when tournament changes
  useEffect(() => {
    if (selectedTournament && selectedTournament.id !== roastStorage.lastTournamentId) {
      roastStorage.zeroPointsRoast = null;
      roastStorage.secondPlaceRoast = null;
      roastStorage.lastTournamentId = selectedTournament.id;
    }
  }, [selectedTournament?.id]);

  // Helper function to handle section clicks with scroll and highlight
  const handleSectionClick = (participantId: string, section: 'performance' | 'volume' | 'bonuses') => {
    // Expand the participant if not already expanded
    const isExpanded = expandedParticipant === participantId;
    if (!isExpanded) {
      setExpandedParticipant(participantId);
    }
    
    // Set highlight effect immediately
    setHighlightedSection(section);
    
    // After a brief delay to allow expansion animation, scroll to the section
    setTimeout(() => {
      const sectionId = `${section}-section-${participantId}`;
      const element = document.getElementById(sectionId);
      if (element) {
        element.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center' 
        });
      }
      
      // Remove highlight after 2 seconds
      setTimeout(() => {
        setHighlightedSection(null);
      }, 2000);
    }, isExpanded ? 100 : 600); // Longer delay if we need to wait for expansion
  };

  // Helper function to open rulebook to specific section
  const openRulebookToSection = (section: string, itemName?: string) => {
    setRulebookSection(section);
    if (itemName) {
      setHighlightRulebookItem(itemName);
    }
    setShowPointsGuide(true);
  };

  // Generate contextual witty competition messages based on position and points gap
  const getCompetitiveMessage = (rank: number, pointsGap: number, totalParticipants: number, topPerformer: any) => {
    if (rank === 1) {
      const participantsSorted = [...selectedTournament!.participants].sort((a, b) => b.totalPoints - a.totalPoints);
      const closeGames = participantsSorted.filter(p => p.totalPoints > 0 && (topPerformer.totalPoints - p.totalPoints) <= 20);
      if (closeGames.length > 1) return "Crown's getting heavy 👑";
      return "Untouchable right now";
    }
    
    if (rank === 2) {
      // Use persistent roast for second place
      if (!roastStorage.secondPlaceRoast) {
        const secondPlaceRoasts = [
          "First place but make it fancy",
          "You're the sequel nobody asked for.",
          "You're the plot twist where the hero almost wins.",
          "Second place: the shadow of greatness.",
          "You're the warm-up act for the real champion.",
          "Almost there, but almost doesn't count in fitness.",
          "Second place: where effort meets reality.",
          "You're the runner-up in a one-person race.",
          "Second place: the silver lining of losing.",
          "You're the backup plan for victory.",
          "Second place: the art of being nearly unstoppable.",
          "You're the reason first place looks so good.",
          "Second place: the ultimate motivator for next time.",
          "You're the benchmark for everyone else's success.",
          "Second place: the proof that you're almost elite.",
          "You're the NPC in someone else's fitness journey.",
          "Second place: the influencer of mediocrity.",
          "You're the Spotify ad between first place's PRs.",
          "Second place: the plot twist no one saw coming, but no one cared about either.",
          "You're the TikTok trend that peaked too soon.",
          "{name} is writing your fitness obituary.",
          "Second place: {name} is using your effort as a warm-up.",
          "You're the reason {name} sleeps easy at night.",
          "{name} called—they said thanks for the easy win.",
          "Second place: {name} is the main character, and you're the side quest."
        ];
        let roast = secondPlaceRoasts[Math.floor(Math.random() * secondPlaceRoasts.length)];
        if (roast.includes('{name}')) {
          const name = topPerformer?.user?.name || 'first place';
          roast = roast.replace('{name}', name);
        }
        roastStorage.secondPlaceRoast = roast;
      }
      return roastStorage.secondPlaceRoast;
    }
    
    if (rank === 3) {
      const thirdPlaceRoasts = [
        "Bronze is just warm-up 🥉",
        "Podium's getting cold 🧊",
        "Third place: the consolation prize of effort.",
        "You're the reason second place feels better about themselves.",
        "{name} and second place are sharing a laugh at your expense.",
        "Third place: the participation trophy of podiums.",
        "You're the buffer between greatness and mediocrity.",
        "{name} is using your effort as a cooldown.",
        "Third place: the sidekick of the sidekick.",
        "You're the reason the podium has three steps.",
        "{name} called—they said thanks for keeping the podium warm."
      ];
      const roast = thirdPlaceRoasts[Math.floor(Math.random() * thirdPlaceRoasts.length)];
      return roast.replace('{name}', topPerformer?.user?.name || 'first place');
    }
    
    if (rank <= totalParticipants / 2) {
      return "Mediocrity loves company ";
    }
    
    if (rank === totalParticipants && totalParticipants > 1) {
      return "Rock bottom has great WiFi ";
    }
    
    return "Gravity seems stronger for you ";
  };

  // Get roast message for current user
  const getCurrentUserRoast = () => {
    if (!selectedTournament || !profile) return null;
    
    const currentParticipant = selectedTournament.participants.find(p => p.userId === profile.id);
    if (!currentParticipant) return null;
    
    // Ensure participants are properly sorted and find the actual rank
    const participantsSorted = [...selectedTournament.participants].sort((a, b) => b.totalPoints - a.totalPoints);
    const actualRank = participantsSorted.findIndex(p => p.userId === profile.id) + 1;
    const displayRank = actualRank > 0 ? actualRank : currentParticipant.rank;
    const topPerformer = participantsSorted[0];
    const pointsFromLeader = topPerformer ? topPerformer.totalPoints - currentParticipant.totalPoints : 0;
    const totalParticipants = selectedTournament.participants.length;
    
    // Special handling for users with 0 points
    if (currentParticipant.totalPoints === 0) {
      if (!roastStorage.zeroPointsRoast) {
        roastStorage.zeroPointsRoast = harshRoasts[Math.floor(Math.random() * harshRoasts.length)];
      }
      return roastStorage.zeroPointsRoast;
    }
    
    return getCompetitiveMessage(displayRank, pointsFromLeader, totalParticipants, topPerformer);
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
    // Add debug logging
    console.log('Participant:', participant.user.name, 'PointsBreakdown:', participant.pointsBreakdown);
    
    // Ensure pointsBreakdown exists and has all required properties with proper fallbacks
    const breakdown = participant.pointsBreakdown || {
      prPoints: 0,
      improvementPoints: 0,
      competitivePoints: 0,
      consistencyPoints: 0,
      participationPoints: 0,
      exercisePoints: 0,
      varietyPoints: 0,
      bonusPoints: 0
    };
    
    // Helper function to safely convert to number
    const safeNumber = (value: any): number => {
      const num = Number(value);
      return isNaN(num) ? 0 : num;
    };
    
    // Core Performance: PRs, improvements, and competitive
    const performance = safeNumber(breakdown.prPoints) + 
                       safeNumber(breakdown.improvementPoints) +
                       safeNumber(breakdown.competitivePoints);
    
    // Volume & Consistency: daily work and habits
    const volume = safeNumber(breakdown.consistencyPoints) + 
                  safeNumber(breakdown.participationPoints) +
                  safeNumber(breakdown.exercisePoints) +
                  safeNumber(breakdown.varietyPoints);
    
    // Bonuses: achievements and special rewards
    const bonuses = safeNumber(breakdown.bonusPoints);
    
    // Ensure all values are valid numbers
    const result = {
      performance: Math.max(0, performance),
      volume: Math.max(0, volume),
      bonuses: Math.max(0, bonuses)
    };
    
    console.log('Calculated breakdown:', result);
    
    return result;
  };

  const getBadgeClickHandler = (badgeType: BadgeType, participantId: string) => {
    switch (badgeType) {
      case BadgeType.FIRST_PR:
      case BadgeType.IMPROVEMENT_STAR:
        return () => handleSectionClick(participantId, 'performance');
      
      case BadgeType.CONSISTENCY_KING:
      case BadgeType.WEEKEND_WARRIOR:
      case BadgeType.VOLUME_CRUSHER:
      case BadgeType.CATEGORY_MASTER:
      case BadgeType.CORE_DESTROYER:
        return () => handleSectionClick(participantId, 'volume');
        
      case BadgeType.PERFECT_WEEK:
      case BadgeType.NEWCOMER_BONUS:
      default:
        return () => handleSectionClick(participantId, 'bonuses');
    }
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
    
    // Sort by priority and take top 2
    return badges
      .sort((a, b) => {
        const aIndex = priorityOrder.indexOf(a.type);
        const bIndex = priorityOrder.indexOf(b.type);
        return aIndex - bIndex;
      })
      .slice(0, 2);
  };

  // Badge icon and short name mapping
  const getBadgeIcon = (badgeType: BadgeType) => {
    const IconComponent = TOURNAMENT_ICONS[badgeType] || TOURNAMENT_ICONS.BONUSES;
    // PR badge icon color matches performance gradient
    if (badgeType === BadgeType.FIRST_PR) {
      return <IconComponent className="h-3 w-3 text-amber-200 dark:text-amber-100" />;
    }
    // High volume badge icon color matches volume gradient
    if (badgeType === BadgeType.VOLUME_CRUSHER) {
      return <IconComponent className="h-3 w-3 text-blue-200 dark:text-blue-100" />;
    }
    // Streak badge icon color matches volume gradient
    if (badgeType === BadgeType.CONSISTENCY_KING) {
      return <IconComponent className="h-3 w-3 text-blue-200 dark:text-blue-100" />;
    }
    return <IconComponent className="h-3 w-3" />;
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
      case BadgeType.FIRST_PR: // PR badge matches performance section
        return 'text-amber-50 bg-gradient-to-r from-amber-600 to-orange-600 border-amber-200 dark:text-amber-100 dark:bg-gradient-to-r dark:from-amber-600 dark:to-orange-600 dark:border-amber-700/50';
      case BadgeType.CONSISTENCY_KING: // Streak badge, avoid orange clash
        return 'text-blue-50 bg-gradient-to-r from-blue-600 to-purple-600 border-blue-200 dark:text-blue-100 dark:bg-gradient-to-r dark:from-blue-600 dark:to-purple-600 dark:border-blue-700/50';
      case BadgeType.IMPROVEMENT_STAR:
        return 'text-purple-50 bg-purple-700 border-purple-200 dark:text-purple-100 dark:bg-purple-700 dark:border-purple-700/50';
      case BadgeType.WEEKEND_WARRIOR:
        return 'text-orange-50 bg-orange-700 border-orange-200 dark:text-orange-100 dark:bg-orange-700 dark:border-orange-700/50';
      case BadgeType.CATEGORY_MASTER:
        return 'text-emerald-50 bg-emerald-700 border-emerald-200 dark:text-emerald-100 dark:bg-emerald-700 dark:border-emerald-700/50';
      case BadgeType.NEWCOMER_BONUS:
        return 'text-teal-50 bg-teal-700 border-teal-200 dark:text-teal-100 dark:bg-teal-700 dark:border-teal-700/50';
      case BadgeType.PERFECT_WEEK:
        return 'text-red-50 bg-red-700 border-red-200 dark:text-red-100 dark:bg-red-700 dark:border-red-200/50';
      case BadgeType.VOLUME_CRUSHER: // High volume matches volume section
        return 'text-blue-50 bg-gradient-to-r from-blue-600 to-purple-600 border-indigo-200 dark:text-blue-100 dark:bg-gradient-to-r dark:from-blue-600 dark:to-purple-600 dark:border-indigo-700/50';
      case BadgeType.CORE_DESTROYER:
        return 'text-emerald-50 bg-emerald-700 border-emerald-200 dark:text-emerald-100 dark:bg-emerald-700 dark:border-emerald-700/50';
      default:
        return 'text-gray-50 bg-gray-700 border-gray-200 dark:text-gray-100 dark:bg-gray-700 dark:border-gray-700/50';
    }
  };

  // Position badge rendering
  const renderPositionBadge = (position: number) => {
    if (position === 1) {
      const CrownIcon = TOURNAMENT_ICONS.FIRST_PLACE;
      return (
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center shadow-md">
          <CrownIcon className="h-4 w-4 text-yellow-900" />
        </div>
      );
    } else if (position === 2) {
      const MedalIcon = TOURNAMENT_ICONS.SECOND_PLACE;
      return (
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-300 to-gray-500 flex items-center justify-center shadow-md">
          <MedalIcon className="h-4 w-4 text-gray-700" />
        </div>
      );
    } else if (position === 3) {
      const AwardIcon = TOURNAMENT_ICONS.THIRD_PLACE;
      return (
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-600 to-amber-800 flex items-center justify-center shadow-md">
          <AwardIcon className="h-4 w-4 text-amber-100" />
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
    const areBadgesExpanded = expandedBadgesParticipantId === participant.userId;
    const winningStreak = selectedTournament ? getWinningStreakForTournament(participant.userId, selectedTournament) : 0;
    const pointBreakdown = getPointBreakdown(participant);
    const relevantBadges = getRelevantBadges(participant.badges);
    const badgesToShow = areBadgesExpanded ? participant.badges : relevantBadges;
    
    // Enhanced card styling based on rank
    const getCardStyling = (rank: number, isCurrentUser: boolean) => {
      switch (rank) {
        case 1:
          // Use a neutral light background for dark mode for readability, keep yellow border
          return 'bg-gradient-to-r from-amber-50 via-yellow-50 to-orange-50 dark:from-slate-900/70 dark:via-slate-800/70 dark:to-slate-900/70 border-amber-300/50 dark:border-yellow-200/50 shadow-lg';
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
        className={`relative transition-all duration-500 ease-out transform tournament-card ${getCardStyling(participant.rank, isCurrentUser)} ${
          isExpanded 
            ? 'scale-[1.01] shadow-xl rounded-t-2xl rounded-b-none'
            : 'shadow-md rounded-2xl'
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
              <Avatar className={`h-8 w-8 ring-2 transition-all duration-200 ${isCurrentUser ? 'ring-teal-500 ring-offset-2 ring-offset-white dark:ring-offset-slate-900 shadow-md' : 'ring-white dark:ring-gray-800 ring-1'}`}>
                <AvatarImage src={participant.user.avatarUrl} alt={participant.user.name} />
                <AvatarFallback className="bg-muted text-muted-foreground text-xs">
                  {participant.user.name?.substring(0, 2).toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className={`font-semibold text-sm truncate ${isCurrentUser ? 'text-teal-700 dark:text-teal-300' : 'text-foreground'}`}>
                    {participant.user.name}
                    {isCurrentUser && <span className="text-xs text-teal-600 dark:text-teal-400 ml-1">(You)</span>}
                  </h3>
                </div>
                
                {/* Badges, clickable to scroll to details */}
                <div className="flex gap-1 mt-1 flex-wrap tournament-badges">
                  {/* Winning streak badge */}
                  {participant.rank === 1 && winningStreak >= 2 && (
                    <Badge className="text-xs bg-gradient-to-r from-orange-600 to-red-600 text-white dark:from-orange-400 dark:to-red-400 dark:text-gray-900 px-2 py-0.5 rounded-full flex-shrink-0 flex items-center gap-1">
                      {(() => {
                        const FlameIcon = TOURNAMENT_ICONS.WINNING_STREAK;
                        return <FlameIcon className="w-2.5 h-2.5 text-white dark:text-gray-900" />;
                      })()}
                      <span>{winningStreak}x</span>
                    </Badge>
                  )}
                  
                  {/* Relevant badges (expanded or just top 1) */}
                  {badgesToShow.map(badge => (
                    <Badge 
                      key={badge.id}
                      className={`text-xs px-2 py-0.5 rounded-full border flex-shrink-0 flex items-center gap-1 ${getBadgeStyles(badge.type)}`}
                    >
                      {/* Remove PR trophy icon from PR badge */}
                      {badge.type !== BadgeType.FIRST_PR && getBadgeIcon(badge.type)}
                      <span className="font-medium">{getBadgeShortName(badge.type)}</span>
                    </Badge>
                  ))}
                  
                  {/* Show "+X more" or "Less" toggle if there are more than 2 badges */}
                  {participant.badges.length > 2 && (
                    <Badge 
                      onClick={(e) => {
                        e.stopPropagation();
                        setExpandedBadgesParticipantId(areBadgesExpanded ? null : participant.userId);
                      }}
                      className="text-xs px-2 py-0.5 bg-gray-100/80 text-gray-600 dark:bg-gray-900/30 dark:text-gray-400 rounded-full border border-gray-200 dark:border-gray-700/50 flex-shrink-0 cursor-pointer"
                    >
                      {areBadgesExpanded ? 'Less' : `+${participant.badges.length - 2} more`}
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
          <div className={`mt-3 pt-3 border-t border-border/30 transition-all duration-300 ${
            participant.rank === 1 ? 'dark:border-yellow-200/40' : 'dark:border-gray-300/40'
          }`}>
            <div className="grid grid-cols-3 gap-3 text-sm">
              <div 
                className="flex flex-col items-center text-center p-2 rounded-lg"
                onClick={() => handleSectionClick(participant.userId, 'performance')}
              >
                <span className="text-xs text-muted-foreground mb-1">Performance</span>
                <span className="font-bold text-lg bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
                  {pointBreakdown?.performance || 0}
                </span>
                <span className="text-xs text-muted-foreground">PRs & Competition</span>
              </div>
              <div 
                className="flex flex-col items-center text-center p-2 rounded-lg"
                onClick={() => handleSectionClick(participant.userId, 'volume')}
              >
                <span className="text-xs text-muted-foreground mb-1">Volume</span>
                <span className="font-bold text-lg bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  {pointBreakdown?.volume || 0}
                </span>
                <span className="text-xs text-muted-foreground">Work & Consistency</span>
              </div>
              <div 
                className="flex flex-col items-center text-center p-2 rounded-lg"
                onClick={() => handleSectionClick(participant.userId, 'bonuses')}
              >
                <span className="text-xs text-muted-foreground mb-1">Bonuses</span>
                <span className="font-bold text-lg bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                  {pointBreakdown?.bonuses || 0}
                </span>
                <span className="text-xs text-muted-foreground">Achievements</span>
              </div>
            </div>
          </div>

          {/* Expandable Details Toggle */}
          <div className={`mt-3 pt-3 border-t border-border/30 ${
            participant.rank === 1 ? 'dark:border-yellow-200/40' : 'dark:border-gray-300/40'
          }`}>
            <button
              onClick={() => setExpandedParticipant(isExpanded ? null : participant.userId)}
              className={`w-full flex items-center justify-center gap-2 text-sm font-medium transition-all duration-300 ease-out py-3 px-4 rounded-2xl z-30 relative apple-button ${isExpanded ? 'text-teal-700 dark:text-teal-300 bg-gradient-to-r from-teal-50/80 to-teal-100/80 dark:from-teal-950/40 dark:to-teal-900/30 border border-teal-200/50 dark:border-teal-800/50' : 'text-slate-600 dark:text-slate-400 bg-gradient-to-r from-slate-50/80 to-slate-100/80 dark:from-slate-800/80 dark:to-slate-700/80 border border-slate-200/50 dark:border-slate-700/50 hover:from-slate-100 hover:to-slate-200 dark:hover:from-slate-700 dark:hover:to-slate-600 hover:text-slate-700 dark:hover:text-slate-300'}`}
            >
              <span className="text-sm font-medium">{isExpanded ? 'Hide Point Breakdown' : 'Show Point Breakdown'}</span>
              <div className={`transition-transform duration-300 ease-out ${isExpanded ? 'rotate-180' : 'rotate-0'}`}> 
                <ChevronDown className="w-4 h-4" />
              </div>
            </button>

            {/* Expandable Detail Section - Unified Single Card */}
            <div className={`overflow-hidden transition-all duration-500 ease-out ${
              isExpanded 
                ? 'max-h-[2000px] opacity-100 -mt-4 z-10 translate-y-0'
                : 'max-h-0 opacity-0 mt-0 z-10 -translate-y-4'
            }`}>
              <div className="space-y-3 text-sm">
                <div className="bg-gradient-to-br from-white to-slate-50/50 dark:from-slate-900/50 dark:to-slate-800/30 p-5 border border-slate-200/50 dark:border-slate-700/50 shadow-sm rounded-2xl"> 
                  

                  
                  {/* --- UNIFIED BREAKDOWN WITH DIVIDERS --- */}
                  <div className="space-y-0">
                    {/* --- Performance Section --- */}
                    {(pointBreakdown.performance > 0) && (
                      <div 
                        id={`performance-section-${participant.userId}`}
                        className={`transition-all duration-300 ${highlightedSection === 'performance' ? 'ring-2 ring-amber-400/50 bg-amber-50/30 dark:bg-amber-950/20 rounded-lg' : ''}`}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <h5 className="font-semibold text-foreground">Performance</h5>
                          </div>
                          <span className="font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent px-2 py-1 rounded-lg text-sm">
                            {pointBreakdown.performance} pts
                          </span>
                        </div>
                        
                        <div className="space-y-2 mb-4">
                          {participant.prDetails.map((pr, idx) => (
                            <div 
                              key={`pr-${idx}`} 
                              className="flex items-center justify-between text-sm p-2 rounded-md hover:bg-amber-100/50 dark:hover:bg-amber-900/20 cursor-pointer transition-all duration-200"
                              onClick={() => openRulebookToSection('performance', 'Personal Records')}
                            >
                              <div className="flex items-center gap-2">
                                {(() => {
                                  const TrophyIcon = TOURNAMENT_ICONS.PR_DETAIL;
                                  return <TrophyIcon className="w-4 h-4 text-yellow-500 flex-shrink-0" />;
                                })()}
                                <div>
                                  <span className="font-medium">{pr.exerciseName} PR</span>
                                  <div className="text-xs text-muted-foreground">
                                    {pr.previousBest > 0 ? `${pr.previousBest} → ${pr.weight}lbs` : `${pr.weight}lbs (First Time)`}
                                  </div>
                                </div>
                              </div>
                              <span className="font-semibold text-emerald-600 dark:text-emerald-400">+{POINTS_CONFIG.PR_ACHIEVEMENT.points}</span>
                            </div>
                          ))}

                          {participant.prDetails.filter(pr => pr.improvementPercent > 0).map((pr, idx) => (
                            <div 
                              key={`improvement-${idx}`} 
                              className="flex items-center justify-between text-sm p-2 rounded-md hover:bg-amber-100/50 dark:hover:bg-amber-900/20 cursor-pointer transition-all duration-200"
                              onClick={() => openRulebookToSection('performance', 'Improvement Bonus')}
                            >
                              <div className="flex items-center gap-2">
                                {(() => {
                                  const TrendingUpIcon = TOURNAMENT_ICONS.IMPROVEMENT_DETAIL;
                                  return <TrendingUpIcon className="w-4 h-4 text-emerald-500 flex-shrink-0" />;
                                })()}
                                <div>
                                  <span className="font-medium">{pr.exerciseName} Gain</span>
                                  <div className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                                    +{pr.improvementPercent.toFixed(1)}% Improvement
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    {pr.improvementPercent.toFixed(1)}% × 2 pts = {Math.min(Math.floor(pr.improvementPercent * 2), 50)} pts
                                  </div>
                                </div>
                              </div>
                              <span className="font-semibold text-emerald-600 dark:text-emerald-400">+{Math.min(Math.floor(pr.improvementPercent * 2), 50)}</span>
                            </div>
                          ))}

                          {/* Show improvements that don't qualify as PRs */}
                          {participant.improvementDetails && participant.improvementDetails.map((improvement, idx) => (
                            <div 
                              key={`non-pr-improvement-${idx}`} 
                              className="flex items-center justify-between text-sm p-2 rounded-md hover:bg-amber-100/50 dark:hover:bg-amber-900/20 cursor-pointer transition-all duration-200"
                              onClick={() => openRulebookToSection('performance', 'Improvement Bonus')}
                            >
                              <div className="flex items-center gap-2">
                                {(() => {
                                  const TrendingUpIcon = TOURNAMENT_ICONS.IMPROVEMENT_DETAIL;
                                  return <TrendingUpIcon className="w-4 h-4 text-blue-500 flex-shrink-0" />;
                                })()}
                                <div>
                                  <span className="font-medium">{improvement.exerciseName} Progress</span>
                                  <div className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                                    +{improvement.improvementPercent.toFixed(1)}% Improvement
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    {improvement.improvementPercent.toFixed(1)}% × 2 pts = {Math.min(Math.floor(improvement.improvementPercent * 2), 50)} pts
                                  </div>
                                </div>
                              </div>
                              <span className="font-semibold text-emerald-600 dark:text-emerald-400">+{Math.min(Math.floor(improvement.improvementPercent * 2), 50)}</span>
                            </div>
                          ))}

                          {participant.competitiveDetails && participant.competitiveDetails.map((comp, idx) => (
                            <div 
                              key={`comp-${idx}`} 
                              className="flex items-center justify-between text-sm p-2 rounded-md hover:bg-amber-100/50 dark:hover:bg-amber-900/20 cursor-pointer transition-all duration-200"
                              onClick={() => openRulebookToSection('performance', 'Beat Friends')}
                            >
                              <div className="flex items-center gap-2">
                                {(() => {
                                  const ZapIcon = TOURNAMENT_ICONS.COMPETITIVE_DETAIL;
                                  return <ZapIcon className="w-4 h-4 text-purple-500 flex-shrink-0" />;
                                })()}
                                <div>
                                  <span className="font-medium">Beat {comp.targetUser || 'Friend'}</span>
                                  <div className="text-xs text-muted-foreground">
                                    {comp.exerciseName} ({comp.type})
                                  </div>
                                </div>
                              </div>
                              <span className="font-semibold text-emerald-600 dark:text-emerald-400">+{comp.points}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Divider between sections */}
                    {(pointBreakdown.performance > 0 && pointBreakdown.volume > 0) && (
                      <div className="border-t border-slate-300/60 dark:border-slate-700/40 my-6"></div>
                    )}
                    
                    {/* --- Volume & Consistency Section --- */}
                    {(pointBreakdown.volume > 0) && (
                      <div 
                        id={`volume-section-${participant.userId}`}
                        className={`transition-all duration-300 ${highlightedSection === 'volume' ? 'ring-2 ring-blue-400/50 bg-blue-50/30 dark:bg-blue-950/20 rounded-lg' : ''}`}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <h5 className="font-semibold text-foreground">Volume & Consistency</h5>
                          </div>
                          <span className="font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent px-2 py-1 rounded-lg text-sm">
                            {pointBreakdown.volume} pts
                          </span>
                        </div>
                        
                        <div className="space-y-2 mb-4">
                          {(participant.pointsBreakdown.participationPoints + participant.pointsBreakdown.varietyPoints) > 0 && (
                            <div 
                              className="flex items-center justify-between text-sm p-2 rounded-md hover:bg-blue-100/50 dark:hover:bg-blue-900/20 cursor-pointer transition-all duration-200"
                              onClick={() => openRulebookToSection('volume', 'Daily Workout')}
                            >
                              <div className="flex items-center gap-2">
                                {(() => {
                                  const CalendarIcon = TOURNAMENT_ICONS.DAILY_WORKOUT;
                                  return <CalendarIcon className="w-4 h-4 text-blue-500 flex-shrink-0" />;
                                })()}
                                <div>
                                  <span className="font-medium">Daily Workouts</span>
                                  <div className="text-xs text-muted-foreground">
                                    {participant.workoutDays.length} days logged × 6 pts = {participant.pointsBreakdown.participationPoints} pts
                                  </div>
                                </div>
                              </div>
                              <span className="font-semibold text-emerald-600 dark:text-emerald-400">+{participant.pointsBreakdown.participationPoints + participant.pointsBreakdown.varietyPoints}</span>
                            </div>
                          )}

                          {participant.pointsBreakdown.consistencyPoints > 0 && (
                            <div 
                              className="flex items-center justify-between text-sm p-2 rounded-md hover:bg-blue-100/50 dark:hover:bg-blue-900/20 cursor-pointer transition-all duration-200"
                              onClick={() => openRulebookToSection('volume', 'Consistency Bonus')}
                            >
                              <div className="flex items-center gap-2">
                                {(() => {
                                  const CheckCircleIcon = TOURNAMENT_ICONS.CONSISTENCY_DETAIL;
                                  return <CheckCircleIcon className="w-4 h-4 text-emerald-500 flex-shrink-0" />;
                                })()}
                                <div>
                                  <span className="font-medium">Consistency Bonus</span>
                                  <div className="text-xs text-muted-foreground">5+ workout days</div>
                                </div>
                              </div>
                              <span className="font-semibold text-emerald-600 dark:text-emerald-400">+{participant.pointsBreakdown.consistencyPoints}</span>
                            </div>
                          )}
                          
                          {(participant.exerciseStats?.totalExercises || 0) > 0 && (
                            <div 
                              className="flex items-center justify-between text-sm p-2 rounded-md hover:bg-blue-100/50 dark:hover:bg-blue-900/20 cursor-pointer transition-all duration-200"
                              onClick={() => openRulebookToSection('volume', 'Exercise Points')}
                            >
                              <div className="flex items-center gap-2">
                                {(() => {
                                  const AwardIcon = TOURNAMENT_ICONS.EXERCISE_VOLUME;
                                  return <AwardIcon className="w-4 h-4 text-indigo-500 flex-shrink-0" />;
                                })()}
                                <div>
                                  <span className="font-medium">Exercise Volume</span>
                                  <div className="text-xs text-muted-foreground">
                                    {participant.exerciseStats?.totalExercises || 0} exercises × 8 pts = {participant.pointsBreakdown.exercisePoints} pts
                                  </div>
                                </div>
                              </div>
                              <span className="font-semibold text-emerald-600 dark:text-emerald-400">+{participant.pointsBreakdown.exercisePoints}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Divider between sections */}
                    {(pointBreakdown.volume > 0 && pointBreakdown.bonuses > 0) && (
                      <div className="border-t border-slate-300/60 dark:border-slate-700/40 my-6"></div>
                    )}
                    
                    {/* --- Achievement Bonuses Section --- */}
                    {(pointBreakdown.bonuses > 0) && (
                      <div 
                        id={`bonuses-section-${participant.userId}`}
                        className={`transition-all duration-300 ${highlightedSection === 'bonuses' ? 'ring-2 ring-emerald-400/50 bg-emerald-50/30 dark:bg-emerald-950/20 rounded-lg' : ''}`}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <h5 className="font-semibold text-foreground">Achievement Bonuses</h5>
                          </div>
                          <span className="font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent px-2 py-1 rounded-lg text-sm">
                            {pointBreakdown.bonuses} pts
                          </span>
                        </div>
                        
                        <div className="space-y-2 mb-4">
                          {(participant.exerciseStats?.newExerciseBonusPoints || 0) > 0 && (
                            <div 
                              className="flex items-center justify-between text-sm p-2 rounded-md hover:bg-emerald-100/50 dark:hover:bg-emerald-900/20 cursor-pointer transition-all duration-200"
                              onClick={() => openRulebookToSection('bonuses', 'New Exercise Bonus')}
                            >
                              <div className="flex items-center gap-2">
                                {(() => {
                                  const PlusIcon = TOURNAMENT_ICONS.NEW_EXERCISE;
                                  return <PlusIcon className="w-4 h-4 text-teal-500 flex-shrink-0" />;
                                })()}
                                <div>
                                  <span className="font-medium">New Exercise Bonus</span>
                                  <div className="text-xs text-muted-foreground">
                                    {Math.floor((participant.exerciseStats?.newExerciseBonusPoints || 0) / NEW_EXERCISE_BONUS.points)} new exercises × 10 pts = {participant.exerciseStats?.newExerciseBonusPoints || 0} pts
                                  </div>
                                </div>
                              </div>
                              <span className="font-semibold text-emerald-600 dark:text-emerald-400">+{participant.exerciseStats?.newExerciseBonusPoints || 0}</span>
                            </div>
                          )}
                          
                          {participant.badges.map(badge => (
                            <div 
                              key={badge.id} 
                              className="flex items-center justify-between text-sm p-2 rounded-md hover:bg-emerald-100/50 dark:hover:bg-emerald-900/20 cursor-pointer transition-all duration-200"
                              onClick={() => openRulebookToSection('bonuses')}
                            >
                              <div className="flex items-center gap-2">
                                <div className="flex-shrink-0">{getBadgeIcon(badge.type)}</div>
                                <div>
                                  <span className="font-medium">{BADGE_DEFINITIONS[badge.type].name}</span>
                                </div>
                              </div>
                              <span className="font-semibold text-emerald-600 dark:text-emerald-400">+{badge.points}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Quick Summary Footer (Preserved) */}
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
      customHeader={
        <div className="w-full flex flex-col gap-2">
          {/* Pill Switcher (unchanged) */}
          <IOSPillSwitcher activeTab={activeTab} onTabChange={tab => setActiveTab(tab)} />

          {/* Unified Header (integrated with background, improved spacing) */}
          {activeTab === 'tournament' && (
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 mt-4 px-4 pb-2">
              {/* Left: Roast/Message */}
              <div className="flex-1 min-w-0">
                {(() => {
                  const roastMessage = getCurrentUserRoast();
                  if (!roastMessage) {
                    return (
                      <div className="text-center">
                        <span className="font-bold text-lg text-foreground">Join the Competition!</span>
                        <div className="text-sm text-muted-foreground mt-1">Log a workout to get points</div>
                      </div>
                    );
                  }
                  return (
                    <div className="flex flex-col">
                      <span className="font-bold text-lg text-foreground leading-tight">
                        {roastMessage}
                      </span>
                      {(() => {
                        const currentParticipant = selectedTournament?.participants.find(p => p.userId === profile?.id);
                        if (currentParticipant && currentParticipant.totalPoints === 0) {
                          return (
                            <span className="text-sm text-muted-foreground mt-1">
                              Time to get those gains
                            </span>
                          );
                        }
                        return null;
                      })()}
                    </div>
                  );
                })()}
              </div>

              {/* Right: Week Dropdown (with timer) and Guide Button */}
              <div className="flex items-center gap-3 mt-4 md:mt-0">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="outline" 
                      className="flex items-center gap-2 px-4 py-2.5 rounded-2xl min-w-[140px] bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm border-slate-200/60 dark:border-slate-700/60 shadow-sm hover:shadow-md transition-all duration-200 apple-button hover:bg-slate-50 dark:hover:bg-slate-700/90"
                    >
                      <Clock className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                      <span className="font-medium text-sm text-slate-700 dark:text-slate-300">
                        {selectedTournament?.id === currentTournament?.id 
                          ? 'This Week' 
                          : new Date(selectedTournament?.weekStart || '').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                        }
                      </span>
                      {countdown.text && (
                        <div className={`ml-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                          countdown.urgency === 'low' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' : ''
                        }${
                          countdown.urgency === 'medium' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300' : ''
                        }${
                          countdown.urgency === 'high' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300' : ''
                        }${
                          countdown.urgency === 'critical' ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300 animate-pulse' : ''
                        }${
                          countdown.urgency === 'ended' ? 'bg-gray-100 text-gray-700 dark:bg-gray-900/40 dark:text-gray-300' : ''
                        }`}>
                          {countdown.text}{countdown.urgency !== 'ended' ? ' left' : ''}
                        </div>
                      )}
                      <ChevronDown className="h-4 w-4 text-slate-400" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48 rounded-2xl border-slate-200/60 dark:border-slate-700/60 bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl shadow-lg">
                    {/* Current Tournament */}
                    {currentTournament && (
                      <DropdownMenuItem 
                        onClick={() => setSelectedTournament(currentTournament)}
                        className={`flex items-center justify-between rounded-xl m-1 ${selectedTournament?.id === currentTournament?.id ? 'bg-teal-50 dark:bg-teal-950/30 text-teal-700 dark:text-teal-300' : ''}`}
                      >
                        <span className="font-medium">This Week</span>
                        {selectedTournament?.id === currentTournament?.id && (
                          <div className="w-2 h-2 bg-teal-500 rounded-full" />
                        )}
                      </DropdownMenuItem>
                    )}
                    {/* Past Tournaments */}
                    {tournamentHistory
                      .filter(tournament => tournament.id !== currentTournament?.id)
                      .slice()
                      .reverse()
                      .map(tournament => (
                        <DropdownMenuItem 
                          key={tournament.id}
                          onClick={() => setSelectedTournament(tournament)}
                          className={`flex items-center justify-between rounded-xl m-1 ${selectedTournament?.id === tournament.id ? 'bg-teal-50 dark:bg-teal-950/30 text-teal-700 dark:text-teal-300' : ''}`}
                        >
                          <span className="font-medium">
                            {new Date(tournament.weekStart).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </span>
                          {selectedTournament?.id === tournament.id && (
                            <div className="w-2 h-2 bg-teal-500 rounded-full" />
                          )}
                        </DropdownMenuItem>
                      ))}
                  </DropdownMenuContent>
                </DropdownMenu>
                <Button 
                  variant="outline" 
                  size="lg"
                  onClick={() => setShowPointsGuide(true)}
                  className="rounded-2xl flex items-center gap-2 px-4 py-2.5 bg-gradient-to-br from-teal-50 to-teal-100/80 hover:from-teal-100 hover:to-teal-200/80 dark:from-teal-950/30 dark:to-teal-900/20 dark:hover:from-teal-900/40 dark:hover:to-teal-800/30 border-teal-200/60 dark:border-teal-800/60 shadow-sm hover:shadow-md transition-all duration-200 apple-button"
                >
                  {(() => {
                    const BookOpenIcon = TOURNAMENT_ICONS.RULEBOOK;
                    return <BookOpenIcon className="h-4 w-4 text-teal-600 dark:text-teal-400" />;
                  })()}
                  <span className="font-medium text-teal-700 dark:text-teal-300">Guide</span>
                </Button>
              </div>
            </div>
          )}
        </div>
      }
    >
      <div className={`space-y-6 relative transition-all duration-500 ease-out ${contentReady ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>

        {/* Page Title removed as per new design */}

        {/* Tournament Header with Roast and Week Selector - Only for Tournament tab */}
        {activeTab === 'tournament' && (currentTournament || tournamentHistory.length > 0) && (
          <div className="border-t border-slate-300/60 dark:border-slate-600/60 my-2"></div>
        )}
        
        {/* Tournament Content */}
        {activeTab === 'tournament' && (
          <>
            {/* Dynamic Rulebook Modal */}
            <TournamentRulebook 
              isOpen={showPointsGuide} 
              onClose={() => {
                setShowPointsGuide(false);
                setRulebookSection(null);
                setHighlightRulebookItem(null);
              }}
              initialSection={rulebookSection}
              highlightItem={highlightRulebookItem}
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
                      {(() => {
                        const TrophyIcon = TOURNAMENT_ICONS.PERFORMANCE;
                        return <TrophyIcon className="w-16 h-16 text-muted-foreground mx-auto mb-4" />;
                      })()}
                      <h3 className="text-lg font-semibold text-foreground mb-2">No Participants Yet</h3>
                      <p className="text-muted-foreground text-sm">
                        Log a workout to join the tournament!
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {/* Removed Historical Tournaments section since it's now at the top */}
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
