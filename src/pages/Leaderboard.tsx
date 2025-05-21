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
import { Medal, Trophy, TrendingUp } from 'lucide-react';

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
          ? 'Select an exercise to view PR Leaders' 
          : `PR Leaders for ${exerciseName}`;
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
            ? "Please select an exercise to view PR Leaders"
            : "No data available for this selection"}
        </div>
      );
    }

    return leaderboardData.map((entry, index) => {
      const rawWeight = entry.value;
      const user = entry.user || { name: 'Unknown', avatarUrl: undefined };
      return (
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
              <AvatarImage src={user.avatarUrl} alt={user.name} />
              <AvatarFallback>
                {user.name?.substring(0, 2).toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            <div>{user.name}</div>
          </div>
          <div className="font-bold">
            {leaderboardType === LeaderboardType.MAX_WEIGHT
              ? `${entry.value.toFixed(1)} lbs`
              : <>
                  {entry.value.toFixed(1)}%{' '}
                  <span className="text-xs text-gray-400 font-normal">({rawWeight.toFixed(1)} lbs)</span>
                </>
            }
          </div>
        </div>
      );
    });
  };
  
  // Generate category leaderboards
  const getCategoryLeaders = () => {
    const categoryLeaders = {};
    
    categories.forEach(category => {
      const leaderData = getLeaderboard(
        allExerciseLogs,
        users,
        leaderboardType,
        undefined,
        category.id
      );
      
      if (leaderData.length > 0) {
        categoryLeaders[category.id] = {
          category,
          leader: leaderData[0]
        };
      }
    });
    
    return categoryLeaders;
  };
  
  // Generate exercise leaderboards for the selected category
  const getExerciseLeaders = () => {
    const exerciseLeaders = {};
    const relevantExercises = selectedCategoryId === 'all' ? exercises : filteredExercises;
    
    relevantExercises.forEach(exercise => {
      const leaderData = getLeaderboard(
        allExerciseLogs,
        users,
        leaderboardType,
        exercise.id
      );
      
      if (leaderData.length > 0 && leaderData[0].value > 0) {
        exerciseLeaders[exercise.id] = {
          exercise,
          leader: leaderData[0]
        };
      }
    });
    
    return exerciseLeaders;
  };
  
  const categoryLeaders = getCategoryLeaders();
  const exerciseLeaders = getExerciseLeaders();

  // Render a compact category leader card, clickable
  const renderCategoryLeaderCard = (categoryId, data) => {
    const { category, leader } = data;
    const rawWeight = leader.value;
    const user = leader.user || { name: 'Unknown', avatarUrl: undefined };
    return (
      <Card
        key={categoryId}
        className="shadow-sm border border-gray-100 cursor-pointer hover:bg-gray-50 transition"
        onClick={() => {
          setSelectedCategoryId(categoryId);
          setSelectedExerciseId('all');
        }}
      >
        <CardContent className="p-3 flex items-center gap-3 sm:gap-4">
          <div className="flex flex-col items-center justify-center">
            <div className="bg-yellow-400 text-gray-900 w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center font-bold text-base sm:text-lg">
              1
            </div>
          </div>
          <Avatar className="h-8 w-8 sm:h-10 sm:w-10">
            <AvatarImage src={user.avatarUrl} alt={user.name} />
            <AvatarFallback>
              {user.name?.substring(0, 2).toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <span className="font-medium truncate block text-sm sm:text-base">{user.name}</span>
            <span className="text-xs text-gray-500 block truncate">{category.name}</span>
          </div>
          <span className="font-bold text-sm sm:text-base whitespace-nowrap">
            {leaderboardType === LeaderboardType.MAX_WEIGHT
              ? `${leader.value.toFixed(1)} lbs`
              : <>
                  {leader.value.toFixed(1)}%{' '}
                  <span className="text-xs text-gray-400 font-normal">({rawWeight.toFixed(1)} lbs)</span>
                </>
            }
          </span>
        </CardContent>
      </Card>
    );
  };

  // Render a compact exercise leader card, clickable
  const renderExerciseLeaderCard = (exerciseId, data) => {
    const { exercise, leader } = data as { exercise: any, leader: any };
    const rawWeight = leader.value;
    const user = leader.user || { name: 'Unknown', avatarUrl: undefined };
    return (
      <div
        key={exerciseId}
        className="flex items-center justify-between py-2 border-b last:border-b-0 cursor-pointer hover:bg-gray-50 px-2 rounded"
        onClick={() => setSelectedExerciseId(exerciseId)}
      >
        <div className="flex items-center gap-2">
          <div className="bg-yellow-400 text-gray-900 w-6 h-6 rounded-full flex items-center justify-center font-bold text-sm">1</div>
          <Avatar className="h-6 w-6">
            <AvatarImage src={user.avatarUrl} />
            <AvatarFallback>
              {user.name?.substring(0, 1) || 'U'}
            </AvatarFallback>
          </Avatar>
          <span className="font-medium text-xs sm:text-sm truncate max-w-[6rem]">{user.name}</span>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-xs text-gray-500 truncate max-w-[6rem]">{exercise.name}</span>
          <span className="font-bold text-xs sm:text-sm">
            {leaderboardType === LeaderboardType.MAX_WEIGHT
              ? `${leader.value.toFixed(1)} lbs`
              : <>
                  {leader.value.toFixed(1)}%{' '}
                  <span className="text-xs text-gray-400 font-normal">({rawWeight.toFixed(1)} lbs)</span>
                </>
            }
          </span>
        </div>
      </div>
    );
  };

  return (
    <Layout title="Rankings">
      <div className="flex flex-col gap-4">
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
              <TabsTrigger value="maxWeight">PR Leaders</TabsTrigger>
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
              
              {/* Category Leaders Section */}
              {selectedCategoryId === 'all' && (
                <>
                  <h2 className="text-lg font-medium text-gray-900">Category Leaders</h2>
                  <div className="grid grid-cols-2 gap-3">
                    {Object.entries(categoryLeaders).map(([categoryId, data]) =>
                      renderCategoryLeaderCard(categoryId, data)
                    )}
                  </div>
                </>
              )}
              
              {/* Exercise Leaders for selected category (if not 'all') */}
              {selectedCategoryId !== 'all' && Object.keys(exerciseLeaders).length > 0 && (
                <>
                  <h3 className="text-base font-medium text-gray-900 mt-2 mb-1">Exercise Leaders</h3>
                  <div className="bg-white rounded shadow-sm border border-gray-100 divide-y">
                    {Object.entries(exerciseLeaders).map(([exerciseId, data]) =>
                      renderExerciseLeaderCard(exerciseId, data as { exercise: any, leader: any })
                    )}
                  </div>
                </>
              )}
              
              {/* Overall Leaderboard */}
              <h2 className="text-lg font-medium text-gray-900">{getLeaderboardTitle()}</h2>
              
              <Card className="shadow-sm border border-gray-100">
                <CardContent className="p-0">
                  {/* If Max Weight and no exercise selected, show all exercise max leaders */}
                  {leaderboardType === LeaderboardType.MAX_WEIGHT && selectedExerciseId === 'all' ? (
                    Object.keys(exerciseLeaders).length > 0 ? (
                      <div className="divide-y">
                        {Object.entries(exerciseLeaders).map(([exerciseId, data]) =>
                          renderExerciseLeaderCard(exerciseId, data as { exercise: any, leader: any })
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        No data available for this selection
                      </div>
                    )
                  ) : (
                    renderLeaderboardEntries()
                  )}
                </CardContent>
              </Card>
            </div>
          </Tabs>
        </div>
      </div>
    </Layout>
  );
};

export default Leaderboard;
