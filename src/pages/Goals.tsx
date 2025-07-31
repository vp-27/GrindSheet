import React, { useState, useEffect, useMemo } from 'react';
import Layout from '@/components/Layout';
import { Card, CardContent } from '@/components/ui/card';
import { Target, Zap } from 'lucide-react';
import { useAppContext } from '@/context/useAppContext';
import { useAuth } from '@/context/AuthContext';
import { getGoalProgressTrackersForUser, getFriendsSoloPRs } from '@/utils/tournamentUtils';
import ProgressTracker from '@/components/ProgressTracker';
import { ProgressTrackers } from '@/types';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

// Helper to get exercise name from id
function getExerciseName(exerciseId: string, exercises: any[]) {
  const ex = exercises.find(e => e.id === exerciseId);
  return ex ? ex.name : 'Exercise';
}


const GoalsPage: React.FC = () => {
  const { profile } = useAuth();
  const { categories, exercises, exerciseLogs } = useAppContext();
  const [progressTrackers, setProgressTrackers] = useState<ProgressTrackers | null>(null);
  const [friendsToBeat, setFriendsToBeat] = useState<any[]>([]);
  const [showFriendsSection, setShowFriendsSection] = useState(false);

  // Always show goals, even if logs are empty
  useEffect(() => {
    if (profile && exercises && categories) {
      const trackers = getGoalProgressTrackersForUser(profile, exerciseLogs || [], exercises, categories);
      setProgressTrackers(trackers);
    }
  }, [profile, exerciseLogs, exercises, categories]);

  // Get friends to beat (solo PRs)
  useEffect(() => {
    if (profile && exerciseLogs && exercises && categories) {
      const friendsSoloPRs = getFriendsSoloPRs(profile, exerciseLogs, exercises, categories);
      setFriendsToBeat(friendsSoloPRs);
    }
  }, [profile, exerciseLogs, exercises, categories]);

  // Motivational card if no logs
  const showMotivation = !exerciseLogs || exerciseLogs.length === 0;

  // Recent achievements (last 3 logs)
  const recentAchievements = useMemo(() => {
    if (!exerciseLogs || exerciseLogs.length === 0) return [];
    return [...exerciseLogs]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 3)
      .map(log => ({
        ...log,
        exerciseName: getExerciseName(log.exerciseId, exercises)
      }));
  }, [exerciseLogs, exercises]);

  return (
    <Layout title="Goals">
      <div className="flex flex-col gap-6 pb-6">
        {/* Weekly Progress Section - always visible */}
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-4">Your Weekly Progress</h3>
            {progressTrackers && Object.keys(progressTrackers).length > 0 ? (
              <ProgressTracker progressTrackers={progressTrackers} />
            ) : (
              <div className="text-muted-foreground text-center py-8">
                <Target className="w-12 h-12 mx-auto mb-2" />
                <div className="mb-2">No progress yet. Start logging exercises to see your goals here!</div>
                <Button variant="default" className="mt-2" onClick={() => window.location.href = '/'}>
                  Log Exercise
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Friends to Beat Section */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold">Friends to Beat</h3>
              <Button variant="ghost" size="sm" onClick={() => setShowFriendsSection(!showFriendsSection)}>
                {showFriendsSection ? 'Hide' : 'Show'}
              </Button>
            </div>
            {showFriendsSection && (
              friendsToBeat.length > 0 ? (
                <div className="space-y-3">
                  {friendsToBeat.slice(0, 5).map((pr, idx) => (
                    <div key={idx} className="flex items-center justify-between rounded-xl bg-muted/40 p-3">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={pr.friendAvatarUrl} />
                          <AvatarFallback>{pr.friendName?.[0] || '?'}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-semibold">{pr.exerciseName}</div>
                          <div className="text-xs text-muted-foreground">{pr.friendName} PR: <span className="font-bold">{pr.friendPR}</span></div>
                        </div>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => window.location.href = `/exercise-detail?exercise=${pr.exerciseId}`}>Beat This</Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-muted-foreground text-center py-4">No friends to beat right now. Keep pushing!</div>
              )
            )}
          </CardContent>
        </Card>


        {/* Motivational Card if no logs */}
        {showMotivation && (
          <Card>
            <CardContent className="p-12 text-center">
              <Target className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">Ready to start your journey?</h3>
              <p className="text-muted-foreground mb-4">
                Log your first exercise to unlock progress tracking, challenges, and more.
              </p>
              <Button variant="default" onClick={() => window.location.href = '/'}>
                Log Exercise
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Coming Soon Card */}
        <Card>
          <CardContent className="p-12 text-center">
            <Zap className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">More Features Coming Soon</h3>
            <p className="text-muted-foreground">
              Custom goals, challenges, and more are on the way.
            </p>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default GoalsPage; 