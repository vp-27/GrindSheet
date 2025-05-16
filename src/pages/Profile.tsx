
import React, { useState } from 'react';
import Layout from '@/components/Layout';
import { useAppContext } from '@/context/AppContext';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const Settings: React.FC = () => {
  const { currentUser, exercises, categories, users } = useAppContext();
  const [activeTab, setActiveTab] = useState('profile');
  
  return (
    <Layout title="Settings">
      <div className="flex flex-col gap-6 pb-16">
        <div className="flex flex-col items-center gap-4 mt-4">
          <Avatar className="h-24 w-24">
            <AvatarImage src={currentUser.avatarUrl} alt={currentUser.name} />
            <AvatarFallback className="text-2xl">
              {currentUser.name.substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <h1 className="text-2xl font-bold">{currentUser.name}</h1>
          <div className="text-muted-foreground">@{currentUser.username}</div>
        </div>
        
        <Separator />
        
        <Tabs defaultValue="profile" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-3 mb-6">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="exercises">Exercises</TabsTrigger>
            <TabsTrigger value="categories">Categories</TabsTrigger>
          </TabsList>
          
          <TabsContent value="profile">
            <section>
              <h2 className="font-semibold text-lg mb-2">About the App</h2>
              <p className="text-muted-foreground text-sm mb-6">
                FitTrack helps you and your friends track strength training progress, compete on leaderboards, 
                and visualize gains across different exercises. Simply log your latest weight for each exercise 
                and let the app handle all the stats, history, and rankings.
              </p>
            </section>
          </TabsContent>
          
          <TabsContent value="exercises">
            <section>
              <div className="flex justify-between items-center mb-4">
                <h2 className="font-semibold text-lg">Manage Exercises</h2>
                <Button size="sm" variant="outline">Add Exercise</Button>
              </div>
              
              <div className="grid grid-cols-1 gap-4">
                {categories.map(category => (
                  <Card key={category.id} className="overflow-hidden">
                    <CardHeader className="bg-muted pb-2">
                      <CardTitle className="text-md">{category.name}</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                      {exercises
                        .filter(exercise => exercise.categoryId === category.id)
                        .map(exercise => (
                          <div key={exercise.id} className="p-3 border-b last:border-0 flex justify-between items-center">
                            <div>
                              <div className="font-medium">{exercise.name}</div>
                              {exercise.description && (
                                <div className="text-xs text-muted-foreground">{exercise.description}</div>
                              )}
                            </div>
                            <Button size="sm" variant="ghost">Edit</Button>
                          </div>
                        ))}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          </TabsContent>
          
          <TabsContent value="categories">
            <section>
              <div className="flex justify-between items-center mb-4">
                <h2 className="font-semibold text-lg">Manage Categories</h2>
                <Button size="sm" variant="outline">Add Category</Button>
              </div>
              
              <div className="grid grid-cols-1 gap-4">
                {categories.map(category => (
                  <Card key={category.id} className="overflow-hidden">
                    <CardContent className="p-3 flex justify-between items-center">
                      <div>
                        <div className="font-medium">{category.name}</div>
                        {category.description && (
                          <div className="text-xs text-muted-foreground">{category.description}</div>
                        )}
                      </div>
                      <Button size="sm" variant="ghost">Edit</Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default Settings;
