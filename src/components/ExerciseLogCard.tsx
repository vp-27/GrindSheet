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
  categoryColor?: string;
  showExerciseName?: boolean;
  showDate?: boolean;

  onEdit: (log: any) => void;
  onDelete: (logId: string) => void;
}

const ExerciseLogCard: React.FC<ExerciseLogCardProps> = ({
  log,
  exerciseName,
  categoryColor = '#10b981',
  showExerciseName = true,
  showDate = true,
  onEdit,
  onDelete
}) => {
  // Convert hex color to category class name
  const getCategoryClass = (color: string) => {
    const colorMap: Record<string, string> = {
      '#3b82f6': 'category-arms',
      '#10b981': 'category-back', 
      '#f59e0b': 'category-chest',
      '#ef4444': 'category-core',
      '#8b5cf6': 'category-legs',
      '#ec4899': 'category-shoulders'
    };
    return colorMap[color] || 'category-default';
  };

  return (
    <div className={`apple-health-card transition-all duration-200 active:shadow-lg active:scale-98 ${getCategoryClass(categoryColor)}`}>
      {/* Top row: Exercise name + Time + Action buttons */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1 min-w-0">
          {showExerciseName && exerciseName && (
            <h3 className="apple-health-card-title truncate mb-2">{exerciseName}</h3>
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
            className="h-8 w-8 rounded-lg border-border/50 active:bg-muted active:border-primary/30 transition-all duration-200 shadow-sm" 
            onClick={(e) => {
              e.stopPropagation();
              onEdit(log);
            }}
            aria-label="Edit exercise log"
          >
            <Pencil className="h-3 w-3" />
          </Button>
          <Button 
            variant="outline" 
            size="icon"
            className="h-8 w-8 rounded-lg border-border/50 text-red-500 active:text-red-600 active:bg-red-50 active:border-red-200 transition-all duration-200 shadow-sm" 
            onClick={(e) => {
              e.stopPropagation();
              onDelete(log.id);
            }}
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
