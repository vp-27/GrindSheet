
import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ProgressChartData } from '@/types';
import { Button } from '@/components/ui/button';
import { History } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface ProgressChartProps {
  data: ProgressChartData[] | any[];
  title: string;
  exerciseId?: string;
  multiple?: boolean;
  showPercentage?: boolean;
}

const ProgressChart: React.FC<ProgressChartProps> = ({ 
  data, 
  title, 
  exerciseId,
  multiple = false,
  showPercentage = false
}) => {
  const navigate = useNavigate();

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">{title}</CardTitle>
        </CardHeader>
        <CardContent className="h-[200px] flex items-center justify-center">
          <div className="text-muted-foreground">No data available</div>
        </CardContent>
      </Card>
    );
  }

  const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  const handleViewHistory = () => {
    navigate(`/history${exerciseId ? `?exercise=${exerciseId}` : ''}`);
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg">{title}</CardTitle>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleViewHistory}
            className="h-8 w-8 p-0"
          >
            <History className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <ResponsiveContainer width="100%" height={200}>
          <LineChart
            data={data}
            margin={{
              top: 5,
              right: 20,
              left: 0,
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
            <XAxis 
              dataKey="date" 
              tick={{ fontSize: 10 }}
              tickFormatter={(value) => {
                const date = new Date(value);
                return `${date.getMonth() + 1}/${date.getDate()}`;
              }}
            />
            <YAxis 
              tickFormatter={(value) => showPercentage ? `${value}%` : `${value}`}
            />
            <Tooltip 
              formatter={(value, name) => showPercentage ? [`${value}%`, name] : [`${value} lbs`, name]}
              labelFormatter={(value) => `Date: ${value}`}
            />
            {multiple ? (
              <>
                <Legend />
                {Object.keys(data[0])
                  .filter(key => key !== 'date')
                  .map((key, index) => (
                    <Line
                      key={key}
                      type="monotone"
                      dataKey={key}
                      name={key}
                      stroke={colors[index % colors.length]}
                      strokeWidth={2}
                      dot={{ r: 3 }}
                      activeDot={{ r: 5 }}
                    />
                  ))}
              </>
            ) : (
              <Line
                type="monotone"
                dataKey={showPercentage ? "percentGain" : "weight"}
                stroke="#3b82f6"
                strokeWidth={2}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default ProgressChart;
