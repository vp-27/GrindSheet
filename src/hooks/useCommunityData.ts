import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { getLogs, getRows } from "@/lib/app-data";

const EMPTY_COMMUNITY = { users: [], logs: [] };

export function useCommunityData() {
  const { user, isDemo } = useAuth();
  const query = useQuery({
    queryKey: ["community", isDemo ? "demo" : user?.id],
    enabled: !!user,
    staleTime: 60_000,
    queryFn: async () => {
      const [profiles, logs] = await Promise.all([
        getRows("profiles"),
        getLogs(),
      ]);
      const failure = profiles.error || logs.error;
      if (failure) throw new Error(failure.message);
      return {
        users: (profiles.data || []).map((row) => ({
          id: row.id,
          name: row.name,
          username: row.username,
          avatarUrl: row.avatar_url,
        })),
        logs: (logs.data || []).map((row) => ({
          id: row.id,
          userId: row.user_id,
          exerciseId: row.exercise_id,
          weight: row.weight,
          timestamp: row.timestamp,
          note: row.note,
        })),
      };
    },
  });
  return { ...query, data: query.data ?? EMPTY_COMMUNITY };
}
