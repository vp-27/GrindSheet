
import React, { createContext, useContext, useState, ReactNode } from 'react';
import { User, Category, Exercise, ExerciseLog } from '../types';
import { users, categories, exercises, exerciseLogs } from '../data/mockData';

interface AppContextType {
  currentUser: User;
  setCurrentUser: (user: User) => void;
  users: User[];
  categories: Category[];
  exercises: Exercise[];
  exerciseLogs: ExerciseLog[];
  addExerciseLog: (log: Omit<ExerciseLog, 'id' | 'timestamp'>) => void;
  selectedCategory: Category | null;
  setSelectedCategory: (category: Category | null) => void;
  selectedExercise: Exercise | null;
  setSelectedExercise: (exercise: Exercise | null) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User>(users[0]);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [logs, setLogs] = useState<ExerciseLog[]>(exerciseLogs);

  const addExerciseLog = (log: Omit<ExerciseLog, 'id' | 'timestamp'>) => {
    const newLog: ExerciseLog = {
      ...log,
      id: `${log.userId}-${log.exerciseId}-${Date.now()}`,
      timestamp: new Date().toISOString(),
    };
    
    setLogs(prevLogs => [newLog, ...prevLogs]);
  };

  return (
    <AppContext.Provider 
      value={{
        currentUser,
        setCurrentUser,
        users,
        categories,
        exercises,
        exerciseLogs: logs,
        addExerciseLog,
        selectedCategory,
        setSelectedCategory,
        selectedExercise,
        setSelectedExercise
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = (): AppContextType => {
  const context = useContext(AppContext);
  
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  
  return context;
};
