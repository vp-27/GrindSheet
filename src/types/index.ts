
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
}

export interface Progress {
  exercise: Exercise;
  currentWeight: number;
  previousWeight?: number;
  startingWeight?: number;
  personalRecord?: number;
  percentGainFromPrevious?: number;
  percentGainFromStart?: number;
}

export interface LeaderboardEntry {
  userId: string;
  user: User;
  value: number; // Could be weight, % gain, etc.
  exerciseId?: string;
  categoryId?: string;
}

export enum LeaderboardType {
  ALLTIME_GAIN = 'All-time % Gain',
  RECENT_GAIN = 'Recent % Gain',
  MAX_WEIGHT = 'Max Weight'
}

export interface ProgressChartData {
  date: string;
  weight: number;
}
