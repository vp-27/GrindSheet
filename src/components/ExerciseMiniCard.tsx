import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Pencil, Trash2 } from 'lucide-react';
import { getCategoryColors, getCategoryKeyByName } from '@/utils/categoryColors';

interface ExerciseMiniCardProps {
  exercise: {
    id: string;
    name: string;
    description?: string;
    category_id: string;
  };
  category?: {
    id: string;
    name: string;
  };
  onEdit: () => void;
  onDelete: () => void;
}

const ExerciseMiniCard: React.FC<ExerciseMiniCardProps> = ({ 
  exercise, 
  category, 
  onEdit, 
  onDelete 
}) => {
  const categoryKey = category ? getCategoryKeyByName(category.name) : 'default';

  return (
    <Card className={`exercise-card exercise-card--${categoryKey} hover:shadow-md transition-all duration-200 border-border/60 hover:border-border`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h4 className="font-medium text-foreground text-sm">{exercise.name}</h4>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-xs text-muted-foreground">
                {exercise.description || 'No description'}
              </p>
              <span className="text-xs text-muted-foreground">•</span>
              <span className={`exercise-badge exercise-badge--${categoryKey} text-xs font-medium px-2 py-0.5 rounded-full`}>
                {category?.name || 'Uncategorized'}
              </span>
            </div>
          </div>
          <div className="flex gap-1 ml-3">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={onEdit}
              className="h-7 w-7 rounded-lg hover:bg-muted/60 text-muted-foreground hover:text-foreground"
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={onDelete}
              className="h-7 w-7 rounded-lg text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ExerciseMiniCard;
