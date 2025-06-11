import React from 'react';
import { format } from 'date-fns';
import { useIsMobile } from '@/hooks/use-mobile';

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
  const isMobile = useIsMobile();
  
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
   // For mobile, use horizontal layout when multiple items or optimize single item
  if (isMobile) {
    return (
      <div className="py-1.5 space-y-1">
        {/* Clean date header */}
        <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          {formattedDate}
        </div>
        
        {dataKeys.length === 1 ? (
          // Single item - inline value with label
          <div className="flex items-center gap-2">
            <div 
              className="w-3 h-3 rounded-sm chart-tooltip-indicator"
              data-color={colors[0]}
            />
            <span className="text-sm font-medium text-foreground">
              {multiple ? dataKeys[0] : (showPercentage ? 'Progress' : 'Weight')}:
            </span>
            <span 
              className="text-lg font-bold chart-tooltip-value"
              data-color={colors[0]}
            >
              {typeof data[dataKeys[0]] === 'number' ? data[dataKeys[0]].toFixed(1) : data[dataKeys[0]]}{showPercentage ? '%' : weightUnit}
            </span>
          </div>
        ) : (
          // Multiple items - clean inline layout
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            {dataKeys.map((key, index) => {
              const value = data[key];
              const formatUnit = showPercentage ? '%' : weightUnit;
              const color = colors[index % colors.length];
              
              return (
                <div key={key} className="flex items-center gap-1.5">
                  <div 
                    className="w-2.5 h-2.5 rounded-sm chart-tooltip-indicator"
                    data-color={color}
                  />
                  <span className="text-xs font-medium text-muted-foreground">
                    {multiple ? key : (showPercentage ? 'Progress' : 'Weight')}:
                  </span>
                  <span 
                    className="text-sm font-bold chart-tooltip-value"
                    data-color={color}
                  >
                    {typeof value === 'number' ? value.toFixed(1) : value}{formatUnit}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }
  
  // Desktop version - clean inline layout
  return (
    <div className="py-2 space-y-1.5">
      {/* Clean date header */}
      <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
        {formattedDate}
      </div>
      
      {/* Clean data rows - inline values */}
      <div className="space-y-1">
        {dataKeys.map((key, index) => {
          const value = data[key];
          const formatUnit = showPercentage ? '%' : weightUnit;
          const color = colors[index % colors.length];
          
          return (
            <div key={key} className="flex items-center gap-2">
              <div 
                className="w-2.5 h-2.5 rounded-sm chart-tooltip-indicator flex-shrink-0"
                data-color={color}
              />
              <span className="text-sm font-medium text-foreground">
                {multiple ? key : (showPercentage ? 'Progress' : 'Weight')}:
              </span>
              <span 
                className="text-base font-bold chart-tooltip-value"
                data-color={color}
              >
                {typeof value === 'number' ? value.toFixed(1) : value}{formatUnit}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ChartTooltipCard;
