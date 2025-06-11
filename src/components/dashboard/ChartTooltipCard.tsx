import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, Calendar, Activity } from 'lucide-react';
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
  
  // Format the date nicely
  const formattedDate = format(new Date(date), 'MMM d, yyyy');
  
  // Get the data keys (excluding 'date')
  const dataKeys = Object.keys(data).filter(key => key !== 'date');
  
  // Use colors from hover data first, then custom colors, then fallback to defaults
  const colors = hoverColors || customColors || ['#34C759', '#5AC8FA', '#FF9500', '#FF2D55', '#AF52DE', '#000000'];
  
  return (
    <Card className="bg-gradient-to-r from-purple-50 via-blue-50 to-indigo-50 dark:from-purple-950/30 dark:via-blue-950/30 dark:to-indigo-950/30 border-purple-200/50 dark:border-purple-800/50 rounded-xl backdrop-blur-sm">
      <CardContent className="p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full flex items-center justify-center">
            <TrendingUp className="h-4 w-4 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">{formattedDate}</h3>
            <p className="text-xs text-muted-foreground">Chart data point</p>
          </div>
        </div>
        
        <div className="space-y-2">
          {dataKeys.map((key, index) => {
            const value = data[key];
            const formatUnit = showPercentage ? '%' : weightUnit;
            const color = colors[index % colors.length];
            
            return (
              <div key={key} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full chart-tooltip-indicator"
                    data-color={color}
                  />
                  <span className="text-sm font-medium text-foreground">
                    {multiple ? key : (showPercentage ? 'Progress' : 'Weight')}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-lg font-bold text-foreground">
                    {typeof value === 'number' ? value.toFixed(1) : value}
                  </span>
                  <span className="text-sm text-muted-foreground">{formatUnit}</span>
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
