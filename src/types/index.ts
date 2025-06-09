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
  CONSISTENCY = 'Consistency',
  TOURNAMENT = 'Tournament'
}

export interface ProgressChartData {
  date: string;
  weight: number;
  percentGain?: number; // Added to track percentage gains for visualization
}

// Tournament System Types
export interface Tournament {
  id: string;
  name: string;
  weekStart: string; // ISO date string (Monday)
  weekEnd: string;   // ISO date string (Sunday)
  status: 'upcoming' | 'active' | 'completed';
  participants: TournamentParticipant[];
  type: TournamentType;
  description?: string;
}

export interface TournamentParticipant {
  userId: string;
  user: User;
  totalPoints: number;
  pointsBreakdown: {
    prPoints: number;
    consistencyPoints: number;
    improvementPoints: number;
    participationPoints: number;
    bonusPoints: number;
  };
  rank: number;
  badges: TournamentBadge[];
  workoutDays: string[]; // ISO date strings of days they worked out
}

export interface TournamentBadge {
  id: string;
  type: BadgeType;
  name: string;
  description: string;
  points: number;
  earnedAt: string; // ISO date string
}

export enum TournamentType {
  WEEKLY_GENERAL = 'Weekly General',
  CATEGORY_FOCUS = 'Category Focus',
  BEGINNER_FRIENDLY = 'Beginner Friendly',
  TEAM_BATTLE = 'Team Battle'
}

export enum BadgeType {
  FIRST_PR = 'first_pr',
  CONSISTENCY_KING = 'consistency_king',
  IMPROVEMENT_STAR = 'improvement_star',
  WEEKEND_WARRIOR = 'weekend_warrior',
  CATEGORY_MASTER = 'category_master',
  NEWCOMER_BONUS = 'newcomer_bonus',
  PERFECT_WEEK = 'perfect_week'
}

export interface PointsRule {
  type: 'pr_achievement' | 'daily_workout' | 'improvement_percent' | 'consistency_bonus' | 'weekend_bonus' | 'category_completion';
  points: number;
  description: string;
  multiplier?: number;
}
