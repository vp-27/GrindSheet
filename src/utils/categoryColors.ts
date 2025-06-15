
import { Category } from '@/types';

// Category color system with Apple aesthetics
export interface CategoryColorScheme {
  primary: string;
  light: string;
  gradient: string;
  shadow: string;
  text: string;
  darkText: string;
}

// Default fallback colors (Apple-inspired)
const defaultColors: CategoryColorScheme = {
  primary: '#8E8E93',
  light: '#F2F2F7',
  gradient: 'from-gray-50 to-gray-100',
  shadow: 'shadow-gray-200/50',
  text: 'text-gray-700',
  darkText: 'text-gray-900'
};

// Get category color scheme from database category object
export const getCategoryColors = (category: Category | null): CategoryColorScheme => {
  if (!category) return defaultColors;
  
  return {
    primary: category.primary_color || defaultColors.primary,
    light: category.light_color || defaultColors.light,
    gradient: `${category.gradient_from || 'from-gray-50'} ${category.gradient_to || 'to-gray-100'}`,
    shadow: category.shadow_color || defaultColors.shadow,
    text: category.text_color || defaultColors.text,
    darkText: category.dark_text_color || defaultColors.darkText
  };
};

// Get category colors by category ID from categories array
export const getCategoryColorsById = (categoryId: string, categories: Category[]): CategoryColorScheme => {
  const category = categories.find(cat => cat.id === categoryId);
  return getCategoryColors(category || null);
};

// Get array of primary colors for charts from categories array
export const getCategoryChartColors = (categories: Category[]): string[] => {
  return categories.map(category => category.primary_color || defaultColors.primary);
};

// Utility: get category key from name (case-insensitive) - DEPRECATED, kept for backward compatibility
export const getCategoryKeyByName = (name: string): string => {
  const map: Record<string, string> = {
    'arms': 'arms',
    'back': 'back',
    'chest': 'chest',
    'core': 'core',
    'legs': 'legs',
    'shoulders': 'shoulders'
  };
  return map[name.toLowerCase()] || 'arms';
};

// Apple-style utility classes generator
export const generateCategoryClasses = (colors: CategoryColorScheme) => {
  return {
    bgPrimary: `bg-[${colors.primary}]`,
    bgLight: `bg-[${colors.light}]`,
    bgGradient: `bg-gradient-to-br ${colors.gradient}`,
    textPrimary: `text-[${colors.primary}]`,
    textLight: colors.text,
    textDark: colors.darkText,
    borderPrimary: `border-[${colors.primary}]`,
    borderLight: `border-[${colors.light}]`,
    shadow: colors.shadow,
    badge: `inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[${colors.light}] ${colors.text}`,
    pill: `rounded-full bg-[${colors.primary}] text-white`,
    island: `rounded-2xl bg-[${colors.light}] backdrop-blur-sm border border-white/20 ${colors.shadow}`,
    card: `rounded-xl bg-white/80 backdrop-blur-sm border border-[${colors.light}] ${colors.shadow}`,
    hoverBg: `hover:bg-[${colors.light}]`,
    hoverBorder: `hover:border-[${colors.primary}]`,
    hoverShadow: `hover:${colors.shadow}`,
    activeBg: `active:bg-[${colors.primary}]`,
    activeText: 'active:text-white',
    focusRing: `focus:ring-2 focus:ring-[${colors.primary}]/20 focus:border-[${colors.primary}]`
  };
};
