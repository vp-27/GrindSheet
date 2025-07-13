import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useAppContext } from '@/context/useAppContext';
import { generateCurrentTournament } from '@/utils/tournamentUtils';
import { supabase } from '@/integrations/supabase/client';
import { Tournament, TournamentParticipant } from '@/types';

interface TournamentRanking {
  rank: number | null;
  totalParticipants: number;
  isLoading: boolean;
  tournament: Tournament | null;
}

// Cache for tournament data to prevent unnecessary refetches
const tournamentCache = {
  data: null as TournamentRanking | null,
  lastFetch: 0,
  cacheDuration: 5 * 60 * 1000, // 5 minutes
  dependencies: {
    profileId: null as string | null,
    exercisesHash: null as string | null,
    categoriesHash: null as string | null
  }
};

export const useTournamentRanking = (): TournamentRanking => {
  const { profile } = useAuth();
  const { categories, exercises } = useAppContext();
  const [ranking, setRanking] = useState<TournamentRanking>({
    rank: null,
    totalParticipants: 0,
    isLoading: true,
    tournament: null
  });
  
  const isInitialized = useRef(false);

  useEffect(() => {
    const fetchTournamentRanking = async () => {
      if (!profile || !exercises.length || !categories.length) {
        if (!isInitialized.current) {
          setRanking(prev => ({ ...prev, isLoading: false }));
          isInitialized.current = true;
        }
        return;
      }

      // Create dependency hashes for cache invalidation
      const profileId = profile.id;
      const exercisesHash = exercises.map(e => e.id).sort().join(',');
      const categoriesHash = categories.map(c => c.id).sort().join(',');
      
      const now = Date.now();
      const cacheIsValid = tournamentCache.data && 
                          (now - tournamentCache.lastFetch) < tournamentCache.cacheDuration &&
                          tournamentCache.dependencies.profileId === profileId &&
                          tournamentCache.dependencies.exercisesHash === exercisesHash &&
                          tournamentCache.dependencies.categoriesHash === categoriesHash;

      // Return cached data if valid
      if (cacheIsValid && tournamentCache.data) {
        setRanking(tournamentCache.data);
        isInitialized.current = true;
        return;
      }

      // Only show loading on first fetch
      if (!isInitialized.current) {
        setRanking(prev => ({ ...prev, isLoading: true }));
      }

      try {
        // Fetch users from Supabase
        const { data: usersData, error: usersError } = await supabase
          .from('profiles')
          .select('id, name, username, avatar_url');
        
        if (usersError || !usersData) {
          const newRanking = {
            rank: null,
            totalParticipants: 0,
            isLoading: false,
            tournament: null
          };
          setRanking(newRanking);
          tournamentCache.data = newRanking;
          tournamentCache.lastFetch = now;
          tournamentCache.dependencies = { profileId, exercisesHash, categoriesHash };
          isInitialized.current = true;
          return;
        }

        const users = usersData.map((u: any) => ({
          id: u.id,
          name: u.name,
          username: u.username,
          avatarUrl: u.avatar_url
        }));

        // Fetch all exercise logs for tournament calculation
        const { data: allLogsData, error: logsError } = await supabase
          .from('exercise_logs')
          .select('*');
        
        if (logsError || !allLogsData) {
          const newRanking = {
            rank: null,
            totalParticipants: 0,
            isLoading: false,
            tournament: null
          };
          setRanking(newRanking);
          tournamentCache.data = newRanking;
          tournamentCache.lastFetch = now;
          tournamentCache.dependencies = { profileId, exercisesHash, categoriesHash };
          isInitialized.current = true;
          return;
        }

        const allExerciseLogs = allLogsData.map((log: any) => ({
          id: log.id,
          userId: log.user_id,
          exerciseId: log.exercise_id,
          weight: log.weight,
          timestamp: log.timestamp,
          note: log.note,
          weightUnit: log.weight_unit
        }));

        const tournament = generateCurrentTournament(users, allExerciseLogs, exercises, categories);
        
        // Find current user's ranking
        const currentParticipant = tournament.participants.find(p => p.userId === profile.id);
        const rank = currentParticipant ? currentParticipant.rank : null;
        const totalParticipants = tournament.participants.length;

        const newRanking = {
          rank,
          totalParticipants,
          isLoading: false,
          tournament
        };

        setRanking(newRanking);
        
        // Update cache
        tournamentCache.data = newRanking;
        tournamentCache.lastFetch = now;
        tournamentCache.dependencies = { profileId, exercisesHash, categoriesHash };
        isInitialized.current = true;
      } catch (error) {
        console.error('Error fetching tournament ranking:', error);
        const newRanking = {
          rank: null,
          totalParticipants: 0,
          isLoading: false,
          tournament: null
        };
        setRanking(newRanking);
        tournamentCache.data = newRanking;
        tournamentCache.lastFetch = now;
        tournamentCache.dependencies = { profileId, exercisesHash, categoriesHash };
        isInitialized.current = true;
      }
    };

    fetchTournamentRanking();
  }, [profile?.id, exercises.length, categories.length]);

  return ranking;
}; 