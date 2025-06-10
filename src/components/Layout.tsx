import React, { useState } from 'react';
import { Home, Trophy, History, User, Plus, Settings, LogOut, Target } from 'lucide-react';
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
import '@/components/ui/category-styles.css';

interface LayoutProps {
  children: React.ReactNode;
  title?: string;
  categoryColor?: string;
}

const Layout: React.FC<LayoutProps> = ({ children, title, categoryColor }) => {
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
        <h1 
          className={categoryColor ? "category-exercise-title" : "text-3xl font-bold text-foreground"}
          style={categoryColor ? {
            '--category-color': categoryColor
          } as React.CSSProperties : undefined}
        >
          {title || "Home"}
        </h1>
        <Button variant="ghost" className="p-0 h-auto" onClick={() => navigate('/settings')}>
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
      <div className="sticky bottom-0 z-10 backdrop-blur-lg bg-background/70 pb-3 w-full sm:max-w-lg sm:mx-auto rounded-t-xl px-2 sm:px-0">
        <nav className="relative flex items-center justify-between p-2">
          <div className="flex-1 flex justify-center items-center">
            <NavLink to="/" icon={<Home />} label="Home" />
          </div>
          <div className="flex-1 flex justify-center items-center">
            <NavLink to="/tournament" icon={<Trophy />} label="Compete" />
          </div>
          <div className="flex-1 flex justify-center items-center">
            <div className="w-16 h-14 flex-shrink-0" />
          </div>
          <div className="flex-1 flex justify-center items-center">
            <NavLink to="/history" icon={<History />} label="History" />
          </div>
          <div className="flex-1 flex justify-center items-center">
            <NavLink to="/settings" icon={<Settings />} label="Settings" />
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

const NavLink: React.FC<{ to: string; icon: React.ReactNode; label?: string }> = ({ to, icon, label }) => {
  // Get current path
  const currentPath = window.location.pathname;
  const isActive = currentPath === to || 
                  (to !== '/' && currentPath.startsWith(to));

  return (
    <Link 
      to={to} 
      className={cn(
        "flex flex-col items-center px-3 py-1 rounded text-xs w-full",
        isActive ? "text-primary font-medium" : "text-muted-foreground"
      )}
    >
      <div className={cn("text-lg mb-0.5 text-icon", isActive ? "text-primary" : "text-icon-muted")}>{icon}</div>
      {label && <span className="text-center truncate w-full">{label}</span>}
    </Link>
  );
};

const AddExerciseButton: React.FC = () => {
  return (
    <Link to="/add-exercise">
      <Button className="rounded-full h-14 w-14 flex items-center justify-center shadow-xl bg-primary text-primary-foreground transition-all duration-300 active:scale-95 active:shadow-2xl border-2 border-white/20 backdrop-blur-sm">
        <Plus className="h-6 w-6" />
      </Button>
    </Link>
  );
};

export default Layout;
