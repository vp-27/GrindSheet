import React from 'react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Clock, Pencil, Trash2 } from 'lucide-react';

interface ExerciseLogCardProps {
  log: {
    id: string;
    exerciseId: string;
    weight: number;
    timestamp: string;
    note?: string;
  };
  exerciseName?: string;
  category?: {
    id: string;
    name: string;
  };
  categoryColor?: string;
  showExerciseName?: boolean;
  showDate?: boolean;
  showCategoryBadge?: boolean;
  onEdit: (log: any) => void;
  onDelete: (logId: string) => void;
}

const ExerciseLogCard: React.FC<ExerciseLogCardProps> = ({
  log,
  exerciseName,
  category,
  categoryColor = '#10b981',
  showExerciseName = true,
  showDate = true,
  showCategoryBadge = false,
  onEdit,
  onDelete
}) => {
  // Calculate RGB values from hex color for CSS custom properties
  const categoryColorRgb = categoryColor.replace('#', '').match(/.{2}/g)?.map(hex => parseInt(hex, 16)).join(', ') || '16, 185, 129';

  return (
    <div 
      className="apple-health-card transition-all duration-200 hover:shadow-lg"
      style={{
        '--category-color': categoryColor,
        '--category-color-rgb': categoryColorRgb
      } as React.CSSProperties}
    >
      {/* Top row: Exercise name + Time + Action buttons */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1 min-w-0">
          {showExerciseName && exerciseName && (
            <div className="mb-2">
              <h3 className="apple-health-card-title truncate">{exerciseName}</h3>
              {/* Category badge moved below exercise name */}
              {category && (
                <div 
                  className="category-badge mt-1 inline-block"
                  style={{
                    '--category-color': categoryColor,
                    '--category-color-rgb': categoryColorRgb
                  } as React.CSSProperties}
                >
                  {category.name}
                </div>
              )}
            </div>
          )}
          
          {showDate && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="w-3 h-3 flex-shrink-0" />
              <span>{format(new Date(log.timestamp), showExerciseName ? 'h:mm a' : 'EEEE, MMMM d, yyyy \'at\' h:mm a')}</span>
            </div>
          )}
        </div>
        
        {/* Action Buttons - Always visible for mobile optimization */}
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="icon"
            className="h-8 w-8 rounded-lg border-border/50 hover:bg-muted hover:border-primary/30 transition-all duration-200 shadow-sm" 
            onClick={() => onEdit(log)}
            aria-label="Edit exercise log"
          >
            <Pencil className="h-3 w-3" />
          </Button>
          <Button 
            variant="outline" 
            size="icon"
            className="h-8 w-8 rounded-lg border-border/50 text-red-500 hover:text-red-600 hover:bg-red-50 hover:border-red-200 transition-all duration-200 shadow-sm" 
            onClick={() => onDelete(log.id)}
            aria-label="Delete exercise log"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Bottom row: Weight display + Note */}
      <div className="flex items-end justify-between">
        <div>
          <p className="apple-health-weight-display">{log.weight}</p>
          <p className="apple-health-weight-unit">lbs</p>
        </div>
        
        {/* Progress indicator space - could be extended later */}
        <div className="flex items-center gap-2">
          {/* Future: Progress badges, PR indicators, etc. */}
        </div>
      </div>

      {/* Note section - Full width at bottom */}
      {log.note && (
        <div className="mt-4 pt-4 border-t border-border/50">
          <div className="text-sm text-muted-foreground p-3 bg-muted/20 rounded-lg border border-border/30">
            {log.note}
          </div>
        </div>
      )}
    </div>
  );
};

export default ExerciseLogCard;
