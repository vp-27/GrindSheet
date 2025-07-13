// Category color system with Apple aesthetics
export interface CategoryColorScheme {
  primary: string;
  light: string;
  gradient: string;
  shadow: string;
  text: string;
  darkText: string;
}

// Apple-inspired color palette for each category (user's preferred mapping)
export const categoryColorSchemes: Record<string, CategoryColorScheme> = {
  // Arms - Blue
  'arms': {
    primary: '#3b82f6', // blue-500
    light: '#dbeafe',   // blue-100
    gradient: 'from-blue-100 to-blue-200',
    shadow: 'shadow-blue-200/50',
    text: 'text-blue-700',
    darkText: 'text-blue-900'
  },
  // Back - Warm Lime Green (more vibrant for category identification)
  'back': {
    primary: '#84cc16', // lime-500 (brighter, more distinctive)
    light: '#f7fee7',   // lime-100
    gradient: 'from-lime-100 to-lime-200',
    shadow: 'shadow-lime-200/50',
    text: 'text-lime-700',
    darkText: 'text-lime-900'
  },
  // Chest - Yellow
  'chest': {
    primary: '#f59e0b', // yellow-500
    light: '#fef9c3',   // yellow-100
    gradient: 'from-yellow-100 to-yellow-200',
    shadow: 'shadow-yellow-200/50',
    text: 'text-yellow-700',
    darkText: 'text-yellow-900'
  },
  // Core - Red
  'core': {
    primary: '#ef4444', // red-500
    light: '#fee2e2',   // red-100
    gradient: 'from-red-100 to-red-200',
    shadow: 'shadow-red-200/50',
    text: 'text-red-700',
    darkText: 'text-red-900'
  },
  // Legs - Purple
  'legs': {
    primary: '#8b5cf6', // purple-500
    light: '#ede9fe',   // purple-100
    gradient: 'from-purple-100 to-purple-200',
    shadow: 'shadow-purple-200/50',
    text: 'text-purple-700',
    darkText: 'text-purple-900'
  },
  // Shoulders - Pink
  'shoulders': {
    primary: '#ec4899', // pink-500
    light: '#fce7f3',   // pink-100
    gradient: 'from-pink-100 to-pink-200',
    shadow: 'shadow-pink-200/50',
    text: 'text-pink-700',
    darkText: 'text-pink-900'
  }
};

// Success indicator color system (separate from categories)
export const successIndicatorColors = {
  // Brand/Action: Cool Teal
  brand: {
    primary: '#0d9488', // teal-600
    light: '#ccfbf1',   // teal-100
    text: 'text-teal-700',
    darkText: 'text-teal-900'
  },
  // Positive Feedback/Progress: Professional Emerald Green
  positive: {
    primary: '#059669', // emerald-600 (more professional for success)
    light: '#d1fae5',   // emerald-100
    text: 'text-emerald-700',
    darkText: 'text-emerald-900'
  },
  // Negative Feedback: Red
  negative: {
    primary: '#ef4444', // red-500
    light: '#fee2e2',   // red-100
    text: 'text-red-700',
    darkText: 'text-red-900'
  }
};

// Get category color scheme by category key (string)
export const getCategoryColors = (categoryKey: string): CategoryColorScheme => {
  return categoryColorSchemes[categoryKey] || {
    primary: '#8E8E93',
    light: '#F2F2F7',
    gradient: 'from-gray-50 to-gray-100',
    shadow: 'shadow-gray-200/50',
    text: 'text-gray-700',
    darkText: 'text-gray-900'
  };
};

// Get array of primary colors for charts (in legend order)
export const getCategoryChartColors = (): string[] => [
  categoryColorSchemes['arms'].primary,
  categoryColorSchemes['back'].primary,
  categoryColorSchemes['chest'].primary,
  categoryColorSchemes['core'].primary,
  categoryColorSchemes['legs'].primary,
  categoryColorSchemes['shoulders'].primary
];

// Utility: get category key from name (case-insensitive)
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
export const generateCategoryClasses = (categoryKey: string) => {
  const colors = getCategoryColors(categoryKey);
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