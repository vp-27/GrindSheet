
import { ExerciseLog, Progress, Exercise, ProgressChartData, LeaderboardEntry, LeaderboardType, User } from '../types';
import { getExerciseById } from '../data/mockData';

export const calculateProgress = (logs: ExerciseLog[], exerciseId: string, exercise: Exercise): Progress => {
  // Filter logs for this exercise and sort by timestamp (newest first)
  const exerciseLogs = logs
    .filter(log => log.exerciseId === exerciseId)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  if (exerciseLogs.length === 0) {
    return {
      exercise,
      currentWeight: 0
    };
  }

  // Current weight is the most recent log
  const currentWeight = exerciseLogs[0].weight;
  
  // Previous weight is the second most recent log (if it exists)
  const previousWeight = exerciseLogs.length > 1 ? exerciseLogs[1].weight : undefined;
  
  // Starting weight is the oldest log
  const startingWeight = exerciseLogs[exerciseLogs.length - 1].weight;
  
  // Personal record is the highest weight ever recorded
  const personalRecord = Math.max(...exerciseLogs.map(log => log.weight));
  
  // Calculate percentage gains
  const percentGainFromPrevious = previousWeight 
    ? ((currentWeight - previousWeight) / previousWeight) * 100
    : undefined;
    
  const percentGainFromStart = startingWeight 
    ? ((currentWeight - startingWeight) / startingWeight) * 100
    : undefined;

  return {
    exercise,
    currentWeight,
    previousWeight,
    startingWeight,
    personalRecord,
    percentGainFromPrevious,
    percentGainFromStart
  };
};

export const getProgressChartData = (logs: ExerciseLog[], exerciseId: string): ProgressChartData[] => {
  // Filter logs for this exercise and sort by timestamp (oldest first)
  return logs
    .filter(log => log.exerciseId === exerciseId)
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
    .map(log => ({
      date: new Date(log.timestamp).toLocaleDateString(),
      weight: log.weight
    }));
};

export const calculateAllTimeGainLeaderboard = (
  logs: ExerciseLog[], 
  users: User[], 
  exerciseId?: string, 
  categoryId?: string
): LeaderboardEntry[] => {
  const userGains: Map<string, number> = new Map();
  const userMaxWeights: Map<string, number> = new Map();
  const userStartWeights: Map<string, number> = new Map();
  
  // Process all logs
  logs.forEach(log => {
    // If filtering by exercise and this log isn't for that exercise, skip it
    if (exerciseId && log.exerciseId !== exerciseId) return;
    
    // If filtering by category, check if the exercise is in that category
    if (categoryId) {
      const exercise = getExerciseById(log.exerciseId);
      if (!exercise || exercise.categoryId !== categoryId) return;
    }
    
    const userExerciseKey = `${log.userId}-${log.exerciseId}`;
    
    // Track max weight for this user and exercise
    if (!userMaxWeights.has(userExerciseKey) || log.weight > userMaxWeights.get(userExerciseKey)!) {
      userMaxWeights.set(userExerciseKey, log.weight);
    }
    
    // Track starting weight for this user and exercise (will be overwritten by earlier dates)
    if (!userStartWeights.has(userExerciseKey) || 
        new Date(log.timestamp) < new Date(userStartWeights.get(userExerciseKey)!)) {
      userStartWeights.set(userExerciseKey, log.weight);
    }
  });
  
  // Calculate gains for each user
  users.forEach(user => {
    let totalGainPercent = 0;
    let exerciseCount = 0;
    
    logs.forEach(log => {
      // Only process unique user-exercise combinations
      const userExerciseKey = `${user.id}-${log.exerciseId}`;
      
      // If we've already processed this user-exercise combo, skip
      if (log.userId !== user.id) return;
      
      // If filtering by exercise and this log isn't for that exercise, skip it
      if (exerciseId && log.exerciseId !== exerciseId) return;
      
      // If filtering by category, check if the exercise is in that category
      if (categoryId) {
        const exercise = getExerciseById(log.exerciseId);
        if (!exercise || exercise.categoryId !== categoryId) return;
      }
      
      const maxWeight = userMaxWeights.get(userExerciseKey) || 0;
      const startWeight = userStartWeights.get(userExerciseKey) || maxWeight;
      
      if (startWeight > 0 && maxWeight > startWeight) {
        const gainPercent = ((maxWeight - startWeight) / startWeight) * 100;
        totalGainPercent += gainPercent;
        exerciseCount++;
      }
    });
    
    // Calculate average gain percentage
    const avgGainPercent = exerciseCount > 0 ? totalGainPercent / exerciseCount : 0;
    
    userGains.set(user.id, avgGainPercent);
  });
  
  // Convert to leaderboard entries and sort
  return Array.from(userGains.entries())
    .map(([userId, value]) => ({
      userId,
      user: users.find(u => u.id === userId)!,
      value,
      exerciseId,
      categoryId
    }))
    .sort((a, b) => b.value - a.value);
};

export const calculateMaxWeightLeaderboard = (
  logs: ExerciseLog[], 
  users: User[], 
  exerciseId?: string
): LeaderboardEntry[] => {
  if (!exerciseId) return [];
  
  const userMaxWeights: Map<string, number> = new Map();
  
  // Find max weight for each user for this exercise
  logs
    .filter(log => log.exerciseId === exerciseId)
    .forEach(log => {
      if (!userMaxWeights.has(log.userId) || log.weight > userMaxWeights.get(log.userId)!) {
        userMaxWeights.set(log.userId, log.weight);
      }
    });
  
  // Convert to leaderboard entries and sort
  return Array.from(userMaxWeights.entries())
    .map(([userId, value]) => ({
      userId,
      user: users.find(u => u.id === userId)!,
      value,
      exerciseId
    }))
    .sort((a, b) => b.value - a.value);
};

export const getLeaderboard = (
  logs: ExerciseLog[],
  users: User[],
  type: LeaderboardType,
  exerciseId?: string,
  categoryId?: string
): LeaderboardEntry[] => {
  switch (type) {
    case LeaderboardType.ALLTIME_GAIN:
      return calculateAllTimeGainLeaderboard(logs, users, exerciseId, categoryId);
    case LeaderboardType.RECENT_GAIN:
      // For simplicity, we'll use 30 days as "recent"
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const recentLogs = logs.filter(log => new Date(log.timestamp) >= thirtyDaysAgo);
      return calculateAllTimeGainLeaderboard(recentLogs, users, exerciseId, categoryId);
    case LeaderboardType.MAX_WEIGHT:
      // This only makes sense for a specific exercise
      if (!exerciseId) return [];
      return calculateMaxWeightLeaderboard(logs, users, exerciseId);
    default:
      return [];
  }
};
