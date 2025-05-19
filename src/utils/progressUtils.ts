import { ExerciseLog, Progress, Exercise, ProgressChartData, LeaderboardEntry, LeaderboardType, User, Category } from '../types';
import { getExerciseById } from '../data/mockData';

// Helper function to convert weight to lbs (we'll keep this for any legacy kg data)
export const convertWeight = (weight: number, fromUnit: string = 'kg'): number => {
  if (fromUnit === 'lbs') return weight;
  
  if (fromUnit === 'kg') {
    return weight * 2.20462; // kg to lbs
  }
  
  return weight; // Default case
};

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

  // Get the most recent log
  const mostRecentLog = exerciseLogs[0];
  
  // Convert weight to lbs if needed
  const weightUnit = 'lbs'; // Always use lbs for display
  const currentWeight = mostRecentLog.weightUnit === 'kg' 
    ? convertWeight(mostRecentLog.weight, 'kg') 
    : mostRecentLog.weight;
  
  // Previous weight is the second most recent log (if it exists)
  const previousWeight = exerciseLogs.length > 1 
    ? (exerciseLogs[1].weightUnit === 'kg' 
        ? convertWeight(exerciseLogs[1].weight, 'kg') 
        : exerciseLogs[1].weight) 
    : undefined;
  
  // Starting weight is the oldest log
  const oldestLog = exerciseLogs[exerciseLogs.length - 1];
  const startingWeight = oldestLog.weightUnit === 'kg'
    ? convertWeight(oldestLog.weight, 'kg')
    : oldestLog.weight;
  
  // Personal record is the highest weight ever recorded (convert all to lbs first)
  const personalRecord = Math.max(...exerciseLogs.map(log => 
    log.weightUnit === 'kg' ? convertWeight(log.weight, 'kg') : log.weight
  ));
  
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
    percentGainFromStart,
    weightUnit
  };
};

export const getProgressChartData = (logs: ExerciseLog[], exerciseId: string): ProgressChartData[] => {
  // Filter logs for this exercise and sort by timestamp (oldest first)
  const exerciseLogs = logs
    .filter(log => log.exerciseId === exerciseId)
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  
  if (exerciseLogs.length === 0) return [];
  
  // Calculate the starting weight for percentage gains
  const startingWeight = exerciseLogs[0].weight;
  
  return exerciseLogs.map(log => {
    const percentGain = ((log.weight - startingWeight) / startingWeight) * 100;
    
    return {
      date: new Date(log.timestamp).toLocaleDateString(),
      weight: log.weight,
      percentGain: percentGain
    };
  });
};

// New function to get category-based progress chart data
export const getCategoryProgressChartData = (logs: ExerciseLog[], exercises: Exercise[], categoryId: string): any[] => {
  // Get all exercises for this category
  const categoryExercises = exercises.filter(exercise => exercise.categoryId === categoryId);
  
  if (categoryExercises.length === 0) return [];
  
  // Group logs by date for this chart
  const logsByDate = new Map();
  
  // Process all logs for exercises in this category
  categoryExercises.forEach(exercise => {
    const exerciseLogs = logs
      .filter(log => log.exerciseId === exercise.id)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
      
    exerciseLogs.forEach(log => {
      const date = new Date(log.timestamp).toLocaleDateString();
      
      if (!logsByDate.has(date)) {
        logsByDate.set(date, {
          date,
        });
      }
      
      // Store the latest weight for this exercise for this date
      logsByDate.get(date)[exercise.name] = log.weight;
    });
  });
  
  // Convert the map to an array and sort by date
  return Array.from(logsByDate.values())
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
};

// New function to get overall progress chart data across all categories
export const getOverallProgressChartData = (
  logs: ExerciseLog[], 
  exercises: Exercise[], 
  categories: Category[]
): any[] => {
  const chartData = new Map();
  
  // Create a map of category IDs to names for quick lookup
  const categoryNames = new Map(categories.map(cat => [cat.id, cat.name]));
  
  // Group logs by date and category
  logs.forEach(log => {
    const date = new Date(log.timestamp).toLocaleDateString();
    const exercise = exercises.find(e => e.id === log.exerciseId);
    
    if (!exercise) return;
    
    const categoryId = exercise.categoryId;
    const categoryName = categoryNames.get(categoryId) || 'Unknown';
    
    if (!chartData.has(date)) {
      chartData.set(date, {
        date,
      });
    }
    
    // For each category, we'll track the average weight across all exercises
    const dayData = chartData.get(date);
    
    if (!dayData[categoryName]) {
      dayData[categoryName] = {
        total: 0,
        count: 0,
      };
    }
    
    dayData[categoryName].total += log.weight;
    dayData[categoryName].count += 1;
  });
  
  // Calculate the average for each category and convert to final format
  const result = Array.from(chartData.values()).map(dayData => {
    const formattedDay = { date: dayData.date };
    
    // Calculate average for each category
    Object.entries(dayData).forEach(([key, value]) => {
      if (key !== 'date' && typeof value === 'object') {
        const { total, count } = value as { total: number, count: number };
        formattedDay[key] = count > 0 ? total / count : 0;
      }
    });
    
    return formattedDay;
  });
  
  // Sort by date
  return result.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
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
  
  // Ensure all users are included, even if they have no logs
  users.forEach(user => {
    if (!userGains.has(user.id)) {
      userGains.set(user.id, 0);
    }
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
  
  // Ensure all users are included, even if they have no logs
  users.forEach(user => {
    if (!userMaxWeights.has(user.id)) {
      userMaxWeights.set(user.id, 0);
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
