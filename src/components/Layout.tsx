
import React, { useState } from 'react';
import { Home, Trophy, History, User, Plus, Settings } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAppContext } from '@/context/AppContext';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface LayoutProps {
  children: React.ReactNode;
  title?: string;
}

const Layout: React.FC<LayoutProps> = ({ children, title }) => {
  const { currentUser, setCurrentUser, users } = useAppContext();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const handleSwitchUser = (user: typeof currentUser) => {
    setCurrentUser(user);
    setIsDropdownOpen(false);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="p-4 bg-primary text-primary-foreground sticky top-0 z-10">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="font-bold text-xl">FitTrack</div>
            {title && <span className="text-sm opacity-80">/ {title}</span>}
          </div>
          
          <DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="p-0 h-auto">
                <Avatar>
                  <AvatarImage src={currentUser.avatarUrl} alt={currentUser.name} />
                  <AvatarFallback>{currentUser.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end">
              <DropdownMenuLabel>
                <div className="font-medium">{currentUser.name}</div>
                <div className="text-xs text-muted-foreground">@{currentUser.username}</div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem asChild>
                  <Link to="/profile" className="cursor-pointer" onClick={() => setIsDropdownOpen(false)}>
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuLabel>Switch User</DropdownMenuLabel>
              {users.map(user => (
                <DropdownMenuItem 
                  key={user.id} 
                  className={cn(
                    "flex items-center gap-2 cursor-pointer",
                    user.id === currentUser.id && "bg-muted"
                  )}
                  onClick={() => handleSwitchUser(user)}
                  disabled={user.id === currentUser.id}
                >
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={user.avatarUrl} alt={user.name} />
                    <AvatarFallback>{user.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <span>{user.name}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>
      
      {/* Main content */}
      <main className="flex-1 container max-w-md mx-auto py-4 px-4">
        {children}
      </main>
      
      {/* Bottom navigation */}
      <div className="bg-background border-t border-border sticky bottom-0 z-10">
        <nav className="flex justify-around items-center p-2">
          <NavLink to="/" icon={<Home />} label="Home" />
          <NavLink to="/leaderboard" icon={<Trophy />} label="Leaderboard" />
          <AddExerciseButton />
          <NavLink to="/history" icon={<History />} label="History" />
          <NavLink to="/profile" icon={<Settings />} label="Settings" />
        </nav>
      </div>
    </div>
  );
};

const NavLink: React.FC<{ to: string; icon: React.ReactNode; label: string }> = ({ to, icon, label }) => {
  // Get current path
  const currentPath = window.location.pathname;
  const isActive = currentPath === to || 
                  (to !== '/' && currentPath.startsWith(to));

  return (
    <Link 
      to={to} 
      className={cn(
        "flex flex-col items-center px-3 py-1 rounded text-xs",
        isActive ? "text-primary" : "text-muted-foreground"
      )}
    >
      <div className="text-lg mb-0.5">{icon}</div>
      <span>{label}</span>
    </Link>
  );
};

const AddExerciseButton: React.FC = () => {
  return (
    <Link to="/add-exercise" className="relative -mt-6">
      <Button className="rounded-full h-14 w-14 flex items-center justify-center shadow-lg bg-accent hover:bg-accent/90">
        <Plus className="h-6 w-6" />
      </Button>
    </Link>
  );
};

export default Layout;
