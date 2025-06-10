import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, Calendar, Activity } from 'lucide-react';
import { format } from 'date-fns';

interface ChartTooltipCardProps {
  hoverData: any;
  showPercentage?: boolean;
  weightUnit?: string;
  multiple?: boolean;
}

const ChartTooltipCard: React.FC<ChartTooltipCardProps> = ({ 
  hoverData, 
  showPercentage = false,
  weightUnit = 'lbs',
  multiple = false
}) => {
  if (!hoverData) {
    return null;
  }

  const { date, data } = hoverData;
  
  // Format the date nicely
  const formattedDate = format(new Date(date), 'MMM d, yyyy');
  
  // Get the data keys (excluding 'date')
  const dataKeys = Object.keys(data).filter(key => key !== 'date');
  
  return (
    <Card className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-950/30 dark:via-indigo-950/30 dark:to-purple-950/30 border-blue-200/50 dark:border-blue-800/50 rounded-xl backdrop-blur-sm">
      <CardContent className="p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
            <Calendar className="h-4 w-4 text-white" />
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
            
            return (
              <div key={key} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ 
                      backgroundColor: multiple ? 
                        ['#34C759', '#5AC8FA', '#FF9500', '#FF2D55', '#AF52DE', '#000000'][index % 6] : 
                        '#34C759'
                    }}
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
        
        <div className="mt-3 pt-3 border-t border-border/50">
          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <Activity className="h-3 w-3" />
            <span>Hover over chart to explore data</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ChartTooltipCard;
