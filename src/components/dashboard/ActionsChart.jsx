import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Activity } from 'lucide-react';

const COLORS = {
  success: '#22c55e',
  error: '#ef4444',
  executing: '#f59e0b'
};

const STATUS_LABELS = {
  success: 'Success',
  error: 'Error', 
  executing: 'Executing'
};

const STATUS_ICONS = {
  success: '✅',
  error: '❌',
  executing: '⏳'
};

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0];
    return (
      <div className="bg-white/95 backdrop-blur-sm p-3 border border-gray-200 rounded-lg shadow-lg">
        <div className="flex items-center gap-2">
          <span className="text-lg">{STATUS_ICONS[data.name]}</span>
          <div>
            <p className="font-semibold text-gray-900">{STATUS_LABELS[data.name]}</p>
            <p className="text-sm text-gray-600">{data.value} actions</p>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

const CustomLegend = ({ payload }) => (
  <div className="flex justify-center gap-6 mt-4">
    {payload.map((entry, index) => (
      <div key={index} className="flex items-center gap-2">
        <span className="text-lg">{STATUS_ICONS[entry.value]}</span>
        <span className="text-sm font-medium" style={{ color: entry.color }}>
          {STATUS_LABELS[entry.value]}
        </span>
      </div>
    ))}
  </div>
);

export default function ActionsChart({ data, isLoading, timeRange = '24h' }) {
  const hasData = data.length > 0 && (data[0].success > 0 || data[0].error > 0 || data[0].executing > 0);
  
  const getDescription = () => {
    const period = timeRange === '7d' ? 'last 7 days' : 'last 24 hours';
    return `Action execution status breakdown for the ${period}`;
  };

  // Transform data for pie chart
  const pieData = hasData ? [
    { name: 'success', value: data[0].success },
    { name: 'error', value: data[0].error },
    { name: 'executing', value: data[0].executing }
  ].filter(item => item.value > 0) : [];
  
  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-indigo-600" />
          Actions by Status
        </CardTitle>
        <CardDescription>{getDescription()}</CardDescription>
      </CardHeader>
      <CardContent style={{ minHeight: '300px' }}>
        {isLoading ? (
          <Skeleton className="h-[280px] w-full" />
        ) : !hasData ? (
          <div className="h-[280px] flex items-center justify-center text-gray-500">
            <div className="text-center">
              <Activity className="h-16 w-16 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium text-gray-900 mb-1">No actions executed</p>
              <p className="text-sm text-gray-500">
                No actions in the {timeRange === '7d' ? 'last 7 days' : 'last 24 hours'}
              </p>
            </div>
          </div>
        ) : (
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="45%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[entry.name]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend content={<CustomLegend />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}