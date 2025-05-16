
import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import Layout from '@/components/Layout';
import { useAppContext } from '@/context/AppContext';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { format } from 'date-fns';

const History: React.FC = () => {
  const { currentUser, exercises, exerciseLogs, categories } = useAppContext();
  const [searchParams] = useSearchParams();
  const exerciseParam = searchParams.get('exercise');
  const [selectedExerciseId, setSelectedExerciseId] = useState<string>(exerciseParam || 'all');
  
  useEffect(() => {
    if (exerciseParam) {
      setSelectedExerciseId(exerciseParam);
    }
  }, [exerciseParam]);
  
  // Filter logs for the current user
  const userLogs = exerciseLogs.filter(log => log.userId === currentUser.id);
  
  // Filter logs by selected exercise if any
  const filteredLogs = selectedExerciseId === 'all'
    ? userLogs
    : userLogs.filter(log => log.exerciseId === selectedExerciseId);
  
  // Sort logs by timestamp (newest first)
  const sortedLogs = [...filteredLogs].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
  
  // Group logs by date
  const groupedLogs: { [date: string]: typeof sortedLogs } = {};
  
  sortedLogs.forEach(log => {
    const date = format(new Date(log.timestamp), 'yyyy-MM-dd');
    if (!groupedLogs[date]) {
      groupedLogs[date] = [];
    }
    groupedLogs[date].push(log);
  });
  
  return (
    <Layout title="History">
      <div className="flex flex-col gap-4 pb-16">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Exercise History</h1>
        </div>
        
        {/* Exercise Filter */}
        <Select
          value={selectedExerciseId}
          onValueChange={setSelectedExerciseId}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Filter by exercise" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Exercises</SelectItem>
            {categories.map(category => (
              <React.Fragment key={category.id}>
                <SelectItem value={`category-${category.id}`} className="font-semibold bg-muted" disabled>
                  {category.name}
                </SelectItem>
                {exercises
                  .filter(ex => ex.categoryId === category.id)
                  .map(exercise => (
                    <SelectItem key={exercise.id} value={exercise.id}>
                      {exercise.name}
                    </SelectItem>
                  ))}
              </React.Fragment>
            ))}
          </SelectContent>
        </Select>
        
        {/* History List */}
        <div className="space-y-4">
          {Object.keys(groupedLogs).length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No exercise logs found
            </div>
          ) : (
            Object.entries(groupedLogs).map(([date, logs]) => (
              <div key={date} className="space-y-2">
                <h3 className="font-medium text-sm text-muted-foreground">
                  {format(new Date(date), 'EEEE, MMMM d, yyyy')}
                </h3>
                
                <Card>
                  <CardContent className="p-0">
                    {logs.map((log, index) => {
                      const exercise = exercises.find(e => e.id === log.exerciseId);
                      return (
                        <React.Fragment key={log.id}>
                          <div className="p-4">
                            <div className="flex justify-between items-start">
                              <div>
                                <div className="font-medium">{exercise?.name}</div>
                                <div className="text-sm text-muted-foreground">
                                  {format(new Date(log.timestamp), 'h:mm a')}
                                </div>
                              </div>
                              <div className="font-bold">{log.weight} lbs</div>
                            </div>
                            
                            {log.note && (
                              <div className="mt-2 text-sm text-muted-foreground italic">
                                "{log.note}"
                              </div>
                            )}
                          </div>
                          {index < logs.length - 1 && <Separator />}
                        </React.Fragment>
                      );
                    })}
                  </CardContent>
                </Card>
              </div>
            ))
          )}
        </div>
      </div>
    </Layout>
  );
};

export default History;
