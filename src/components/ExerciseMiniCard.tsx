import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Pencil, Trash2 } from 'lucide-react';
import { getCategoryColors, getCategoryKeyByName } from '@/utils/categoryColors';
import { useIsMobile } from '@/hooks/use-mobile';

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
  canDelete?: boolean;
}

const ExerciseMiniCard: React.FC<ExerciseMiniCardProps> = ({ 
  exercise, 
  category, 
  onEdit, 
  onDelete,
  canDelete = true
}) => {
  const isMobile = useIsMobile();
  const categoryKey = category ? getCategoryKeyByName(category.name) : 'default';

  return (
    <Card className={`exercise-card exercise-card--${categoryKey} hover:shadow-md transition-all duration-200 border-border/60 hover:border-border`}>
      <CardContent className={`${isMobile ? 'p-4' : 'p-4'}`}>
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h4 className={`font-medium text-foreground ${isMobile ? 'text-base' : 'text-sm'}`}>{exercise.name}</h4>
              {!canDelete && (
                <span className="text-xs px-2 py-0.5 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 rounded-full font-medium">
                  Protected
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-1">
              <p className={`text-muted-foreground ${isMobile ? 'text-sm' : 'text-xs'}`}>
                {exercise.description || 'No description'}
                {!canDelete && (
                  <span className="text-orange-600 dark:text-orange-400 ml-2">• Used by others</span>
                )}
              </p>
              <span className={`text-muted-foreground ${isMobile ? 'text-sm' : 'text-xs'}`}>•</span>
              <span className={`exercise-badge exercise-badge--${categoryKey} ${isMobile ? 'text-sm' : 'text-xs'} font-medium px-2 py-0.5 rounded-full`}>
                {category?.name || 'Uncategorized'}
              </span>
            </div>
          </div>
          <div className={`flex ${isMobile ? 'gap-2' : 'gap-1'} ml-3`}>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={onEdit}
              className={`${isMobile ? 'h-11 w-11' : 'h-7 w-7'} rounded-lg hover:bg-muted/60 text-muted-foreground hover:text-foreground`}
            >
              <Pencil className={`${isMobile ? 'h-5 w-5' : 'h-3.5 w-3.5'}`} />
            </Button>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={onDelete}
              disabled={!canDelete}
              className={`${isMobile ? 'h-11 w-11' : 'h-7 w-7'} rounded-lg ${
                canDelete 
                  ? 'text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30' 
                  : 'text-muted-foreground/40 cursor-not-allowed'
              }`}
              title={canDelete ? 'Delete exercise' : 'Cannot delete - used by other users'}
            >
              <Trash2 className={`${isMobile ? 'h-5 w-5' : 'h-3.5 w-3.5'}`} />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ExerciseMiniCard;
