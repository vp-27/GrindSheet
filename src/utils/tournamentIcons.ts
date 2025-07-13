import { 
  Trophy, 
  Crown, 
  Medal, 
  Award, 
  Zap, 
  Target,
  TrendingUp,
  Calendar,
  Users,
  Star,
  Flame,
  CheckCircle,
  Timer,
  ChevronDown,
  ChevronUp,
  Activity,
  Plus,
  BookOpen,
  History,
  Clock
} from 'lucide-react';
import { BadgeType } from '@/types';

// Centralized icon definitions for tournament components
export const TOURNAMENT_ICONS = {
  // Category icons
  PERFORMANCE: Trophy,
  VOLUME: Activity,
  BONUSES: Award,
  
  // Badge icons
  [BadgeType.FIRST_PR]: Trophy,
  [BadgeType.CONSISTENCY_KING]: Crown,
  [BadgeType.IMPROVEMENT_STAR]: Star,
  [BadgeType.WEEKEND_WARRIOR]: Zap,
  [BadgeType.CATEGORY_MASTER]: Target,
  [BadgeType.NEWCOMER_BONUS]: CheckCircle,
  [BadgeType.PERFECT_WEEK]: Flame,
  [BadgeType.VOLUME_CRUSHER]: Activity,
  [BadgeType.CORE_DESTROYER]: Target,
  
  // Other icons
  PR_DETAIL: Trophy,
  IMPROVEMENT_DETAIL: TrendingUp,
  COMPETITIVE_DETAIL: Zap,
  DAILY_WORKOUT: Calendar,
  CONSISTENCY_DETAIL: CheckCircle,
  EXERCISE_VOLUME: Award,
  NEW_EXERCISE: Plus,
  WINNING_STREAK: Flame,
  USERS: Users,
  
  // Position badges
  FIRST_PLACE: Crown,
  SECOND_PLACE: Medal,
  THIRD_PLACE: Award,
  
  // UI icons
  RULEBOOK: BookOpen,
  CLOCK: Clock,
  EXPAND: ChevronDown,
  COLLAPSE: ChevronUp,
} as const;

// Gradient color schemes for consistent styling
export const TOURNAMENT_GRADIENTS = {
  PERFORMANCE: "from-amber-600 to-orange-600",
  VOLUME: "from-blue-600 to-purple-600", 
  BONUSES: "from-emerald-600 to-teal-600",
  
  // Badge gradients
  [BadgeType.FIRST_PR]: "from-amber-600 to-orange-600",
  [BadgeType.CONSISTENCY_KING]: "from-blue-600 to-purple-600",
  [BadgeType.IMPROVEMENT_STAR]: "from-purple-600 to-pink-600",
  [BadgeType.WEEKEND_WARRIOR]: "from-orange-600 to-red-600",
  [BadgeType.CATEGORY_MASTER]: "from-green-600 to-emerald-600",
  [BadgeType.NEWCOMER_BONUS]: "from-teal-600 to-cyan-600",
  [BadgeType.PERFECT_WEEK]: "from-red-600 to-pink-600",
  [BadgeType.VOLUME_CRUSHER]: "from-indigo-600 to-blue-600",
  [BadgeType.CORE_DESTROYER]: "from-emerald-600 to-teal-600",
} as const;

// Helper function to get icon component
export const getTournamentIcon = (iconKey: keyof typeof TOURNAMENT_ICONS) => {
  return TOURNAMENT_ICONS[iconKey];
};

// Helper function to get gradient
export const getTournamentGradient = (gradientKey: keyof typeof TOURNAMENT_GRADIENTS) => {
  return TOURNAMENT_GRADIENTS[gradientKey];
}; 