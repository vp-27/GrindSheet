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
          <div className="absolute left-0 top-0 bottom-0 flex flex-col justify-between text-xs text-muted-foreground/40">
            {['100%', '75%', '50%', '25%', '0%'].map((label, i) => (
              <div key={i} className="animate-pulse flex items-center">
                <div className={`h-2.5 bg-muted/30 rounded-sm y-axis-label-${i}`}>
                  <div className={`h-full bg-gradient-to-r from-muted/50 to-transparent rounded-sm chart-skeleton-shimmer y-axis-shimmer-${i}`} />
                </div>
              </div>
            ))}
          </div>

          {/* Chart lines skeleton */}
          <div className="absolute inset-0 ml-12">
            <svg className="w-full h-full" viewBox="0 0 100 100">
              <defs>
                <linearGradient id="shimmer-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor={isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'} />
                  <stop offset="50%" stopColor={isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)'} />
                  <stop offset="100%" stopColor={isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'} />
                  <animateTransform
                    attributeName="gradientTransform"
                    type="translate"
                    values="-100 0;100 0;-100 0"
                    dur="3s"
                    repeatCount="indefinite"
                  />
                </linearGradient>
                
                {/* Gradient fill for chart area */}
                <linearGradient id="area-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor={isDark ? 'rgba(52, 199, 89, 0.1)' : 'rgba(52, 199, 89, 0.08)'} />
                  <stop offset="100%" stopColor={isDark ? 'rgba(52, 199, 89, 0.02)' : 'rgba(52, 199, 89, 0.01)'} />
                </linearGradient>
              </defs>

              {/* Background grid lines */}
              <g opacity="0.1">
                {/* Horizontal grid lines */}
                {[20, 40, 60, 80].map((y) => (
                  <line key={y} x1="5" y1={y} x2="95" y2={y} stroke={isDark ? '#ffffff' : '#000000'} strokeWidth="0.5" />
                ))}
                {/* Vertical grid lines */}
                {[20, 40, 60, 80].map((x) => (
                  <line key={x} x1={x} y1="10" x2={x} y2="90" stroke={isDark ? '#ffffff' : '#000000'} strokeWidth="0.5" />
                ))}
              </g>

              {/* Main trend line with realistic curve */}
              <path
                d="M 8 85 Q 20 75, 35 65 T 55 55 T 75 45 T 92 35"
                stroke="url(#shimmer-gradient)"
                strokeWidth="3"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity="0.7"
              />

              {/* Area fill under main line */}
              <path
                d="M 8 85 Q 20 75, 35 65 T 55 55 T 75 45 T 92 35 L 92 90 L 8 90 Z"
                fill="url(#area-gradient)"
                opacity="0.3"
              />

              {/* Secondary trend lines */}
              <path
                d="M 8 80 Q 25 70, 40 60 T 70 50 T 92 40"
                stroke="url(#shimmer-gradient)"
                strokeWidth="2.5"
                fill="none"
                strokeLinecap="round"
                opacity="0.4"
              />
              
              <path
                d="M 8 75 Q 25 65, 40 70 T 70 60 T 92 45"
                stroke="url(#shimmer-gradient)"
                strokeWidth="2.5"
                fill="none"
                strokeLinecap="round"
                opacity="0.3"
              />

              {/* Animated dots at end of lines with pulsing */}
              <circle cx="92" cy="35" r="3.5" fill={isDark ? 'rgba(52, 199, 89, 0.6)' : 'rgba(52, 199, 89, 0.8)'}>
                <animate attributeName="r" values="3.5;4.5;3.5" dur="2s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.6;1;0.6" dur="2s" repeatCount="indefinite" />
              </circle>
              <circle cx="92" cy="40" r="3" fill={isDark ? 'rgba(90, 200, 250, 0.5)' : 'rgba(90, 200, 250, 0.7)'}>
                <animate attributeName="r" values="3;4;3" dur="2s" repeatCount="indefinite" begin="0.7s" />
                <animate attributeName="opacity" values="0.5;0.8;0.5" dur="2s" repeatCount="indefinite" begin="0.7s" />
              </circle>
              <circle cx="92" cy="45" r="2.5" fill={isDark ? 'rgba(255, 149, 0, 0.4)' : 'rgba(255, 149, 0, 0.6)'}>
                <animate attributeName="r" values="2.5;3.5;2.5" dur="2s" repeatCount="indefinite" begin="1.3s" />
                <animate attributeName="opacity" values="0.4;0.7;0.4" dur="2s" repeatCount="indefinite" begin="1.3s" />
              </circle>

              {/* Subtle moving highlight effect */}
              <circle r="8" fill="url(#shimmer-gradient)" opacity="0.15">
                <animateMotion dur="4s" repeatCount="indefinite">
                  <path d="M 8 85 Q 20 75, 35 65 T 55 55 T 75 45 T 92 35" />
                </animateMotion>
              </circle>
            </svg>
          </div>

          {/* X-axis labels */}
          <div className="absolute bottom-0 left-12 right-0 flex justify-between text-xs text-muted-foreground/40">
            {['Jan 1', 'Jan 15', 'Feb 1', 'Feb 15'].map((label, i) => (
              <div key={i} className="animate-pulse flex items-center">
                <div className={`h-2.5 bg-muted/30 rounded-sm x-axis-label-${i}`}>
                  <div className={`h-full bg-gradient-to-r from-muted/50 to-transparent rounded-sm chart-skeleton-shimmer x-axis-shimmer-${i}`} />
                </div>
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
