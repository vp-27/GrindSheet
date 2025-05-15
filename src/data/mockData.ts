
import { User, Category, Exercise, ExerciseLog } from '../types';

export const users: User[] = [
  {
    id: '1',
    name: 'John Smith',
    username: 'johnsmith',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=John'
  },
  {
    id: '2',
    name: 'Jane Doe',
    username: 'janedoe',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Jane'
  },
  {
    id: '3',
    name: 'Mike Johnson',
    username: 'mikej',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Mike'
  },
  {
    id: '4',
    name: 'Sarah Williams',
    username: 'sarahw',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah'
  }
];

export const categories: Category[] = [
  {
    id: '1',
    name: 'Chest',
    description: 'Chest exercises'
  },
  {
    id: '2',
    name: 'Back',
    description: 'Back exercises'
  },
  {
    id: '3',
    name: 'Legs',
    description: 'Leg exercises'
  },
  {
    id: '4',
    name: 'Shoulders',
    description: 'Shoulder exercises'
  },
  {
    id: '5',
    name: 'Arms',
    description: 'Arm exercises'
  },
  {
    id: '6',
    name: 'Core',
    description: 'Core exercises'
  }
];

export const exercises: Exercise[] = [
  {
    id: '1',
    name: 'Bench Press',
    categoryId: '1',
    description: 'Barbell bench press'
  },
  {
    id: '2',
    name: 'Incline Bench Press',
    categoryId: '1',
    description: 'Incline barbell bench press'
  },
  {
    id: '3',
    name: 'Deadlift',
    categoryId: '2',
    description: 'Conventional deadlift'
  },
  {
    id: '4',
    name: 'Pull-ups',
    categoryId: '2',
    description: 'Bodyweight pull-ups'
  },
  {
    id: '5',
    name: 'Squat',
    categoryId: '3',
    description: 'Barbell back squat'
  },
  {
    id: '6',
    name: 'Leg Press',
    categoryId: '3',
    description: 'Machine leg press'
  },
  {
    id: '7',
    name: 'Overhead Press',
    categoryId: '4',
    description: 'Barbell overhead press'
  },
  {
    id: '8',
    name: 'Lateral Raises',
    categoryId: '4',
    description: 'Dumbbell lateral raises'
  },
  {
    id: '9',
    name: 'Bicep Curls',
    categoryId: '5',
    description: 'Dumbbell bicep curls'
  },
  {
    id: '10',
    name: 'Tricep Extensions',
    categoryId: '5',
    description: 'Cable tricep extensions'
  },
  {
    id: '11',
    name: 'Planks',
    categoryId: '6',
    description: 'Static plank hold'
  },
  {
    id: '12',
    name: 'Russian Twists',
    categoryId: '6',
    description: 'Weighted Russian twists'
  }
];

// Generate mock exercise logs
const generateMockLogs = (): ExerciseLog[] => {
  const logs: ExerciseLog[] = [];
  const now = new Date();
  
  // For each user
  users.forEach(user => {
    // For each exercise
    exercises.forEach(exercise => {
      // Create 1-5 logs per exercise
      const logCount = Math.floor(Math.random() * 5) + 1;
      let baseWeight = Math.floor(Math.random() * 100) + 50; // Random starting weight
      
      for (let i = 0; i < logCount; i++) {
        // Each log is between 1-10 days apart
        const daysAgo = i * (Math.floor(Math.random() * 10) + 1);
        const logDate = new Date(now);
        logDate.setDate(logDate.getDate() - daysAgo);
        
        // Weight increases by 0-10% each time
        if (i > 0) {
          const increase = baseWeight * (Math.random() * 0.1);
          baseWeight += increase;
        }
        
        logs.push({
          id: `${user.id}-${exercise.id}-${i}`,
          userId: user.id,
          exerciseId: exercise.id,
          weight: Math.round(baseWeight),
          timestamp: logDate.toISOString(),
          note: i === 0 ? 'Starting weight' : 
                i === logCount - 1 ? 'Latest session, felt good!' : 
                Math.random() > 0.7 ? 'Good progress' : undefined
        });
      }
    });
  });
  
  return logs;
};

export const exerciseLogs: ExerciseLog[] = generateMockLogs();

export const getExercisesByCategory = (categoryId: string): Exercise[] => {
  return exercises.filter(exercise => exercise.categoryId === categoryId);
};

export const getExerciseById = (exerciseId: string): Exercise | undefined => {
  return exercises.find(exercise => exercise.id === exerciseId);
};

export const getCategoryById = (categoryId: string): Category | undefined => {
  return categories.find(category => category.id === categoryId);
};

export const getUserById = (userId: string): User | undefined => {
  return users.find(user => user.id === userId);
};

export const getLogsByExerciseAndUser = (exerciseId: string, userId: string): ExerciseLog[] => {
  return exerciseLogs
    .filter(log => log.exerciseId === exerciseId && log.userId === userId)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
};

export const getLogsByUser = (userId: string): ExerciseLog[] => {
  return exerciseLogs
    .filter(log => log.userId === userId)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
};
