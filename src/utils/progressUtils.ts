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

// Function to get overall progress chart data with percentage growth by categories
// 
// IMPORTANT: This function solves the "different exercise baseline" problem by:
// 1. Calculating percentage gains PER EXERCISE based on each exercise's own starting weight
// 2. Averaging the PERCENTAGE GAINS (not raw weights) for each category
// 
// Example scenario that this fixes:
// Day 1: Shoulder Press 20lbs (0% gain)
// Day 2: Shoulder Press 22lbs (10% gain) + Lateral Raises 10lbs (0% gain) 
// Result: Category shows 5% gain average (not a false weight drop)
//
// This ensures that adding new exercises with different baselines doesn't
// artificially affect the category's progress visualization.
export const getOverallProgressChartData = (
  logs: ExerciseLog[], 
  exercises: Exercise[], 
  categories: Category[]
): any[] => {
  const chartData = new Map();
  const exerciseStartWeights = new Map(); // Track the first recorded weight for each exercise
  
  // Create a map of category IDs to names for quick lookup
  const categoryNames = new Map(categories.map(cat => [cat.id, cat.name]));
  
  // Sort logs by timestamp to ensure proper chronological order
  const sortedLogs = [...logs].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  
  // First pass: establish starting weights for each exercise
  sortedLogs.forEach(log => {
    const exercise = exercises.find(e => e.id === log.exerciseId);
    if (!exercise) return;
    
    const exerciseId = exercise.id;
    
    // Only set if this is the earliest weight for this exercise
    if (!exerciseStartWeights.has(exerciseId)) {
      exerciseStartWeights.set(exerciseId, log.weight);
    }
  });
  
  // Initialize all categories with starting data to ensure complete coverage
  const allDates = new Set();
  sortedLogs.forEach(log => {
    const logDate = new Date(log.timestamp);
    const date = `${logDate.getMonth() + 1}/${logDate.getDate()}/${logDate.getFullYear()}`;
    allDates.add(date);
  });
  
  // Second pass: group logs by date and exercise, then calculate per-exercise percentage gains
  sortedLogs.forEach(log => {
    const logDate = new Date(log.timestamp);
    const date = `${logDate.getMonth() + 1}/${logDate.getDate()}/${logDate.getFullYear()}`;
    const exercise = exercises.find(e => e.id === log.exerciseId);
    
    if (!exercise) return;
    
    const categoryId = exercise.categoryId;
    const categoryName = categoryNames.get(categoryId) || 'Unknown';
    const exerciseId = exercise.id;
    
    if (!chartData.has(date)) {
      chartData.set(date, {
        date,
      });
    }
    
    const dayData = chartData.get(date);
    
    if (!dayData[categoryName]) {
      dayData[categoryName] = {
        exerciseProgress: new Map(), // Track percentage progress per exercise
        latestTimestamp: log.timestamp
      };
    }
    
    // Calculate percentage gain for this exercise and store it
    const startWeight = exerciseStartWeights.get(exerciseId) || log.weight;
    const percentGain = startWeight > 0 ? ((log.weight - startWeight) / startWeight) * 100 : 0;
    
    // Track the latest percentage gain for each exercise in this category on this date
    if (!dayData[categoryName].exerciseProgress.has(exerciseId) || 
        new Date(log.timestamp) >= new Date(dayData[categoryName].latestTimestamp)) {
      dayData[categoryName].exerciseProgress.set(exerciseId, percentGain);
      if (new Date(log.timestamp) >= new Date(dayData[categoryName].latestTimestamp)) {
        dayData[categoryName].latestTimestamp = log.timestamp;
      }
    }
  });
  
  // Calculate average percentage gains for each category
  const result = Array.from(chartData.values()).map(dayData => {
    const formattedDay = { date: dayData.date };
    
    // Ensure all categories are represented with data points for better line continuity
    categories.forEach(category => {
      const categoryName = category.name;
      if (dayData[categoryName]) {
        const categoryData = dayData[categoryName] as { exerciseProgress: Map<string, number>; latestTimestamp: string };
        
        // Calculate the average percentage gain for this category on this date
        // This averages the individual percentage gains of each exercise, not raw weights
        const progressValues = Array.from(categoryData.exerciseProgress.values());
        const avgPercentGain = progressValues.length > 0 
          ? progressValues.reduce((sum, percent) => sum + percent, 0) / progressValues.length 
          : 0;
        
        formattedDay[categoryName] = Math.round(avgPercentGain * 100) / 100; // Round to 2 decimal places
      } else {
        // Fill missing data with previous value or 0 to maintain line continuity
        formattedDay[categoryName] = 0;
      }
    });
    
    return formattedDay;
  });
  
  // Sort by date and fill gaps for better line continuity
  const sortedResult = result.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  
  // Forward fill missing values to ensure continuous lines
  for (let i = 1; i < sortedResult.length; i++) {
    categories.forEach(category => {
      const categoryName = category.name;
      if (sortedResult[i][categoryName] === 0 && sortedResult[i-1][categoryName] > 0) {
        sortedResult[i][categoryName] = sortedResult[i-1][categoryName];
      }
    });
  }
  
  return sortedResult;
};

