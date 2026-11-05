import {
  BadgeType,
  Category,
  Exercise,
  ExerciseLog,
  PointsRule,
  PRDetail,
  ProgressTrackers,
  Tournament,
  TournamentBadge,
  TournamentParticipant,
  TournamentType,
  User,
} from "../types";
import { calculateProgress } from "./progressUtils";

// --- Balanced Point System for Muscle Growth & Plateau Breaking ---
// Points configuration for different actions
export const POINTS_CONFIG: Record<string, PointsRule> = {
  PR_ACHIEVEMENT: {
    type: "pr_achievement",
    points: 50, // Increased from 25 to 50 for a more motivating PR reward
    description: "New personal record",
  },
  EXERCISE_COMPLETED: {
    type: "exercise_completed",
    points: 8,
    description: "Points per exercise completed",
  },
  DAILY_WORKOUT_BASE: {
    type: "daily_workout_base",
    points: 6,
    description: "Base points for working out (min 2 exercises)",
  },
  EXERCISE_VARIETY_BONUS: {
    type: "exercise_variety_bonus",
    points: 4,
    description: "Bonus per exercise beyond the first 2",
  },
  IMPROVEMENT_PERCENT: {
    type: "improvement_percent",
    points: 2,
    description: "Points per 1% improvement",
    multiplier: 1,
  },
  CONSISTENCY_BONUS: {
    type: "consistency_bonus",
    points: 60,
    description: "5+ workout days in a week",
  },
  WEEKEND_BONUS: {
    type: "weekend_bonus",
    points: 8,
    description: "Extra points for weekend workouts",
  },
  CATEGORY_COMPLETION: {
    type: "category_completion",
    points: 50,
    description: "Work all muscle groups in a week",
  },
  CORE_FOCUS_BONUS: {
    type: "core_focus_bonus",
    points: 15,
    description: "Extra points for core exercises",
  },
};

// Badge definitions
export const BADGE_DEFINITIONS: Record<
  BadgeType,
  { name: string; description: string; points: number }
> = {
  [BadgeType.FIRST_PR]: {
    name: "First PR",
    description: "First personal record of the tournament",
    points: 25,
  },
  [BadgeType.CONSISTENCY_KING]: {
    name: "Consistency King",
    description: "Worked out every day this week",
    points: 50,
  },
  [BadgeType.IMPROVEMENT_STAR]: {
    name: "Improvement Star",
    description: "Highest improvement percentage",
    points: 35,
  },
  [BadgeType.WEEKEND_WARRIOR]: {
    name: "Weekend Warrior",
    description: "Worked out both weekend days",
    points: 20,
  },
  [BadgeType.CATEGORY_MASTER]: {
    name: "Category Master",
    description: "Worked every muscle group",
    points: 30,
  },
  [BadgeType.NEWCOMER_BONUS]: {
    name: "Newcomer Bonus",
    description: "First tournament participation",
    points: 40,
  },
  [BadgeType.PERFECT_WEEK]: {
    name: "Perfect Week",
    description: "Achieved PRs and perfect consistency",
    points: 100,
  },
  [BadgeType.VOLUME_CRUSHER]: {
    name: "Volume Crusher",
    description: "Averaged 3.5+ exercises per workout",
    points: 35,
  },
  [BadgeType.CORE_DESTROYER]: {
    name: "Core Destroyer",
    description: "Completed 6+ core exercises this week",
    points: 30,
  },
};

// Competitive bonus configuration
export const COMPETITIVE_BONUS_CONFIG = {
  TAKEOVER: { points: 20, description: "Takeover: Beat another user's PR" },
  CLOSE_WIN: { points: 10, description: "Close Win: Beat another user by <5%" },
  FIRST_TIME_PR: {
    points: 10,
    description: "First time PR (first log for exercise)",
  },
  IMPROVEMENT_CAP: 50, // max improvement points per exercise per week
};

// New exercise bonus config
export const NEW_EXERCISE_BONUS = {
  points: 25,
  capPerCategory: 5,
  description:
    "Bonus for each new unique exercise per category (up to 5 per category, lifetime)",
};

/**
 * Get the current week's tournament dates (Monday to Sunday)
 */
export const getCurrentWeekDates = (date: Date = new Date()) => {
  const monday = new Date(date);
  const dayOfWeek = monday.getDay();
  const diff = monday.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
  monday.setDate(diff);
  monday.setHours(0, 0, 0, 0);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);

  return {
    start: monday.toISOString(),
    end: sunday.toISOString(),
  };
};

/**
 * Generate a tournament ID based on the week
 */
