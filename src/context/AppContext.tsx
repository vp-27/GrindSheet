import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Category, Exercise, ExerciseLog } from '../types';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';

export interface AppContextType { // Added export
  categories: Category[];
  exercises: Exercise[];
  exerciseLogs: ExerciseLog[];
  addExerciseLog: (log: Omit<ExerciseLog, 'id' | 'timestamp'>) => Promise<void>;
  updateExerciseLog: (log: ExerciseLog) => Promise<void>;
  deleteExerciseLog: (id: string) => Promise<void>;
  selectedCategory: Category | null;
  setSelectedCategory: (category: Category | null) => void;
  selectedExercise: Exercise | null;
  setSelectedExercise: (exercise: Exercise | null) => void;
  loading: boolean; // <-- add loading to context
  appReady: boolean;
  setAppReady: (ready: boolean) => void;
}

export const AppContext = createContext<AppContextType | undefined>(undefined); // Added export

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [exerciseLogs, setExerciseLogs] = useState<ExerciseLog[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [loading, setLoading] = useState(true);
  const [appReady, setAppReady] = useState(false);

  const exercisesSubRef = useRef<any>(null);
  const categoriesSubRef = useRef<any>(null);
  const exerciseLogsSubRef = useRef<any>(null);

  // Redirect to auth if not logged in and trying to access protected routes
  useEffect(() => {
    if (loading) return;
    
    const currentPath = window.location.pathname;
    const publicRoutes = ['/auth'];
    
    if (!user && !publicRoutes.includes(currentPath)) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  // Fetch categories, exercises, and exercise logs from Supabase
  useEffect(() => {
    const fetchData = async () => {
      // Always fetch categories and exercises, even if no user
      try {
        // Fetch categories (global for all users)
        const { data: categoriesData, error: categoriesError } = await supabase
          .from('categories')
          .select('*')
          .order('name');
        if (categoriesError) throw categoriesError;
        const mappedCategories: Category[] = (categoriesData || []).map(cat => ({
          id: cat.id,
          name: cat.name,
          description: cat.description,
        }));
        setCategories(mappedCategories);

        // Fetch exercises (global for all users)
        const { data: exercisesData, error: exercisesError } = await supabase
          .from('exercises')
          .select('*')
          .order('name');
        if (exercisesError) throw exercisesError;
        const mappedExercises: Exercise[] = (exercisesData || []).map(ex => ({
          id: ex.id,
          name: ex.name,
          categoryId: ex.category_id,
          description: ex.description,
        }));
        setExercises(mappedExercises);
      } catch (error) {
        console.error('Error fetching data from Supabase:', error);
      }
      // Only fetch logs if user exists
      if (user) {
        try {
          const { data: logsData, error: logsError } = await supabase
            .from('exercise_logs')
            .select('*')
            .eq('user_id', user.id)
            .order('timestamp', { ascending: false });
          if (logsError) throw logsError;
          const mappedLogs: ExerciseLog[] = (logsData || []).map(log => ({
            id: log.id,
            userId: log.user_id,
            exerciseId: log.exercise_id,
            weight: log.weight,
            timestamp: log.timestamp,
            note: log.note,
          }));
          setExerciseLogs(mappedLogs);
        } catch (error) {
          console.error('Error fetching exercise logs:', error);
        }
      }
      setLoading(false);
    };

    fetchData();

    // --- Real-time subscriptions (deduplicated) ---
    // Clean up previous subscriptions if they exist
    if (exercisesSubRef.current) {
      supabase.removeChannel(exercisesSubRef.current);
      exercisesSubRef.current = null;
    }
    if (categoriesSubRef.current) {
      supabase.removeChannel(categoriesSubRef.current);
      categoriesSubRef.current = null;
    }
    if (exerciseLogsSubRef.current) {
      supabase.removeChannel(exerciseLogsSubRef.current);
      exerciseLogsSubRef.current = null;
    }

    // Subscribe to global tables (only once per mount)
    exercisesSubRef.current = supabase
      .channel('public:exercises')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'exercises',
        },
        () => {
          fetchExercises();
        }
      )
      .subscribe();
    categoriesSubRef.current = supabase
      .channel('public:categories')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'categories',
        },
        () => {
          fetchCategories();
        }
      )
      .subscribe();

    // Subscribe to exercise_logs only if user exists
    if (user) {
      exerciseLogsSubRef.current = supabase
        .channel('public:exercise_logs')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'exercise_logs',
            filter: `user_id=eq.${user.id}`,
          },
          () => {
            fetchExerciseLogs();
          }
        )
        .subscribe();
    }

    // Cleanup on unmount or user change
    return () => {
      if (exercisesSubRef.current) {
        supabase.removeChannel(exercisesSubRef.current);
        exercisesSubRef.current = null;
      }
      if (categoriesSubRef.current) {
        supabase.removeChannel(categoriesSubRef.current);
        categoriesSubRef.current = null;
      }
      if (exerciseLogsSubRef.current) {
        supabase.removeChannel(exerciseLogsSubRef.current);
        exerciseLogsSubRef.current = null;
      }
    };
  }, [user]);

  // Remove user check from fetchExercises and fetchCategories
  const fetchExerciseLogs = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('exercise_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('timestamp', { ascending: false });
      if (error) throw error;
      const mappedLogs: ExerciseLog[] = (data || []).map(log => ({
        id: log.id,
        userId: log.user_id,
        exerciseId: log.exercise_id,
        weight: log.weight,
        timestamp: log.timestamp,
        note: log.note,
      }));
      setExerciseLogs(mappedLogs);
    } catch (error) {
      console.error('Error fetching exercise logs:', error);
    }
  };

  const fetchExercises = async () => {
    try {
      const { data, error } = await supabase
        .from('exercises')
        .select('*')
        .order('name');
      if (error) throw error;
      const mappedExercises: Exercise[] = (data || []).map(ex => ({
        id: ex.id,
        name: ex.name,
        categoryId: ex.category_id,
        description: ex.description,
      }));
      setExercises(mappedExercises);
    } catch (error) {
      console.error('Error fetching exercises:', error);
    }
  };

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name');
      if (error) throw error;
      const mappedCategories: Category[] = (data || []).map(cat => ({
        id: cat.id,
        name: cat.name,
        description: cat.description,
      }));
      setCategories(mappedCategories);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const addExerciseLog = async (log: Omit<ExerciseLog, 'id' | 'timestamp'>) => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('exercise_logs')
        .insert({
          user_id: user.id,
          exercise_id: log.exerciseId,
          weight: log.weight,
          note: log.note,
        });
        
      if (error) throw error;
      
      // Fetch updated logs
      fetchExerciseLogs();
    } catch (error) {
      console.error('Error adding exercise log:', error);
      throw error;
    }
  };

  const updateExerciseLog = async (log: ExerciseLog) => {
    if (!user) return;
    try {
      const { error } = await supabase
        .from('exercise_logs')
        .update({
          exercise_id: log.exerciseId,
          weight: log.weight,
          note: log.note,
        })
        .eq('id', log.id);
      if (error) throw error;
      fetchExerciseLogs();
    } catch (error) {
      console.error('Error updating exercise log:', error);
      throw error;
    }
  };

  const deleteExerciseLog = async (id: string) => {
    if (!user) return;
    try {
      const { error } = await supabase
        .from('exercise_logs')
        .delete()
        .eq('id', id);
      if (error) throw error;
      fetchExerciseLogs();
    } catch (error) {
      console.error('Error deleting exercise log:', error);
      throw error;
    }
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
        loading, // <-- provide loading
        appReady,
        setAppReady,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

// useAppContext hook has been removed from this file and moved to useAppContext.ts
