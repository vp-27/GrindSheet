import React from 'react';
import { LineChart } from '@tremor/react';
import { ProgressChartData } from '@/types';
import { Button } from '@/components/ui/button';
import { History } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface ModernProgressChartProps {
  data: ProgressChartData[] | any[];
  title?: string;
  exerciseId?: string;
  categoryId?: string;
  multiple?: boolean;
  showPercentage?: boolean;
  weightUnit?: string;
  customColors?: string[];
}

const ModernProgressChart: React.FC<ModernProgressChartProps> = ({ 
  data, 
  title, 
  exerciseId,
  categoryId,
  multiple = false,
  showPercentage = false,
  weightUnit = 'lb',
  customColors
}) => {
  const navigate = useNavigate();

  if (!data || data.length === 0) {
    return (
      <div className="h-[240px] flex items-center justify-center text-muted-foreground">
        <p>No progress data available</p>
      </div>
    );
  }

  const handleViewHistory = () => {
    if (exerciseId) {
      navigate(`/history?exercise=${exerciseId}`);
    } else if (categoryId) {
      navigate(`/history?category=${categoryId}`);
    } else {
      navigate('/history');
    }
  };

  // Tremor chart colors (modern, beautiful palette)
  const chartColors = customColors || [
    'emerald', 'blue', 'violet', 'amber', 'rose', 'cyan', 'orange', 'pink'
  ];

  // For multiple lines, get all data keys except 'date'
  const dataKeys = multiple 
    ? Object.keys(data[0]).filter(key => key !== 'date')
    : [showPercentage ? 'percentGain' : 'weight'];

  const formatUnit = showPercentage ? '%' : weightUnit;

  return (
    <div className="space-y-4">
      {title && (
        <div className="flex justify-between items-center">
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
      
      <LineChart
        className="h-60"
        data={data}
        index="date"
        categories={dataKeys}
        colors={chartColors}
        valueFormatter={(value) => `${value}${formatUnit}`}
        showLegend={multiple}
        showGridLines={false}
        showXAxis={true}
        showYAxis={true}
        startEndOnly={false}
        connectNulls={false}
        curveType="monotone"
        animationDuration={800}
        showAnimation={true}
      />
    </div>
  );
};

export default ModernProgressChart;
