import type { ComponentProps } from "react";
import ProgressChart from "./ProgressChart";
import ChartSkeleton from "./ChartSkeleton";
import "@/styles/components/chart-loader.css";

type ChartWithLoaderProps = ComponentProps<typeof ProgressChart> & {
  loading?: boolean;
  className?: string;
};
export default function ChartWithLoader({
  data,
  loading = false,
  className = "",
  ...props
}: ChartWithLoaderProps) {
  return (
    <div className={`chart-loader-container ${className}`}>
      {loading ? (
        <div role="status" aria-label="Loading progress">
          <ChartSkeleton
            showPercentage={props.showPercentage}
            showTimeframeControls={!props.hideTimeframeControls}
            chartTimeframe={props.timeframe}
            onTimeframeChange={(timeframe) =>
              props.onTimeframeChange?.(timeframe, null)
            }
          />
        </div>
      ) : data.length > 0 ? (
        <ProgressChart data={data} {...props} />
      ) : (
        <div
          className="text-center text-muted-foreground py-12 px-4"
          role="status"
        >
          <p className="text-base font-semibold text-foreground mb-2">
            Your progress starts with a workout
          </p>
          <p className="text-sm">
            Tap + to log an exercise, or choose a longer timeframe to see
            earlier workouts.
          </p>
        </div>
      )}
    </div>
  );
}