export const generateTournamentId = (weekStart: string): string => {
  const date = new Date(weekStart);
  const year = date.getFullYear();
  const week = getWeekNumber(date);
  return `tournament-${year}-w${week}`;
};

/**
 * Get week number of the year
 */
export const getWeekNumber = (date: Date): number => {
  const d = new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()),
  );
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
};

/**
 * Check if a date is a weekend (Saturday or Sunday)
 */
export const isWeekend = (date: Date): boolean => {
  const day = date.getDay();
  return day === 0 || day === 6; // Sunday = 0, Saturday = 6
};

/**
 * Calculate points for a tournament participant
 */
export const calculateTournamentPoints = (
  user: User,
  logs: ExerciseLog[],
  exercises: Exercise[],
  categories: Category[],
  tournamentStart: string,
  tournamentEnd: string,
  allParticipantLogs: ExerciseLog[] = [],
  allUsers: User[] = [],
): TournamentParticipant => {
  const startDate = new Date(tournamentStart);
  const endDate = new Date(tournamentEnd);

  // Filter logs for this user and tournament period
  const userLogs = logs.filter((log) => {
    const logDate = new Date(log.timestamp);
    return log.userId === user.id && logDate >= startDate && logDate <= endDate;
  });

  // Initialize points breakdown with new categories
  const pointsBreakdown = {
    prPoints: 0,
    consistencyPoints: 0,
    improvementPoints: 0,
    participationPoints: 0,
    bonusPoints: 0,
    competitivePoints: 0,
    exercisePoints: 0,
    varietyPoints: 0,
  };

  let badges: TournamentBadge[] = [];
  let workoutDays: string[] = [];

  // Track workout days (use local timezone to avoid date shifts)
  const workoutDates = new Set(
    userLogs.map((log) => {
      const logDate = new Date(log.timestamp);
      const year = logDate.getFullYear();
      const month = String(logDate.getMonth() + 1).padStart(2, "0");
      const day = String(logDate.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    }),
  );
  workoutDays = Array.from(workoutDates);

  // Calculate weekend workout days
  const weekendWorkoutDays = workoutDays.filter((dateStr) => {
    const [year, month, day] = dateStr.split("-").map(Number);
    const date = new Date(year, month - 1, day);
    return isWeekend(date);
  }).length;

  // NEW: Calculate exercise-based points
  let totalExercises = 0;
  const uniqueExercises = new Set<string>();
  let coreExercises = 0;
  const exercisesPerDay = new Map<string, number>();
  const varietyDays: { date: string; exerciseCount: number; bonus: number }[] =
    [];

  // Count exercises per day and track variety
  userLogs.forEach((log) => {
    totalExercises++;
    uniqueExercises.add(log.exerciseId);

    // Track exercises per day
    const logDate = new Date(log.timestamp);
    const dateKey = `${logDate.getFullYear()}-${String(logDate.getMonth() + 1).padStart(2, "0")}-${String(logDate.getDate()).padStart(2, "0")}`;
    exercisesPerDay.set(dateKey, (exercisesPerDay.get(dateKey) || 0) + 1);

    // Check for core exercises (exercises with "core", "abs", "plank" in name)
    const exercise = exercises.find((ex) => ex.id === log.exerciseId);
    if (
      exercise &&
      /core|abs|plank|crunch|russian twist|mountain climber/i.test(
        exercise.name,
      )
    ) {
      coreExercises++;
      pointsBreakdown.bonusPoints += POINTS_CONFIG.CORE_FOCUS_BONUS.points;
    }
  });

  // Calculate exercise points (5 points per exercise)
  pointsBreakdown.exercisePoints =
    totalExercises * POINTS_CONFIG.EXERCISE_COMPLETED.points;

  // Calculate daily workout and variety points
  exercisesPerDay.forEach((exerciseCount, date) => {
    if (exerciseCount >= 2) {
      // Base daily workout points (minimum 2 exercises required)
      pointsBreakdown.participationPoints +=
        POINTS_CONFIG.DAILY_WORKOUT_BASE.points;

      // Variety bonus for exercises beyond the first 2
      if (exerciseCount > 2) {
        const varietyBonus =
          (exerciseCount - 2) * POINTS_CONFIG.EXERCISE_VARIETY_BONUS.points;
        pointsBreakdown.varietyPoints += varietyBonus;
        varietyDays.push({
          date,
          exerciseCount,
          bonus: varietyBonus,
        });
      }
    }
  });

  // 2. Weekend bonus points
  let weekendWorkouts = 0;
  userLogs.forEach((log) => {
    const logDate = new Date(log.timestamp);
    if (isWeekend(logDate)) {
      pointsBreakdown.bonusPoints += POINTS_CONFIG.WEEKEND_BONUS.points;
      weekendWorkouts++;
    }
  });

  // 3. Consistency bonus (5+ days)
  if (workoutDates.size >= 5) {
    pointsBreakdown.consistencyPoints += POINTS_CONFIG.CONSISTENCY_BONUS.points;
  }

  // 4. PR points, improvement points, and competitive bonuses
  const exerciseProgress = new Map<
    string,
    { hadPR: boolean; improvementPercent: number }
  >();
  const prDetails: PRDetail[] = [];
  const improvementDetails: PRDetail[] = []; // Track improvements that don't qualify as PRs
  const competitiveDetails: {
    exerciseId: string;
    exerciseName: string;
    type: string;
    targetUser?: string;
    points: number;
  }[] = [];
  exercises.forEach((exercise) => {
    const exerciseLogs = logs.filter((log) => log.exerciseId === exercise.id);
    const userExerciseLogs = exerciseLogs.filter(
      (log) => log.userId === user.id,
    );
    if (userExerciseLogs.length === 0) return;
    const progress = calculateProgress(exerciseLogs, exercise.id, exercise);
    // Tournament logs for this exercise
    const tournamentExerciseLogs = userExerciseLogs.filter((log) => {
      const logDate = new Date(log.timestamp);
      return logDate >= startDate && logDate <= endDate;
    });
    if (tournamentExerciseLogs.length > 0) {
      const maxTournamentWeight = Math.max(
        ...tournamentExerciseLogs.map((log) => log.weight),
      );
      const preTournamentLogs = userExerciseLogs.filter((log) => {
        const logDate = new Date(log.timestamp);
        return logDate < startDate;
      });
      // --- PR & IMPROVEMENT LOGIC ---
      let achievedPR = false;
      let improvementPercent = 0;
      let previousBest = 0; // Declare at higher scope for competitive bonus logic

      if (preTournamentLogs.length > 0) {
        previousBest = Math.max(...preTournamentLogs.map((log) => log.weight));
        // Find user's first log for this exercise (all time)
        const firstLogWeight =
          userExerciseLogs.length > 0
            ? Math.min(...userExerciseLogs.map((log) => log.weight))
            : previousBest;

        // Calculate improvement percentage (always calculate if there's progress)
        if (maxTournamentWeight > previousBest) {
          improvementPercent =
            ((maxTournamentWeight - previousBest) / previousBest) * 100;

          // Award improvement points for ANY progress (separate from PR points)
          const improvementPoints = Math.min(
            Math.floor(
              improvementPercent * POINTS_CONFIG.IMPROVEMENT_PERCENT.points,
            ),
            COMPETITIVE_BONUS_CONFIG.IMPROVEMENT_CAP,
          );
          pointsBreakdown.improvementPoints += improvementPoints;

          // PR points only awarded if improvement is meaningful (prevents gaming)
          if (
            isMeaningfulPR({
              previousBest,
              newBest: maxTournamentWeight,
              firstLogWeight,
            })
          ) {
            achievedPR = true;
            pointsBreakdown.prPoints += POINTS_CONFIG.PR_ACHIEVEMENT.points;
            exerciseProgress.set(exercise.id, {
              hadPR: true,
              improvementPercent,
            });

            // Find the exact log where the PR was achieved
            const prLog = tournamentExerciseLogs.find(
              (log) => log.weight === maxTournamentWeight,
            );
            prDetails.push({
              exerciseId: exercise.id,
              exerciseName: exercise.name,
              weight: maxTournamentWeight,
              previousBest,
              achievedAt:
                prLog?.timestamp || tournamentExerciseLogs[0].timestamp,
              improvementPercent,
            });
          } else {
            // Still track improvement for badges/progress, but not as PR
            exerciseProgress.set(exercise.id, {
              hadPR: false,
              improvementPercent,
            });

            // Add to improvement details for display
            const improvementLog = tournamentExerciseLogs.find(
              (log) => log.weight === maxTournamentWeight,
            );
            improvementDetails.push({
              exerciseId: exercise.id,
              exerciseName: exercise.name,
              weight: maxTournamentWeight,
              previousBest,
              achievedAt:
                improvementLog?.timestamp ||
                tournamentExerciseLogs[0].timestamp,
              improvementPercent,
            });
          }
        }
      } else {
        // First log for this exercise (not a PR)
        pointsBreakdown.bonusPoints +=
          COMPETITIVE_BONUS_CONFIG.FIRST_TIME_PR.points;
        // Do NOT add to prDetails or count as PR
      }
      // --- COMPETITIVE BONUS LOGIC ---
      // Award if achievedPR OR if there's meaningful improvement OR if it's a newcomer's first time with this exercise
      if (
        achievedPR ||
        (improvementPercent > 0 && maxTournamentWeight > previousBest) ||
        preTournamentLogs.length === 0
      ) {
        allUsers.forEach((otherUser) => {
          if (otherUser.id === user.id) return;
          const otherLogs = exerciseLogs.filter(
            (log) =>
              log.userId === otherUser.id && new Date(log.timestamp) <= endDate,
          );
          if (otherLogs.length === 0) return;
          const otherBest = Math.max(...otherLogs.map((log) => log.weight));
          if (maxTournamentWeight > otherBest) {
            // Takeover bonus
            pointsBreakdown.competitivePoints =
              (pointsBreakdown.competitivePoints || 0) +
              COMPETITIVE_BONUS_CONFIG.TAKEOVER.points;
            competitiveDetails.push({
              exerciseId: exercise.id,
              exerciseName: exercise.name,
              type: "Takeover",
              targetUser: otherUser.name,
              points: COMPETITIVE_BONUS_CONFIG.TAKEOVER.points,
            });
            // Close win bonus
            if ((maxTournamentWeight - otherBest) / otherBest < 0.05) {
              pointsBreakdown.competitivePoints +=
                COMPETITIVE_BONUS_CONFIG.CLOSE_WIN.points;
              competitiveDetails.push({
                exerciseId: exercise.id,
                exerciseName: exercise.name,
                type: "Close Win",
                targetUser: otherUser.name,
                points: COMPETITIVE_BONUS_CONFIG.CLOSE_WIN.points,
              });
            }
          }
        });
      }
    }
  });

  // 5. Category completion bonus
  const categoriesWorked = new Set(
    userLogs
      .map((log) => {
        const exercise = exercises.find((ex) => ex.id === log.exerciseId);
        return exercise?.categoryId;
      })
      .filter(Boolean),
  );

  if (categoriesWorked.size >= categories.length) {
    pointsBreakdown.bonusPoints += POINTS_CONFIG.CATEGORY_COMPLETION.points;
  }

  // --- New Exercise Bonus Logic ---
  // For each category, count user's unique exercises (lifetime)
  let newExerciseBonusPoints = 0;
  categories.forEach((category) => {
    // All logs for this user in this category (lifetime)
    const userCategoryLogs = logs.filter(
      (log) =>
        log.userId === user.id &&
        exercises.find((ex) => ex.id === log.exerciseId)?.categoryId ===
          category.id,
    );
    const uniqueExerciseIds = new Set(
      userCategoryLogs.map((log) => log.exerciseId),
    );
    // All logs for this user in this category BEFORE this tournament
    const preTournamentLogs = logs.filter((log) => {
      const logDate = new Date(log.timestamp);
      return (
        log.userId === user.id &&
        logDate < new Date(tournamentStart) &&
        exercises.find((ex) => ex.id === log.exerciseId)?.categoryId ===
          category.id
      );
    });
    const preUniqueExerciseIds = new Set(
      preTournamentLogs.map((log) => log.exerciseId),
    );
    // New unique exercises in this tournament for this category
    const tournamentLogs = userLogs.filter(
      (log) =>
        exercises.find((ex) => ex.id === log.exerciseId)?.categoryId ===
        category.id,
    );
    const tournamentUniqueExerciseIds = new Set(
      tournamentLogs.map((log) => log.exerciseId),
    );
    // Only count those that are not in preUniqueExerciseIds
    let newThisTournament = 0;
    tournamentUniqueExerciseIds.forEach((exId) => {
      if (
        !preUniqueExerciseIds.has(exId) &&
        preUniqueExerciseIds.size < NEW_EXERCISE_BONUS.capPerCategory
      ) {
        // Only award if under cap
        if (
          preUniqueExerciseIds.size + newThisTournament <
          NEW_EXERCISE_BONUS.capPerCategory
        ) {
          newThisTournament++;
        }
      }
    });
    newExerciseBonusPoints += newThisTournament * NEW_EXERCISE_BONUS.points;
  });
  pointsBreakdown.bonusPoints += newExerciseBonusPoints;

  // Calculate exercise statistics
  const exerciseStats = {
    totalExercises,
    uniqueExercises: uniqueExercises.size,
    averageExercisesPerDay:
      workoutDates.size > 0 ? totalExercises / workoutDates.size : 0,
    coreExercises,
    varietyDays,
    newExerciseBonusPoints, // <-- add this property
  };

  // 6. Calculate badges (after exerciseStats is defined)
  badges = calculateBadges(
    user,
    userLogs,
    exerciseProgress,
    workoutDates,
    categoriesWorked,
    categories,
    allParticipantLogs,
    tournamentStart,
    exerciseStats,
  );
  // Add badge points to bonus
  pointsBreakdown.bonusPoints += badges.reduce(
    (sum, badge) => sum + badge.points,
    0,
  );

  // 7. NEW: Generate a dynamic list of progress trackers
  const potentialTrackers: ProgressTrackers = {};
  const toLocalYYYYMMDD = (isoDate: string): string => {
    const date = new Date(isoDate);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };
  const sortedUserLogs = [...userLogs].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
  );

  // Easy daily goal
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  const exercisesToday = exercisesPerDay.get(todayStr) || 0;
  const dailyWorkoutAchieved = exercisesToday >= 2;
  potentialTrackers.dailyWorkout = {
    current: exercisesToday,
    goal: 2,
    text: "Log a workout today (2+ exercises)",
    points: POINTS_CONFIG.DAILY_WORKOUT_BASE.points,
    isAchieved: dailyWorkoutAchieved,
    completedAt: dailyWorkoutAchieved ? todayStr : null,
  };

  // Main goals (from existing logic)
  const consistencyAchieved = workoutDates.size >= 5;
  potentialTrackers.consistency = {
    current: workoutDates.size,
    goal: 5,
    text: "5 Workout Days",
    points: POINTS_CONFIG.CONSISTENCY_BONUS.points,
    isAchieved: consistencyAchieved,
    completedAt: consistencyAchieved
      ? Array.from(workoutDates).sort()[4]
      : null,
  };

  const categoryCompletionAchieved = categoriesWorked.size >= categories.length;
  let categoryCompletionDate: string | null = null;
  if (categoryCompletionAchieved) {
    const workedCats = new Set<string>();
    for (const log of sortedUserLogs) {
      const exercise = exercises.find((ex) => ex.id === log.exerciseId);
      if (exercise) {
        workedCats.add(exercise.categoryId);
        if (workedCats.size === categories.length) {
          categoryCompletionDate = toLocalYYYYMMDD(log.timestamp);
          break;
        }
      }
    }
  }
  potentialTrackers.categoryCompletion = {
    current: categoriesWorked.size,
    goal: categories.length,
    text: "Work All Muscle Groups",
    points: POINTS_CONFIG.CATEGORY_COMPLETION.points,
    isAchieved: categoryCompletionAchieved,
    completedAt: categoryCompletionDate,
  };

  // Badge-related goals
  const weekendWarriorAchieved = weekendWorkoutDays >= 2;
  let weekendWarriorCompletionDate: string | null = null;
  if (weekendWarriorAchieved) {
    const uniqueWeekendDays = new Set(
      sortedUserLogs
        .filter((log) => isWeekend(new Date(log.timestamp)))
        .map((log) => toLocalYYYYMMDD(log.timestamp)),
    );
    weekendWarriorCompletionDate = Array.from(uniqueWeekendDays).sort()[1];
  }
  potentialTrackers.weekendWarrior = {
    current: weekendWorkoutDays,
    goal: 2,
    text: "Weekend Warrior",
    points: BADGE_DEFINITIONS[BadgeType.WEEKEND_WARRIOR].points,
    isAchieved: weekendWarriorAchieved,
    completedAt: weekendWarriorCompletionDate,
  };

  const coreDestroyerAchieved = exerciseStats.coreExercises >= 6;
  let coreDestroyerCompletionDate: string | null = null;
  if (coreDestroyerAchieved) {
    let coreCount = 0;
    for (const log of sortedUserLogs) {
      const exercise = exercises.find((ex) => ex.id === log.exerciseId);
      if (
        exercise &&
        /core|abs|plank|crunch|russian twist|mountain climber/i.test(
          exercise.name,
        )
      ) {
        coreCount++;
        if (coreCount === 6) {
          coreDestroyerCompletionDate = toLocalYYYYMMDD(log.timestamp);
          break;
        }
      }
    }
  }
  potentialTrackers.coreDestroyer = {
    current: exerciseStats.coreExercises,
    goal: 6,
    text: "6+ Core Exercises",
    points: BADGE_DEFINITIONS[BadgeType.CORE_DESTROYER].points,
    isAchieved: coreDestroyerAchieved,
    completedAt: coreDestroyerCompletionDate,
  };

  const volumeCrusherAchieved = exerciseStats.averageExercisesPerDay >= 3.5;
  potentialTrackers.volumeCrusher = {
    current: exerciseStats.averageExercisesPerDay,
    goal: 3.5,
    text: "Avg. 3.5+ Exercises/Day",
    points: BADGE_DEFINITIONS[BadgeType.VOLUME_CRUSHER].points,
    isAchieved: volumeCrusherAchieved,
    completedAt: volumeCrusherAchieved
      ? toLocalYYYYMMDD(sortedUserLogs[sortedUserLogs.length - 1].timestamp)
      : null,
  };

  // Performance goals
  const setPRAchieved = prDetails.length >= 1;
  potentialTrackers.setPR = {
    current: prDetails.length,
    goal: 1,
    text: "Set a new Personal Record",
    points: POINTS_CONFIG.PR_ACHIEVEMENT.points,
    isAchieved: setPRAchieved,
    completedAt: setPRAchieved
      ? toLocalYYYYMMDD(
          prDetails.sort(
            (a, b) =>
              new Date(a.achievedAt).getTime() -
              new Date(b.achievedAt).getTime(),
          )[0].achievedAt,
        )
      : null,
  };

  const beatFriendAchieved = competitiveDetails.length >= 1;
  let beatFriendCompletionDate: string | null = null;
  if (beatFriendAchieved) {
    // Find the earliest log that resulted in a competitive victory
    const competitiveWinLog = sortedUserLogs.find((log) =>
      competitiveDetails.some((cd) => cd.exerciseId === log.exerciseId),
    );
    if (competitiveWinLog) {
      beatFriendCompletionDate = toLocalYYYYMMDD(competitiveWinLog.timestamp);
    }
  }
  potentialTrackers.beatFriend = {
    current: competitiveDetails.length,
    goal: 1,
    text: "Beat a friend's record",
    points: COMPETITIVE_BONUS_CONFIG.TAKEOVER.points,
    isAchieved: beatFriendAchieved,
    completedAt: beatFriendCompletionDate,
  };

  // Advanced Volume/Variety goals
  const maxVarietyInDay = Math.max(0, ...Array.from(exercisesPerDay.values()));
  const varietyAchieved = maxVarietyInDay >= 4;
  potentialTrackers.exerciseVariety = {
    current: maxVarietyInDay,
    goal: 4,
    text: "Daily Exercise Variety (4+ in one day)",
    points: 20, // Custom point value for this goal
    isAchieved: varietyAchieved,
    completedAt: varietyAchieved
      ? toLocalYYYYMMDD(sortedUserLogs[sortedUserLogs.length - 1].timestamp)
      : null,
  };

  const totalVolumeAchieved = exerciseStats.totalExercises >= 15;
  potentialTrackers.totalVolume = {
    current: exerciseStats.totalExercises,
    goal: 15,
    text: "Complete 15 total exercises",
    points: 40, // Custom point value
    isAchieved: totalVolumeAchieved,
    completedAt: totalVolumeAchieved
      ? toLocalYYYYMMDD(
          sortedUserLogs.find((l) => {
            // This is a bit tricky, we need to find the 15th log
            let count = 0;
            for (let i = 0; i < sortedUserLogs.length; i++) {
              count++;
              if (count === 15) return sortedUserLogs[i].timestamp;
            }
            return null;
          })?.timestamp || sortedUserLogs[sortedUserLogs.length - 1].timestamp,
        )
      : null,
  };

  const progressTrackers: ProgressTrackers = potentialTrackers;

  // Calculate total points (include all new point categories)
  const totalPoints = Object.values(pointsBreakdown).reduce(
    (sum, points) => sum + points,
    0,
  );

  return {
    userId: user.id,
    user,
    totalPoints,
    pointsBreakdown,
    rank: 0, // Will be calculated when sorting all participants
    badges,
    workoutDays,
    prDetails,
    improvementDetails, // Add improvement details for non-PR improvements
    competitiveDetails: competitiveDetails,
    exerciseStats,
    progressTrackers, // Add progress trackers to participant object
  };
};

