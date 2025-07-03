import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Trophy, Target, Users, Crown, Medal, Award, Flame } from 'lucide-react';
import { Tournament, TournamentParticipant } from '@/types';
import './TournamentStatusCard.css';

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
  "You have more gym memberships than gym visits.",
  "Your biceps are on a milk carton—missing since January."
];

// Store roast messages globally to persist across navigation
const roastStorage = {
  zeroPointsRoast: null as string | null,
  secondPlaceRoast: null as string | null,
  lastTournamentId: null as string | null
};

interface TournamentStatusCardProps {
  tournament: Tournament | null;
  currentUserId: string;
  loading?: boolean;
  initialized?: boolean;
}

const TournamentStatusCard: React.FC<TournamentStatusCardProps> = ({ 
  tournament, 
  currentUserId, 
  loading,
  initialized = false
}) => {
  const navigate = useNavigate();
  // Removed border flare state and effect

  // Reset roast storage when tournament changes
  useEffect(() => {
    if (tournament && tournament.id !== roastStorage.lastTournamentId) {
      roastStorage.zeroPointsRoast = null;
      roastStorage.secondPlaceRoast = null;
      roastStorage.lastTournamentId = tournament.id;
    }
  }, [tournament?.id]);
  
  // Show loader only if not initialized and loading
  if (!initialized && loading) {
    return (
      <Card className="bg-gradient-to-r from-purple-50 via-blue-50 to-indigo-50 dark:from-purple-950/30 dark:via-blue-950/30 dark:to-indigo-950/30 border-purple-200/50 dark:border-purple-800/50 rounded-xl backdrop-blur-sm">
        <CardContent className="p-4">
          <div className="animate-pulse">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-200 to-blue-200 dark:from-purple-800 dark:to-blue-800 rounded-full"></div>
              <div className="w-24 h-3 bg-gradient-to-r from-purple-200 to-blue-200 dark:from-purple-800 dark:to-blue-800 rounded"></div>
            </div>
            <div className="flex items-center justify-between">
              <div className="w-32 h-3 bg-gradient-to-r from-purple-200 to-blue-200 dark:from-purple-800 dark:to-blue-800 rounded"></div>
              <div className="w-12 h-4 bg-gradient-to-r from-purple-200 to-blue-200 dark:from-purple-800 dark:to-blue-800 rounded"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Only show "no tournament" state if initialized and actually no tournament
  if (initialized && !tournament) {
    return (
      <Card className="bg-gradient-to-r from-gray-50 via-slate-50 to-zinc-50 dark:from-gray-950/30 dark:via-slate-950/30 dark:to-zinc-950/30 border-gray-200/50 dark:border-gray-800/50 rounded-xl backdrop-blur-sm">
        <CardContent className="p-4 text-center">
          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
            <Target className="h-5 w-5 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold text-gray-600 dark:text-gray-400 mb-2">No Active Tournament</h3>
          <p className="text-sm text-gray-500 dark:text-gray-500">Start logging workouts to join the weekly competition!</p>
        </CardContent>
      </Card>
    );
  }

  // Special handling when tournament exists but no one has points yet (early in the week)
  if (initialized && tournament && tournament.participants.length > 0) {
    const hasActiveParticipants = tournament.participants.some(p => p.totalPoints > 0);
    
    if (!hasActiveParticipants) {
      return (
        <Card 
          className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-950/30 dark:via-indigo-950/30 dark:to-purple-950/30 border-blue-200/50 dark:border-blue-800/50 cursor-pointer active:opacity-80 transition-opacity duration-150 rounded-xl backdrop-blur-sm"
          onClick={() => navigate('/tournament')}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex-1 min-w-0">
                {/* Make "Be the First!" the main focal point */}
                <div className="flex items-center justify-between">
                  <span className="font-bold text-lg text-foreground leading-tight">Be the First! 🏃‍♂️</span>
                  {/* Compact action indicator */}                <div 
                  className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center flex-shrink-0 cursor-pointer active:scale-90 transition-all duration-150 shadow-lg ring-2 ring-white/20 dark:ring-gray-800/20"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate('/tournament');
                  }}
                >
                  <span className="text-white text-base font-bold">+</span>
                </div>
                </div>
                {/* Motivational subtitle */}
                <div className="mt-1 text-sm text-muted-foreground">
                  Fresh week, fresh competition!
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      );
    }
  }

  // Don't render anything if not initialized yet
  if (!initialized) {
    return null;
  }

  const currentParticipant = tournament.participants.find(p => p.userId === currentUserId);
  
  if (!currentParticipant) {
    return (
      <Card 
        className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-950/30 dark:via-indigo-950/30 dark:to-purple-950/30 border-blue-200/50 dark:border-blue-800/50 cursor-pointer active:opacity-80 rounded-xl backdrop-blur-sm transition-opacity duration-150"
        onClick={() => navigate('/tournament')}
      >
        <CardContent className="p-4 text-center">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-sm mx-auto mb-3">
            <Users className="h-5 w-5 text-white" />
          </div>
          <h3 className="text-lg font-semibold text-blue-600 dark:text-blue-400 mb-2">Join Tournament</h3>
          <p className="text-sm text-blue-500 dark:text-blue-400">Log a workout to join this week's competition!</p>
        </CardContent>
      </Card>
    );
  }

  // Ensure participants are properly sorted and find the actual rank
  const participantsSorted = [...tournament.participants].sort((a, b) => b.totalPoints - a.totalPoints);
  const actualRank = participantsSorted.findIndex(p => p.userId === currentUserId) + 1;
  
  // Use the calculated rank instead of the stored rank to ensure accuracy
  const displayRank = actualRank > 0 ? actualRank : currentParticipant.rank;

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return (        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center shadow-lg ring-2 ring-yellow-200/50">
          <Crown className="h-5 w-5 text-yellow-900" />
        </div>
        );
      case 2:
        return (        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-300 to-gray-500 flex items-center justify-center shadow-lg ring-2 ring-gray-200/50">
          <Medal className="h-5 w-5 text-gray-700" />
        </div>
        );
      case 3:
        return (        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-600 to-amber-800 flex items-center justify-center shadow-lg ring-2 ring-amber-200/50">
          <Award className="h-5 w-5 text-amber-100" />
        </div>
        );
      default:
        return (
          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground font-bold text-lg">
            {rank}
          </div>
        );
    }
  };

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1:
        return 'from-amber-50 via-yellow-50 to-orange-50 dark:from-amber-950/30 dark:via-yellow-950/30 dark:to-orange-950/30 border-amber-300/50 dark:border-amber-700/50 shadow-lg';
      case 2:
        return 'from-slate-50 via-gray-50 to-zinc-50 dark:from-slate-950/30 dark:via-gray-950/30 dark:to-zinc-950/30 border-slate-300/50 dark:border-slate-700/50 shadow-md';
      case 3:
        return 'from-orange-50 via-amber-50 to-yellow-50 dark:from-orange-950/30 dark:via-amber-950/30 dark:to-yellow-950/30 border-orange-300/50 dark:border-orange-700/50 shadow-md';
      case 4:
      case 5:
        return 'from-emerald-50 to-green-100 dark:from-emerald-900/20 dark:to-green-900/20 border-emerald-200/50 dark:border-emerald-800/50';
      default:
        return rank <= 10 
          ? 'from-blue-50 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200/50 dark:border-blue-800/50'
          : 'from-gray-50 to-slate-100 dark:from-gray-900/20 dark:to-slate-900/20 border-gray-200/50 dark:border-gray-800/50';
    }
  };

  const getRankText = (rank: number, short: boolean = false) => {
    if (short) {
      return `#${rank}`;
    }
    if (rank === 1) return '1st Place';
    if (rank === 2) return '2nd Place';
    if (rank === 3) return '3rd Place';
    return `${rank}${rank > 20 ? 'th' : ['th', 'st', 'nd', 'rd'][rank % 10] || 'th'} Place`;
  };

  const totalParticipants = tournament.participants.length;
  
  // Find the actual top performer
  const topPerformer = participantsSorted[0];
  const isTopPerformer = displayRank === 1;
  const pointsFromLeader = topPerformer ? topPerformer.totalPoints - currentParticipant.totalPoints : 0;

  // Generate contextual witty competition messages based on position and points gap
  const getCompetitiveMessage = (rank: number, pointsGap: number, totalParticipants: number) => {
    if (rank === 1) {
      const closeGames = participantsSorted.filter(p => p.totalPoints > 0 && (topPerformer.totalPoints - p.totalPoints) <= 20);
      if (closeGames.length > 1) return "Crown's getting heavy 👑";
      return "Untouchable right now";
    }
    
    if (rank === 2) {
      // Use persistent roast for second place
      if (!roastStorage.secondPlaceRoast) {
        const secondPlaceRoasts = [
          "First place but make it fancy",
          "Second place: forever the bridesmaid, never the bride.",
          "You’re so close, but {name} is still flexing on you.",
          "Silver medal, golden disappointment.",
          "You peaked at 'almost good enough'.",
          "Second place: the best at losing.",
          "Maybe if you trained as hard as {name}, you'd be on top.",
          "First place is using your effort as a warmup.",
          "Second place: the king of 'not quite'.",
          "Silver looks good on you, but gold would look better—on someone else.",
          "You’re the sequel nobody asked for.",
          "You’re the plot twist where the hero almost wins."
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
      if (pointsGap <= 20) return "Bronze is just warm-up 🥉";
      return "Podium's getting cold 🧊";
    }
    
    if (rank <= totalParticipants / 2) {
      return "Mediocrity loves company 🤝";
    }
    
    if (rank === totalParticipants && totalParticipants > 1) {
      return "Rock bottom has great WiFi 📶";
    }
    
    return "Gravity seems stronger for you 🌍";
  };

  // Determine message based on rank and points
  const competitiveMessage = getCompetitiveMessage(displayRank, pointsFromLeader, totalParticipants);

  // Special handling for users with 0 points - show harsh roast to motivate action
  if (currentParticipant.totalPoints === 0) {
    // Use persistent roast that only changes when tournament changes
    if (!roastStorage.zeroPointsRoast) {
      roastStorage.zeroPointsRoast = harshRoasts[Math.floor(Math.random() * harshRoasts.length)];
    }
    
    const streak = currentParticipant.workoutDays.length;
    return (
      <Card 
        className="apple-card rounded-xl backdrop-blur-sm cursor-pointer active:opacity-80 transition-opacity duration-150 w-full max-w-full px-3 py-3 sm:px-4 sm:py-4"
        onClick={() => navigate('/tournament')}
      >
        <CardContent className="flex flex-col items-center w-full p-0">
          {/* Fire streak badge if streak >= 2 */}
          {streak >= 2 && (
            <div className="relative flex items-center mb-1">
              <span className="inline-block text-orange-500 text-lg">
                <Flame className="inline h-5 w-5" />
              </span>
              <span className="absolute right-0 bottom-0 bg-black/80 text-white text-[10px] rounded-full px-1 py-0.5 font-bold border-2 border-white ml-[-8px]">
                {streak}
              </span>
            </div>
          )}
          {/* Roast text, responsive and bold */}
          <div className="w-full flex flex-col items-center">
            <span className="font-extrabold text-sm sm:text-base text-center text-foreground leading-tight px-2">
              {roastStorage.zeroPointsRoast}
            </span>
            <span className="mt-1 text-xs text-muted-foreground">Time to get those gains 💪</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Add fire streak badge to main card if streak >= 2
  return (
    <Card 
      className={"tournament-status-card apple-card rounded-xl backdrop-blur-sm cursor-pointer active:opacity-80 transition-opacity duration-150 w-full max-w-full px-4 py-4 relative overflow-hidden"}
      onClick={() => navigate('/tournament')}
    >
      <CardContent className="flex items-center justify-between w-full p-0 relative z-10">
        {/* Left: Rank icon and points */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="flex items-center gap-2">
            {getRankIcon(displayRank)}
            <div className="flex flex-col">
              <span className="text-lg font-bold text-foreground leading-tight">
                {currentParticipant.totalPoints}
              </span>
              <span className="text-xs text-muted-foreground">pts</span>
            </div>
          </div>
        </div>

        {/* Center: Roast message (main focus) */}
        <div className="flex-1 mx-4 text-center">
          <span className="font-bold text-sm sm:text-base text-foreground leading-tight block">
            {competitiveMessage}
          </span>
          <div className="flex items-center justify-center gap-2 mt-1 text-xs text-muted-foreground">
            <span>{getRankText(displayRank, true)}</span>
            {!isTopPerformer && pointsFromLeader > 0 && (
              <>
                <span>•</span>
                <span>{pointsFromLeader} behind</span>
              </>
            )}
          </div>
        </div>

        {/* Right: Fire streak badge */}
        {currentParticipant.workoutDays.length >= 2 && (
          <div className="flex items-center gap-1 flex-shrink-0">
            <span className="inline-block text-orange-500 text-lg">
              <Flame className="inline h-5 w-5" />
            </span>
            <span className="text-xs text-muted-foreground font-medium">
              {currentParticipant.workoutDays.length}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TournamentStatusCard;
