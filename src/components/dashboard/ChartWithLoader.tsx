import React, { useState, useEffect } from 'react';
import ProgressChart from './ProgressChart';
import ChartSkeleton from './ChartSkeleton';
import '@/styles/components/chart-loader.css';

interface ChartWithLoaderProps {
  data: any[];
  loading?: boolean;
  multiple?: boolean;
  categoryId?: string;
  weightUnit?: string;
  showPercentage?: boolean;
  appleStyle?: boolean;
  blendWithBackground?: boolean;
  customColors?: string[];
  onHoverData?: (data: any) => void;
  onTimeframeChange?: (timeframe: '2W' | '1M' | 'ALL', gain: number | null) => void;
  hideTooltip?: boolean;
  hideTimeframeControls?: boolean;
  timeframe?: '2W' | '1M' | 'ALL';
  disableInternalTimeframeFilter?: boolean;
  className?: string;
}

const ChartWithLoader: React.FC<ChartWithLoaderProps> = ({
  data,
  loading = false,
  className = '',
  ...chartProps
}) => {
  const [showSkeleton, setShowSkeleton] = useState(loading);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    if (loading) {
      // If we start loading, immediately show skeleton
      setShowSkeleton(true);
      setIsTransitioning(false);
    } else if (data && data.length > 0) {
      // If we have data and were previously loading, start transition
      if (showSkeleton) {
        setIsTransitioning(true);
        // Allow skeleton to show for a longer moment for integrated feel
        const timer = setTimeout(() => {
          setShowSkeleton(false);
          // After skeleton is hidden, end transition
          setTimeout(() => setIsTransitioning(false), 800);
        }, 800); // Longer delay for smooth spawn-in effect
        
        return () => clearTimeout(timer);
      }
    }
  }, [loading, data, showSkeleton]);

  // Determine what to render
  const shouldShowSkeleton = loading || showSkeleton;
  const shouldShowChart = data && data.length > 0 && !shouldShowSkeleton;

  return (
    <div className={`chart-loader-container ${className}`}>
      {/* Skeleton Loader */}
      <div
        className={`absolute inset-0 transition-all duration-700 ease-out chart-spawn-container ${
          shouldShowSkeleton 
            ? 'opacity-100 scale-100' 
            : 'opacity-0 scale-98 pointer-events-none'
        }`}
      >
        <ChartSkeleton
          showPercentage={chartProps.showPercentage}
          showTimeframeControls={!chartProps.hideTimeframeControls}
          chartTimeframe={chartProps.timeframe}
          onTimeframeChange={(tf) => chartProps.onTimeframeChange?.(tf, null)}
        />
      </div>

      {/* Actual Chart */}
      <div
        className={`transition-all duration-1000 ease-out ${
          shouldShowChart 
            ? 'opacity-100 scale-100' 
            : 'opacity-0 scale-98'
        } ${shouldShowChart ? 'visible' : 'invisible'}`}
      >
        {data && data.length > 0 && (
          <div className="chart-content-stagger">
            <ProgressChart 
              data={data}
              {...chartProps}
            />
          </div>
        )}
      </div>

      {/* Empty State - only show if not loading and no data */}
      {!loading && (!data || data.length === 0) && (
        <div
          className={`transition-all duration-800 ease-out ${
            !shouldShowSkeleton 
              ? 'opacity-100 scale-100' 
              : 'opacity-0 scale-98'
          }`}
        >
          <div className="text-center text-muted-foreground py-16">
            <svg className="w-12 h-12 text-muted-foreground mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <p className="text-lg font-medium mb-2">No data available yet</p>
            <p>Start logging exercises to see your progress!</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChartWithLoader;
