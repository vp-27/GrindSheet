import React, { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ProgressChartData } from '@/types';
import { Button } from '@/components/ui/button';
import { History } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { addDays, isBefore, parseISO } from 'date-fns';
import './ProgressChart.css';

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
  customColors?: string[]; // Allow custom colors to be passed in
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
  blendWithBackground = false,
  customColors
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
  const colors = customColors || (appleStyle 
    ? ['#34C759', '#5AC8FA', '#FF9500', '#FF2D55', '#AF52DE', '#000000']
    : ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']);

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

  // Clean, minimal dot at the end of each line
  const renderEndDot = (lineKey: string) => (props: any) => {
    const { cx, cy, index, payload, stroke } = props;
    // Defensive: if cx/cy are not numbers, don't render
    if (typeof cx !== 'number' || typeof cy !== 'number') return null;
    // Find the last non-null index for this lineKey
    let lastIndex = -1;
    for (let i = data.length - 1; i >= 0; i--) {
      if (data[i][lineKey] !== null && data[i][lineKey] !== undefined) {
        lastIndex = i;
        break;
      }
    }
    if (index === lastIndex) {
      return (
        <circle
          cx={cx}
          cy={cy}
          r={3}
          fill={stroke}
          className="progresschart-dot-clean"
        />
      );
    }
    return null;
  };

  return (
    <div className="progresschart-container">
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
      <div className={`${blendWithBackground ? 'px-0' : 'p-0'}`}>
        <ResponsiveContainer width="100%" height={240}>
          <LineChart
            data={data}
            margin={{
              top: 15, // Increased to prevent dot clipping
              right: 15, // Increased to prevent dot clipping
              left: 10,
              bottom: 15, // Increased to prevent dot clipping
            }}
          >
            <CartesianGrid 
              strokeDasharray={blendWithBackground ? "0 0" : appleStyle ? "0 0" : "3 3"} 
              stroke={blendWithBackground ? "transparent" : appleStyle ? "#f5f5f7" : "#eee"} 
              vertical={!blendWithBackground && !appleStyle}
            />
            <XAxis 
              dataKey="date" 
              tick={{ fontSize: 10, fill: appleStyle ? '#8E8E93' : '#6B7280' }}
              tickFormatter={(value) => {
                const date = new Date(value);
                return `${date.getMonth() + 1}/${date.getDate()}`;
              }}
              axisLine={!appleStyle}
              tickLine={!appleStyle}
              hide={false} // Always show X-axis for clarity
            />
            <YAxis 
              tickFormatter={(value) => `${value}${formatUnit}`}
              tick={{ fontSize: 10, fill: appleStyle ? '#8E8E93' : '#6B7280' }}
              axisLine={!appleStyle}
              tickLine={!appleStyle}
              hide={false} // Always show Y-axis for clarity
              domain={showPercentage ? ['dataMin', 'dataMax'] : ['dataMin', 'dataMax']} // Keep percentage charts within data range, not forced to 100%
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
            {multiple && !showPercentage && (
              <Legend 
                layout="horizontal"
                align="center"
                verticalAlign="bottom"
                wrapperStyle={{
                  fontSize: '13px',
                  color: appleStyle ? '#8E8E93' : '#374151',
                  paddingTop: '12px',
                  fontWeight: '500',
                  display: 'flex',
                  flexWrap: 'wrap',
                  justifyContent: 'center',
                  gap: '16px'
                }}
                iconType="line"
              />
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
                      strokeWidth={blendWithBackground ? 2 : appleStyle ? 1.8 : 2}
                      dot={renderEndDot(key)}
                      activeDot={false}
                      animationDuration={800}
                      animationBegin={index * 100} // Reduced stagger time
                    />
                  ))}
              </>
            ) : (
              <Line
                type="monotone"
                dataKey={showPercentage ? "percentGain" : "weight"}
                stroke={appleStyle ? "#34C759" : "#3b82f6"}
                strokeWidth={blendWithBackground ? 2 : appleStyle ? 1.8 : 2}
                dot={renderEndDot(showPercentage ? "percentGain" : "weight")}
                activeDot={false}
                animationDuration={800}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default ProgressChart;
