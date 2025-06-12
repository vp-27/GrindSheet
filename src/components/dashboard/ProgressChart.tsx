import React, { useState, useMemo, useEffect, useLayoutEffect, useRef } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
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
  onTimeframeChange?: (timeframe: TimeframeOption, gain: number | null) => void; // Callback for timeframe changes
  onHoverData?: (data: any) => void; // New callback for hover data
  hideTooltip?: boolean; // Option to hide traditional tooltip
}

// Define timeframe options
type TimeframeOption = '1M' | 'ALL';

// Helper function to filter data based on timeframe
const filterDataByTimeframe = (data: any[], timeframe: TimeframeOption) => {
  if (timeframe === 'ALL' || !data.length) return data;
  
  const now = new Date();
  const cutoffDate = new Date();
  
  switch (timeframe) {
    case '1M':
      cutoffDate.setMonth(now.getMonth() - 1);
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
  customColors,
  onTimeframeChange,
  onHoverData,
  hideTooltip = false
}) => {
  const [timeframe, setTimeframe] = useState<TimeframeOption>('1M');
  const [dotVisible, setDotVisible] = useState(false);

  // Slider state and refs for timeframe controls
  const [timeframeSliderStyle, setTimeframeSliderStyle] = useState({ left: '0px', width: '0px', opacity: 0 });
  const timeframeOptionsContainerRef = useRef<HTMLDivElement>(null);
  const oneMonthBtnRef = useRef<HTMLButtonElement>(null);
  const allBtnRef = useRef<HTMLButtonElement>(null);

  // Handle chart hover for custom tooltip
  const handleChartHover = (data: any) => {
    if (onHoverData && data && data.activePayload && data.activePayload.length > 0) {
      const payload = data.activePayload[0].payload;
      onHoverData({
        date: payload.date,
        data: payload,
        label: data.label,
        colors: colors // Pass the actual colors being used by the chart
      });
    }
  };

  const handleChartLeave = () => {
    if (onHoverData) {
      onHoverData(null);
    }
  };

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

  // Notify parent component when timeframe or gain changes
  useEffect(() => {
    if (onTimeframeChange) {
      onTimeframeChange(timeframe, timeframeGain);
    }
  }, [timeframe, timeframeGain, onTimeframeChange]);

  useLayoutEffect(() => {
    let activeRef: React.RefObject<HTMLButtonElement> | null = null;
    if (timeframe === '1M') {
      activeRef = oneMonthBtnRef;
    } else if (timeframe === 'ALL') {
      activeRef = allBtnRef;
    }

    if (activeRef?.current && timeframeOptionsContainerRef.current) {
      const buttonElement = activeRef.current;
      const left = buttonElement.offsetLeft;
      const width = buttonElement.offsetWidth;
      setTimeframeSliderStyle({ left: `${left}px`, width: `${width}px`, opacity: 1 });
    }
  }, [timeframe]);

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

      <div className={`relative ${blendWithBackground ? 'px-0' : 'p-0'}`}>
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
            onMouseMove={onHoverData ? handleChartHover : undefined}
            onMouseLeave={onHoverData ? handleChartLeave : undefined}
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
              labelFormatter={(value) => `Date: ${value}`}
              contentStyle={hideTooltip ? {
                display: 'none'
              } : (appleStyle || blendWithBackground ? { 
                backgroundColor: 'rgba(255, 255, 255, 0.98)',
                borderRadius: '12px',
                border: 'none', 
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
                padding: '12px 16px',
                fontSize: '14px',
                fontWeight: '500'
              } : undefined)}
              cursor={{ 
                stroke: appleStyle ? '#8E8E93' : '#94A3B8', 
                strokeWidth: 1.5,
                strokeDasharray: '0' 
              }}
              animationDuration={0}
              allowEscapeViewBox={{ x: false, y: false }}
              position={{ x: undefined, y: 20 }}
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
        
        {/* Chart Controls Section - Compact floating controls */}
        <div className={`absolute ${exerciseId ? '-top-8' : '-top-12'} right-4 flex items-center gap-2`}>
          {/* Compact percentage gain indicator */}
          {timeframeGain !== null && !exerciseId && (
            <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium backdrop-blur-sm ${
              timeframeGain >= 0 
                ? 'text-emerald-700 bg-emerald-50/90 dark:text-emerald-400 dark:bg-emerald-900/40' 
                : 'text-red-700 bg-red-50/90 dark:text-red-400 dark:bg-red-900/40'
            }`}>
              <span className="font-semibold">
                {timeframeGain >= 0 ? '+' : ''}{timeframeGain.toFixed(1)}%
              </span>
            </div>
          )}
          
          {/* Compact Timeframe Controls */}
          <div ref={timeframeOptionsContainerRef} className="relative flex items-center bg-muted p-1 rounded-lg shadow-sm">
            {/* Slider Element for Timeframe Controls */}
            <div
              className="absolute top-1 bottom-1 bg-background rounded-md shadow-md transition-all duration-300 ease-in-out"
              style={timeframeSliderStyle}
            />
            {(['1M', 'ALL'] as TimeframeOption[]).map((period) => (
              <button
                key={period}
                ref={period === '1M' ? oneMonthBtnRef : allBtnRef}
                onClick={() => setTimeframe(period)}
                className={`relative z-10 px-3 py-1.5 text-xs font-medium rounded-md transition-colors duration-150 ease-in-out active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                  timeframe === period
                    ? 'text-foreground'
                    : 'text-muted-foreground hover:text-foreground/80'
                }`}
              >
                {period}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProgressChart;
