import React, { useState, useMemo, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MobileSlider } from '@/components/ui/mobile-slider';
import { ProgressChartData } from '@/types';
import { addDays, isBefore, parseISO } from 'date-fns';
import { Calendar, Clock } from 'lucide-react';
import AnimatedCounter from '@/components/ui/animated-counter';
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
  defaultTimeframe?: TimeframeOption; // Allow parent to set initial timeframe
  hideTimeframeControls?: boolean; // New prop to hide timeframe controls
  timeframe?: TimeframeOption; // Allow parent to control timeframe externally
}

// Define timeframe options
type TimeframeOption = '2W' | '1M' | 'ALL';

// Helper function to filter data based on timeframe
const filterDataByTimeframe = (data: any[], timeframe: TimeframeOption) => {
  if (timeframe === 'ALL' || !data.length) return data;
  
  const now = new Date();
  const cutoffDate = new Date();
  
  switch (timeframe) {
    case '2W':
      cutoffDate.setDate(now.getDate() - 14);
      break;
    case '1M':
      cutoffDate.setMonth(now.getMonth() - 1);
      break;
  }
  
  return data.filter(item => new Date(item.date) >= cutoffDate);
};

// Enhanced function to calculate percentage gain from chart start date (visible timeframe)
const calculatePercentageFromChartStart = (
  data: any[],
  timeframe: TimeframeOption,
  multiple: boolean,
  showPercentage: boolean
): number | null => {
  if (!data || data.length === 0) return null;

  // Filter data based on timeframe first
  const filteredData = filterDataByTimeframe(data, timeframe);
  if (filteredData.length === 0) return null;

  // Get the first point in the visible chart (chart start date)
  const chartStartPoint = filteredData[0];
  const chartEndPoint = filteredData[filteredData.length - 1];

  if (multiple && showPercentage) {
    // For "Overall Progress" (all categories) - percentage data
    const keys = Object.keys(chartEndPoint).filter(key => key !== 'date');
    let totalGain = 0;
    let validGains = 0;
    
    keys.forEach(key => {
      const startValue = chartStartPoint[key];
      const endValue = chartEndPoint[key];
      
      if (
        startValue !== null && startValue !== undefined && !isNaN(startValue) &&
        endValue !== null && endValue !== undefined && !isNaN(endValue)
      ) {
        totalGain += (endValue - startValue);
        validGains++;
      }
    });
    
    return validGains > 0 ? totalGain / validGains : 0;
  } else if (multiple && !showPercentage) {
    // For category-specific view with weight data
    const keys = Object.keys(chartEndPoint).filter(key => key !== 'date');
    let totalGain = 0;
    let validGains = 0;
    
    keys.forEach(key => {
      const startValue = chartStartPoint[key];
      const endValue = chartEndPoint[key];
      
      if (
        startValue !== null && startValue !== undefined && !isNaN(startValue) && startValue > 0 &&
        endValue !== null && endValue !== undefined && !isNaN(endValue)
      ) {
        totalGain += ((endValue - startValue) / startValue) * 100;
        validGains++;
      }
    });
    
    return validGains > 0 ? totalGain / validGains : 0;
  } else {
    // Single metric
    const key = showPercentage ? "percentGain" : "weight";
    const startValue = chartStartPoint[key];
    const endValue = chartEndPoint[key];
    
    if (showPercentage) {
      if (
        startValue !== null && startValue !== undefined && !isNaN(startValue) &&
        endValue !== null && endValue !== undefined && !isNaN(endValue)
      ) {
        return endValue - startValue;
      }
      return 0;
    } else {
      if (
        startValue !== null && startValue !== undefined && !isNaN(startValue) && startValue > 0 &&
        endValue !== null && endValue !== undefined && !isNaN(endValue)
      ) {
        return ((endValue - startValue) / startValue) * 100;
      }
      return 0;
    }
  }
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
  hideTooltip = false,
  defaultTimeframe = '2W',
  hideTimeframeControls = false,
  timeframe: externalTimeframe
}) => {
  const [internalTimeframe, setInternalTimeframe] = useState<TimeframeOption>(defaultTimeframe);
  const [dotVisible, setDotVisible] = useState(false);
  const [disableInitialAnimation, setDisableInitialAnimation] = useState(true);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null); // NEW

  // Use external timeframe if provided, otherwise use internal
  const currentTimeframe = externalTimeframe || internalTimeframe;

  // Filter data based on selected timeframe
  const filteredData = useMemo(() => {
    return filterDataByTimeframe(data, currentTimeframe);
  }, [data, currentTimeframe]);

  // Calculate percentage gain for current timeframe - using chart start date
  const timeframeGain = useMemo(() => {
    // If hovering, use hovered point for gain
    if (hoveredIndex !== null && filteredData.length > 0) {
      const chartStartPoint = filteredData[0];
      const hoveredPoint = filteredData[hoveredIndex];
      if (!hoveredPoint) return 0;
      if (multiple && showPercentage) {
        const keys = Object.keys(hoveredPoint).filter(key => key !== 'date');
        let totalGain = 0;
        let validGains = 0;
        keys.forEach(key => {
          const startValue = chartStartPoint[key];
          const endValue = hoveredPoint[key];
          if (
            startValue !== null && startValue !== undefined && !isNaN(startValue) &&
            endValue !== null && endValue !== undefined && !isNaN(endValue)
          ) {
            totalGain += (endValue - startValue);
            validGains++;
          }
        });
        return validGains > 0 ? totalGain / validGains : 0;
      } else if (multiple && !showPercentage) {
        const keys = Object.keys(hoveredPoint).filter(key => key !== 'date');
        let totalGain = 0;
        let validGains = 0;
        keys.forEach(key => {
          const startValue = chartStartPoint[key];
          const endValue = hoveredPoint[key];
          if (
            startValue !== null && startValue !== undefined && !isNaN(startValue) && startValue > 0 &&
            endValue !== null && endValue !== undefined && !isNaN(endValue)
          ) {
            totalGain += ((endValue - startValue) / startValue) * 100;
            validGains++;
          }
        });
        return validGains > 0 ? totalGain / validGains : 0;
      } else {
        const key = showPercentage ? "percentGain" : "weight";
        const startValue = chartStartPoint[key];
        const endValue = hoveredPoint[key];
        if (showPercentage) {
          if (
            startValue !== null && startValue !== undefined && !isNaN(startValue) &&
            endValue !== null && endValue !== undefined && !isNaN(endValue)
          ) {
            return endValue - startValue;
          }
          return 0;
        } else {
          if (
            startValue !== null && startValue !== undefined && !isNaN(startValue) && startValue > 0 &&
            endValue !== null && endValue !== undefined && !isNaN(endValue)
          ) {
            return ((endValue - startValue) / startValue) * 100;
          }
          return 0;
        }
      }
    }
    // Default: use last point
    return calculatePercentageFromChartStart(data, currentTimeframe, multiple, showPercentage);
  }, [data, currentTimeframe, multiple, showPercentage, hoveredIndex, filteredData]);

  // Notify parent component when timeframe or gain changes
  useEffect(() => {
    if (onTimeframeChange) {
      onTimeframeChange(currentTimeframe, timeframeGain);
    }
  }, [currentTimeframe, timeframeGain, onTimeframeChange]);

  // Handle chart hover for custom tooltip and percent gain
  const handleChartHover = (data: any) => {
    if (onHoverData && data && data.activePayload && data.activePayload.length > 0) {
      const payload = data.activePayload[0].payload;
      // Find hovered index in filteredData
      const idx = filteredData.findIndex(d => d.date === payload.date);
      setHoveredIndex(idx);
      onHoverData({
        date: payload.date,
        data: payload,
        label: data.label,
        colors: colors // Pass the actual colors being used by the chart
      });
    }
  };

  const handleChartLeave = () => {
    setHoveredIndex(null);
    if (onHoverData) {
      onHoverData(null);
    }
  };

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

  useEffect(() => {
    const timeout = setTimeout(() => setDisableInitialAnimation(false), 50);
    return () => clearTimeout(timeout);
  }, []);

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
              tickFormatter={(value) => {
                const roundedValue = typeof value === 'number' ? 
                  (value % 1 === 0 ? value.toString() : value.toFixed(1)) : value;
                return `${roundedValue}${formatUnit}`;
              }}
              tick={{ fontSize: 10, fill: appleStyle ? '#8E8E93' : '#6B7280' }}
              axisLine={!appleStyle}
              tickLine={!appleStyle}
              hide={false}
              domain={showPercentage ? ['dataMin', 'dataMax'] : ['dataMin', 'dataMax']}
            />
            <Tooltip 
              formatter={(value, name) => {
                const displayName = multiple ? name : (showPercentage ? 'Progress' : 'Weight');
                // Round percentage values to 1 decimal place, weight values to 1 decimal place
                const roundedValue = typeof value === 'number' ? 
                  (value % 1 === 0 ? value.toString() : value.toFixed(1)) : value;
                return [`${roundedValue}${formatUnit}`, displayName];
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
                      animationDuration={disableInitialAnimation ? 0 : 800}
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
                animationDuration={disableInitialAnimation ? 0 : 800}
                onAnimationEnd={() => setDotVisible(true)}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
      
      {/* Apple-style centered timeframe controls - only show if not hidden */}
      {!hideTimeframeControls && (
        <div className="flex justify-center mt-4 mb-2">
          <MobileSlider
            options={[
              { id: '2W', label: '2W' },
              { id: '1M', label: '1M' },
              { id: 'ALL', label: 'ALL' }
            ]}
            activeOption={currentTimeframe}
            onOptionChange={(optionId) => {
              const newTimeframe = optionId as TimeframeOption;
              if (externalTimeframe) {
                // If timeframe is controlled externally, notify parent instead of updating internal state
                onTimeframeChange && onTimeframeChange(newTimeframe, null);
              } else {
                setInternalTimeframe(newTimeframe);
              }
            }}
            variant="compact"
          />
        </div>
      )}
    </div>
  );
};

export default ProgressChart;
