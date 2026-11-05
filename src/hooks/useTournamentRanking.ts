import { useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import { useAppContext } from "@/context/useAppContext";
import { generateCurrentTournament } from "@/utils/tournamentUtils";
import { useCommunityData } from "./useCommunityData";

export function useTournamentRanking() {
  const { profile } = useAuth();
  const { categories, exercises } = useAppContext();
  const { data, isLoading } = useCommunityData();
  const tournament = useMemo(
    () =>
      data && exercises.length && categories.length
        ? generateCurrentTournament(
            data.users,
            data.logs,
            exercises,
            categories,
          )
        : null,
    [data, exercises, categories],
  );
  return {
    tournament,
    isLoading,
    totalParticipants: tournament?.participants.length ?? 0,
    rank:
      tournament?.participants.find(
        (participant) => participant.userId === profile?.id,
      )?.rank ?? null,
  };
}
