import type { ExerciseLog } from "@/types";
import React from "react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Clock, Pencil, Trash2, X } from "lucide-react";
import AnimatedCounter from "@/components/ui/animated-counter";

interface ExerciseLogCardProps {
  log: ExerciseLog;
  exerciseName?: string;
  categoryColor?: string;
  showExerciseName?: boolean;
  showDate?: boolean;
  showTime?: boolean;

  onEdit: (log: ExerciseLog) => void;
  onDelete: (logId: string) => void;
}

const ExerciseLogCard: React.FC<ExerciseLogCardProps> = ({
  log,
  exerciseName,
  categoryColor = "#10b981",
  showExerciseName = true,
  showDate = true,
  showTime = false,
  onEdit,
  onDelete,
}) => {
  // Convert hex color to category class name
  const getCategoryClass = (color: string) => {
    const colorMap: Record<string, string> = {
      "#3b82f6": "category-arms",
      "#10b981": "category-back",
      "#f59e0b": "category-chest",
      "#ef4444": "category-core",
      "#8b5cf6": "category-legs",
      "#ec4899": "category-shoulders",
    };
    return colorMap[color] || "category-default";
  };

  return (
    <div
      className={`apple-health-card transition-all duration-200 active:shadow-lg active:scale-98 ${getCategoryClass(categoryColor)}`}
    >
      {/* Top row: Exercise name + Time + Action buttons */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1 min-w-0">
          {showExerciseName && exerciseName && (
            <h3 className="apple-health-card-title truncate mb-2">
              {exerciseName}
            </h3>
          )}

          {(showDate || showTime) && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="w-3 h-3 flex-shrink-0" />
              <span>
                {showDate &&
                  !showTime &&
                  format(
                    new Date(log.timestamp),
                    "EEEE, MMMM d, yyyy 'at' h:mm a",
                  )}
                {showTime &&
                  !showDate &&
                  format(new Date(log.timestamp), "h:mm a")}
                {showDate &&
                  showTime &&
                  format(
                    new Date(log.timestamp),
                    "EEEE, MMMM d, yyyy 'at' h:mm a",
                  )}
              </span>
            </div>
          )}
        </div>

        {/* Action Buttons - Always visible for mobile optimization */}
        <div className="flex gap-2">
          <Button
            size="icon"
            className="h-8 w-8 rounded-full bg-[#14b8a6] text-white shadow-md hover:bg-[#10b981] active:bg-[#0e9e6e] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#14b8a6]/40"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(log);
            }}
            aria-label="Edit exercise log"
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            className="h-8 w-8 rounded-full bg-red-500 text-white shadow-md hover:bg-red-600 active:bg-red-700 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-red-500/40"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(log.id);
            }}
            aria-label="Delete exercise log"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Bottom row: Weight display + Note */}
      <div className="flex items-end justify-between">
        <div>
          <div className="apple-health-weight-display">
            <AnimatedCounter
              value={log.weight}
              formatValue={(val) =>
                val % 1 === 0 ? val.toString() : val.toFixed(1)
              }
              duration={600}
              className="tabular-nums"
            />
          </div>
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
