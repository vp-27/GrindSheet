import React, { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import AddExerciseModal from '@/components/AddExerciseModal';
// Heroicons imports - outline versions
import {
  HomeIcon as HomeOutline,
  TrophyIcon as TrophyOutline,
  ClockIcon as ClockOutline,
  ClipboardDocumentCheckIcon as GoalsOutline, // Using ClipboardDocumentCheckIcon for "Goals"
} from '@heroicons/react/24/outline';
// Heroicons imports - solid versions
import {
  HomeIcon as HomeSolid,
  TrophyIcon as TrophySolid,
  ClockIcon as ClockSolid,
  ClipboardDocumentCheckIcon as GoalsSolid, // Using ClipboardDocumentCheckIcon for "Goals"
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
import '@/styles/index.css';

interface LayoutProps {
  children: React.ReactNode;
  title?: string;
  categoryColor?: string;
  headerSlider?: React.ReactNode;
  headerStreak?: React.ReactNode; // New: custom header right-side content
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

const Layout: React.FC<LayoutProps> = ({ children, title, categoryColor, headerSlider, headerStreak }) => {
  const { profile, signOut } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isAddExerciseModalOpen, setIsAddExerciseModalOpen] = useState(false);
  const [avatarImageError, setAvatarImageError] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
  };

  // Reset avatar error when profile changes
  useEffect(() => {
    setAvatarImageError(false);
  }, [profile?.avatar_url]);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Minimal header */}
      <header className="p-4 flex justify-between items-center">
        {title ? (
          <>
            <h1 
              className={categoryColor ? "category-exercise-title" : "text-3xl font-bold text-foreground"}
              style={categoryColor ? {
                '--category-color': categoryColor
              } as React.CSSProperties : undefined}
            >
              {title}
            </h1>
            {/* Streak indicator or fallback */}
            {headerStreak || headerSlider}
          </>
        ) : (
          // Full width header slider when no title
          headerSlider || (
            <div className="flex justify-between items-center w-full">
              <div></div>
              {/* Optionally, could show streak here too if needed */}
            </div>
          )
        )}
      </header>
      
      {/* Main content */}
      <main className="flex-1 container max-w-lg mx-auto py-2 px-4 page-container">
        {children}
      </main>
      
      {/* Apple-style bottom navigation with glass effect */}
      <div className="sticky bottom-0 z-50 backdrop-blur-xl bg-background/0 pb-3 w-full sm:max-w-lg sm:mx-auto rounded-t-2xl px-2 sm:px-0 border-t border-border/20 shadow-2xl shadow-black/20">
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
              to="/goals" 
              outlineIcon={GoalsOutline}
              solidIcon={GoalsSolid}
              label="Goals" 
            />
          </div>
          <div className="flex-1 flex justify-center items-center">
            <ProfileNavLink 
              to="/settings" 
              profile={profile}
              avatarImageError={avatarImageError}
              setAvatarImageError={setAvatarImageError}
            />
          </div>
          {/* Absolutely positioned AddExerciseButton for precise centering */}
          <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <AddExerciseButton 
              isModalOpen={isAddExerciseModalOpen}
              onOpenModal={() => setIsAddExerciseModalOpen(true)}
              onCloseModal={() => setIsAddExerciseModalOpen(false)}
            />
          </div>
        </nav>
      </div>

      {/* Add Exercise Modal */}
      <AddExerciseModal 
        isOpen={isAddExerciseModalOpen}
        onOpenChange={setIsAddExerciseModalOpen}
      />
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

const ProfileNavLink: React.FC<{ 
  to: string; 
  profile: any;
  avatarImageError: boolean;
  setAvatarImageError: (error: boolean) => void;
}> = ({ to, profile, avatarImageError, setAvatarImageError }) => {
  // Get current path
  const currentPath = window.location.pathname;
  const isActive = currentPath === to || 
                  (to !== '/' && currentPath.startsWith(to));

  // Get user initials for avatar fallback
  const getUserInitials = () => {
    if (!profile?.name) return '?';
    return profile.name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Link 
      to={to} 
      className={cn(
        "flex flex-col items-center px-3 py-1 rounded text-xs w-full",
        isActive ? "text-primary font-medium" : "text-muted-foreground"
      )}
    >
      <div className={cn(
        "mb-0.5 relative transition-all duration-200",
        isActive ? "text-primary" : "text-icon-muted"
      )}>
        <Avatar 
          className={cn(
            "h-6 w-6 transition-all duration-200 ring-2",
            isActive 
              ? "ring-primary" 
              : "ring-muted-foreground/20 hover:ring-muted-foreground/40"
          )}
        >
          <AvatarImage 
            src={profile?.avatar_url} 
            alt={profile?.name || 'Profile'}
            onError={() => setAvatarImageError(true)}
          />
          <AvatarFallback className="text-xs font-medium bg-muted">
            {getUserInitials()}
          </AvatarFallback>
        </Avatar>
      </div>
      <span className={cn("text-center truncate w-full", isActive ? "font-bold" : "font-normal")}>
        Profile
      </span>
    </Link>
  );
};

const AddExerciseButton: React.FC<{
  isModalOpen: boolean;
  onOpenModal: () => void;
  onCloseModal: () => void;
}> = ({ isModalOpen, onOpenModal, onCloseModal }) => {
  const handleClick = () => {
    if (isModalOpen) {
      onCloseModal();
    } else {
      onOpenModal();
    }
  };

  return (
    <button 
      onClick={handleClick}
      aria-label={isModalOpen ? "Close exercise modal" : "Add exercise"}
      className={cn(
        "rounded-full h-14 w-14 flex items-center justify-center shadow-xl transition-all duration-300 backdrop-blur-lg group hover:scale-105 active:scale-95 focus:outline-none",
        isModalOpen 
          ? "bg-red-500 hover:bg-red-600 text-white shadow-2xl scale-105 shadow-red-500/25" 
          : "text-white shadow-2xl hover:shadow-orange-500/25"
      )}
      style={!isModalOpen ? {
        background: 'linear-gradient(45deg, #f97316, #ec4899)'
      } : undefined}
    >
      <Plus className={cn(
        "h-6 w-6 transition-all duration-300 group-hover:scale-110", 
        isModalOpen ? "rotate-45 scale-110" : "group-active:rotate-90"
      )} />
    </button>
  );
};

export default Layout;
