import React, { useState, useMemo, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Area } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ProgressChartData } from '@/types';
import { addDays, isBefore, parseISO } from 'date-fns';
import './ProgressChart.css';

// Custom Legend Component with beautiful styling
const CustomLegend = ({ payload, colors, appleStyle = false }: { 
  payload?: any[], 
  colors: string[], 
  appleStyle?: boolean 
}) => {
  if (!payload?.length) return null;

  return (
    <div className="custom-legend-container">
      <div className="custom-legend-wrapper">
        {payload.map((entry, index) => (
          <div 
            key={entry.value} 
            className={`custom-legend-item ${appleStyle ? 'apple-style' : ''}`}
          >
            <div 
              className="custom-legend-indicator"
              data-color={colors[index % colors.length]}
            />
            <span className="custom-legend-text">
              {entry.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

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

// Helper function to filter data based on timeframe
const filterDataByTimeframe = (data: any[], timeframe: TimeframeOption) => {
  if (timeframe === 'ALL' || !data.length) return data;
  
  const now = new Date();
  const cutoffDate = new Date();
  
  switch (timeframe) {
    case '1W':
      cutoffDate.setDate(now.getDate() - 7);
      break;
    case '1M':
      cutoffDate.setMonth(now.getMonth() - 1);
      break;
    case '3M':
      cutoffDate.setMonth(now.getMonth() - 3);
      break;
  }
  
  return data.filter(item => new Date(item.date) >= cutoffDate);
};

// Helper function to calculate percentage gain for timeframe
const calculateTimeframeGain = (data: any[], timeframe: TimeframeOption, multiple: boolean, showPercentage: boolean) => {
  if (data.length === 0) return null;
  const filteredData = filterDataByTimeframe(data, timeframe);
  if (filteredData.length === 0) return null;

  // Use correct baseline: for ALL, use all-time first point; for others, use first point in filteredData
  const baselinePoint = timeframe === 'ALL' ? data[0] : filteredData[0];
  const lastPoint = filteredData[filteredData.length - 1];

  if (multiple && showPercentage) {
    // For "Overall Progress" (all categories) - percentage data
    const keys = Object.keys(lastPoint).filter(key => key !== 'date');
    let totalGain = 0;
    let validGains = 0;
    keys.forEach(key => {
      const baseline = baselinePoint[key];
      const latest = lastPoint[key];
      if (
        baseline !== null && baseline !== undefined && !isNaN(baseline) &&
        latest !== null && latest !== undefined && !isNaN(latest)
      ) {
        totalGain += (latest - baseline);
        validGains++;
      }
    });
    return validGains > 0 ? totalGain / validGains : 0;
  } else if (multiple && !showPercentage) {
    // For category-specific view with weight data
    const keys = Object.keys(lastPoint).filter(key => key !== 'date');
    let totalGain = 0;
    let validGains = 0;
    keys.forEach(key => {
      const baselineValue = baselinePoint[key];
      const currentValue = lastPoint[key];
      if (
        baselineValue !== null && baselineValue !== undefined && !isNaN(baselineValue) && baselineValue > 0 &&
        currentValue !== null && currentValue !== undefined && !isNaN(currentValue)
      ) {
        totalGain += ((currentValue - baselineValue) / baselineValue) * 100;
        validGains++;
      }
    });
    return validGains > 0 ? totalGain / validGains : 0;
  } else {
    // Single metric
    const key = showPercentage ? "percentGain" : "weight";
    const baselineValue = baselinePoint[key];
    const currentValue = lastPoint[key];
    if (showPercentage) {
      if (
        baselineValue !== null && baselineValue !== undefined && !isNaN(baselineValue) &&
        currentValue !== null && currentValue !== undefined && !isNaN(currentValue)
      ) {
        return currentValue - baselineValue;
      }
      return 0;
    } else {
      if (
        baselineValue !== null && baselineValue !== undefined && !isNaN(baselineValue) && baselineValue > 0 &&
        currentValue !== null && currentValue !== undefined && !isNaN(currentValue)
      ) {
        return ((currentValue - baselineValue) / baselineValue) * 100;
      }
      return 0;
    }
  }
};

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
  const [timeframe, setTimeframe] = useState<TimeframeOption>('ALL');
  const [dotVisible, setDotVisible] = useState(false);

  // Filter data based on selected timeframe
  const filteredData = useMemo(() => {
    return filterDataByTimeframe(data, timeframe);
  }, [data, timeframe]);
  
  // Calculate percentage gain for current timeframe
  const timeframeGain = useMemo(() => {
    return calculateTimeframeGain(data, timeframe, multiple, showPercentage);
  }, [data, timeframe, multiple, showPercentage]);

  useEffect(() => {
    if (filteredData && filteredData.length === 1) {
      // For a single point, the animation might not trigger onAnimationEnd,
      // so we explicitly set the dot to be visible.
      setDotVisible(true);
    }
    // For multiple points, onAnimationEnd will handle setting dotVisible to true.
    // We don't reset to false here to avoid potential flickers if data changes
    // while an animation has already completed and set it to true.
  }, [filteredData]);

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

  const formatUnit = showPercentage ? '%' : weightUnit;

  // Clean, minimal dot at the end of each line with fade-in
  // Pass filteredData to renderEndDot so it checks the correct data
  const renderEndDot = (lineKey: string, dataArray: any[]) => {
    return (props: any) => {
      const { cx, cy, index, stroke } = props;
      if (typeof cx !== 'number' || typeof cy !== 'number') return null;
      // If only one data point, always render the dot
      if (dataArray.length === 1 && index === 0) {
        return (
          <circle
            cx={cx}
            cy={cy}
            r={3}
            fill={stroke}
            className={`progresschart-dot-clean${dotVisible ? ' visible' : ''}`}
          />
        );
      }
      // Find the last non-null index for this lineKey in the filtered data
      let lastIndex = -1;
      for (let i = dataArray.length - 1; i >= 0; i--) {
        if (dataArray[i][lineKey] !== null && dataArray[i][lineKey] !== undefined) {
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
            className={`progresschart-dot-clean${dotVisible ? ' visible' : ''}`}
          />
        );
      }
      return null;
    };
  };

  return (
    <div className="progresschart-container">
      {/* Header with title only */}
      {title && (
        <div className="mb-4">
          <h3 className="text-base font-medium text-foreground">{title}</h3>
        </div>
      )}

      <div className={`${blendWithBackground ? 'px-0' : 'p-0'}`}>
        <ResponsiveContainer width="100%" height={240}>
          <LineChart
            data={filteredData}
            margin={{
              top: 15,
              right: 15,
              left: 10,
              bottom: 15,
            }}
            syncId={undefined}
            onMouseMove={undefined}
            onMouseLeave={undefined}
          >
            <defs>
              {/* Gradient definitions for each line */}
              {colors.map((color, index) => (
                <linearGradient key={`gradient-${index}`} id={`gradient-${index}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={color} stopOpacity={0.3}/>
                  <stop offset="95%" stopColor={color} stopOpacity={0.05}/>
                </linearGradient>
              ))}
            </defs>
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
              hide={false}
            />
            <YAxis 
              tickFormatter={(value) => `${value}${formatUnit}`}
              tick={{ fontSize: 10, fill: appleStyle ? '#8E8E93' : '#6B7280' }}
              axisLine={!appleStyle}
              tickLine={!appleStyle}
              hide={false}
              domain={showPercentage ? ['dataMin', 'dataMax'] : ['dataMin', 'dataMax']}
            />
            <Tooltip 
              formatter={(value, name) => {
                const displayName = multiple ? name : (showPercentage ? 'Progress' : 'Weight');
                return [`${value}${formatUnit}`, displayName];
              }}
              labelFormatter={(value) => {
                // Show date instead of "current" on exercise detail pages
                if (exerciseId && !multiple) {
                  return `Date: ${value}`;
                }
                return `Date: ${value}`;
              }}
              contentStyle={appleStyle || blendWithBackground ? { 
                backgroundColor: 'rgba(255, 255, 255, 0.98)',
                borderRadius: '12px',
                border: 'none', 
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
                padding: '12px 16px',
                fontSize: '14px',
                fontWeight: '500'
              } : undefined}
              // Solid line for cleaner look
              cursor={{ 
                stroke: appleStyle ? '#8E8E93' : '#94A3B8', 
                strokeWidth: 1.5,
                strokeDasharray: '0' 
              }}
              animationDuration={0}
              allowEscapeViewBox={{ x: false, y: false }}
              // Smart positioning: cover legend on dashboard, avoid chart on exercise detail
              position={multiple && !exerciseId ? { x: undefined, y: 180 } : { x: undefined, y: 20 }}
              offset={10}
            />
            {multiple ? (
              <>
                {Object.keys(filteredData[0] || {})
                  .filter(key => key !== 'date')
                  .map((key, index) => (
                    <Line
                      key={key}
                      type="monotone"
                      dataKey={key}
                      name={key}
                      stroke={colors[index % colors.length]}
                      strokeWidth={appleStyle ? 2.5 : 2}
                      dot={renderEndDot(key, filteredData)}
                      activeDot={false}
                      animationDuration={800}
                      animationBegin={index * 100}
                      onAnimationEnd={() => setDotVisible(true)}
                    />
                  ))}
              </>
            ) : (
              <Line
                type="monotone"
                dataKey={showPercentage ? "percentGain" : "weight"}
                stroke={customColors ? customColors[0] : (appleStyle ? "#34C759" : "#3b82f6")}
                strokeWidth={appleStyle ? 2.5 : 2}
                dot={renderEndDot(showPercentage ? "percentGain" : "weight", filteredData)}
                activeDot={false}
                animationDuration={800}
                onAnimationEnd={() => setDotVisible(true)}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
        
        {/* Custom Legend rendered outside the chart */}
        {multiple && !showPercentage && (
          (() => {
            const dataKeys = Object.keys(filteredData[0] || {}).filter(key => key !== 'date');
            if (dataKeys.length >= 2 && dataKeys.length <= 6) {
              return (
                <CustomLegend 
                  payload={dataKeys.map(key => ({ value: key }))}
                  colors={colors}
                  appleStyle={appleStyle}
                />
              );
            }
            return null;
          })()
        )}
      </div>
    </div>
  );
};

export default ProgressChart;
