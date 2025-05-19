import React, { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ProgressChartData } from '@/types';
import { Button } from '@/components/ui/button';
import { History } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { addDays, isBefore, parseISO } from 'date-fns';

interface ProgressChartProps {
  data: ProgressChartData[] | any[];
  title?: string;
  exerciseId?: string;
  categoryId?: string; // Added to track if this is a category view
  multiple?: boolean;
  showPercentage?: boolean;
  weightUnit?: string; // Added to display the correct weight unit
  appleStyle?: boolean; // Added to support Apple iOS styling
  blendWithBackground?: boolean; // New prop for Robinhood-style charts
}

// Define timeframe options
type TimeframeOption = '1W' | '1M' | '3M' | 'ALL';

const ProgressChart: React.FC<ProgressChartProps> = ({ 
  data, 
  title, 
  exerciseId,
  categoryId,
  multiple = false,
  showPercentage = false,
  weightUnit = 'lb',
  appleStyle = false,
  blendWithBackground = false
}) => {
  const navigate = useNavigate();
  const [timeframe, setTimeframe] = useState<TimeframeOption>('ALL');

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">{title || 'Progress'}</CardTitle>
        </CardHeader>
        <CardContent className="h-[200px] flex items-center justify-center">
          <p className="text-gray-500">No progress data available</p>
        </CardContent>
      </Card>
    );
  }

  // Updated colors for Apple-style charts (more muted and elegant)
  const colors = appleStyle 
    ? ['#34C759', '#5AC8FA', '#FF9500', '#FF2D55', '#AF52DE', '#000000']
    : ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  const handleViewHistory = () => {
    if (exerciseId) {
      navigate(`/history?exercise=${exerciseId}`);
    } else if (categoryId) {
      navigate(`/history?category=${categoryId}`);
    } else {
      navigate('/history');
    }
  };

  const formatUnit = showPercentage ? '%' : weightUnit;

  // Container styling for Robinhood-style charts
  const containerStyles = blendWithBackground 
    ? { marginLeft: '-16px', marginRight: '-16px', width: 'calc(100% + 32px)' } 
    : {};

  return (
    <div>
      {title && (
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-base font-medium">{title}</h3>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleViewHistory}
            className="h-8 w-8 p-0"
          >
            <History className="h-4 w-4" />
          </Button>
        </div>
      )}
      <div className={`${blendWithBackground ? 'px-0' : 'p-0'}`} style={containerStyles}>
        <ResponsiveContainer width="100%" height={240}>
          <LineChart
            data={data}
            margin={{
              top: 5,
              right: blendWithBackground ? 0 : 20,
              left: blendWithBackground ? 0 : 0,
              bottom: 5,
            }}
          >
            <CartesianGrid 
              strokeDasharray={blendWithBackground ? "0 0" : appleStyle ? "0 0" : "3 3"} 
              stroke={blendWithBackground ? "transparent" : appleStyle ? "#f5f5f7" : "#eee"} 
              vertical={!blendWithBackground && !appleStyle}
            />
            <XAxis 
              dataKey="date" 
              tick={{ fontSize: 10, fill: appleStyle ? '#8E8E93' : undefined }}
              tickFormatter={(value) => {
                const date = new Date(value);
                return `${date.getMonth() + 1}/${date.getDate()}`;
              }}
              axisLine={!blendWithBackground && !appleStyle}
              tickLine={!blendWithBackground && !appleStyle}
              hide={blendWithBackground}
            />
            <YAxis 
              tickFormatter={(value) => `${value}${formatUnit}`}
              tick={{ fontSize: 10, fill: appleStyle ? '#8E8E93' : undefined }}
              axisLine={!blendWithBackground && !appleStyle}
              tickLine={!blendWithBackground && !appleStyle}
              hide={blendWithBackground}
            />
            <Tooltip 
              formatter={(value, name) => {
                // For category view, display the name as is
                // For percentage view, append %
                // For weight view, append unit
                const displayName = multiple ? name : (showPercentage ? 'Progress' : 'Weight');
                return [`${value}${formatUnit}`, displayName];
              }}
              labelFormatter={(value) => `Date: ${value}`}
              contentStyle={appleStyle || blendWithBackground ? { 
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                borderRadius: '10px',
                border: 'none', 
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                padding: '8px 12px'
              } : undefined}
            />
            {multiple && !blendWithBackground && (
              <Legend wrapperStyle={appleStyle ? { fontSize: '11px', color: '#8E8E93' } : undefined} />
            )}
            {multiple ? (
              <>
                {Object.keys(data[0])
                  .filter(key => key !== 'date')
                  .map((key, index) => (
                    <Line
                      key={key}
                      type="monotone"
                      dataKey={key}
                      name={key}
                      stroke={colors[index % colors.length]}
                      strokeWidth={blendWithBackground ? 2 : appleStyle ? 1.5 : 2}
                      dot={blendWithBackground ? false : appleStyle ? false : { r: 3 }}
                      activeDot={blendWithBackground ? { r: 4 } : appleStyle ? { r: 4, strokeWidth: 0 } : { r: 5 }}
                    />
                  ))}
              </>
            ) : (
              <Line
                type="monotone"
                dataKey={showPercentage ? "percentGain" : "weight"}
                stroke={appleStyle ? "#34C759" : "#3b82f6"}
                strokeWidth={blendWithBackground ? 2 : appleStyle ? 1.5 : 2}
                dot={blendWithBackground ? false : appleStyle ? false : { r: 3 }}
                activeDot={blendWithBackground ? { r: 4 } : appleStyle ? { r: 4, strokeWidth: 0 } : { r: 5 }}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default ProgressChart;
