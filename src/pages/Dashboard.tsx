import React, { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAppContext } from '@/context/AppContext';
import { useAuth } from '@/context/AuthContext';
import { format } from 'date-fns';

const Dashboard = () => {
  const { categories, exercises, exerciseLogs } = useAppContext();
  const { profile } = useAuth();
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);

  // Filter logs based on selected category
  const filteredLogs = useMemo(() => {
    if (!selectedCategoryId) {
      return exerciseLogs;
    }
    
    const categoryExercises = exercises.filter(
      exercise => exercise.categoryId === selectedCategoryId
    ).map(exercise => exercise.id);
    
    return exerciseLogs.filter(log => 
      categoryExercises.includes(log.exerciseId)
    );
  }, [exerciseLogs, exercises, selectedCategoryId]);

  // Prepare data for the progress chart
  const progressData = useMemo(() => {
    // Use a map to keep track of the best weight for each exercise
    const bestWeights = new Map();
    
    // Process logs to find the best weight for each exercise
    filteredLogs.forEach(log => {
      const currentBest = bestWeights.get(log.exerciseId) || 0;
      if (log.weight > currentBest) {
        bestWeights.set(log.exerciseId, log.weight);
      }
    });
    
    // Transform to the format expected by recharts
    return Array.from(bestWeights.entries()).map(([exerciseId, weight]) => {
      const exercise = exercises.find(e => e.id === exerciseId);
      return {
        name: exercise ? exercise.name : 'Unknown',
        weight: weight as number,
      };
    });
  }, [filteredLogs, exercises]);

  // Get recent logs (last 5)
  const recentLogs = useMemo(() => {
    return filteredLogs.slice(0, 5);
  }, [filteredLogs]);

  // Calculate exercise progress
  const exerciseProgress = useMemo(() => {
    const progress = new Map();
    
    // Group logs by exercise
    filteredLogs.forEach(log => {
      if (!progress.has(log.exerciseId)) {
        progress.set(log.exerciseId, {
          exerciseId: log.exerciseId,
          logs: [],
        });
      }
      
      progress.get(log.exerciseId).logs.push(log);
    });
    
    // Calculate progress for each exercise
    return Array.from(progress.values()).map(item => {
      const exercise = exercises.find(e => e.id === item.exerciseId);
      const sortedLogs = [...item.logs].sort((a, b) => 
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );
      
      const firstLog = sortedLogs[0];
      const lastLog = sortedLogs[sortedLogs.length - 1];
      const progressPercentage = firstLog && lastLog 
        ? ((lastLog.weight - firstLog.weight) / firstLog.weight) * 100
        : 0;
      
      return {
        exerciseId: item.exerciseId,
        exerciseName: exercise?.name || 'Unknown',
        firstWeight: firstLog?.weight || 0,
        currentWeight: lastLog?.weight || 0,
        progressPercentage,
      };
    }).sort((a, b) => b.progressPercentage - a.progressPercentage);
  }, [filteredLogs, exercises]);

  return (
    <Layout title="Dashboard">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold">Welcome, {profile?.name || 'User'}</h1>
          <p className="text-muted-foreground">
            Track your progress and see your strength gains
          </p>
        </div>
        
        <div className="flex gap-2 overflow-x-auto pb-2">
          <Button
            variant={selectedCategoryId === null ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedCategoryId(null)}
          >
            All
          </Button>
          
          {categories.map(category => (
            <Button
              key={category.id}
              variant={selectedCategoryId === category.id ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategoryId(category.id)}
            >
              {category.name}
            </Button>
          ))}
        </div>
        
        <Tabs defaultValue="progress">
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="progress">Progress</TabsTrigger>
            <TabsTrigger value="recent">Recent</TabsTrigger>
            <TabsTrigger value="stats">Stats</TabsTrigger>
          </TabsList>
          
          <TabsContent value="progress">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Strength Progress</CardTitle>
              </CardHeader>
              <CardContent>
                {progressData.length > 0 ? (
                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={progressData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="weight" fill="#8884d8" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="text-center p-8">
                    <p>No exercise data available. Start logging exercises!</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="recent">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Recent Workouts</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {recentLogs.length > 0 ? (
                  recentLogs.map(log => {
                    const exercise = exercises.find(e => e.id === log.exerciseId);
                    const category = categories.find(c => c.id === exercise?.categoryId);
                    
                    return (
                      <div key={log.id} className="p-4 border-b last:border-0">
                        <div className="flex justify-between items-center">
                          <div>
                            <div className="font-medium">{exercise?.name || 'Unknown Exercise'}</div>
                            <div className="text-sm text-muted-foreground">
                              {format(new Date(log.timestamp), 'MMM d, yyyy')}
                              {log.note && <span> - {log.note}</span>}
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            <div className="font-bold">{log.weight} kg</div>
                            {category && (
                              <Badge variant="outline" className="text-xs">
                                {category.name}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center p-8">
                    <p>No recent workouts. Start logging exercises!</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="stats">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Progress Stats</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {exerciseProgress.length > 0 ? (
                  exerciseProgress.map(progress => (
                    <div key={progress.exerciseId} className="p-4 border-b last:border-0">
                      <div className="flex justify-between items-center">
                        <div className="font-medium">{progress.exerciseName}</div>
                        <Badge 
                          variant={progress.progressPercentage > 0 ? "default" : "destructive"}
                          className="text-xs"
                        >
                          {progress.progressPercentage > 0 ? '+' : ''}
                          {progress.progressPercentage.toFixed(1)}%
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">
                        {progress.firstWeight} kg → {progress.currentWeight} kg
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center p-8">
                    <p>No progress data available. Log more exercises to see your progress!</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default Dashboard;
