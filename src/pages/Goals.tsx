import React, { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { Card, CardContent } from '@/components/ui/card';
import { Target, Zap } from 'lucide-react';
import { useAppContext } from '@/context/useAppContext';
import { useAuth } from '@/context/AuthContext';
import { getGoalProgressTrackersForUser } from '@/utils/tournamentUtils';
import ProgressTracker from '@/components/ProgressTracker';
import { ProgressTrackers } from '@/types';


const GoalsPage: React.FC = () => {
  const { profile } = useAuth();
  const { categories, exercises, exerciseLogs } = useAppContext();
  const [progressTrackers, setProgressTrackers] = useState<ProgressTrackers | null>(null);

  useEffect(() => {
    if (profile && exerciseLogs && exercises && categories) {
      if (exerciseLogs.length > 0 && exercises.length > 0 && categories.length > 0) {
        const trackers = getGoalProgressTrackersForUser(profile, exerciseLogs, exercises, categories);
        setProgressTrackers(trackers);
      }
    }
  }, [profile, exerciseLogs, exercises, categories]);

  return (
    <Layout title="Goals">
      <div className="space-y-6">
        {progressTrackers && Object.keys(progressTrackers).length > 0 ? (
          <Card>
            <CardContent className="p-6">
              <ProgressTracker progressTrackers={progressTrackers} />
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-12 text-center">
              <Target className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">Weekly Goal Progress</h3>
              <p className="text-muted-foreground">
                Log some exercises this week to see your goal progress appear here!
              </p>
            </CardContent>
          </Card>
        )}
        
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