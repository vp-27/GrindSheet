import React from 'react';
import { MobileSlider } from '@/components/ui/mobile-slider';
import { useTheme } from '@/context/ThemeContext';
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
  const { isDark } = useTheme();

  return (
    <div className={`relative ${className}`}>
      {/* Percentage gain skeleton - animated shimmer */}
      {showPercentage && (
        <div className="mb-2 flex items-center justify-between">
          <div className="animate-pulse">
            <div className="h-8 bg-gradient-to-r from-muted via-muted/50 to-muted rounded-lg w-20 chart-skeleton-shimmer" />
          </div>
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

      {/* Chart area skeleton */}
      <div className={`chart-skeleton-container ${isDark ? 'dark' : 'light'}`}>
        {/* Animated chart skeleton */}
        <div className="absolute inset-4">
          {/* Y-axis labels */}
          <div className="absolute left-0 top-0 bottom-0 flex flex-col justify-between text-xs text-muted-foreground/60">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="animate-pulse chart-skeleton-breathe">
                <div className="h-3 bg-muted/40 rounded w-8" />
              </div>
            ))}
          </div>

          {/* Chart lines skeleton */}
          <div className="absolute inset-0 ml-12">
            <svg className="w-full h-full" viewBox="0 0 100 100">
              <defs>
                <linearGradient id="shimmer-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor={isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'} />
                  <stop offset="50%" stopColor={isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)'} />
                  <stop offset="100%" stopColor={isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'} />
                  <animateTransform
                    attributeName="gradientTransform"
                    type="translate"
                    values="-100 0;100 0;-100 0"
                    dur="2s"
                    repeatCount="indefinite"
                  />
                </linearGradient>
              </defs>

              {/* Multiple skeleton lines */}
              <path
                d="M 10 80 Q 25 60, 40 70 T 70 45 T 90 30"
                stroke="url(#shimmer-gradient)"
                strokeWidth="2.5"
                fill="none"
                strokeLinecap="round"
                opacity="0.6"
              />
              <path
                d="M 10 85 Q 25 75, 40 60 T 70 40 T 90 25"
                stroke="url(#shimmer-gradient)"
                strokeWidth="2.5"
                fill="none"
                strokeLinecap="round"
                opacity="0.4"
              />
              <path
                d="M 10 90 Q 25 80, 40 85 T 70 65 T 90 50"
                stroke="url(#shimmer-gradient)"
                strokeWidth="2.5"
                fill="none"
                strokeLinecap="round"
                opacity="0.3"
              />

              {/* Animated dots at end of lines */}
              <circle cx="90" cy="30" r="3" fill={isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)'}>
                <animate attributeName="opacity" values="0.4;0.8;0.4" dur="2s" repeatCount="indefinite" />
              </circle>
              <circle cx="90" cy="25" r="3" fill={isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)'}>
                <animate attributeName="opacity" values="0.3;0.6;0.3" dur="2s" repeatCount="indefinite" begin="0.5s" />
              </circle>
              <circle cx="90" cy="50" r="3" fill={isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)'}>
                <animate attributeName="opacity" values="0.2;0.5;0.2" dur="2s" repeatCount="indefinite" begin="1s" />
              </circle>
            </svg>
          </div>

          {/* X-axis labels */}
          <div className="absolute bottom-0 left-12 right-0 flex justify-between text-xs text-muted-foreground/60">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="animate-pulse chart-skeleton-breathe">
                <div className="h-3 bg-muted/40 rounded w-12" />
              </div>
            ))}
          </div>
        </div>

        {/* Pulse overlay for extra loading effect */}
        <div className={`absolute inset-0 opacity-30 chart-skeleton-pulse-overlay ${isDark ? 'dark' : 'light'}`} />
      </div>
    </div>
  );
};

export default ChartSkeleton;
