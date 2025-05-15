
import React from 'react';
import { Progress } from '@/types';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowUp, ArrowDown } from 'lucide-react';

interface ProgressCardProps {
  progress: Progress;
  onClick?: () => void;
}

const ProgressCard: React.FC<ProgressCardProps> = ({ progress, onClick }) => {
  const { 
    exercise, 
    currentWeight, 
    previousWeight, 
    percentGainFromPrevious,
    personalRecord 
  } = progress;

  const isGain = percentGainFromPrevious && percentGainFromPrevious > 0;
  const isLoss = percentGainFromPrevious && percentGainFromPrevious < 0;

  return (
    <Card 
      className={cn(
        "cursor-pointer hover:border-primary/50 transition-all duration-200",
        isGain && "hover:border-gain",
        isLoss && "hover:border-loss"
      )}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex justify-between items-center">
          <h3 className="font-medium">{exercise.name}</h3>
          <div className="font-bold text-lg">{currentWeight} lbs</div>
        </div>

        <div className="flex justify-between items-center mt-2 text-sm text-muted-foreground">
          <div>Previous: {previousWeight || '-'} lbs</div>
          
          {personalRecord === currentWeight && (
            <div className="text-fitness-orange font-medium">PR!</div>
          )}
        </div>

        {percentGainFromPrevious !== undefined && (
          <div className={cn(
            "flex items-center mt-1 text-sm",
            isGain ? "text-gain" : isLoss ? "text-loss" : "text-muted-foreground"
          )}>
            {isGain ? (
              <ArrowUp className="h-4 w-4 mr-1" />
            ) : isLoss ? (
              <ArrowDown className="h-4 w-4 mr-1" />
            ) : null}
            <span>
              {Math.abs(percentGainFromPrevious).toFixed(1)}% from last
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ProgressCard;
