import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Trophy, Target, Users, Crown, Medal, Award } from 'lucide-react';
import { Tournament, TournamentParticipant } from '@/types';

interface TournamentStatusCardProps {
  tournament: Tournament | null;
  currentUserId: string;
  loading?: boolean;
}

const TournamentStatusCard: React.FC<TournamentStatusCardProps> = ({ 
  tournament, 
  currentUserId, 
  loading 
}) => {
  const navigate = useNavigate();
  
  if (loading) {
    return (
      <Card className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border-amber-200/50 dark:border-amber-800/50">
        <CardContent className="p-6">
          <div className="animate-pulse">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-amber-200 dark:bg-amber-800 rounded-full"></div>
              <div>
                <div className="w-32 h-5 bg-amber-200 dark:bg-amber-800 rounded mb-2"></div>
                <div className="w-20 h-4 bg-amber-200 dark:bg-amber-800 rounded"></div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="w-full h-12 bg-amber-200 dark:bg-amber-800 rounded"></div>
              <div className="w-full h-12 bg-amber-200 dark:bg-amber-800 rounded"></div>
              <div className="w-full h-12 bg-amber-200 dark:bg-amber-800 rounded"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!tournament) {
    return (
      <Card className="bg-gradient-to-br from-gray-50 to-slate-50 dark:from-gray-900/20 dark:to-slate-900/20 border-gray-200/50 dark:border-gray-800/50">
        <CardContent className="p-6 text-center">
          <Target className="w-12 h-12 text-gray-400 dark:text-gray-600 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-gray-600 dark:text-gray-400 mb-2">No Active Tournament</h3>
          <p className="text-sm text-gray-500 dark:text-gray-500">Start logging workouts to join the weekly competition!</p>
        </CardContent>
      </Card>
    );
  }

  const currentParticipant = tournament.participants.find(p => p.userId === currentUserId);
  
  if (!currentParticipant) {
    return (
      <Card 
        className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200/50 dark:border-blue-800/50 cursor-pointer hover:shadow-lg transition-all duration-300 active:scale-95"
        onClick={() => navigate('/tournament')}
      >
        <CardContent className="p-6 text-center">
          <Users className="w-12 h-12 text-blue-500 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-blue-600 dark:text-blue-400 mb-2">Join Tournament</h3>
          <p className="text-sm text-blue-500 dark:text-blue-400">Log a workout to join this week's competition!</p>
        </CardContent>
      </Card>
    );
  }

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="w-6 h-6 text-yellow-500" />;
      case 2:
        return <Medal className="w-6 h-6 text-gray-400" />;
      case 3:
        return <Award className="w-6 h-6 text-amber-600" />;
      default:
        return <Trophy className="w-6 h-6 text-blue-500" />;
    }
  };

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1:
        return 'from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20 border-yellow-200/50 dark:border-yellow-800/50';
      case 2:
        return 'from-gray-50 to-slate-50 dark:from-gray-900/20 dark:to-slate-900/20 border-gray-200/50 dark:border-gray-800/50';
      case 3:
        return 'from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border-amber-200/50 dark:border-amber-800/50';
      default:
        return 'from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200/50 dark:border-blue-800/50';
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
  const topPerformer = tournament.participants[0];
  const isTopPerformer = currentParticipant.rank === 1;
  const pointsFromLeader = topPerformer ? topPerformer.totalPoints - currentParticipant.totalPoints : 0;

  return (
    <Card 
      className={`bg-gradient-to-br ${getRankColor(currentParticipant.rank)} cursor-pointer hover:shadow-lg transition-all duration-300 active:scale-95 hover:scale-105`}
      onClick={() => navigate('/tournament')}
    >
      <CardContent className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            {getRankIcon(currentParticipant.rank)}
            <div>
              <h3 className="text-lg font-bold text-foreground">Tournament</h3>
              <p className="text-sm text-muted-foreground">{tournament.name}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-foreground">{currentParticipant.totalPoints}</p>
            <p className="text-xs text-muted-foreground">points</p>
          </div>
        </div>

        {/* Status Grid */}
        <div className="grid grid-cols-3 gap-3">
          {/* Rank */}
          <div className="text-center">
            <p className="text-base md:text-lg font-bold text-foreground">{getRankText(currentParticipant.rank, true)}</p>
            <p className="text-xs text-muted-foreground">of {totalParticipants}</p>
          </div>

          {/* Badges */}
          <div className="text-center">
            <p className="text-base md:text-lg font-bold text-foreground">{currentParticipant.badges.length}</p>
            <p className="text-xs text-muted-foreground">badge{currentParticipant.badges.length !== 1 ? 's' : ''}</p>
          </div>

          {/* Points from leader or lead status */}
          <div className="text-center">
            {isTopPerformer ? (
              <>
                <p className="text-base md:text-lg font-bold text-yellow-600 dark:text-yellow-400">Leading!</p>
                <p className="text-xs text-muted-foreground">🏆</p>
              </>
            ) : (
              <>
                <p className="text-base md:text-lg font-bold text-foreground">-{pointsFromLeader}</p>
                <p className="text-xs text-muted-foreground">behind</p>
              </>
            )}
          </div>
        </div>

        {/* Quick stats or recent badges */}
        {currentParticipant.badges.length > 0 ? (
          <div className="mt-4 pt-3 border-t border-border/30">
            <div className="flex items-center gap-2 overflow-x-auto">
              <span className="text-xs text-muted-foreground font-medium whitespace-nowrap">Latest:</span>
              {currentParticipant.badges.slice(-2).map((badge, index) => (
                <div 
                  key={badge.id}
                  className="flex items-center gap-1 bg-background/50 backdrop-blur-sm rounded-full px-2 py-1 whitespace-nowrap"
                >
                  <Trophy className="w-3 h-3 text-amber-500" />
                  <span className="text-xs font-medium text-foreground">{badge.name}</span>
                </div>
              ))}
            </div>
          </div>
        ) : totalParticipants > 1 ? (
          <div className="mt-4 pt-3 border-t border-border/30">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Competing with {totalParticipants - 1} other{totalParticipants > 2 ? 's' : ''}</span>
              <div className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 font-medium">
                <span>View details</span>
                <Target className="w-3 h-3" />
              </div>
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
};

export default TournamentStatusCard;
