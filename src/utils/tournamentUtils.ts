import { 
  Tournament, 
  TournamentParticipant, 
  TournamentBadge, 
  BadgeType, 
  TournamentType, 
  PointsRule,
  ExerciseLog, 
  User, 
  Exercise, 
  Category,
  PRDetail
} from '../types';
import { calculateProgress } from './progressUtils';

// --- Revamped Point System ---
// Points configuration for different actions
export const POINTS_CONFIG: Record<string, PointsRule> = {
  PR_ACHIEVEMENT: {
    type: 'pr_achievement',
    points: 75,
    description: 'New personal record'
  },
  DAILY_WORKOUT: {
    type: 'daily_workout', 
    points: 15,
    description: 'Complete a workout'
  },
  IMPROVEMENT_PERCENT: {
    type: 'improvement_percent',
    points: 2,
    description: 'Points per 1% improvement',
    multiplier: 1
  },
  CONSISTENCY_BONUS: {
    type: 'consistency_bonus',
    points: 60,
    description: '5+ workout days in a week'
  },
  WEEKEND_BONUS: {
    type: 'weekend_bonus',
    points: 10,
    description: 'Extra points for weekend workouts',
    multiplier: 2
  },
  CATEGORY_COMPLETION: {
    type: 'category_completion',
    points: 40,
    description: 'Work all muscle groups in a week'
  }
};

// Badge definitions
export const BADGE_DEFINITIONS: Record<BadgeType, { name: string; description: string; points: number }> = {
  [BadgeType.FIRST_PR]: {
    name: 'First PR',
    description: 'First personal record of the tournament',
    points: 25
  },
  [BadgeType.CONSISTENCY_KING]: {
    name: 'Consistency King',
    description: 'Worked out every day this week',
    points: 50
  },
  [BadgeType.IMPROVEMENT_STAR]: {
    name: 'Improvement Star', 
    description: 'Highest improvement percentage',
    points: 35
  },
  [BadgeType.WEEKEND_WARRIOR]: {
    name: 'Weekend Warrior',
    description: 'Worked out both weekend days',
    points: 20
  },
  [BadgeType.CATEGORY_MASTER]: {
    name: 'Category Master',
    description: 'Worked every muscle group',
    points: 30
  },
  [BadgeType.NEWCOMER_BONUS]: {
    name: 'Newcomer Bonus',
    description: 'First tournament participation',
    points: 40
  },
  [BadgeType.PERFECT_WEEK]: {
    name: 'Perfect Week',
    description: 'Achieved PRs and perfect consistency',
    points: 100
  }
};

