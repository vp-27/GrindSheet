
-- Add color fields to the categories table
ALTER TABLE public.categories 
ADD COLUMN primary_color TEXT DEFAULT '#8E8E93',
ADD COLUMN light_color TEXT DEFAULT '#F2F2F7',
ADD COLUMN gradient_from TEXT DEFAULT 'from-gray-50',
ADD COLUMN gradient_to TEXT DEFAULT 'to-gray-100',
ADD COLUMN shadow_color TEXT DEFAULT 'shadow-gray-200/50',
ADD COLUMN text_color TEXT DEFAULT 'text-gray-700',
ADD COLUMN dark_text_color TEXT DEFAULT 'text-gray-900';

-- Update existing categories with the current hardcoded colors
-- Arms - Blue
UPDATE public.categories 
SET 
  primary_color = '#3b82f6',
  light_color = '#dbeafe',
  gradient_from = 'from-blue-100',
  gradient_to = 'to-blue-200',
  shadow_color = 'shadow-blue-200/50',
  text_color = 'text-blue-700',
  dark_text_color = 'text-blue-900'
WHERE LOWER(name) = 'arms';

-- Back - Green
UPDATE public.categories 
SET 
  primary_color = '#10b981',
  light_color = '#d1fae5',
  gradient_from = 'from-green-100',
  gradient_to = 'to-green-200',
  shadow_color = 'shadow-green-200/50',
  text_color = 'text-green-700',
  dark_text_color = 'text-green-900'
WHERE LOWER(name) = 'back';

-- Chest - Yellow
UPDATE public.categories 
SET 
  primary_color = '#f59e0b',
  light_color = '#fef9c3',
  gradient_from = 'from-yellow-100',
  gradient_to = 'to-yellow-200',
  shadow_color = 'shadow-yellow-200/50',
  text_color = 'text-yellow-700',
  dark_text_color = 'text-yellow-900'
WHERE LOWER(name) = 'chest';

-- Core - Red
UPDATE public.categories 
SET 
  primary_color = '#ef4444',
  light_color = '#fee2e2',
  gradient_from = 'from-red-100',
  gradient_to = 'to-red-200',
  shadow_color = 'shadow-red-200/50',
  text_color = 'text-red-700',
  dark_text_color = 'text-red-900'
WHERE LOWER(name) = 'core';

-- Legs - Purple
UPDATE public.categories 
SET 
  primary_color = '#8b5cf6',
  light_color = '#ede9fe',
  gradient_from = 'from-purple-100',
  gradient_to = 'to-purple-200',
  shadow_color = 'shadow-purple-200/50',
  text_color = 'text-purple-700',
  dark_text_color = 'text-purple-900'
WHERE LOWER(name) = 'legs';

-- Shoulders - Pink
UPDATE public.categories 
SET 
  primary_color = '#ec4899',
  light_color = '#fce7f3',
  gradient_from = 'from-pink-100',
  gradient_to = 'to-pink-200',
  shadow_color = 'shadow-pink-200/50',
  text_color = 'text-pink-700',
  dark_text_color = 'text-pink-900'
WHERE LOWER(name) = 'shoulders';