/**
 * Calculate badges earned by a participant
 */
const calculateBadges = (
  user: User,
  userLogs: ExerciseLog[],
  exerciseProgress: Map<string, { hadPR: boolean; improvementPercent: number }>,
  workoutDates: Set<string>,
  categoriesWorked: Set<string>,
  allCategories: Category[],
  allParticipantLogs: ExerciseLog[],
  tournamentStart: string,
  exerciseStats: {
    totalExercises: number;
    uniqueExercises: number;
    averageExercisesPerDay: number;
    coreExercises: number;
    varietyDays: { date: string; exerciseCount: number; bonus: number }[];
  },
): TournamentBadge[] => {
  const badges: TournamentBadge[] = [];
  const now = new Date().toISOString();

  // First PR badge
  const hasPR = Array.from(exerciseProgress.values()).some(
    (progress) => progress.hadPR,
  );
  if (hasPR) {
    badges.push({
      id: `${user.id}-first-pr`,
      type: BadgeType.FIRST_PR,
      ...BADGE_DEFINITIONS[BadgeType.FIRST_PR],
      earnedAt: now,
    });
  }

  // Consistency King (7 days)
  if (workoutDates.size === 7) {
    badges.push({
      id: `${user.id}-consistency-king`,
      type: BadgeType.CONSISTENCY_KING,
      ...BADGE_DEFINITIONS[BadgeType.CONSISTENCY_KING],
      earnedAt: now,
    });
  }

  // Weekend Warrior
  const weekendDays = Array.from(workoutDates).filter((dateStr) => {
    // Parse the YYYY-MM-DD format date string to avoid timezone shifts
    const [year, month, day] = dateStr.split("-").map(Number);
    const date = new Date(year, month - 1, day); // month is 0-indexed
    return isWeekend(date);
  });
  if (weekendDays.length >= 2) {
    badges.push({
      id: `${user.id}-weekend-warrior`,
      type: BadgeType.WEEKEND_WARRIOR,
      ...BADGE_DEFINITIONS[BadgeType.WEEKEND_WARRIOR],
      earnedAt: now,
    });
  }

  // Category Master
  if (categoriesWorked.size >= allCategories.length) {
    badges.push({
      id: `${user.id}-category-master`,
      type: BadgeType.CATEGORY_MASTER,
      ...BADGE_DEFINITIONS[BadgeType.CATEGORY_MASTER],
      earnedAt: now,
    });
  }

  // Perfect Week (PRs + perfect consistency)
  if (hasPR && workoutDates.size === 7) {
    badges.push({
      id: `${user.id}-perfect-week`,
      type: BadgeType.PERFECT_WEEK,
      ...BADGE_DEFINITIONS[BadgeType.PERFECT_WEEK],
      earnedAt: now,
    });
  }

  // Newcomer Bonus (check if this is their first tournament)
  const preTournamentLogs = allParticipantLogs.filter((log) => {
    const logDate = new Date(log.timestamp);
    return log.userId === user.id && logDate < new Date(tournamentStart);
  });

  if (preTournamentLogs.length === 0 && userLogs.length > 0) {
    badges.push({
      id: `${user.id}-newcomer-bonus`,
      type: BadgeType.NEWCOMER_BONUS,
      ...BADGE_DEFINITIONS[BadgeType.NEWCOMER_BONUS],
      earnedAt: now,
    });
  }

  // Volume Crusher (averaged 3.5+ exercises per workout - more achievable)
  if (exerciseStats.averageExercisesPerDay >= 3.5) {
    badges.push({
      id: `${user.id}-volume-crusher`,
      type: BadgeType.VOLUME_CRUSHER,
      ...BADGE_DEFINITIONS[BadgeType.VOLUME_CRUSHER],
      earnedAt: now,
    });
  }

  // Core Destroyer (6+ core exercises this week - more achievable)
  if (exerciseStats.coreExercises >= 6) {
    badges.push({
      id: `${user.id}-core-destroyer`,
      type: BadgeType.CORE_DESTROYER,
      ...BADGE_DEFINITIONS[BadgeType.CORE_DESTROYER],
      earnedAt: now,
    });
  }

  return badges;
};