// Competitive bonus configuration
export const COMPETITIVE_BONUS_CONFIG = {
  TAKEOVER: { points: 20, description: 'Takeover: Beat another user\'s PR' },
  CLOSE_WIN: { points: 10, description: 'Close Win: Beat another user by <5%' },
  FIRST_TIME_PR: { points: 10, description: 'First time PR (first log for exercise)' },
  IMPROVEMENT_CAP: 50 // max improvement points per exercise per week
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
    end: sunday.toISOString()
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
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
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
  allUsers: User[] = []
): TournamentParticipant => {
  const startDate = new Date(tournamentStart);
  const endDate = new Date(tournamentEnd);
  
  // Filter logs for this user and tournament period
  const userLogs = logs.filter(log => {
    const logDate = new Date(log.timestamp);
    return log.userId === user.id && 
           logDate >= startDate && 
           logDate <= endDate;
  });

  // Initialize points breakdown
  let pointsBreakdown = {
    prPoints: 0,
    consistencyPoints: 0,
    improvementPoints: 0,
    participationPoints: 0,
    bonusPoints: 0,
    competitivePoints: 0
  };

  let badges: TournamentBadge[] = [];
  let workoutDays: string[] = [];

  // Track workout days (use local timezone to avoid date shifts)
  const workoutDates = new Set(userLogs.map(log => {
    const logDate = new Date(log.timestamp);
    const year = logDate.getFullYear();
    const month = String(logDate.getMonth() + 1).padStart(2, '0');
    const day = String(logDate.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }));
  workoutDays = Array.from(workoutDates);

  // 1. Daily workout points
  pointsBreakdown.participationPoints = workoutDates.size * POINTS_CONFIG.DAILY_WORKOUT.points;

  // 2. Weekend bonus points
  let weekendWorkouts = 0;
  userLogs.forEach(log => {
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
  const exerciseProgress = new Map<string, { hadPR: boolean; improvementPercent: number }>();
  const prDetails: PRDetail[] = [];
  const competitiveDetails: { exerciseId: string; type: string; targetUser?: string; points: number; }[] = [];
  exercises.forEach(exercise => {
    const exerciseLogs = logs.filter(log => log.exerciseId === exercise.id);
    const userExerciseLogs = exerciseLogs.filter(log => log.userId === user.id);
    if (userExerciseLogs.length === 0) return;
    const progress = calculateProgress(exerciseLogs, exercise.id, exercise);
    // Tournament logs for this exercise
    const tournamentExerciseLogs = userExerciseLogs.filter(log => {
      const logDate = new Date(log.timestamp);
      return logDate >= startDate && logDate <= endDate;
    });
    if (tournamentExerciseLogs.length > 0) {
      const maxTournamentWeight = Math.max(...tournamentExerciseLogs.map(log => log.weight));
      const preTournamentLogs = userExerciseLogs.filter(log => {
        const logDate = new Date(log.timestamp);
        return logDate < startDate;
      });
      // --- PR LOGIC ---
      let achievedPR = false;
      if (preTournamentLogs.length > 0) {
        const previousBest = Math.max(...preTournamentLogs.map(log => log.weight));
        // PR achieved if tournament weight exceeds previous best
        if (maxTournamentWeight > previousBest) {
          achievedPR = true;
          pointsBreakdown.prPoints += POINTS_CONFIG.PR_ACHIEVEMENT.points;
          const improvementPercent = ((maxTournamentWeight - previousBest) / previousBest) * 100;
          // Cap improvement points per exercise
          const improvementPoints = Math.min(
            Math.floor(improvementPercent * POINTS_CONFIG.IMPROVEMENT_PERCENT.points),
            COMPETITIVE_BONUS_CONFIG.IMPROVEMENT_CAP
          );
          pointsBreakdown.improvementPoints += improvementPoints;
          exerciseProgress.set(exercise.id, { hadPR: true, improvementPercent });
          // Find the exact log where the PR was achieved
          const prLog = tournamentExerciseLogs.find(log => log.weight === maxTournamentWeight);
          prDetails.push({
            exerciseId: exercise.id,
            exerciseName: exercise.name,
            weight: maxTournamentWeight,
            previousBest,
            achievedAt: prLog?.timestamp || tournamentExerciseLogs[0].timestamp,
            improvementPercent
          });
        }
      } else {
        // First log for this exercise (not a PR)
        pointsBreakdown.bonusPoints += COMPETITIVE_BONUS_CONFIG.FIRST_TIME_PR.points;
        // Do NOT add to prDetails or count as PR
      }
      // --- COMPETITIVE BONUS LOGIC ---
      // Award if achievedPR OR if it's a newcomer's first time with this exercise
      if (achievedPR || preTournamentLogs.length === 0) {
        allUsers.forEach(otherUser => {
          if (otherUser.id === user.id) return;
          const otherLogs = exerciseLogs.filter(log => log.userId === otherUser.id && new Date(log.timestamp) <= endDate);
          if (otherLogs.length === 0) return;
          const otherBest = Math.max(...otherLogs.map(log => log.weight));
          if (maxTournamentWeight > otherBest) {
            // Takeover bonus
            pointsBreakdown.competitivePoints = (pointsBreakdown.competitivePoints || 0) + COMPETITIVE_BONUS_CONFIG.TAKEOVER.points;
            competitiveDetails.push({ exerciseId: exercise.id, exerciseName: exercise.name, type: 'Takeover', targetUser: otherUser.name, points: COMPETITIVE_BONUS_CONFIG.TAKEOVER.points });
            // Close win bonus
            if ((maxTournamentWeight - otherBest) / otherBest < 0.05) {
              pointsBreakdown.competitivePoints += COMPETITIVE_BONUS_CONFIG.CLOSE_WIN.points;
              competitiveDetails.push({ exerciseId: exercise.id, exerciseName: exercise.name, type: 'Close Win', targetUser: otherUser.name, points: COMPETITIVE_BONUS_CONFIG.CLOSE_WIN.points });
            }
          }
        });
      }
    }
  });

  // 5. Category completion bonus
  const categoriesWorked = new Set(
    userLogs.map(log => {
      const exercise = exercises.find(ex => ex.id === log.exerciseId);
      return exercise?.categoryId;
    }).filter(Boolean)
  );
  
  if (categoriesWorked.size >= categories.length) {
    pointsBreakdown.bonusPoints += POINTS_CONFIG.CATEGORY_COMPLETION.points;
  }

  // 6. Calculate badges
  badges = calculateBadges(user, userLogs, exerciseProgress, workoutDates, categoriesWorked, categories, allParticipantLogs, tournamentStart);
  // Add badge points to bonus
  pointsBreakdown.bonusPoints += badges.reduce((sum, badge) => sum + badge.points, 0);
  // Calculate total points (include competitivePoints)
  const totalPoints = Object.values(pointsBreakdown).reduce((sum, points) => sum + points, 0);
  // Ensure all competitiveDetails have exerciseName (for type safety)
  const competitiveDetailsWithName = competitiveDetails.map(cd => ({
    exerciseId: cd.exerciseId,
    exerciseName: cd.exerciseName || (exercises.find(e => e.id === cd.exerciseId)?.name ?? ''),
    type: cd.type,
    targetUser: cd.targetUser,
    points: cd.points
  }));
  return {
    userId: user.id,
    user,
    totalPoints,
    pointsBreakdown,
    rank: 0, // Will be calculated when sorting all participants
    badges,
    workoutDays,
    prDetails,
    competitiveDetails: competitiveDetailsWithName
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
  tournamentStart: string
): TournamentBadge[] => {
  const badges: TournamentBadge[] = [];
  const now = new Date().toISOString();

  // First PR badge
  const hasPR = Array.from(exerciseProgress.values()).some(progress => progress.hadPR);
  if (hasPR) {
    badges.push({
      id: `${user.id}-first-pr`,
      type: BadgeType.FIRST_PR,
      ...BADGE_DEFINITIONS[BadgeType.FIRST_PR],
      earnedAt: now
    });
  }

  // Consistency King (7 days)
  if (workoutDates.size === 7) {
    badges.push({
      id: `${user.id}-consistency-king`,
      type: BadgeType.CONSISTENCY_KING,
      ...BADGE_DEFINITIONS[BadgeType.CONSISTENCY_KING],
      earnedAt: now
    });
  }

  // Weekend Warrior
  const weekendDays = Array.from(workoutDates).filter(dateStr => {
    // Parse the YYYY-MM-DD format date string to avoid timezone shifts
    const [year, month, day] = dateStr.split('-').map(Number);
    const date = new Date(year, month - 1, day); // month is 0-indexed
    return isWeekend(date);
  });
  if (weekendDays.length >= 2) {
    badges.push({
      id: `${user.id}-weekend-warrior`,
      type: BadgeType.WEEKEND_WARRIOR,
      ...BADGE_DEFINITIONS[BadgeType.WEEKEND_WARRIOR],
      earnedAt: now
    });
  }

  // Category Master
  if (categoriesWorked.size >= allCategories.length) {
    badges.push({
      id: `${user.id}-category-master`,
      type: BadgeType.CATEGORY_MASTER,
      ...BADGE_DEFINITIONS[BadgeType.CATEGORY_MASTER],
      earnedAt: now
    });
  }

  // Perfect Week (PRs + perfect consistency)
  if (hasPR && workoutDates.size === 7) {
    badges.push({
      id: `${user.id}-perfect-week`,
      type: BadgeType.PERFECT_WEEK,
      ...BADGE_DEFINITIONS[BadgeType.PERFECT_WEEK],
      earnedAt: now
    });
  }

  // Newcomer Bonus (check if this is their first tournament)
  const preTournamentLogs = allParticipantLogs.filter(log => {
    const logDate = new Date(log.timestamp);
    return log.userId === user.id && logDate < new Date(tournamentStart);
  });
  
  if (preTournamentLogs.length === 0 && userLogs.length > 0) {
    badges.push({
      id: `${user.id}-newcomer-bonus`,
      type: BadgeType.NEWCOMER_BONUS,
      ...BADGE_DEFINITIONS[BadgeType.NEWCOMER_BONUS],
      earnedAt: now
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
  categories: Category[]
): Tournament => {
  const weekDates = getCurrentWeekDates();
  const tournamentId = generateTournamentId(weekDates.start);
  // Calculate participants
  const participants = users.map(user => 
    calculateTournamentPoints(user, logs, exercises, categories, weekDates.start, weekDates.end, logs, users)
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
  
  let status: Tournament['status'] = 'active';
  if (now < startDate) status = 'upcoming';
  if (now > endDate) status = 'completed';

  return {
    id: tournamentId,
    name: `Week of ${startDate.toLocaleDateString()}`,
    weekStart: weekDates.start,
    weekEnd: weekDates.end,
    status,
    participants,
    type: TournamentType.WEEKLY_GENERAL,
    description: 'Weekly tournament for all exercises and categories'
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
  weeksBack: number = 4
): Tournament[] => {
  const tournaments: Tournament[] = [];
  for (let i = 1; i <= weeksBack; i++) {
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - (7 * i));
    weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1); // Go to Monday
    weekStart.setHours(0, 0, 0, 0);
    
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);
    
    const weekDates = {
      start: weekStart.toISOString(),
      end: weekEnd.toISOString()
    };
    
    // Filter logs for this specific week
    const weekLogs = logs.filter(log => {
      const logDate = new Date(log.timestamp);
      return logDate >= weekStart && logDate <= weekEnd;
    });
    
    // Only create tournament if there were logs that week
    if (weekLogs.length > 0) {
      const participants = users.map(user => 
        calculateTournamentPoints(user, logs, exercises, categories, weekDates.start, weekDates.end, logs, users)
      ).filter(participant => participant.totalPoints > 0);
      
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
          status: 'completed',
          participants,
          type: TournamentType.WEEKLY_GENERAL,
          description: 'Weekly tournament for all exercises and categories'
        });
      }
    }
  }
  return tournaments.reverse(); // Most recent first
};
