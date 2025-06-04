export interface User {
  id: string;
  name: string;
  username: string;
  avatarUrl?: string;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
}

export interface Exercise {
  id: string;
  name: string;
  categoryId: string;
  description?: string;
}

export interface ExerciseLog {
  id: string;
  userId: string;
  exerciseId: string;
  weight: number;
  timestamp: string;
  note?: string;
  weightUnit?: string; // Added to track the unit used
}

export interface Progress {
  exercise: Exercise;
  currentWeight: number;
  previousWeight?: number;
  startingWeight?: number;
  personalRecord?: number;
  percentGainFromPrevious?: number;
  percentGainFromStart?: number;
  weightUnit?: string; // Added to display the correct unit
}

export interface LeaderboardEntry {
  userId: string;
  user: User;
  users?: User[]; // For ties - multiple users with same value
  value: number; // Could be weight, % gain, etc.
  exerciseId?: string;
  categoryId?: string;
  isTie?: boolean; // Flag to indicate if this entry represents a tie
}

export enum LeaderboardType {
  OVERALL_PROGRESS = 'Overall Progress',
  RECENT_ACHIEVERS = 'Recent Achievers',
  EXERCISE_PR = 'Exercise PR',
  CONSISTENCY = 'Consistency'
}

export interface ProgressChartData {
  date: string;
  weight: number;
  percentGain?: number; // Added to track percentage gains for visualization
}
