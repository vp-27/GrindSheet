import React, { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { useAppContext } from '@/context/AppContext';
import { LeaderboardType } from '@/types';
import { getLeaderboard } from '@/utils/progressUtils';
import { Card, CardContent } from '@/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Medal, MedalIcon } from 'lucide-react';

const Leaderboard: React.FC = () => {
  const { profile } = useAuth();
  const { categories, exercises, exerciseLogs } = useAppContext();
  
  const [leaderboardType, setLeaderboardType] = useState<LeaderboardType>(LeaderboardType.MAX_WEIGHT);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all');
  const [selectedExerciseId, setSelectedExerciseId] = useState<string>('all');
  const [users, setUsers] = useState<any[]>([]); // Use correct User type if imported
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [allExerciseLogs, setAllExerciseLogs] = useState<any[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(true);

  // Fetch all users (profiles) on mount
  useEffect(() => {
    const fetchUsers = async () => {
      setLoadingUsers(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('id, name, username, avatar_url');
      if (!error && data) {
        setUsers(data.map((u: any) => ({
          id: u.id,
          name: u.name,
          username: u.username,
          avatarUrl: u.avatar_url
        })));
      }
      setLoadingUsers(false);
    };
    fetchUsers();
  }, []);

  // Fetch all exercise logs for leaderboard
  useEffect(() => {
    const fetchLogs = async () => {
      setLoadingLogs(true);
      const { data, error } = await supabase
        .from('exercise_logs')
        .select('*');
      if (!error && data) {
        setAllExerciseLogs(data.map((log: any) => ({
          id: log.id,
          userId: log.user_id,
          exerciseId: log.exercise_id,
          weight: log.weight,
          timestamp: log.timestamp,
          note: log.note,
          weightUnit: log.weight_unit // if you have this field
        })));
      }
      setLoadingLogs(false);
    };
    fetchLogs();
  }, []);

  // Get filtered exercises based on selected category
  const filteredExercises = selectedCategoryId === 'all'
    ? exercises
    : exercises.filter(e => e.categoryId === selectedCategoryId);
  
  // Get leaderboard data
  const leaderboardData = getLeaderboard(
    allExerciseLogs,
    users,
    leaderboardType,
    selectedExerciseId === 'all' ? undefined : selectedExerciseId,
    selectedCategoryId === 'all' ? undefined : selectedCategoryId
  );
  
  // Handle category change
  const handleCategoryChange = (value: string) => {
    setSelectedCategoryId(value);
    
    // If we have an exercise selected but it's not in the new category, clear it
    if (selectedExerciseId !== 'all') {
      const exercise = exercises.find(e => e.id === selectedExerciseId);
      if (exercise && exercise.categoryId !== value && value !== 'all') {
        setSelectedExerciseId('all');
      }
    }
  };

  // Get descriptive stats for the current view
  const getStatsDescription = () => {
    const exerciseName = selectedExerciseId !== 'all' 
      ? exercises.find(e => e.id === selectedExerciseId)?.name
      : 'All Exercises';
      
    const categoryName = selectedCategoryId !== 'all'
      ? categories.find(c => c.id === selectedCategoryId)?.name
      : 'All Categories';
      
    return { exerciseName, categoryName };
  };

  const { exerciseName, categoryName } = getStatsDescription();
  
  // Get title based on leaderboard type
  const getLeaderboardTitle = () => {
    switch(leaderboardType) {
      case LeaderboardType.MAX_WEIGHT:
        return selectedExerciseId === 'all' 
          ? 'Select an exercise to view max weight records' 
          : `Max Weight for ${exerciseName}`;
      case LeaderboardType.ALLTIME_GAIN:
        return `All-time Gains${exerciseName !== 'All Exercises' ? ` - ${exerciseName}` : ''}`;
      case LeaderboardType.RECENT_GAIN:
        return `Recent Gains (30 days)${exerciseName !== 'All Exercises' ? ` - ${exerciseName}` : ''}`;
      default:
        return '';
    }
  };

  // Render leaderboard entries
  const renderLeaderboardEntries = () => {
    if ((leaderboardType === LeaderboardType.MAX_WEIGHT && selectedExerciseId === 'all') || leaderboardData.length === 0) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          {leaderboardType === LeaderboardType.MAX_WEIGHT && selectedExerciseId === 'all'
            ? "Please select an exercise to view max weight records"
            : "No data available for this selection"}
        </div>
      );
    }

    return leaderboardData.map((entry, index) => (
      <div 
        key={entry.userId} 
        className={`flex items-center justify-between p-4 ${
          index !== leaderboardData.length - 1 ? "border-b" : ""
        }`}
      >
        <div className="flex items-center space-x-3">
          <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
            index === 0 ? "bg-yellow-400" :
            index === 1 ? "bg-gray-300" :
            index === 2 ? "bg-amber-600" : "bg-gray-100"
          } ${index < 3 ? "text-gray-900" : "text-gray-500"} font-bold`}>
            {index + 1}
          </div>
          <Avatar className="h-8 w-8">
            <AvatarImage src={entry.user.avatarUrl} alt={entry.user.name} />
            <AvatarFallback>
              {entry.user.name.substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>{entry.user.name}</div>
        </div>
        <div className="font-bold">
          {leaderboardType === LeaderboardType.MAX_WEIGHT
            ? `${entry.value.toFixed(1)} lbs`
            : `${entry.value.toFixed(1)}%`
          }
        </div>
      </div>
    ));
  };
  
  return (
    <Layout title="Rankings">
      <div className="flex flex-col gap-4">
        <Tabs defaultValue="maxWeight" onValueChange={(value) => {
          switch(value) {
            case "maxWeight":
              setLeaderboardType(LeaderboardType.MAX_WEIGHT);
              break;
            case "allTimeGain":
              setLeaderboardType(LeaderboardType.ALLTIME_GAIN);
              break;
            case "recentGain":
              setLeaderboardType(LeaderboardType.RECENT_GAIN);
              break;
          }
        }}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="maxWeight">Max Weight</TabsTrigger>
            <TabsTrigger value="allTimeGain">All-time Gain</TabsTrigger>
            <TabsTrigger value="recentGain">Recent Gain</TabsTrigger>
          </TabsList>
          
          <div className="mt-4 space-y-4">
            {/* Filters */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Select
                  value={selectedCategoryId}
                  onValueChange={handleCategoryChange}
                >
                  <SelectTrigger className="border-gray-200 focus-visible:ring-0 focus-visible:ring-offset-0">
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map(category => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Select
                  value={selectedExerciseId}
                  onValueChange={setSelectedExerciseId}
                >
                  <SelectTrigger className="border-gray-200 focus-visible:ring-0 focus-visible:ring-offset-0">
                    <SelectValue placeholder="Select Exercise" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Exercises</SelectItem>
                    {filteredExercises.map(exercise => (
                      <SelectItem key={exercise.id} value={exercise.id}>
                        {exercise.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {/* Title with dynamic content */}
            <h2 className="text-lg font-medium text-gray-900">{getLeaderboardTitle()}</h2>
            
            {/* Leaderboard Card */}
            <Card className="shadow-sm border border-gray-100">
              <CardContent className="p-0">
                {renderLeaderboardEntries()}
              </CardContent>
            </Card>
          </div>
        </Tabs>
      </div>
    </Layout>
  );
};

export default Leaderboard;
