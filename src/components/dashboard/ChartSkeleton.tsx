import React from 'react';
import { MobileSlider } from '@/components/ui/mobile-slider';
import './ChartSkeleton.css';

interface ChartSkeletonProps {
  showPercentage?: boolean;
  showTimeframeControls?: boolean;
  chartTimeframe?: '2W' | '1M' | 'ALL';
  onTimeframeChange?: (timeframe: '2W' | '1M' | 'ALL') => void;
  className?: string;
}

const ChartSkeleton: React.FC<ChartSkeletonProps> = ({
  showPercentage = false,
  showTimeframeControls = false,
  chartTimeframe = '2W',
  onTimeframeChange,
  className = ''
}) => {
  return (
    <div className={`relative ${className}`}>
      {/* Percentage gain skeleton */}
      {showPercentage && (
        <div className="mb-3 flex items-center justify-between">
          <div className="chart-skeleton-bar shimmer h-5 w-14 rounded-md" />
          {showTimeframeControls && (
            <div className="flex-shrink-0">
              <MobileSlider
                options={[
                  { id: '2W', label: '2W' },
                  { id: '1M', label: '1M' },
                  { id: 'ALL', label: 'ALL' }
                ]}
                activeOption={chartTimeframe}
                onOptionChange={(optionId) => onTimeframeChange?.(optionId as '2W' | '1M' | 'ALL')}
                variant="compact"
              />
            </div>
          )}
        </div>
      )}

      {/* Chart container */}
      <div className="chart-skeleton-container chart-skeleton-breathe">
        {/* Grid background */}
        <div className="chart-skeleton-grid">
          {/* Horizontal grid lines */}
          <div className="chart-skeleton-grid-line horizontal absolute grid-h-25" />
          <div className="chart-skeleton-grid-line horizontal absolute grid-h-50" />
          <div className="chart-skeleton-grid-line horizontal absolute grid-h-75" />
          
          {/* Vertical grid lines */}
          <div className="chart-skeleton-grid-line vertical absolute grid-v-25" />
          <div className="chart-skeleton-grid-line vertical absolute grid-v-50" />
          <div className="chart-skeleton-grid-line vertical absolute grid-v-75" />
        </div>

        {/* Y-axis labels */}
        <div className="absolute left-3 top-4 bottom-8 flex flex-col justify-between">
          <div className="chart-skeleton-bar shimmer h-2.5 w-6 rounded delay-0" />
          <div className="chart-skeleton-bar shimmer h-2.5 w-7 rounded delay-1" />
          <div className="chart-skeleton-bar shimmer h-2.5 w-8 rounded delay-2" />
          <div className="chart-skeleton-bar shimmer h-2.5 w-7 rounded delay-3" />
          <div className="chart-skeleton-bar shimmer h-2.5 w-6 rounded delay-4" />
        </div>

        {/* Chart area with subtle trend lines */}
        <div className="absolute inset-4 ml-14 mr-4">
          <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <defs>
              <linearGradient id="line-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="hsl(var(--muted))" stopOpacity="0.1" />
                <stop offset="50%" stopColor="hsl(var(--muted))" stopOpacity="0.25" />
                <stop offset="100%" stopColor="hsl(var(--muted))" stopOpacity="0.1" />
                <animateTransform
                  attributeName="gradientTransform"
                  type="translate"
                  values="-100 0;100 0;-100 0"
                  dur="4s"
                  repeatCount="indefinite"
                />
              </linearGradient>
              
              <linearGradient id="area-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="hsl(var(--muted))" stopOpacity="0.05" />
                <stop offset="100%" stopColor="hsl(var(--muted))" stopOpacity="0.01" />
              </linearGradient>
            </defs>

            {/* Subtle area fill */}
            <path
              d="M 5 85 Q 25 70 50 55 T 95 25 L 95 95 L 5 95 Z"
              fill="url(#area-gradient)"
              className="chart-skeleton-breathe"
            />

            {/* Main trend line - very subtle */}
            <path
              d="M 5 85 Q 25 70 50 55 T 95 25"
              stroke="url(#line-gradient)"
              strokeWidth="1.5"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity="0.6"
            />

            {/* Secondary trend line */}
            <path
              d="M 5 75 Q 30 65 55 60 T 95 40"
              stroke="url(#line-gradient)"
              strokeWidth="1"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity="0.4"
            />

            {/* Subtle data points */}
            {[25, 50, 75].map((x, i) => (
              <circle
                key={i}
                cx={x}
                cy={80 - i * 15}
                r="1.5"
                fill="hsl(var(--muted))"
                opacity="0.2"
              >
                <animate
                  attributeName="opacity"
                  values="0.1;0.3;0.1"
                  dur="3s"
                  repeatCount="indefinite"
                  begin={`${i * 0.5}s`}
                />
              </circle>
            ))}
          </svg>
        </div>

        {/* X-axis labels */}
        <div className="absolute bottom-3 left-16 right-4 flex justify-between">
          <div className="chart-skeleton-bar shimmer h-2.5 w-8 rounded delay-x-0" />
          <div className="chart-skeleton-bar shimmer h-2.5 w-10 rounded delay-x-1" />
          <div className="chart-skeleton-bar shimmer h-2.5 w-9 rounded delay-x-2" />
          <div className="chart-skeleton-bar shimmer h-2.5 w-11 rounded delay-x-3" />
        </div>
      </div>
    </div>
  );
};

export default ChartSkeleton;
