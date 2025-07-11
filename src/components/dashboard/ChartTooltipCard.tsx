import React from 'react';
import { format } from 'date-fns';
import AnimatedCounter from '@/components/ui/animated-counter';

interface ChartTooltipCardProps {
  hoverData: any;
  showPercentage?: boolean;
  weightUnit?: string;
  multiple?: boolean;
  customColors?: string[];
}

const ChartTooltipCard: React.FC<ChartTooltipCardProps> = ({ 
  hoverData, 
  showPercentage = false,
  weightUnit = 'lbs',
  multiple = false,
  customColors
}) => {
  if (!hoverData) {
    return null;
  }

  const { date, data, colors: hoverColors } = hoverData;
  const formattedDate = format(new Date(date), 'MMM d');
  const dataKeys = Object.keys(data).filter(key => key !== 'date');
  const colors = hoverColors || customColors || ['#34C759', '#5AC8FA', '#FF9500', '#FF2D55', '#AF52DE', '#000000'];

  return (
    <div className="flex items-center gap-4 px-3 py-2 rounded-2xl bg-background/50 backdrop-blur-md border border-border/20 shadow-lg">
      {/* Date */}
      <div className="text-sm font-semibold text-foreground pr-3 border-r border-border/50">
        {formattedDate}
      </div>
      
      {/* Data Points */}
      <div className="flex items-center gap-x-4 gap-y-1 flex-wrap">
        {dataKeys.map((key, index) => {
          const value = data[key];
          const formatUnit = showPercentage ? '%' : 'lbs';
          const color = colors[index % colors.length];

          return (
            <div key={key} className="flex items-center gap-2">
              <div 
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: color }}
              />
              <div className="flex items-baseline gap-1">
                <span className="text-sm font-medium text-foreground whitespace-nowrap">
                  <AnimatedCounter 
                    value={typeof value === 'number' ? value : 0}
                    formatValue={(val) => val % 1 === 0 ? val.toString() : val.toFixed(1)}
                    duration={300}
                    className="tabular-nums"
                  />
                  <span className="text-xs text-muted-foreground">{formatUnit}</span>
                </span>
                {multiple && (
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {key}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ChartTooltipCard;