/**
 * Generate current week tournament
 */
export const generateCurrentTournament = (
  users: User[],
  logs: ExerciseLog[],
  exercises: Exercise[],
  categories: Category[],
): Tournament => {
  const weekDates = getCurrentWeekDates();
  const tournamentId = generateTournamentId(weekDates.start);
  // Calculate participants
  const participants = users.map((user) =>
    calculateTournamentPoints(
      user,
      logs,
      exercises,
      categories,
      weekDates.start,
      weekDates.end,
      logs,
      users,
    ),
  );
  // Sort by total points and assign ranks
  participants.sort((a, b) => b.totalPoints - a.totalPoints);
  participants.forEach((participant, index) => {
    participant.rank = index + 1;
  });

  // Determine tournament status
  const now = new Date();
  const startDate = new Date(weekDates.start);
  const endDate = new Date(weekDates.end);

  let status: Tournament["status"] = "active";
  if (now < startDate) status = "upcoming";
  if (now > endDate) status = "completed";

  return {
    id: tournamentId,
    name: `Week of ${startDate.toLocaleDateString()}`,
    weekStart: weekDates.start,
    weekEnd: weekDates.end,
    status,
    participants,
    type: TournamentType.WEEKLY_GENERAL,
    description: "Weekly tournament for all exercises and categories",
  };
};

