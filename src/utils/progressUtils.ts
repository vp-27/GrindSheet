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
  
  // Calculate percentage gains with special handling for bodyweight exercises
  let percentGainFromPrevious = undefined;
  if (previousWeight !== undefined) {
    if (previousWeight > 0) {
      percentGainFromPrevious = ((currentWeight - previousWeight) / previousWeight) * 100;
    } else if (previousWeight === 0 && currentWeight > 0) {
      percentGainFromPrevious = currentWeight * 10; // 10% per lb when starting from bodyweight
    } else if (previousWeight === 0 && currentWeight === 0) {
      percentGainFromPrevious = 0; // No change in bodyweight
    } else if (previousWeight > 0 && currentWeight === 0) {
      percentGainFromPrevious = -100; // Back to bodyweight
    }
  }
    
  let percentGainFromStart = undefined;
  if (startingWeight !== undefined) {
    if (startingWeight > 0) {
      percentGainFromStart = ((currentWeight - startingWeight) / startingWeight) * 100;
    } else if (startingWeight === 0 && currentWeight > 0) {
      percentGainFromStart = currentWeight * 10; // 10% per lb when starting from bodyweight
    } else if (startingWeight === 0 && currentWeight === 0) {
      percentGainFromStart = 0; // No change in bodyweight
    } else if (startingWeight > 0 && currentWeight === 0) {
      percentGainFromStart = -100; // Back to bodyweight
    }
  }

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
    // Handle percentage calculation for bodyweight exercises
    let percentGain = 0;
    if (startingWeight > 0) {
      // Standard percentage calculation for weighted exercises
      percentGain = ((log.weight - startingWeight) / startingWeight) * 100;
    } else if (startingWeight === 0 && log.weight > 0) {
      // When transitioning from bodyweight (0) to weighted, show meaningful progress
      percentGain = log.weight * 10; // 10% gain per lb when starting from bodyweight
    } else if (startingWeight === 0 && log.weight === 0) {
      // Bodyweight to bodyweight stays at 0% change
      percentGain = 0;
    }
    // If starting weight > 0 but current is 0, calculate normal percentage
    else if (startingWeight > 0 && log.weight === 0) {
      percentGain = -100; // Complete loss back to bodyweight
    }

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
  categories: Category[],
  windowStartDate?: Date // NEW: optional window start for 1W, 2W, 1M timeframes
): any[] => {
  const chartData = new Map();
  const exerciseStartWeights = new Map(); // Track the first recorded weight for each exercise
  const categoryNames = new Map(categories.map(cat => [cat.id, cat.name]));
  const sortedLogs = [...logs].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  // First pass: establish starting weights for each exercise
  sortedLogs.forEach(log => {
    const exercise = exercises.find(e => e.id === log.exerciseId);
    if (!exercise) return;
    const exerciseId = exercise.id;
    if (!exerciseStartWeights.has(exerciseId)) {
      exerciseStartWeights.set(exerciseId, log.weight);
    }
  });

  // NEW: If windowStartDate is provided, filter to only include exercises that existed at that date
  let allowedExercises = new Set<string>();
  if (windowStartDate) {
    // Find exercises that have logs at or before the windowStartDate
    sortedLogs.forEach(log => {
      if (new Date(log.timestamp) <= windowStartDate) {
        allowedExercises.add(log.exerciseId);
      }
    });
    console.log(`Baseline locking: Only including ${allowedExercises.size} exercises that existed at ${windowStartDate.toDateString()}`);
  }

  // Initialize all categories with starting data to ensure complete coverage
  const allDates = new Set();
  sortedLogs.forEach(log => {
    // Skip exercises not in allowedExercises if we're doing baseline locking
    if (windowStartDate && !allowedExercises.has(log.exerciseId)) return;
    
    const logDate = new Date(log.timestamp);
    const date = `${logDate.getMonth() + 1}/${logDate.getDate()}/${logDate.getFullYear()}`;
    allDates.add(date);
  });
  allDates.forEach(date => {
    if (!chartData.has(date)) {
      chartData.set(date, { date });
    }
  });

  // Second pass: group logs by date and exercise, then calculate per-exercise percentage gains
  sortedLogs.forEach(log => {
    // Skip exercises not in allowedExercises if we're doing baseline locking
    if (windowStartDate && !allowedExercises.has(log.exerciseId)) return;
    
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
    const startWeight = exerciseStartWeights.get(exerciseId) || log.weight;
    // Handle percentage calculation for bodyweight exercises (starting weight = 0)
    let percentGain = 0;
    if (startWeight > 0) {
      // Standard percentage calculation for weighted exercises
      percentGain = ((log.weight - startWeight) / startWeight) * 100;
    } else if (startWeight === 0 && log.weight > 0) {
      // When transitioning from bodyweight (0) to weighted, show the weight as progress
      // Use a base value for percentage calculation (e.g., treat 0->X as 100% gain per X lbs)
      percentGain = log.weight * 10; // 10% gain per lb when starting from bodyweight
    } else if (startWeight === 0 && log.weight === 0) {
      // Bodyweight to bodyweight stays at 0% change
      percentGain = 0;
    }
    // If current weight goes back to 0 from a positive start weight, calculate normal percentage
    else if (startWeight > 0 && log.weight === 0) {
      percentGain = -100; // Complete loss of weight (back to bodyweight)
    }
    const isFirstLogForExercise = exerciseStartWeights.get(exerciseId) === log.weight && 
      !sortedLogs.some(prevLog => 
        prevLog.exerciseId === exerciseId && 
        new Date(prevLog.timestamp) < new Date(log.timestamp)
      );
    if (!dayData[categoryName].exerciseProgress.has(exerciseId) || 
        new Date(log.timestamp) >= new Date(dayData[categoryName].latestTimestamp)) {
      if (!isFirstLogForExercise || log.weight !== startWeight) {
        dayData[categoryName].exerciseProgress.set(exerciseId, percentGain);
      }
      if (new Date(log.timestamp) >= new Date(dayData[categoryName].latestTimestamp)) {
        dayData[categoryName].latestTimestamp = log.timestamp;
      }
    }
  });

  // Calculate average percentage gains for each category
  let result = Array.from(chartData.values()).map(dayData => {
    const formattedDay = { date: dayData.date };
    categories.forEach(category => {
      const categoryName = category.name;
      if (dayData[categoryName]) {
        const categoryData = dayData[categoryName] as { exerciseProgress: Map<string, number>; latestTimestamp: string };
        const progressValues = Array.from(categoryData.exerciseProgress.values());
        const avgPercentGain = progressValues.length > 0 
          ? progressValues.reduce((sum, percent) => sum + percent, 0) / progressValues.length 
          : 0;
        formattedDay[categoryName] = Math.round(avgPercentGain * 100) / 100; // Round to 2 decimal places
      } else {
        formattedDay[categoryName] = 0;
      }
    });
    return formattedDay;
  });
  result = result.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Forward fill missing values to show maintained progress
  const logsOnDate = new Map();
  sortedLogs.forEach(log => {
    // Skip exercises not in allowedExercises if we're doing baseline locking
    if (windowStartDate && !allowedExercises.has(log.exerciseId)) return;
    
    const logDate = new Date(log.timestamp);
    const date = `${logDate.getMonth() + 1}/${logDate.getDate()}/${logDate.getFullYear()}`;
    if (!logsOnDate.has(date)) {
      logsOnDate.set(date, []);
    }
    logsOnDate.get(date).push(log);
  });
  for (let i = 1; i < result.length; i++) {
    categories.forEach(category => {
      const categoryName = category.name;
      const categoryExerciseIds = exercises
        .filter(ex => ex.categoryId === category.id)
        .filter(ex => !windowStartDate || allowedExercises.has(ex.id)) // Only include allowed exercises
        .map(ex => ex.id);
      const currentDayLogs = logsOnDate.get(result[i].date) || [];
      const hasLogsThisDay = currentDayLogs.some(log => 
        categoryExerciseIds.includes(log.exerciseId)
      );
      if (result[i][categoryName] === 0 && 
          result[i-1][categoryName] !== 0 && 
          !hasLogsThisDay) {
        result[i][categoryName] = result[i-1][categoryName];
      }
    });
  }

  // --- If windowStartDate is provided, re-baseline all categories to 0% at that date ---
  if (windowStartDate) {
    // Find the first index >= windowStartDate
    const windowStartIdx = result.findIndex(d => new Date(d.date) >= windowStartDate);
    if (windowStartIdx !== -1) {
      // For each category, get the value at windowStartIdx and subtract from all subsequent points
      categories.forEach(category => {
        const categoryName = category.name;
        const baseline = result[windowStartIdx][categoryName];
        for (let i = windowStartIdx; i < result.length; i++) {
          result[i][categoryName] = result[i][categoryName] - baseline;
        }
      });
    }
  }

  return result;
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
      // Convert weight to lbs if needed
      const weightInLbs = log.weightUnit === 'kg' ? convertWeight(log.weight, 'kg') : log.weight;
      
      if (!userMaxWeights.has(log.userId) || weightInLbs > userMaxWeights.get(log.userId)!) {
        userMaxWeights.set(log.userId, weightInLbs);
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

// New function to calculate PR overview across all exercises
export const calculateAllExercisesPROverview = (
  logs: ExerciseLog[], 
  users: User[],
  exercises?: Exercise[],
  categoryId?: string
): LeaderboardEntry[] => {
  // Filter logs by category if specified
  let filteredLogs = logs;
  if (categoryId && exercises) {
    const categoryExerciseIds = exercises
      .filter(exercise => exercise.categoryId === categoryId)
      .map(exercise => exercise.id);
    filteredLogs = logs.filter(log => categoryExerciseIds.includes(log.exerciseId));
  }
  
  // Find exercises with multiple users
  const exerciseUserCounts = new Map<string, Set<string>>();
  filteredLogs.forEach(log => {
    if (!exerciseUserCounts.has(log.exerciseId)) {
      exerciseUserCounts.set(log.exerciseId, new Set());
    }
    exerciseUserCounts.get(log.exerciseId)!.add(log.userId);
  });
  
  const multiUserExercises = Array.from(exerciseUserCounts.entries())
    .filter(([_, userSet]) => userSet.size > 1)
    .sort((a, b) => b[1].size - a[1].size);
  
  const prOverview: LeaderboardEntry[] = [];
  
  // For each exercise with multiple users, find the PR holder(s)
  multiUserExercises.forEach(([exerciseId, _]) => {
    const exerciseLogs = filteredLogs.filter(log => log.exerciseId === exerciseId);
    
    // Find the highest weight for this exercise
    let maxWeight = 0;
    const prHolders: User[] = [];
    
    // First pass: find the max weight
    exerciseLogs.forEach(log => {
      const weightInLbs = log.weightUnit === 'kg' ? convertWeight(log.weight, 'kg') : log.weight;
      if (weightInLbs > maxWeight) {
        maxWeight = weightInLbs;
      }
    });
    
    // Second pass: find all users who achieved this max weight (handle ties)
    exerciseLogs.forEach(log => {
      const weightInLbs = log.weightUnit === 'kg' ? convertWeight(log.weight, 'kg') : log.weight;
      if (weightInLbs === maxWeight) {
        const user = users.find(u => u.id === log.userId);
        if (user && !prHolders.some(h => h.id === user.id)) {
          prHolders.push(user);
        }
      }
    });
    
    // Add one entry per exercise, with all PR holders grouped together
    if (maxWeight > 0 && prHolders.length > 0) {
      prOverview.push({
        userId: prHolders[0].id, // Use first holder as primary user
        user: prHolders[0], // Primary user for display
        users: prHolders, // All tied users
        value: maxWeight,
        exerciseId,
        isTie: prHolders.length > 1
      });
    }
  });
  
  // Sort by highest weight, then by exercise name for consistent ordering
  return prOverview.sort((a, b) => {
    if (b.value !== a.value) return b.value - a.value;
    // If weights are equal, sort by exerciseId for consistent ordering
    return a.exerciseId!.localeCompare(b.exerciseId!);
  });
};

// Calculate PR championship summary (who has the most PRs)
export const calculatePRChampionshipSummary = (
  logs: ExerciseLog[], 
  users: User[],
  exercises?: Exercise[],
  categoryId?: string
): { champion: User | null; championCount: number; totalExercises: number; summary: Array<{ user: User; prCount: number }> } => {
  const prOverview = calculateAllExercisesPROverview(logs, users, exercises, categoryId);
  
  // Count PRs per user (accounting for ties)
  const userPRCounts = new Map<string, number>();
  users.forEach(user => userPRCounts.set(user.id, 0));
  
  prOverview.forEach(entry => {
    const currentCount = userPRCounts.get(entry.userId) || 0;
    userPRCounts.set(entry.userId, currentCount + 1);
  });
  
  // Find the champion (user with most PRs)
  let championId: string | null = null;
  let maxPRs = 0;
  
  userPRCounts.forEach((count, userId) => {
    if (count > maxPRs) {
      maxPRs = count;
      championId = userId;
    }
  });
  
  const champion = championId ? users.find(u => u.id === championId) || null : null;
  
  // Get unique exercises count
  const uniqueExercises = new Set(prOverview.map(entry => entry.exerciseId));
  
  // Create summary array
  const summary = Array.from(userPRCounts.entries())
    .map(([userId, prCount]) => ({
      user: users.find(u => u.id === userId)!,
      prCount
    }))
    .filter(item => item.prCount > 0)
    .sort((a, b) => b.prCount - a.prCount);
  
  return {
    champion,
    championCount: maxPRs,
    totalExercises: uniqueExercises.size,
    summary
  };
};

export const calculateOverallProgressLeaderboard = (
  logs: ExerciseLog[], 
  users: User[]
): LeaderboardEntry[] => {
  const userStats: Map<string, { totalGain: number; exerciseCount: number }> = new Map();
  const userExerciseStats: Map<string, { maxWeight: number; startWeight: number }> = new Map();
  
  // Process all logs to calculate gains per user per exercise
  logs.forEach(log => {
    const userExerciseKey = `${log.userId}-${log.exerciseId}`;
    
    if (!userExerciseStats.has(userExerciseKey)) {
      userExerciseStats.set(userExerciseKey, { maxWeight: log.weight, startWeight: log.weight });
    } else {
      const stats = userExerciseStats.get(userExerciseKey)!;
      stats.maxWeight = Math.max(stats.maxWeight, log.weight);
      // Keep earliest (lowest timestamp) as start weight
      if (new Date(log.timestamp) < new Date()) {
        stats.startWeight = Math.min(stats.startWeight, log.weight);
      }
    }
  });
  
  // Calculate average gains per user
  users.forEach(user => {
    let totalGainPercent = 0;
    let exerciseCount = 0;
    
    for (const [key, stats] of userExerciseStats.entries()) {
      if (key.startsWith(user.id + '-')) {
        if (stats.startWeight > 0 && stats.maxWeight > stats.startWeight) {
          const gainPercent = ((stats.maxWeight - stats.startWeight) / stats.startWeight) * 100;
          totalGainPercent += gainPercent;
          exerciseCount++;
        }
      }
    }
    
    const avgGainPercent = exerciseCount > 0 ? totalGainPercent / exerciseCount : 0;
    userStats.set(user.id, { totalGain: avgGainPercent, exerciseCount });
  });
  
  // Convert to leaderboard entries and sort
  return Array.from(userStats.entries())
    .map(([userId, stats]) => ({
      userId,
      user: users.find(u => u.id === userId)!,
      value: stats.totalGain,
      exerciseCount: stats.exerciseCount
    }))
    .filter(entry => entry.exerciseCount > 0) // Only include users with exercises
    .sort((a, b) => b.value - a.value);
};

export const calculateRecentAchieversLeaderboard = (
  logs: ExerciseLog[], 
  users: User[]
): LeaderboardEntry[] => {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const recentLogs = logs.filter(log => new Date(log.timestamp) >= thirtyDaysAgo);
  const userBestRecent: Map<string, number> = new Map();
  
  // Find best recent achievement for each user
  users.forEach(user => {
    const userRecentLogs = recentLogs.filter(log => log.userId === user.id);
    if (userRecentLogs.length > 0) {
      const maxWeight = Math.max(...userRecentLogs.map(log => log.weight));
      userBestRecent.set(user.id, maxWeight);
    } else {
      userBestRecent.set(user.id, 0);
    }
  });
  
  return Array.from(userBestRecent.entries())
    .map(([userId, value]) => ({
      userId,
      user: users.find(u => u.id === userId)!,
      value
    }))
    .filter(entry => entry.value > 0) // Only show users with recent activity
    .sort((a, b) => b.value - a.value);
};

export const calculateConsistencyLeaderboard = (
  logs: ExerciseLog[], 
  users: User[]
): LeaderboardEntry[] => {
  const userConsistency: Map<string, number> = new Map();
  
  users.forEach(user => {
    const userLogs = logs.filter(log => log.userId === user.id);
    if (userLogs.length === 0) {
      userConsistency.set(user.id, 0);
      return;
    }
    
    // Sort logs by date
    const sortedLogs = userLogs.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    
    // Calculate workout days (unique dates)
    const workoutDates = new Set(
      sortedLogs.map(log => new Date(log.timestamp).toDateString())
    );
    
    // Calculate span of activity
    const firstWorkout = new Date(sortedLogs[0].timestamp);
    const lastWorkout = new Date(sortedLogs[sortedLogs.length - 1].timestamp);
    const daySpan = Math.max(1, Math.ceil((lastWorkout.getTime() - firstWorkout.getTime()) / (1000 * 60 * 60 * 24)));
    
    // Consistency score: workout days / total days * 100
    const consistencyScore = (workoutDates.size / daySpan) * 100;
    userConsistency.set(user.id, Math.min(100, consistencyScore)); // Cap at 100%
  });
  
  return Array.from(userConsistency.entries())
    .map(([userId, value]) => ({
      userId,
      user: users.find(u => u.id === userId)!,
      value
    }))
    .filter(entry => entry.value > 0)
    .sort((a, b) => b.value - a.value);
};

export const getLeaderboard = (
  logs: ExerciseLog[],
  users: User[],
  type: LeaderboardType,
  exerciseId?: string,
  categoryId?: string,
  exercises?: Exercise[]
): LeaderboardEntry[] => {
  switch (type) {
    case LeaderboardType.OVERALL_PROGRESS:
      return calculateOverallProgressLeaderboard(logs, users);
    case LeaderboardType.RECENT_ACHIEVERS:
      return calculateRecentAchieversLeaderboard(logs, users);
    case LeaderboardType.CONSISTENCY:
      return calculateConsistencyLeaderboard(logs, users);
    case LeaderboardType.EXERCISE_PR:
      // If no specific exercise selected, show PR overview across all exercises
      if (!exerciseId) {
        return calculateAllExercisesPROverview(logs, users, exercises, categoryId);
      }
      return calculateMaxWeightLeaderboard(logs, users, exerciseId);
    default:
      return calculateOverallProgressLeaderboard(logs, users);
  }
};

// New function to calculate category-specific progress leaders for the redesigned overall section
export const calculateCategoryProgressLeaders = (
  logs: ExerciseLog[], 
  users: User[], 
  exercises: Exercise[],
  categories: Category[]
): { categoryId: string, categoryName: string, leader: LeaderboardEntry }[] => {
  const categoryLeaders: { categoryId: string, categoryName: string, leader: LeaderboardEntry }[] = [];
  
  // Group exercises by category
  const categoriesMap = new Map<string, { id: string, name: string, exercises: Exercise[] }>();
  exercises.forEach(exercise => {
    if (!categoriesMap.has(exercise.categoryId)) {
      // Get category name from the categories array
      const category = categories.find(cat => cat.id === exercise.categoryId);
      const categoryName = category?.name || exercise.categoryId;
      categoriesMap.set(exercise.categoryId, { 
        id: exercise.categoryId, 
        name: categoryName, 
        exercises: [] 
      });
    }
    categoriesMap.get(exercise.categoryId)!.exercises.push(exercise);
  });
  
  categoriesMap.forEach(({ id: categoryId, name: categoryName, exercises: categoryExercises }) => {
    const userStats: Map<string, { totalGain: number; exerciseCount: number }> = new Map();
    const userExerciseStats: Map<string, { maxWeight: number; startWeight: number }> = new Map();
    
    // Filter logs for exercises in this category
    const categoryExerciseIds = new Set(categoryExercises.map(ex => ex.id));
    const categoryLogs = logs.filter(log => categoryExerciseIds.has(log.exerciseId));
    
    // Calculate stats for each user-exercise combination in this category
    categoryLogs.forEach(log => {
      const userExerciseKey = `${log.userId}-${log.exerciseId}`;
      
      if (!userExerciseStats.has(userExerciseKey)) {
        userExerciseStats.set(userExerciseKey, { maxWeight: log.weight, startWeight: log.weight });
      } else {
        const stats = userExerciseStats.get(userExerciseKey)!;
        stats.maxWeight = Math.max(stats.maxWeight, log.weight);
        stats.startWeight = Math.min(stats.startWeight, log.weight);
      }
    });
    
    // Calculate average gains per user for this category
    users.forEach(user => {
      let totalGainPercent = 0;
      let exerciseCount = 0;
      
      for (const [key, stats] of userExerciseStats.entries()) {
        if (key.startsWith(user.id + '-')) {
          if (stats.startWeight > 0 && stats.maxWeight > stats.startWeight) {
            const gainPercent = ((stats.maxWeight - stats.startWeight) / stats.startWeight) * 100;
            totalGainPercent += gainPercent;
            exerciseCount++;
          }
        }
      }
      
      const avgGainPercent = exerciseCount > 0 ? totalGainPercent / exerciseCount : 0;
      if (avgGainPercent > 0) {
        userStats.set(user.id, { totalGain: avgGainPercent, exerciseCount });
      }
    });
    
    // Find the leader for this category
    let bestUser: User | null = null;
    let bestValue = 0;
    
    for (const [userId, stats] of userStats.entries()) {
      if (stats.totalGain > bestValue) {
        bestValue = stats.totalGain;
        bestUser = users.find(u => u.id === userId) || null;
      }
    }
    
    if (bestUser && bestValue > 0) {
      categoryLeaders.push({
        categoryId,
        categoryName,
        leader: {
          userId: bestUser.id,
          user: bestUser,
          value: bestValue,
          categoryId
        }
      });
    }
  });
  
  return categoryLeaders;
};

// Define timeframe options type
type TimeframeOption = '1W' | '2W' | '1M' | 'ALL';

// Helper function to filter data based on timeframe
const filterDataByTimeframe = (data: any[], timeframe: TimeframeOption) => {
  if (timeframe === 'ALL' || !data.length) return data;
  
  const now = new Date();
  const cutoffDate = new Date();
  
  switch (timeframe) {
    case '1W':
      cutoffDate.setDate(now.getDate() - 7);
      break;
    case '2W':
      cutoffDate.setDate(now.getDate() - 14);
      break;
    case '1M':
      cutoffDate.setMonth(now.getMonth() - 1);
      break;
  }
  
  return data.filter(item => new Date(item.date) >= cutoffDate);
};

// Enhanced function to calculate percentage gain from chart start date (visible timeframe)
export const calculatePercentageFromChartStart = (
  data: any[],
  timeframe: '1M' | 'ALL',
  multiple: boolean,
  showPercentage: boolean
): number | null => {
  if (!data || data.length === 0) return null;

  // Filter data based on timeframe first
  const filteredData = filterDataByTimeframe(data, timeframe);
  if (filteredData.length === 0) return null;

  // Get the first point in the visible chart (chart start date)
  const chartStartPoint = filteredData[0];
  const chartEndPoint = filteredData[filteredData.length - 1];

  if (multiple && showPercentage) {
    // For "Overall Progress" (all categories) - percentage data
    const keys = Object.keys(chartEndPoint).filter(key => key !== 'date');
    let totalGain = 0;
    let validGains = 0;
    
    keys.forEach(key => {
      const startValue = chartStartPoint[key];
      const endValue = chartEndPoint[key];
      
      if (
        startValue !== null && startValue !== undefined && !isNaN(startValue) &&
        endValue !== null && endValue !== undefined && !isNaN(endValue)
      ) {
        totalGain += (endValue - startValue);
        validGains++;
      }
    });
    
    return validGains > 0 ? totalGain / validGains : 0;
  } else if (multiple && !showPercentage) {
    // For category-specific view with weight data
    const keys = Object.keys(chartEndPoint).filter(key => key !== 'date');
    let totalGain = 0;
    let validGains = 0;
    
    keys.forEach(key => {
      const startValue = chartStartPoint[key];
      const endValue = chartEndPoint[key];
      
      if (
        startValue !== null && startValue !== undefined && !isNaN(startValue) && startValue > 0 &&
        endValue !== null && endValue !== undefined && !isNaN(endValue)
      ) {
        totalGain += ((endValue - startValue) / startValue) * 100;
        validGains++;
      }
    });
    
    return validGains > 0 ? totalGain / validGains : 0;
  } else {
    // Single metric
    const key = showPercentage ? "percentGain" : "weight";
    const startValue = chartStartPoint[key];
    const endValue = chartEndPoint[key];
    
    if (showPercentage) {
      if (
        startValue !== null && startValue !== undefined && !isNaN(startValue) &&
        endValue !== null && endValue !== undefined && !isNaN(endValue)
      ) {
        return endValue - startValue;
      }
      return 0;
    } else {
      if (
        startValue !== null && startValue !== undefined && !isNaN(startValue) && startValue > 0 &&
        endValue !== null && endValue !== undefined && !isNaN(endValue)
      ) {
        return ((endValue - startValue) / startValue) * 100;
      }
      return 0;
    }
  }
};
