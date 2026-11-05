import { supabase } from "@/integrations/supabase/client";
import { deleteRow, getLogs, getRows, saveRow } from "@/lib/app-data";
import { DEMO_DATA_EVENT } from "@/lib/demo-store";
import type { Category, Exercise, ExerciseLog } from "@/types";
import { useQueryClient } from "@tanstack/react-query";
import {
  createContext,
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useAuth } from "./AuthContext";

export interface AppContextType {
  categories: Category[];
  exercises: Exercise[];
  exerciseLogs: ExerciseLog[];
  addExerciseLog: (log: Omit<ExerciseLog, "id" | "timestamp">) => Promise<void>;
  updateExerciseLog: (log: ExerciseLog) => Promise<void>;
  deleteExerciseLog: (id: string) => Promise<void>;
  selectedCategory: Category | null;
  setSelectedCategory: (category: Category | null) => void;
  selectedExercise: Exercise | null;
  setSelectedExercise: (exercise: Exercise | null) => void;
  loading: boolean;
  error: string | null;
  refreshData: () => Promise<void>;
}
export const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const { user, isDemo } = useAuth();
  const userId = user?.id;
  const queryClient = useQueryClient();
  const [categories, setCategories] = useState<Category[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [exerciseLogs, setExerciseLogs] = useState<ExerciseLog[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(
    null,
  );
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(
    null,
  );
  const [loading, setLoading] = useState(!!userId);
  const [error, setError] = useState<string | null>(null);
  const generation = useRef(0);

  const refreshData = useCallback(async () => {
    if (!userId) return;
    const request = ++generation.current;
    try {
      const [categoryResult, exerciseResult, logResult] = await Promise.all([
        getRows("categories"),
        getRows("exercises"),
        getLogs(userId),
      ]);
      if (request !== generation.current) return;
      const failure =
        categoryResult.error || exerciseResult.error || logResult.error;
      if (failure) throw new Error(failure.message);
      setCategories(
        (categoryResult.data || [])
          .map((row) => ({
            id: row.id,
            name: row.name,
            description: row.description,
          }))
          .sort((a, b) => a.name.localeCompare(b.name)),
      );
      setExercises(
        (exerciseResult.data || [])
          .map((row) => ({
            id: row.id,
            name: row.name,
            categoryId: row.category_id,
            description: row.description,
          }))
          .sort((a, b) => a.name.localeCompare(b.name)),
      );
      setExerciseLogs(
        (logResult.data || []).map((row) => ({
          id: row.id,
          userId: row.user_id,
          exerciseId: row.exercise_id,
          weight: row.weight,
          timestamp: row.timestamp,
          note: row.note,
        })),
      );
      setError(null);
    } catch (err) {
      if (request === generation.current)
        setError(
          err instanceof Error ? err.message : "Could not load your workouts.",
        );
    } finally {
      if (request === generation.current) setLoading(false);
    }
  }, [userId]);

  const cancelRequests = useCallback(() => {
    ++generation.current;
  }, []);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }
    void refreshData();
    const refresh = () => {
      void refreshData();
      void queryClient.invalidateQueries({ queryKey: ["community"] });
    };
    if (isDemo) {
      window.addEventListener(DEMO_DATA_EVENT, refresh);
      return () => {
        cancelRequests();
        window.removeEventListener(DEMO_DATA_EVENT, refresh);
      };
    }
    const channel = supabase
      .channel(`app-data:${userId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "categories" },
        refresh,
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "exercises" },
        refresh,
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "exercise_logs",
          filter: `user_id=eq.${userId}`,
        },
        refresh,
      )
      .subscribe();
    window.addEventListener("online", refresh);
    return () => {
      cancelRequests();
      void supabase.removeChannel(channel);
      window.removeEventListener("online", refresh);
    };
  }, [userId, isDemo, refreshData, queryClient, cancelRequests]);

  const requireUser = () => {
    if (!userId) throw new Error("Please sign in to save a workout.");
    if (!isDemo && !navigator.onLine)
      throw new Error("You’re offline. Reconnect before saving this workout.");
    return userId;
  };
  const afterMutation = async (result: {
    error: { message: string } | null;
  }) => {
    if (result.error) throw new Error(result.error.message);
    await refreshData();
    void queryClient.invalidateQueries({ queryKey: ["community"] });
  };
  const addExerciseLog: AppContextType["addExerciseLog"] = async (log) => {
    const id = requireUser();
    await afterMutation(
      await saveRow("exercise_logs", {
        user_id: id,
        exercise_id: log.exerciseId,
        weight: log.weight,
        note: log.note,
      }),
    );
  };
  const updateExerciseLog = async (log: ExerciseLog) => {
    requireUser();
    if (!exerciseLogs.some((item) => item.id === log.id))
      throw new Error("This workout no longer exists.");
    await afterMutation(
      await saveRow(
        "exercise_logs",
        { exercise_id: log.exerciseId, weight: log.weight, note: log.note },
        log.id,
      ),
    );
  };
  const deleteExerciseLog = async (id: string) => {
    requireUser();
    if (!exerciseLogs.some((item) => item.id === id))
      throw new Error("This workout no longer exists.");
    await afterMutation(await deleteRow("exercise_logs", id));
  };
  return (
    <AppContext.Provider
      value={{
        categories,
        exercises,
        exerciseLogs,
        addExerciseLog,
        updateExerciseLog,
        deleteExerciseLog,
        selectedCategory,
        setSelectedCategory,
        selectedExercise,
        setSelectedExercise,
        loading,
        error,
        refreshData,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};
