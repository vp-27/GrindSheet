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
    <div className="min-h-screen bg-background flex flex-col">
      {/* Minimal header */}
      <header className="p-4 flex justify-between items-center">
        <h1 className="text-xl font-semibold text-gray-900">
          {title || "Home"}
        </h1>
        <Button variant="ghost" className="p-0 h-auto" onClick={() => navigate('/profile')}>
          <Avatar className="h-8 w-8">
            <AvatarImage src={profile?.avatar_url} alt={profile?.name} />
            <AvatarFallback className="bg-gray-200 text-gray-700">{profile?.name?.substring(0, 2).toUpperCase() || 'U'}</AvatarFallback>
          </Avatar>
        </Button>
      </header>
      
      {/* Main content */}
      <main className="flex-1 container max-w-lg mx-auto py-2 px-4">
        {children}
      </main>
      
      {/* Apple-style bottom navigation with glass effect */}
      <div className="sticky bottom-0 z-10 backdrop-blur-lg bg-white/70 dark:bg-gray-900/70">
        <nav className="flex justify-around items-center p-2 max-w-lg mx-auto">
          <NavLink to="/" icon={<Home />} label="Home" />
          <NavLink to="/leaderboard" icon={<Trophy />} label="Leaderboard" />
          <AddExerciseButton />
          <NavLink to="/history" icon={<History />} label="History" />
          <NavLink to="/profile" icon={<Settings />} label="Profile" />
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
        isActive ? "text-green-600 font-medium" : "text-gray-500"
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
      <Button className="rounded-full h-14 w-14 flex items-center justify-center shadow-lg bg-green-600 hover:bg-green-700 text-white">
        <Plus className="h-6 w-6" />
      </Button>
    </Link>
  );
};

export default Layout;