/**
 * Get tournament history (previous weeks)
 */
export const generateTournamentHistory = (
  users: User[],
  logs: ExerciseLog[],
  exercises: Exercise[],
  categories: Category[],
  weeksBack: number = 4,
): Tournament[] => {
  const tournaments: Tournament[] = [];
  for (let i = 1; i <= weeksBack; i++) {
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - 7 * i);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1); // Go to Monday
    weekStart.setHours(0, 0, 0, 0);

    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);

    const weekDates = {
      start: weekStart.toISOString(),
      end: weekEnd.toISOString(),
    };

    // Filter logs for this specific week
    const weekLogs = logs.filter((log) => {
      const logDate = new Date(log.timestamp);
      return logDate >= weekStart && logDate <= weekEnd;
    });

    // Only create tournament if there were logs that week
    if (weekLogs.length > 0) {
      const participants = users
        .map((user) =>
          calculateTournamentPoints(
            user,
            logs,
            exercises,
            categories,
            weekDates.start,
            weekDates.end,
            logs,
            users,
          ),
        )
        .filter((participant) => participant.totalPoints > 0);

      if (participants.length > 0) {
        participants.sort((a, b) => b.totalPoints - a.totalPoints);
        participants.forEach((participant, index) => {
          participant.rank = index + 1;
        });

        tournaments.push({
          id: generateTournamentId(weekDates.start),
          name: `Week of ${weekStart.toLocaleDateString()}`,
          weekStart: weekDates.start,
          weekEnd: weekDates.end,
          status: "completed",
          participants,
          type: TournamentType.WEEKLY_GENERAL,
          description: "Weekly tournament for all exercises and categories",
        });
      }
    }
  }
  return tournaments.reverse(); // Most recent first
};