// Function to get exercise progress chart data for a specific category (RAW WEIGHT in lbs)
export const getExerciseProgressChartData = (
  logs: ExerciseLog[], 
  exercises: Exercise[], 
  categoryId: string
): any[] => {
  const chartData = new Map();
  
  // Get all exercises for this category
  const categoryExercises = exercises.filter(exercise => exercise.categoryId === categoryId);
  
  if (categoryExercises.length === 0) return [];
  
  console.log(`Processing category with ${categoryExercises.length} exercises:`, categoryExercises.map(e => e.name));
  
  // Sort logs by timestamp to ensure proper chronological order
  const sortedLogs = [...logs].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  
  // Filter logs to only include those for exercises in this category
  const categoryLogs = sortedLogs.filter(log => 
    categoryExercises.some(ex => ex.id === log.exerciseId)
  );
  
  console.log(`Found ${categoryLogs.length} logs for this category`);
  
  // Collect all unique dates for this category
  const allDates = new Set();
  categoryLogs.forEach(log => {
    const logDate = new Date(log.timestamp);
    const date = `${logDate.getMonth() + 1}/${logDate.getDate()}/${logDate.getFullYear()}`;
    allDates.add(date);
  });
  
  // Initialize chart data structure for all dates
  Array.from(allDates).forEach(date => {
    chartData.set(date, { date });
  });
  
  // Process all logs for exercises in this category
  categoryLogs.forEach(log => {
    const exercise = categoryExercises.find(ex => ex.id === log.exerciseId);
    if (!exercise) return;
    
    const logDate = new Date(log.timestamp);
    const date = `${logDate.getMonth() + 1}/${logDate.getDate()}/${logDate.getFullYear()}`;
    const exerciseName = exercise.name;
    
    const dayData = chartData.get(date);
    
    if (!dayData[exerciseName]) {
      dayData[exerciseName] = {
        maxWeight: 0,
      };
    }
    
    // Convert to lbs if needed and track the maximum weight for this exercise on this date
    const weightInLbs = log.weightUnit === 'kg' ? convertWeight(log.weight, 'kg') : log.weight;
    dayData[exerciseName].maxWeight = Math.max(dayData[exerciseName].maxWeight || 0, weightInLbs);
  });
  
  // Convert to result format with raw weights (no percentage calculation)
  const result = Array.from(chartData.values()).map(dayData => {
    const formattedDay = { date: dayData.date };
    
    // Ensure ALL exercises in the category are represented
    categoryExercises.forEach(exercise => {
      const exerciseName = exercise.name;
      if (dayData[exerciseName]) {
        const { maxWeight } = dayData[exerciseName] as { maxWeight: number };
        formattedDay[exerciseName] = Math.round(maxWeight * 100) / 100; // Round to 2 decimal places
      } else {
        // Initialize with null for exercises with no data on this date
        formattedDay[exerciseName] = null;
      }
    });
    
    return formattedDay;
  });
  
  // Sort by date
  const sortedResult = result.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  
  // Forward fill missing values to maintain line continuity for each exercise
  for (let i = 1; i < sortedResult.length; i++) {
    categoryExercises.forEach(exercise => {
      const exerciseName = exercise.name;
      // If current value is null but previous has a value, forward fill
      if (sortedResult[i][exerciseName] === null && sortedResult[i-1][exerciseName] !== null) {
        sortedResult[i][exerciseName] = sortedResult[i-1][exerciseName];
      }
    });
  }
  
  // Only return results that have at least one non-null exercise value
  const finalResult = sortedResult.filter(day => 
    categoryExercises.some(exercise => day[exercise.name] !== null)
  );
  
  console.log(`Final result has ${finalResult.length} data points with exercises:`, 
    finalResult.length > 0 ? Object.keys(finalResult[0]).filter(k => k !== 'date') : []);
  
  return finalResult;
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
