
import React from 'react';
import Layout from '@/components/Layout';
import { useAppContext } from '@/context/AppContext';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

const Profile: React.FC = () => {
  const { currentUser, setCurrentUser, users } = useAppContext();
  
  const handleSwitchUser = (user: typeof currentUser) => {
    setCurrentUser(user);
  };
  
  return (
    <Layout title="Profile">
      <div className="flex flex-col gap-6">
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
        
        <section>
          <h2 className="font-semibold text-lg mb-4">Switch User</h2>
          <div className="grid grid-cols-1 gap-4">
            {users.filter(user => user.id !== currentUser.id).map(user => (
              <Card key={user.id} onClick={() => handleSwitchUser(user)} className="cursor-pointer hover:bg-accent/10 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={user.avatarUrl} alt={user.name} />
                        <AvatarFallback>
                          {user.name.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{user.name}</div>
                        <div className="text-sm text-muted-foreground">@{user.username}</div>
                      </div>
                    </div>
                    <Button variant="secondary" size="sm">
                      Switch
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
        
        <section>
          <h2 className="font-semibold text-lg mb-2">About the App</h2>
          <p className="text-muted-foreground text-sm">
            FitTrack helps you and your friends track strength training progress, compete on leaderboards, 
            and visualize gains across different exercises. Simply log your latest weight for each exercise 
            and let the app handle all the stats, history, and rankings.
          </p>
        </section>
      </div>
    </Layout>
  );
};

export default Profile;
