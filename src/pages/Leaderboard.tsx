import React, { useState } from 'react';
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

const Leaderboard: React.FC = () => {
  const { profile } = useAuth();
  const { users, categories, exercises, exerciseLogs } = useAppContext();
  
  const [leaderboardType, setLeaderboardType] = useState<LeaderboardType>(LeaderboardType.MAX_WEIGHT);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all');
  const [selectedExerciseId, setSelectedExerciseId] = useState<string>('all');
  
  // Get filtered exercises based on selected category
  const filteredExercises = selectedCategoryId === 'all'
    ? exercises
    : exercises.filter(e => e.categoryId === selectedCategoryId);
  
  // Use profile data as the only user for now
  // In a real multi-user app, this would come from a users API call
  const users = profile ? [{ 
    id: profile.id,
    name: profile.name,
    username: profile.username,
    avatarUrl: profile.avatar_url
  }] : [];
  
  // Get leaderboard data
  const leaderboardData = getLeaderboard(
    exerciseLogs,
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
  
  return (
    <Layout title="Leaderboard">
      <div className="flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Leaderboards</h1>
        </div>
        
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
                  <SelectTrigger>
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
                  disabled={leaderboardType === LeaderboardType.MAX_WEIGHT && selectedExerciseId === 'all'}
                >
                  <SelectTrigger>
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
            
            <TabsContent value="maxWeight" className="space-y-4">
              {leaderboardType === LeaderboardType.MAX_WEIGHT && selectedExerciseId === 'all' ? (
                <div className="text-center py-8 text-muted-foreground">
                  Please select an exercise to view the max weight leaderboard
                </div>
              ) : leaderboardData.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No data available for this leaderboard
                </div>
              ) : (
                <Card>
                  <CardContent className="p-0">
                    {leaderboardData.map((entry, index) => (
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
                            index === 2 ? "bg-amber-600" : "bg-muted"
                          } text-background font-bold`}>
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
                            ? `${entry.value} lbs`
                            : `${entry.value.toFixed(1)}%`
                          }
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
            </TabsContent>
            
            <TabsContent value="allTimeGain" className="space-y-4">
              {leaderboardData.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No data available for this leaderboard
                </div>
              ) : (
                <Card>
                  <CardContent className="p-0">
                    {leaderboardData.map((entry, index) => (
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
                            index === 2 ? "bg-amber-600" : "bg-muted"
                          } text-background font-bold`}>
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
                          {`${entry.value.toFixed(1)}%`}
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
            </TabsContent>
            
            <TabsContent value="recentGain" className="space-y-4">
              {leaderboardData.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No data available for this leaderboard
                </div>
              ) : (
                <Card>
                  <CardContent className="p-0">
                    {leaderboardData.map((entry, index) => (
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
                            index === 2 ? "bg-amber-600" : "bg-muted"
                          } text-background font-bold`}>
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
                          {`${entry.value.toFixed(1)}%`}
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </Layout>
  );
};

export default Leaderboard;
