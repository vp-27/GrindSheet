import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Trophy, Target, Users, Crown, Medal, Award } from 'lucide-react';
import { Tournament, TournamentParticipant } from '@/types';

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
          className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-950/30 dark:via-indigo-950/30 dark:to-purple-950/30 border-blue-200/50 dark:border-blue-800/50 cursor-pointer hover:shadow-lg transition-all duration-200 rounded-xl backdrop-blur-sm"
          onClick={() => navigate('/add-exercise')}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="relative flex-shrink-0">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-md">
                    <Trophy className="h-4 w-4 text-white" />
                  </div>
                </div>
                <div className="flex flex-col gap-1 flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-lg text-foreground whitespace-nowrap">Be the First!</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-medium text-muted-foreground truncate">Fresh week, fresh competition!</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <div className="text-right">
                  <div className="font-bold text-lg text-blue-600 dark:text-blue-400">
                    Lead Early
                  </div>
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
        className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-950/30 dark:via-indigo-950/30 dark:to-purple-950/30 border-blue-200/50 dark:border-blue-800/50 cursor-pointer active:scale-95 rounded-xl backdrop-blur-sm hover:shadow-lg transition-all duration-200"
        onClick={() => navigate('/add-exercise')}
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
        return (
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center shadow-md">
            <Crown className="h-4 w-4 text-yellow-900" />
          </div>
        );
      case 2:
        return (
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-300 to-gray-500 flex items-center justify-center shadow-md">
            <Medal className="h-4 w-4 text-gray-700" />
          </div>
        );
      case 3:
        return (
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-600 to-amber-800 flex items-center justify-center shadow-md">
            <Award className="h-4 w-4 text-amber-100" />
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
      if (closeGames.length > 1) return "They're hunting you 🎯";
      return "Crown is heavy? 👑";
    }
    
    if (rank === 2) {
      if (pointsGap <= 10) return "Breathing down their neck 😤";
      if (pointsGap <= 30) return "Second place = first loser 😏";
      return "Silver medal collecting 🥈";
    }
    
    if (rank === 3) {
      if (pointsGap <= 20) return "Bronze is still shiny 🥉";
      return "Podium's getting cold 🧊";
    }
    
    if (rank <= totalParticipants / 2) {
      return "Mediocrity loves company 🤝";
    }
    
    if (rank === totalParticipants && totalParticipants > 1) {
      return "Taking Ls like a champ 🏆";
    }
    
    return "Bottom feeder energy 🐟";
  };

  // Determine message based on rank and points
  const competitiveMessage = getCompetitiveMessage(displayRank, pointsFromLeader, totalParticipants);

  // Special handling for users with 0 points - show witty roast to motivate action
  if (currentParticipant.totalPoints === 0) {
    const wittyRoasts = [
      "Ghost mode activated 👻",
      "Spectator of the year 🏆",
      "Still warming the bench? 🪑",
      "Your muscles called - they're bored 😴",
      "Even the couch is lifting more 🛋️",
      "Tutorial mode: OFF 🎮"
    ];
    
    const randomRoast = wittyRoasts[Math.floor(Math.random() * wittyRoasts.length)];
    
    return (
      <Card 
        className="bg-gradient-to-r from-red-50 via-orange-50 to-yellow-50 dark:from-red-950/30 dark:via-orange-950/30 dark:to-yellow-950/30 border-red-200/50 dark:border-red-800/50 cursor-pointer hover:shadow-lg transition-all duration-200 rounded-xl backdrop-blur-sm"
        onClick={() => navigate('/add-exercise')}
      >
        <CardContent className="p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="relative flex-shrink-0">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-red-500 to-orange-600 flex items-center justify-center shadow-md">
                  <Target className="h-4 w-4 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-2 h-2 bg-orange-400 rounded-full animate-pulse" />
              </div>
              <div className="flex flex-col gap-1 flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-lg text-foreground whitespace-nowrap">Wake Up Call</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-medium text-muted-foreground truncate">{randomRoast}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
              <div className="text-right">
                <div className="font-bold text-lg text-red-600 dark:text-red-400">
                  Log Now
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card 
      className={`bg-gradient-to-r ${getRankColor(displayRank)} cursor-pointer hover:shadow-lg transition-all duration-200 rounded-xl backdrop-blur-sm`}
      onClick={() => navigate('/tournament')}
    >
      <CardContent className="p-4">
        {/* Tournament Status - Mobile Optimized */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="relative flex-shrink-0">
              {getRankIcon(displayRank)}
              {displayRank === 1 && (
                <div className="absolute -top-1 -right-1 w-2 h-2 bg-yellow-400 rounded-full animate-pulse" />
              )}
            </div>
            <div className="flex flex-col gap-1 flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg text-foreground whitespace-nowrap">{getRankText(displayRank, true)}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="font-medium text-muted-foreground truncate">Weekly Tournament</span>
                {!isTopPerformer && (
                  <>
                    <span className="text-muted-foreground hidden xs:inline">•</span>
                    <span className="text-muted-foreground truncate">{pointsFromLeader} pts behind</span>
                  </>
                )}
                {/* Add subtle streak indicator if user has workout streak */}
                {currentParticipant.workoutDays.length >= 3 && (
                  <>
                    <span className="text-muted-foreground hidden sm:inline">•</span>
                    <span className="text-xs bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 px-2 py-0.5 rounded-full font-medium hidden sm:inline">
                      {currentParticipant.workoutDays.length} day streak
                    </span>
                  </>
                )}
              </div>
              {/* Competitive context message */}
              <div className="text-xs text-muted-foreground/80 mt-0.5 hidden sm:block">
                {getCompetitiveMessage(displayRank, pointsFromLeader, totalParticipants)}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            {currentParticipant.badges.length > 0 && (
              <span className="text-xs text-muted-foreground whitespace-nowrap hidden sm:inline">
                {currentParticipant.badges.length} badge{currentParticipant.badges.length !== 1 ? 's' : ''}
              </span>
            )}
            <div className="text-right">
              <div className="font-bold text-lg text-foreground">
                {currentParticipant.totalPoints}
                <span className="text-xs text-muted-foreground ml-1">pts</span>
              </div>
            </div>
          </div>
        </div>
        {/* Competitive Messaging - Always Visible */}
        <div className="mt-2 text-center">
          <span className="text-sm text-muted-foreground">{competitiveMessage}</span>
        </div>
      </CardContent>
    </Card>
  );
};

export default TournamentStatusCard;
