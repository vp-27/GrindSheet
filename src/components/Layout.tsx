import React, { useState } from 'react';
import { Home, Trophy, History, User, Plus, Settings, LogOut } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
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
  const { profile, signOut } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Minimal header */}
      <header className="p-4 flex justify-between items-center">
        <h1 className="text-xl font-semibold text-foreground">
          {title || "Home"}
        </h1>
        <Button variant="ghost" className="p-0 h-auto" onClick={() => navigate('/profile')}>
          <Avatar className="h-8 w-8">
            <AvatarImage src={profile?.avatar_url} alt={profile?.name} />
            <AvatarFallback className="bg-muted text-muted-foreground">{profile?.name?.substring(0, 2).toUpperCase() || 'U'}</AvatarFallback>
          </Avatar>
        </Button>
      </header>
      
      {/* Main content */}
      <main className="flex-1 container max-w-lg mx-auto py-2 px-4">
        {children}
      </main>
      
      {/* Apple-style bottom navigation with glass effect */}
      <div className="sticky bottom-3 z-10 backdrop-blur-lg bg-background/70 mb-3 w-full sm:max-w-lg sm:mx-auto rounded-xl px-2 sm:px-0">
        <nav className="relative flex items-center justify-between p-2">
          <div className="flex-1 flex justify-center items-center">
            <NavLink to="/" icon={<Home />} label="Home" />
          </div>
          <div className="flex-1 flex justify-center items-center">
            <NavLink to="/leaderboard" icon={<Trophy />} label="Leaderboard" />
          </div>
          <div className="flex-1 flex justify-center items-center">
            <div className="w-16 h-14 flex-shrink-0" />
          </div>
          <div className="flex-1 flex justify-center items-center">
            <NavLink to="/history" icon={<History />} label="History" />
          </div>
          <div className="flex-1 flex justify-center items-center">
            <NavLink to="/profile" icon={<Settings />} label="Profile" />
          </div>
          {/* Absolutely positioned AddExerciseButton for precise centering */}
          <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <AddExerciseButton />
          </div>
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
        "flex flex-col items-center px-3 py-1 rounded text-xs w-full",
        isActive ? "text-green-600 font-medium" : "text-muted-foreground"
      )}
    >
      <div className="text-lg mb-0.5">{icon}</div>
      <span className="text-center truncate w-full">{label}</span>
    </Link>
  );
};

const AddExerciseButton: React.FC = () => {
  return (
    <Link to="/add-exercise">
      <Button className="rounded-full h-14 w-14 flex items-center justify-center shadow-lg bg-green-600 hover:bg-green-700 text-white">
        <Plus className="h-6 w-6" />
      </Button>
    </Link>
  );
};

export default Layout;
