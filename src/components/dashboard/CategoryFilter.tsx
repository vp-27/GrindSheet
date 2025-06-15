import React from 'react';
import { Category } from '@/types';
import { cn } from '@/lib/utils';
import { getCategoryColors } from '@/utils/categoryColors';

interface CategoryFilterProps {
  categories: Category[];
  selectedCategoryId: string | null;
  onSelectCategory: (categoryId: string | null) => void;
}

const CategoryFilter: React.FC<CategoryFilterProps> = ({ 
  categories, 
  selectedCategoryId, 
  onSelectCategory 
}) => {
  return (
    <div className="flex items-center overflow-x-auto py-2 gap-2 scrollbar-none">
      <button
        className={cn(
          "px-3 py-1 text-sm rounded-full whitespace-nowrap transition-colors",
          selectedCategoryId === null
            ? "bg-primary text-primary-foreground"
            : "bg-secondary text-secondary-foreground hover:bg-muted"
        )}
        onClick={() => onSelectCategory(null)}
      >
        All
      </button>
      
      {categories.map((category) => {
        const colors = getCategoryColors(category);
        const isSelected = selectedCategoryId === category.id;
        
        return (
          <button
            key={category.id}
            className={cn(
              "px-3 py-1 text-sm rounded-full whitespace-nowrap transition-colors border",
              isSelected 
                ? "text-white border-transparent" 
                : "border-transparent hover:opacity-80"
            )}
            style={isSelected ? {
             backgroundColor: colors.primary,
             color: 'white',
             borderColor: colors.primary + "55"
            } : {
             backgroundColor: `${colors.primary}15`,
             color: colors.primary,
             borderColor: `${colors.primary}30`
            }}
            onClick={() => onSelectCategory(category.id)}
          >
            {category.name}
          </button>
        );
      })}
    </div>
  );
};

export default CategoryFilter;
