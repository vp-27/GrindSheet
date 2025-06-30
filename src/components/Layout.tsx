import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
// Heroicons imports - outline versions
import {
  HomeIcon as HomeOutline,
  TrophyIcon as TrophyOutline,
  ClockIcon as ClockOutline,
  CogIcon as CogOutline,
} from '@heroicons/react/24/outline';
// Heroicons imports - solid versions
import {
  HomeIcon as HomeSolid,
  TrophyIcon as TrophySolid,
  ClockIcon as ClockSolid,
  CogIcon as CogSolid,
} from '@heroicons/react/24/solid';
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

// Icon transition component
interface AnimatedIconProps {
  outlineIcon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  solidIcon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  isActive: boolean;
  className?: string;
}

const AnimatedIcon: React.FC<AnimatedIconProps> = ({ outlineIcon: OutlineIcon, solidIcon: SolidIcon, isActive, className }) => {
  return (
    <div className={cn("relative transition-all duration-200", className)}>
      <OutlineIcon 
        className={cn(
          "h-6 w-6 transition-opacity duration-200",
          isActive ? "opacity-0" : "opacity-100"
        )} 
      />
      <SolidIcon 
        className={cn(
          "h-6 w-6 absolute inset-0 transition-opacity duration-200",
          isActive ? "opacity-100" : "opacity-0"
        )} 
      />
    </div>
  );
};

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
      <div className="sticky bottom-0 z-10 backdrop-blur-xl bg-background/30 pb-3 w-full sm:max-w-lg sm:mx-auto rounded-t-2xl px-2 sm:px-0 border-t border-border/20 shadow-2xl shadow-black/20">
        <nav className="relative flex items-center justify-between p-2 rounded-t-2xl">
          <div className="flex-1 flex justify-center items-center">
            <NavLink 
              to="/" 
              outlineIcon={HomeOutline}
              solidIcon={HomeSolid}
              label="Home" 
            />
          </div>
          <div className="flex-1 flex justify-center items-center">
            <NavLink 
              to="/tournament" 
              outlineIcon={TrophyOutline}
              solidIcon={TrophySolid}
              label="Compete" 
            />
          </div>
          <div className="flex-1 flex justify-center items-center">
            <div className="w-16 h-14 flex-shrink-0" />
          </div>
          <div className="flex-1 flex justify-center items-center">
            <NavLink 
              to="/history" 
              outlineIcon={ClockOutline}
              solidIcon={ClockSolid}
              label="History" 
            />
          </div>
          <div className="flex-1 flex justify-center items-center">
            <NavLink 
              to="/settings" 
              outlineIcon={CogOutline}
              solidIcon={CogSolid}
              label="Settings" 
            />
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

const NavLink: React.FC<{ 
  to: string; 
  outlineIcon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  solidIcon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  label?: string; 
}> = ({ to, outlineIcon, solidIcon, label }) => {
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
      <div className={cn("mb-0.5", isActive ? "text-primary" : "text-icon-muted")}>
        <AnimatedIcon 
          outlineIcon={outlineIcon}
          solidIcon={solidIcon}
          isActive={isActive}
        />
      </div>
      {label && <span className={cn("text-center truncate w-full", isActive ? "font-bold" : "font-normal")}>{label}</span>}
    </Link>
  );
};

const AddExerciseButton: React.FC = () => {
  return (
    <Link to="/add-exercise">
      <Button className="rounded-full h-14 w-14 flex items-center justify-center shadow-xl bg-primary text-primary-foreground transition-all duration-300 active:scale-95 active:shadow-2xl ring-2 ring-white/20 dark:ring-gray-800/20 backdrop-blur-lg">
        <Plus className="h-6 w-6" />
      </Button>
    </Link>
  );
};

export default Layout;
