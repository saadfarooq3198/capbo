import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export default function KpiCard({ title, value, icon, isLoading, secondaryMetric, onClick, trend }) {
  const cardContent = (
    <Card className={`h-full transition-all duration-200 ${onClick ? 'cursor-pointer hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]' : ''}`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-gray-600 line-clamp-1 leading-5">{title}</CardTitle>
        <div className="text-indigo-600">{icon}</div>
      </CardHeader>
      <CardContent className="h-full flex flex-col">
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-4 w-16" />
          </div>
        ) : (
          <>
            <div className="text-3xl md:text-4xl font-semibold tracking-[-0.01em] text-gray-900 mb-1">{value}</div>
            <div className="mt-auto pt-2 text-xs min-h-[20px] flex items-center">
              {secondaryMetric ? (
                <div className={`flex items-center gap-1 whitespace-nowrap ${
                  trend === 'up' ? 'text-green-600' : 
                  trend === 'down' ? 'text-red-600' : 
                  'text-gray-500'
                }`}>
                  {trend === 'up' && '↗'}
                  {trend === 'down' && '↘'}
                  {secondaryMetric}
                </div>
              ) : (
                <span className="opacity-0">placeholder</span>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );

  return onClick ? (
    <div onClick={onClick} className="h-full">
      {cardContent}
    </div>
  ) : cardContent;
}