import React, { useState, useEffect, useMemo, useCallback, memo } from 'react';
import { Plus, Crown, Medal, Award } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { useTournamentRanking } from '@/hooks/useTournamentRanking';
import AddExerciseModal from '@/components/AddExerciseModal';
// Heroicons imports - outline versions
import {
  HomeIcon as HomeOutline,
  TrophyIcon as TrophyOutline,
  ClockIcon as ClockOutline,
  ClipboardDocumentCheckIcon as GoalsOutline, // Using ClipboardDocumentCheckIcon for "Goals"
  UserIcon as UserOutline,
} from '@heroicons/react/24/outline';
// Heroicons imports - solid versions
import {
  HomeIcon as HomeSolid,
  TrophyIcon as TrophySolid,
  ClockIcon as ClockSolid,
  ClipboardDocumentCheckIcon as GoalsSolid, // Using ClipboardDocumentCheckIcon for "Goals"
  UserIcon as UserSolid,
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
  customHeader?: React.ReactNode; // New: custom header element (e.g., pill switcher)
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

const Layout: React.FC<LayoutProps> = ({ children, title, categoryColor, headerSlider, headerStreak, customHeader }) => {
  const { profile, signOut } = useAuth();
  const { rank: tournamentRank, totalParticipants, isLoading: rankingLoading } = useTournamentRanking();
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

  // Create a stable profile reference to prevent unnecessary re-renders
  const stableProfile = useMemo(() => ({
    id: profile?.id,
    name: profile?.name,
    username: profile?.username,
    avatar_url: profile?.avatar_url
  }), [profile?.id, profile?.name, profile?.username, profile?.avatar_url]);

  // Memoize the profile nav link to prevent unnecessary re-renders
  const profileNavLink = useMemo(() => (
    <ProfileNavLink to="/settings" />
  ), []);

  // Create ranking indicator component
  const RankingIndicator: React.FC<{ rank: number | null; totalParticipants: number }> = ({ rank, totalParticipants }) => {
    if (!rank || totalParticipants === 0) return null;

    // Special indicators for top 3 positions using consistent icons
    if (rank === 1) {
      return (
        <div className="w-3 h-3 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center shadow-sm">
          <Crown className="w-2 h-2 text-yellow-900" />
        </div>
      );
    }
    
    if (rank === 2) {
      return (
        <div className="w-3 h-3 rounded-full bg-gradient-to-br from-gray-300 to-gray-500 flex items-center justify-center shadow-sm">
          <Medal className="w-2 h-2 text-gray-700" />
        </div>
      );
    }
    
    if (rank === 3) {
      return (
        <div className="w-3 h-3 rounded-full bg-gradient-to-br from-amber-600 to-amber-800 flex items-center justify-center shadow-sm">
          <Award className="w-2 h-2 text-amber-100" />
        </div>
      );
    }

    // For other positions, show a small red dot with the rank number
    return (
      <div className="w-3 h-3 rounded-full bg-red-500 flex items-center justify-center shadow-sm">
        <span className="text-[6px] font-bold text-white">{rank}</span>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Minimal header */}
      <header className="p-4 flex justify-between items-center">
        {customHeader ? (
          customHeader
        ) : title ? (
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
              rankingIndicator={
                !rankingLoading && tournamentRank ? (
                  <RankingIndicator rank={tournamentRank} totalParticipants={totalParticipants} />
                ) : null
              }
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
            {profileNavLink}
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
  rankingIndicator?: React.ReactNode;
}> = ({ to, outlineIcon, solidIcon, label, rankingIndicator }) => {
  // Get current path
  const currentPath = window.location.pathname;
  const isActive = currentPath === to || 
                  (to !== '/' && currentPath.startsWith(to));

  return (
    <Link 
      to={to} 
      className={cn(
        "flex flex-col items-center px-3 py-1 rounded text-xs w-full relative",
        isActive ? "text-primary font-medium" : "text-muted-foreground"
      )}
    >
      <div className={cn("mb-0.5 relative", isActive ? "text-primary" : "text-icon-muted")}>
        <AnimatedIcon 
          outlineIcon={outlineIcon}
          solidIcon={solidIcon}
          isActive={isActive}
        />
        {rankingIndicator && (
          <div className="absolute -bottom-1 -right-1">
            {rankingIndicator}
          </div>
        )}
      </div>
      {label && <span className={cn("text-center truncate w-full", isActive ? "font-bold" : "font-normal")}>{label}</span>}
    </Link>
  );
};

const ProfileNavLink = memo<{ 
  to: string; 
}>(({ to }) => {
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
      <div className={cn(
        "mb-0.5 relative transition-all duration-200",
        isActive ? "text-primary" : "text-icon-muted"
      )}>
        <AnimatedIcon 
          outlineIcon={UserOutline}
          solidIcon={UserSolid}
          isActive={isActive}
          className="h-6 w-6"
        />
      </div>
      <span className={cn("text-center truncate w-full", isActive ? "font-bold" : "font-normal")}> 
        Profile
      </span>
    </Link>
  );
});

ProfileNavLink.displayName = 'ProfileNavLink';

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
          : "text-white shadow-2xl hover:shadow-teal-500/25"
      )}
      style={!isModalOpen ? { backgroundColor: '#14b8a6' } : undefined}
    >
      <Plus className={cn(
        "h-6 w-6 transition-all duration-300 group-hover:scale-110", 
        isModalOpen ? "rotate-45 scale-110" : "group-active:rotate-90"
      )} />
    </button>
  );
};

export default Layout;
