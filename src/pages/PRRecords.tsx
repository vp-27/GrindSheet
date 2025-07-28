import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '@/context/useAppContext';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import Layout from '@/components/Layout';
import { 
  Trophy, 
  Crown, 
  Medal,
  Star,
  Target,
  Users,
  Flame,
  Zap,
  ChevronRight,
  Search,
  X,
  Filter,
  TrendingUp,
  TrendingDown,
  Activity,
  ChevronDown
} from 'lucide-react';
import { LeaderboardType } from '@/types';
import { 
  getLeaderboard, 
  calculatePRChampionshipSummary
} from '@/utils/progressUtils';
import { getCategoryChartColors, getCategoryKeyByName, getCategoryColors } from '@/utils/categoryColors';
import { supabase } from '@/integrations/supabase/client';
import AnimatedCounter from '@/components/ui/animated-counter';
import { MobileSlider } from '@/components/ui/mobile-slider';
import '@/styles/index.css';
import '@/styles/components/search.css';

import '../styles/components/pr-records.css';
// Internal component for use within Tournament tab
export const PRRecordsContent: React.FC = () => {
  const { profile } = useAuth();
  const { isDark } = useTheme();
  const { categories, exercises } = useAppContext();
  const navigate = useNavigate();
  
  const [users, setUsers] = useState<any[]>([]);
  const [allExerciseLogs, setAllExerciseLogs] = useState<any[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [contentReady, setContentReady] = useState(false);
  const [prLeaderboard, setPrLeaderboard] = useState<any[]>([]);
  const [prChampionship, setPrChampionship] = useState<any>({
    champion: null,
    championCount: 0,
    totalExercises: 0,
    summary: []
  });
  const [friendsSoloPRs, setFriendsSoloPRs] = useState<any[]>([]);
  const [showSoloPRs, setShowSoloPRs] = useState(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [sortBy, setSortBy] = useState<'weight' | 'recent' | 'exercise'>('weight');
  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);

  // Refs and state for the animated category filter
  const [indicatorStyle, setIndicatorStyle] = useState({});
  const filterContainerRef = useRef<HTMLDivElement>(null);
  const buttonRefs = useRef<{[key: string]: HTMLButtonElement | null}>({});

  // State for expandable search
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Handle search expansion
  const handleSearchToggle = () => {
    setIsSearchExpanded(!isSearchExpanded);
    if (!isSearchExpanded) {
      // Focus the input after expansion animation
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 200);
    }
  };

  // Close search when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isSearchExpanded && !(event.target as Element).closest('.expandable-search-overlay')) {
        setIsSearchExpanded(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isSearchExpanded]);

  // Handle search clear
  const handleSearchClear = () => {
    setSearchQuery('');
    setIsSearchExpanded(false); // Also hide/collapse the search bar
  };

  // Use the same color system as the rest of the app
  const chartColors = getCategoryChartColors();

  // This effect updates the sliding indicator for the category filter
  useEffect(() => {
    const activeId = selectedCategoryId ?? 'all';
    const activeButton = buttonRefs.current[activeId];
    
    if (activeButton) {
      const activeColor = selectedCategoryId
        ? getCategoryColor(categories.findIndex(cat => cat.id === selectedCategoryId))
        : 'hsl(var(--primary))';

      setIndicatorStyle({
        transform: `translateX(${activeButton.offsetLeft}px)`,
        width: `${activeButton.offsetWidth}px`,
        backgroundColor: activeColor,
      });

      activeButton.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    }
  }, [selectedCategoryId, categories]);

  // Handle exercise click navigation
  const handleExerciseClick = (exerciseId: string) => {
    navigate(`/exercise-detail?exercise=${exerciseId}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Fetch data on mount
  useEffect(() => {
    const fetchData = async () => {
      // Fetch users
      const { data: usersData, error: usersError } = await supabase
        .from('profiles')
        .select('id, name, username, avatar_url');
      
      if (!usersError && usersData) {
        setUsers(usersData.map((u: any) => ({
          id: u.id,
          name: u.name,
          username: u.username,
          avatarUrl: u.avatar_url
        })));
      }

      // Fetch all exercise logs
      const { data: logsData, error: logsError } = await supabase
        .from('exercise_logs')
        .select('*');
      
      if (!logsError && logsData) {
        const formattedLogs = logsData.map((log: any) => ({
          id: log.id,
          userId: log.user_id,
          exerciseId: log.exercise_id,
          weight: log.weight,
          timestamp: log.timestamp,
          note: log.note,
          weightUnit: log.weight_unit
        }));
        setAllExerciseLogs(formattedLogs);
      }
      
      // Small delay to allow smooth entrance animation
      setTimeout(() => setContentReady(true), 50);
    };

    fetchData();
  }, []);

  // Get color for a category based on its index
  const getCategoryColor = (categoryIndex: number) => {
    return chartColors[categoryIndex % chartColors.length];
  };

  // Calculate friends' solo PRs that can be beaten
  const calculateFriendsSoloPRs = () => {
    if (!profile || users.length === 0 || allExerciseLogs.length === 0) return [];
    
    const friendsSoloPRs: any[] = [];
    const currentUserLogs = allExerciseLogs.filter(log => log.userId === profile.id);
    const friendsLogs = allExerciseLogs.filter(log => log.userId !== profile.id);
    
    // Get friends' PR for each exercise
    exercises.forEach(exercise => {
      if (selectedCategoryId && exercise.categoryId !== selectedCategoryId) return;
      
      // Get current user's best for this exercise
      const currentUserBest = currentUserLogs
        .filter(log => log.exerciseId === exercise.id)
        .reduce((best, log) => log.weight > best ? log.weight : best, 0);
      
      // Get friends' PRs for this exercise
      const friendsPRs = friendsLogs
        .filter(log => log.exerciseId === exercise.id)
        .reduce((prs: any[], log) => {
          const existingPR = prs.find(pr => pr.userId === log.userId);
          if (!existingPR) {
            prs.push({
              userId: log.userId,
              weight: log.weight,
              timestamp: log.timestamp
            });
          } else if (log.weight > existingPR.weight) {
            existingPR.weight = log.weight;
            existingPR.timestamp = log.timestamp;
          }
          return prs;
        }, []);
      
      // Find beatable PRs (friend's PR > current user's best)
      friendsPRs.forEach(pr => {
        if (pr.weight > currentUserBest) {
          const user = users.find(u => u.id === pr.userId);
          if (user) {
            friendsSoloPRs.push({
              exerciseId: exercise.id,
              exerciseName: exercise.name,
              category: categories.find(cat => cat.id === exercise.categoryId),
              friend: user,
              friendPR: pr.weight,
              userBest: currentUserBest,
              deficit: pr.weight - currentUserBest,
              timestamp: pr.timestamp
            });
          }
        }
      });
    });
    
    // Sort by deficit (closest to beat first)
    return friendsSoloPRs.sort((a, b) => a.deficit - b.deficit);
  };

  // Update friends' solo PRs when dependencies change
  useEffect(() => {
    if (users.length > 0 && allExerciseLogs.length > 0 && exercises.length > 0 && categories.length > 0) {
      const soloPRs = calculateFriendsSoloPRs();
      setFriendsSoloPRs(soloPRs);
    }
  }, [users, allExerciseLogs, exercises, categories, selectedCategoryId, profile]);

  // Update PR data when dependencies change
  useEffect(() => {
    if (users.length > 0 && allExerciseLogs.length > 0 && exercises.length > 0 && categories.length > 0) {
      const categoryId = selectedCategoryId || undefined;
      
      // Get PR leaderboard
      const leaderboard = getLeaderboard(
        allExerciseLogs,
        users,
        LeaderboardType.EXERCISE_PR,
        undefined, // exerciseId
        categoryId,
        exercises
      );
      setPrLeaderboard(leaderboard);
      
      // Get PR championship summary
      const championship = calculatePRChampionshipSummary(
        allExerciseLogs,
        users,
        exercises,
        categoryId
      );
      setPrChampionship(championship);
    }
  }, [users, allExerciseLogs, exercises, categories, selectedCategoryId]);

  // Get exercise name by ID
  const getExerciseName = (exerciseId: string) => {
    const exercise = exercises.find(ex => ex.id === exerciseId);
    return exercise?.name || 'Unknown Exercise';
  };

  // Get category name by ID
  const getCategoryName = (categoryId: string) => {
    const category = categories.find(cat => cat.id === categoryId);
    return category?.name || 'Unknown Category';
  };

  // Get exercise category
  const getExerciseCategory = (exerciseId: string) => {
    const exercise = exercises.find(ex => ex.id === exerciseId);
    if (!exercise) return null;
    return categories.find(cat => cat.id === exercise.categoryId);
  };

  // Filter and sort PR leaderboard
  const filteredAndSortedPRs = useMemo(() => {
    let filtered = prLeaderboard;
    
    // Filter by search query
    if (searchQuery.trim()) {
      filtered = filtered.filter(entry => {
        const exerciseName = getExerciseName(entry.exerciseId!);
        const categoryName = getExerciseCategory(entry.exerciseId!)?.name || '';
        const userName = entry.user?.name || '';
        
        return exerciseName.toLowerCase().includes(searchQuery.toLowerCase()) ||
               categoryName.toLowerCase().includes(searchQuery.toLowerCase()) ||
               userName.toLowerCase().includes(searchQuery.toLowerCase());
      });
    }
    
    // Sort based on selected sort method
    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'weight':
          return b.value - a.value;
        case 'recent':
          return new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime();
        case 'exercise':
          return getExerciseName(a.exerciseId!).localeCompare(getExerciseName(b.exerciseId!));
        default:
          return 0;
      }
    });
  }, [prLeaderboard, searchQuery, sortBy]);

  // Get selected category info
  const selectedCategory = selectedCategoryId 
    ? categories.find(cat => cat.id === selectedCategoryId) 
    : null;

  // Get selected category color for subtle background tinting
  const selectedCategoryColor = useMemo(() => {
    if (!selectedCategoryId) return null;
    const categoryIndex = categories.findIndex(cat => cat.id === selectedCategoryId);
    return categoryIndex >= 0 ? getCategoryColor(categoryIndex) : null;
  }, [selectedCategoryId, categories]);

  // Get the header title
  const headerTitle = selectedCategoryId ? 
    `${categories.find(c => c.id === selectedCategoryId)?.name} Records` : 
    "PR Records";

  // Render PR champion summary card
  const renderPRChampionSummary = () => {
    if (!prChampionship.champion && prChampionship.summary.length === 0) {
      return (
        <div className={`glass-card rounded-2xl p-8 text-center ${selectedCategoryId ? 'category-tinted' : 'pr-champion-card'}`}>
          <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">No PR Records Yet</h3>
          <p className="text-muted-foreground">
            {selectedCategoryId 
              ? `No PR records in ${getCategoryName(selectedCategoryId)} category yet.`
              : 'Start logging workouts to see PR champions!'
            }
          </p>
        </div>
      );
    }

    // Get category color for styling
    const categoryColor = selectedCategoryId 
      ? getCategoryColor(categories.findIndex(cat => cat.id === selectedCategoryId))
      : '#fbbf24'; // Default amber color

    return (
      <div 
        className={`apple-health-card mb-6 ${selectedCategoryId ? 'category-tinted' : 'pr-champion-card'}`}
        style={{
          '--category-color': categoryColor,
          '--category-color-rgb': categoryColor.replace('#', '').match(/.{2}/g)?.map(hex => parseInt(hex, 16)).join(', ') || '251, 191, 36'
        } as React.CSSProperties}
      >
        <div className="flex items-center gap-4 mb-4">
          <div 
            className="w-12 h-12 rounded-full flex items-center justify-center shadow-md"
            style={{
              background: selectedCategoryId 
                ? `linear-gradient(135deg, ${categoryColor}40, ${categoryColor}80)`
                : 'linear-gradient(135deg, #fbbf24, #f59e0b)'
            }}
          >
            <Crown 
              className="h-6 w-6" 
              style={{ color: selectedCategoryId ? categoryColor : '#92400e' }}
            />
          </div>
          <div className="flex-1">
            <h3 
              className="apple-health-card-title text-base font-bold"
              style={{ 
                color: selectedCategoryId 
                  ? categoryColor 
                  : '#92400e'
              }}
            >
              PR Champion{prChampionship.champion ? `: ${prChampionship.champion.name}` : 'ship'}
            </h3>
            <div className="apple-health-card-time">
              <span 
                className="apple-health-card-time-text"
                style={{ 
                  color: selectedCategoryId 
                    ? `${categoryColor}cc` 
                    : '#92400ecc'
                }}
              >
                {prChampionship.champion 
                  ? `${prChampionship.championCount} PR${prChampionship.championCount !== 1 ? 's' : ''} out of ${prChampionship.totalExercises} exercises`
                  : `${prChampionship.totalExercises} exercises tracked`
                }
              </span>
            </div>
          </div>
        </div>
        
        {prChampionship.summary.length > 0 && (
          <div className="space-y-2">
            {prChampionship.summary.slice(0, 3).map((item, index) => (
              <div 
                key={item.user.id} 
                className="flex items-center gap-3 p-3 rounded-xl"
                style={{
                  backgroundColor: selectedCategoryId 
                    ? `${categoryColor}15` 
                    : 'rgba(251, 191, 36, 0.1)'
                }}
              >
                <div className="flex items-center gap-2">
                  {index === 0 && (
                    <Crown 
                      className="h-4 w-4" 
                      style={{ color: selectedCategoryId ? categoryColor : '#d97706' }}
                    />
                  )}
                  {index === 1 && <Medal className="h-4 w-4 text-gray-500" />}
                  {index === 2 && <Trophy className="h-4 w-4 text-amber-600" />}
                  {index > 2 && <span className="w-4 h-4 flex items-center justify-center text-xs font-bold text-muted-foreground">#{index + 1}</span>}
                </div>
                <Avatar className="w-8 h-8">
                  <AvatarImage src={item.user.avatarUrl} alt={item.user.name} />
                  <AvatarFallback>{item.user.name.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div 
                    className="font-medium text-sm"
                    style={{ 
                      color: selectedCategoryId 
                        ? categoryColor 
                        : '#92400e'
                    }}
                  >
                    {item.user.name}
                  </div>
                </div>
                <Badge 
                  variant="secondary" 
                  style={{
                    backgroundColor: selectedCategoryId 
                      ? `${categoryColor}30` 
                      : 'rgba(251, 191, 36, 0.3)',
                    color: selectedCategoryId 
                      ? categoryColor 
                      : '#92400e'
                  }}
                >
                  {item.prCount} PR{item.prCount !== 1 ? 's' : ''}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  // Render friends' solo PR challenge section
  const renderFriendsSoloPRs = () => {
    if (friendsSoloPRs.length === 0) return null;
    
    return (
      <div className="mb-6">
        <div
          className={`w-full challenges-button interactive flex items-center justify-between p-4 h-auto cursor-pointer select-none shadow-sm border border-orange-200 dark:border-orange-800 rounded-2xl ${selectedCategoryId ? 'category-tinted' : ''}`}
          role="button"
          tabIndex={0}
          onClick={() => setShowSoloPRs(!showSoloPRs)}
          onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') setShowSoloPRs(!showSoloPRs); }}
        >
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900 w-10 h-10">
              <Zap className="h-6 w-6 text-orange-600 dark:text-orange-400" />
            </div>
            <div className="text-left">
              <div className="font-semibold text-base leading-tight">Friends' PRs to Beat</div>
              <div className="text-sm text-muted-foreground leading-tight">{friendsSoloPRs.length} challenges available</div>
            </div>
          </div>
          <div className="flex items-center gap-2 ml-4">
            <span className={`px-4 py-1 rounded-full font-semibold text-sm transition bg-orange-50 dark:bg-orange-950 text-orange-700 dark:text-orange-300 border border-orange-200 dark:border-orange-800 shadow-sm`}>
              {showSoloPRs ? 'Hide' : 'Show'}
            </span>
            <ChevronDown 
              className={`h-5 w-5 text-orange-500 transition-transform duration-300 ${showSoloPRs ? 'rotate-180' : ''}`}
              aria-hidden="true"
            />
          </div>
        </div>
        
        <div
          className={`transition-all duration-500 ease-out overflow-hidden ${showSoloPRs ? 'max-h-[2000px] opacity-100 translate-y-0' : 'max-h-0 opacity-0 -translate-y-2 pointer-events-none'}`}
          style={{ willChange: 'max-height, opacity, transform' }}
        >
          <div className="space-y-3 mt-4">
            {friendsSoloPRs.slice(0, 10).map((challenge, index) => {
              const categoryColor = getCategoryColor(
                categories.findIndex(cat => cat.id === challenge.category?.id)
              );
              
              return (
                <div 
                  key={`${challenge.exerciseId}-${challenge.friend.id}`}
                  className={`apple-health-card challenge-card ${selectedCategoryId ? 'category-tinted' : ''}`}
                  onClick={() => handleExerciseClick(challenge.exerciseId)}
                  style={{
                    '--category-color': categoryColor,
                    '--category-color-rgb': categoryColor.replace('#', '').match(/.{2}/g)?.map(hex => parseInt(hex, 16)).join(', ') || '16, 185, 129'
                  } as React.CSSProperties}
                >
                  {/* Top row: Exercise name only */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="apple-health-card-title truncate mb-1">{challenge.exerciseName}</h3>
                      <div className="apple-health-card-time">
                        <span className="apple-health-card-time-text">Beat {challenge.friend.name}'s PR</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Bottom row: Friend avatar + PR challenge info */}
                  <div className="flex items-end justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={challenge.friend.avatarUrl} alt={challenge.friend.name} />
                        <AvatarFallback>{challenge.friend.name.charAt(0).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div className="text-sm">
                        <div className="text-muted-foreground">Your best: {challenge.userBest || 0} lbs</div>
                        <div className="text-xs text-orange-600 dark:text-orange-400 font-medium">
                          Need +{challenge.deficit} lbs to beat
                        </div>
                      </div>
                    </div>
                    
                    {/* Target PR Display */}
                    <div className="text-right">
                      <div className="apple-health-weight-display text-orange-600 dark:text-orange-400">
                        <AnimatedCounter 
                          value={challenge.friendPR} 
                          formatValue={(val) => val.toString()}
                          duration={600}
                          className="tabular-nums"
                        />
                      </div>
                      <p className="apple-health-weight-unit">lbs PR</p>
                    </div>
                  </div>
                </div>
              );
            })}
            
            {friendsSoloPRs.length > 10 && (
              <div className="text-center text-sm text-muted-foreground">
                And {friendsSoloPRs.length - 10} more challenges...
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderPREntry = (entry: any, index: number) => {
    const exerciseName = getExerciseName(entry.exerciseId!);
    const category = getExerciseCategory(entry.exerciseId!);
    const isCurrentUser = entry.userId === profile?.id;
    const isTie = entry.isTie;
    
    // Get category color for this exercise
    const categoryIndex = category ? categories.findIndex(cat => cat.id === category.id) : -1;
    const categoryColor = categoryIndex >= 0 ? getCategoryColor(categoryIndex) : '#10b981';
    
    // Format timestamp
    const timestamp = entry.timestamp ? new Date(entry.timestamp) : null;
    let timeDisplay = '';
    if (timestamp) {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
      const logDate = new Date(timestamp.getFullYear(), timestamp.getMonth(), timestamp.getDate());
      
      if (logDate.getTime() === today.getTime()) {
        timeDisplay = timestamp.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
      } else if (logDate.getTime() === yesterday.getTime()) {
        timeDisplay = 'Yesterday';
      } else {
        timeDisplay = timestamp.toLocaleDateString([], { month: 'short', day: 'numeric' });
      }
    }
    
    return (
      <div 
        key={`${entry.exerciseId}-${entry.userId}`}
        className={`apple-health-card transition-all duration-200 cursor-pointer ${selectedCategoryId ? 'category-tinted' : ''} ${
          isCurrentUser ? 'user-pr' : ''
        }`}
        onClick={() => handleExerciseClick(entry.exerciseId!)}
        style={{
          '--category-color': categoryColor,
          '--category-color-rgb': categoryColor.replace('#', '').match(/.{2}/g)?.map(hex => parseInt(hex, 16)).join(', ') || '16, 185, 129'
        } as React.CSSProperties}
      >
        {/* Top row: Exercise name + Time with arrow */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1 min-w-0">
            <h3 className="apple-health-card-title truncate mb-1">{exerciseName}</h3>
            <div className="apple-health-card-time">
              {isTie && entry.users ? (
                <span className="apple-health-card-time-text">{entry.users.length} users tied</span>
              ) : (
                <span className="apple-health-card-time-text">{entry.user?.name}</span>
              )}
              {isCurrentUser && (
                <Badge variant="secondary" className="ml-2 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-xs">You</Badge>
              )}
            </div>
          </div>
          {timeDisplay && (
            <div className="apple-health-card-time">
              <span className="apple-health-card-time-text">{timeDisplay}</span>
              <ChevronRight className="apple-health-card-arrow" />
            </div>
          )}
        </div>

        {/* Bottom row: User avatars + Weight display */}
        <div className="flex items-end justify-between">
          <div className="flex items-center gap-3">
            {isTie && entry.users ? (
              // Render multiple avatars for ties
              <div className="flex -space-x-2">
                {entry.users.slice(0, 3).map((user: any, userIndex: number) => (
                  <Avatar key={user.id} className="w-8 h-8 border-2 border-background">
                    <AvatarImage src={user.avatarUrl} alt={user.name} />
                    <AvatarFallback>{user.name.charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                ))}
                {entry.users.length > 3 && (
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium text-muted-foreground border-2 border-background">
                    +{entry.users.length - 3}
                  </div>
                )}
              </div>
            ) : (
              <Avatar className="w-8 h-8">
                <AvatarImage src={entry.user?.avatarUrl} alt={entry.user?.name} />
                <AvatarFallback>{entry.user?.name?.charAt(0).toUpperCase()}</AvatarFallback>
              </Avatar>
            )}
          </div>

          {/* Weight Display */}
          <div className="text-right">
            <div className="apple-health-weight-display">
              <AnimatedCounter 
                value={entry.value > 0 ? entry.value : 0} 
                formatValue={(val) => val.toString()}
                duration={600}
                className="tabular-nums"
              />
            </div>
            <p className="apple-health-weight-unit">lbs</p>
            {isTie && (
              <div className="text-xs text-amber-600 dark:text-amber-400 font-medium flex items-center gap-1 justify-end mt-1">
                <Star className="h-3 w-3" />
                <span>Tied</span>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="relative">
        <div className="relative flex flex-col pb-6 z-10">
          
          {/* Controls Island (Sticky Category Selector/Filter Bar) */}
          <div className="control-panel mt-4 mb-8 relative sticky top-0 z-30">
            {/* Compact Category Filter with Filter Button */}
            <div className="relative bg-muted p-1 rounded-2xl">
              <div 
                ref={filterContainerRef}
                className="relative flex gap-1 overflow-x-auto scrollbar-hide"
              >
                <div className="category-filter-indicator" style={indicatorStyle} />
                
                {/* Filter Button */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsSortDropdownOpen(!isSortDropdownOpen)}
                  className="category-filter-button px-3 py-2.5 flex-shrink-0"
                >
                  <Filter className="h-4 w-4" />
                </Button>
                
                <Button
                  ref={(el) => (buttonRefs.current['all'] = el)}
                  onClick={() => setSelectedCategoryId(null)}
                  variant="ghost"
                  size="sm"
                  className={`category-filter-button px-5 py-2.5 ${
                    selectedCategoryId === null ? 'selected' : ''
                  }`}
                >
                  All
                </Button>
                {categories.map((category, index) => {
                  const isSelected = selectedCategoryId === category.id;
                  const categoryColor = getCategoryColor(index);
                  return (
                    <Button
                      ref={(el) => (buttonRefs.current[category.id] = el)}
                      key={category.id}
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedCategoryId(category.id)}
                      className={`category-filter-button px-5 py-2.5 ${
                        isSelected ? 'selected' : ''
                      }`}
                      style={!isSelected ? { color: categoryColor } : {}}
                    >
                      {category.name}
                    </Button>
                  );
                })}
              </div>
              
              {/* Expandable Search Overlay */}
              <div className="expandable-search-overlay">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSearchToggle}
                  className={`search-icon-button ${isSearchExpanded ? 'search-hidden' : 'search-visible'}`}
                >
                  <Search className="h-4 w-4" />
                </Button>
                
                <div className={`expandable-search-input ${isSearchExpanded ? 'search-expanded' : 'search-collapsed'}`}>
                  <input
                    ref={searchInputRef}
                    type="text"
                    placeholder="Search records..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="expandable-search-field"
                  />
                  {searchQuery && (
                    <button
                      onClick={handleSearchClear}
                      className="search-clear-button"
                      aria-label="Clear search"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
            
            {/* Sort Dropdown */}
            {isSortDropdownOpen && (
              <div className="absolute top-full left-0 mt-2 bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-gray-200/50 dark:border-gray-700/50 backdrop-blur-md z-50 min-w-48">
                <div className="p-2">
                  {[
                    { id: 'weight', label: 'Weight', icon: TrendingUp },
                    { id: 'recent', label: 'Recent', icon: Activity },
                    { id: 'exercise', label: 'Exercise', icon: Target }
                  ].map((option) => {
                    const Icon = option.icon;
                    return (
                      <button
                        key={option.id}
                        onClick={() => {
                          setSortBy(option.id as 'weight' | 'recent' | 'exercise');
                          setIsSortDropdownOpen(false);
                        }}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 active:scale-95 ${
                          sortBy === option.id
                            ? 'bg-primary text-primary-foreground'
                            : 'text-foreground active:bg-gray-100 dark:active:bg-gray-800'
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                        <span className="font-medium">{option.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Content */}
          <div className={`space-y-6 relative transition-all duration-500 ease-out ${contentReady ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            
            {/* PR Champion Summary */}
            {renderPRChampionSummary()}

            {/* Friends' Solo PRs Challenge Section */}
            {friendsSoloPRs.length > 0 && renderFriendsSoloPRs()}

            {/* PR Leaderboard */}
            <div className="space-y-3">
              {filteredAndSortedPRs.length > 0 ? (
                <>
                  {filteredAndSortedPRs.map((entry, index) => renderPREntry(entry, index))}
                </>
              ) : (
                <div className={`glass-card rounded-2xl p-12 text-center ${selectedCategoryId ? 'category-tinted' : ''}`}>
                  {searchQuery.trim() ? (
                    <>
                      <Search className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-foreground mb-2">No records found</h3>
                      <p className="text-muted-foreground mb-4">
                        No records match "{searchQuery}"
                      </p>
                      <Button 
                        variant="outline" 
                        onClick={() => setSearchQuery('')}
                        className="mt-2"
                      >
                        Clear search
                      </Button>
                    </>
                  ) : (
                    <>
                      <Target className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-foreground mb-2">No PR Records Found</h3>
                      <p className="text-muted-foreground">
                        {selectedCategoryId 
                          ? `No records found for ${getCategoryName(selectedCategoryId)} exercises.`
                          : 'No exercise records found. Start logging workouts to see personal records!'
                        }
                      </p>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

// Standalone page component with Layout wrapper
const PRRecordsPage: React.FC = () => {
  return (
    <Layout title="PR Records">
      <PRRecordsContent />
    </Layout>
  );
};

export default PRRecordsPage;
