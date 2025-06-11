import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { format } from 'date-fns';

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
  
  // Format the date more compactly for mobile
  const formattedDate = format(new Date(date), 'MMM d');
  
  // Get the data keys (excluding 'date')
  const dataKeys = Object.keys(data).filter(key => key !== 'date');
  
  // Use colors from hover data first, then custom colors, then fallback to defaults
  const colors = hoverColors || customColors || ['#34C759', '#5AC8FA', '#FF9500', '#FF2D55', '#AF52DE', '#000000'];
  
  return (
    <Card className="bg-background/95 dark:bg-background/95 border border-border/50 rounded-lg backdrop-blur-sm shadow-lg">
      <CardContent className="p-3">
        {/* Compact header with just date */}
        <div className="flex items-center gap-2 mb-3">
          <div className="w-2 h-2 bg-primary rounded-full"></div>
          <span className="text-sm font-medium text-foreground">{formattedDate}</span>
        </div>
        
        {/* Compact data rows */}
        <div className="space-y-1.5">
          {dataKeys.map((key, index) => {
            const value = data[key];
            const formatUnit = showPercentage ? '%' : weightUnit;
            const color = colors[index % colors.length];
            
            return (
              <div key={key} className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <div 
                    className="w-2 h-2 rounded-full chart-tooltip-indicator flex-shrink-0"
                    data-color={color}
                  />
                  <span className="text-xs font-medium text-muted-foreground truncate">
                    {multiple ? key : (showPercentage ? 'Progress' : 'Weight')}
                  </span>
                </div>
                <div className="flex items-baseline gap-0.5 flex-shrink-0">
                  <span 
                    className="text-sm font-bold chart-tooltip-value"
                    data-color={color}
                  >
                    {typeof value === 'number' ? value.toFixed(1) : value}
                  </span>
                  <span 
                    className="text-xs chart-tooltip-unit"
                    data-color={color}
                  >
                    {formatUnit}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default ChartTooltipCard;
