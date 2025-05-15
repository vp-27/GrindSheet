
import React from 'react';
import { Category } from '@/types';
import { cn } from '@/lib/utils';

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
          "px-3 py-1 text-sm rounded-full whitespace-nowrap",
          selectedCategoryId === null
            ? "bg-primary text-primary-foreground"
            : "bg-secondary text-secondary-foreground"
        )}
        onClick={() => onSelectCategory(null)}
      >
        All
      </button>
      
      {categories.map((category) => (
        <button
          key={category.id}
          className={cn(
            "px-3 py-1 text-sm rounded-full whitespace-nowrap",
            selectedCategoryId === category.id
              ? "bg-primary text-primary-foreground"
              : "bg-secondary text-secondary-foreground"
          )}
          onClick={() => onSelectCategory(category.id)}
        >
          {category.name}
        </button>
      ))}
    </div>
  );
};

export default CategoryFilter;