/**
 * Get Duolingo-style countdown text and urgency level
 */
export const getTournamentCountdown = (endDate: string) => {
  const now = new Date();
  const end = new Date(endDate);
  const diffMs = end.getTime() - now.getTime();

  if (diffMs <= 0) {
    return {
      text: "Ended",
      urgency: "ended" as const,
      timeLeft: 0,
    };
  }

  // Determine the start of the week (Monday)
  const weekStart = new Date(end);
  weekStart.setDate(end.getDate() - ((end.getDay() + 6) % 7)); // Monday of the week
  weekStart.setHours(0, 0, 0, 0);

  // Get the current day of the week (0=Sunday, 1=Monday, ... 6=Saturday)
  const nowDay = now.getDay();
  // Get the day of the week for the end date (should be Sunday for a weekly tournament)
  const endDay = end.getDay();

  // Calculate the number of days since the start of the week
  const daysSinceMonday =
    (now.getTime() - weekStart.getTime()) / (1000 * 60 * 60 * 24);

  // Set urgency based on the day of the week (color only, keep text as time left)
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  // Default text logic (numerical)
  let text = "";
  if (diffDays > 1) {
    text = `${diffDays} days`;
  } else if (diffDays === 1) {
    text = "1 day";
  } else if (diffHours > 1) {
    text = `${diffHours} hours`;
  } else if (diffHours === 1) {
    text = "Final hour!";
  } else {
    text = `${diffMinutes} minutes`;
  }

  // Urgency by day of week only (color)
  let urgency: "low" | "medium" | "high" | "critical" | "ended" = "low";
  if (now > end) {
    urgency = "ended";
  } else if (nowDay === 1) {
    // Monday
    urgency = "low";
  } else if (nowDay === 2 || nowDay === 3) {
    // Tuesday, Wednesday
    urgency = "medium";
  } else if (nowDay === 4 || nowDay === 5) {
    // Thursday, Friday
    urgency = "high";
  } else if (nowDay === 6 || nowDay === 0) {
    // Saturday, Sunday
    urgency = "critical";
  }

  return {
    text,
    urgency,
    timeLeft: diffMs,
  };
};

/**
 * Helper: Determine if a PR is meaningful for bonus eligibility
 * - For light exercises (first log < 25 lb): require 20%+ or +2.5 lb
 * - For mid/heavy (first log >= 25 lb): require 10%+ or +5 lb
 */
function isMeaningfulPR({
  previousBest,
  newBest,
  firstLogWeight,
}: {
  previousBest: number;
  newBest: number;
  firstLogWeight: number;
}): boolean {
  const absGain = newBest - previousBest;
  const pctGain =
    previousBest > 0 ? ((newBest - previousBest) / previousBest) * 100 : 0;
  // Use first log to determine weight class
  if (firstLogWeight < 25) {
    // Light: allow high % or +2.5 lb
    return pctGain >= 20 || absGain >= 2.5;
  } else {
    // Mid/Heavy: require 10% or +5 lb
    return pctGain >= 10 || absGain >= 5;
  }
}
