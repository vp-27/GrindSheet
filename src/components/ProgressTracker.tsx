import React from 'react';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ProgressTrackers, ProgressTrackerData } from '@/types';
import { 
  Calendar, 
  Target, 
  Zap, 
  Activity, 
  Award,
  CheckCircle2,
  TrendingUp,
  Trophy,
  Users,
  CheckCircle
} from 'lucide-react';

interface ProgressTrackerProps {
  progressTrackers: ProgressTrackers;
}

const getTrackerIcon = (key: string) => {
  switch (key) {
    case 'consistency':
      return <Calendar className="w-6 h-6 text-blue-500" />;
    case 'categoryCompletion':
      return <Target className="w-6 h-6 text-emerald-500" />;
    case 'weekendWarrior':
      return <Zap className="w-6 h-6 text-yellow-500" />;
    case 'coreDestroyer':
      return <Activity className="w-6 h-6 text-red-500" />;
    case 'volumeCrusher':
      return <Award className="w-6 h-6 text-purple-500" />;
    case 'dailyWorkout':
      return <CheckCircle className="w-6 h-6 text-sky-500" />;
    case 'setPR':
      return <Trophy className="w-6 h-6 text-amber-500" />;
    case 'beatFriend':
      return <Users className="w-6 h-6 text-orange-500" />;
    case 'exerciseVariety':
      return <Zap className="w-6 h-6 text-teal-500" />;
    case 'totalVolume':
      return <TrendingUp className="w-6 h-6 text-indigo-500" />;
    default:
      return <TrendingUp className="w-6 h-6 text-gray-500" />;
  }
};

const getTrackerColorClass = (key: keyof ProgressTrackers | string): string => {
  switch (key) {
    case 'consistency': return 'bg-blue-500';
    case 'categoryCompletion': return 'bg-green-500';
    case 'weekendWarrior': return 'bg-yellow-500';
    case 'coreDestroyer': return 'bg-red-500';
    case 'volumeCrusher': return 'bg-purple-500';
    case 'dailyWorkout': return 'bg-sky-500';
    case 'setPR': return 'bg-amber-500';
    case 'beatFriend': return 'bg-orange-500';
    case 'exerciseVariety': return 'bg-teal-500';
    case 'totalVolume': return 'bg-indigo-500';
    default: return 'bg-gray-500';
  }
};

const TrackerItem: React.FC<{ trackerKey: string, tracker: ProgressTrackerData }> = ({ trackerKey, tracker }) => {
  const progressPercentage = tracker.goal > 0 ? Math.min((tracker.current / tracker.goal) * 100, 100) : 0;
  
  return (
    <div className="flex items-center gap-4 py-3">
      <div className="flex-shrink-0">
        {getTrackerIcon(trackerKey as keyof ProgressTrackers)}
      </div>
      <div className="flex-1">
        <div className="flex justify-between items-center mb-1">
          <p className="font-semibold text-sm text-foreground">{tracker.text}</p>
          {tracker.isAchieved ? (
            <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
              <span className="font-bold text-sm">+{tracker.points} pts</span>
            </div>
          ) : (
            <span className="font-semibold text-sm text-muted-foreground">+{tracker.points} pts</span>
          )}
        </div>
        <Progress 
          value={progressPercentage} 
          className="h-2 rounded-full bg-slate-200 dark:bg-slate-700"
          indicatorClassName={getTrackerColorClass(trackerKey)}
        />
        <div className="flex justify-between items-center mt-1">
          <p className="text-xs text-muted-foreground">{tracker.isAchieved ? 'Completed!' : 'In Progress...'}</p>
          <p className="text-xs font-medium text-muted-foreground">
            {tracker.current.toFixed(1)} / {tracker.goal.toFixed(1)}
          </p>
        </div>
      </div>
    </div>
  );
};

const ProgressTracker: React.FC<ProgressTrackerProps> = ({ progressTrackers }) => {
  if (!progressTrackers) {
    return null;
  }

  const trackerOrder: (keyof ProgressTrackers)[] = [
    'consistency',
    'volumeCrusher',
    'categoryCompletion',
    'coreDestroyer',
    'weekendWarrior',
  ];

  const today = new Date();
  const dayOfWeek = today.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

  const possibleTrackers = progressTrackers ? Object.entries(progressTrackers)
    .filter(([key, tracker]) => {
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const day = String(today.getDate()).padStart(2, '0');
      const todayStr = `${year}-${month}-${day}`;

      // If a goal is achieved, only show it on the day it was completed.
      if (tracker.isAchieved) {
        return tracker.completedAt === todayStr;
      }

      // Filter out Weekend Warrior if it's a weekday.
      if (key === 'weekendWarrior' && !isWeekend) {
        return false;
      }

      // Filter out consistency goal if it's mathematically impossible.
      if (key === 'consistency') {
        const daysRemainingMap: { [key: number]: number } = { 0: 1, 1: 7, 2: 6, 3: 5, 4: 4, 5: 3, 6: 2 }; // Sun:1, Mon:7...
        const daysRemaining = daysRemainingMap[dayOfWeek];
        const workoutsNeeded = tracker.goal - tracker.current;
        if (workoutsNeeded > 0 && workoutsNeeded > daysRemaining) {
          return false;
        }
      }

      // All other unachieved goals are considered possible.
      return true;
    }) : [];

  const trackersToShow = possibleTrackers
    .sort(([keyA, a], [keyB, b]) => {
      if (a.isAchieved !== b.isAchieved) {
        return a.isAchieved ? 1 : -1;
      }
      return b.points - a.points;
    })
    .slice(0, 5);

  return (
    <div id="progress-tracker-section" className="space-y-3">
      <h4 className="font-bold text-foreground flex items-center gap-2 text-base">
        <TrendingUp className="h-5 w-5 text-purple-600" />
        Goal Progress
      </h4>
      <div className="divide-y divide-border/50">
        {trackersToShow.map(([key, tracker]) => (
          <TrackerItem key={key} trackerKey={key} tracker={tracker} />
        ))}
      </div>
    </div>
  );
};

export default ProgressTracker; 