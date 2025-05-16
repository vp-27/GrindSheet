
import React, { useState } from 'react';
import { format } from 'date-fns';
import Layout from '@/components/Layout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar } from 'lucide-react';
import { useAppContext } from '@/context/AppContext';
import { useAuth } from '@/context/AuthContext';

const History = () => {
  const { exerciseLogs, exercises, categories } = useAppContext();
  const { profile } = useAuth();
  
  // Group logs by date
  const logsByDate = React.useMemo(() => {
    const grouped = {};
    
    exerciseLogs.forEach(log => {
      const date = format(new Date(log.timestamp), 'yyyy-MM-dd');
      
      if (!grouped[date]) {
        grouped[date] = [];
      }
      
      grouped[date].push(log);
    });
    
    return grouped;
  }, [exerciseLogs]);
  
  // Sort dates in descending order
  const sortedDates = React.useMemo(() => {
    return Object.keys(logsByDate).sort((a, b) => {
      return new Date(b).getTime() - new Date(a).getTime();
    });
  }, [logsByDate]);
  
  // Find exercise and category names
  const getExerciseName = (exerciseId) => {
    const exercise = exercises.find(e => e.id === exerciseId);
    return exercise?.name || 'Unknown Exercise';
  };
  
  const getCategoryForExercise = (exerciseId) => {
    const exercise = exercises.find(e => e.id === exerciseId);
    if (!exercise) return null;
    
    const category = categories.find(c => c.id === exercise.categoryId);
    return category;
  };

  return (
    <Layout title="History">
      <div className="flex flex-col gap-6">
        <h1 className="text-2xl font-bold">Workout History</h1>
        
        {sortedDates.length === 0 && (
          <div className="text-center p-8 border rounded">
            <p>No workout history found. Start logging exercises to see your history!</p>
          </div>
        )}
        
        {sortedDates.map(date => (
          <div key={date} className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <h2 className="font-semibold">
                {format(new Date(date), 'EEEE, MMMM d, yyyy')}
              </h2>
            </div>
            
            <Card>
              {logsByDate[date].map(log => {
                const exerciseName = getExerciseName(log.exerciseId);
                const category = getCategoryForExercise(log.exerciseId);
                
                return (
                  <CardContent key={log.id} className="p-4 border-b last:border-0">
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="font-medium">{exerciseName}</div>
                        <div className="text-sm text-muted-foreground">
                          {format(new Date(log.timestamp), 'h:mm a')}
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
                  </CardContent>
                );
              })}
            </Card>
          </div>
        ))}
      </div>
    </Layout>
  );
};

export default History;
