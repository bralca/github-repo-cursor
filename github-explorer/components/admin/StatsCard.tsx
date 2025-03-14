import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface StatsCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  statLabel: string;
  statValue: number;
  status: 'scheduled' | 'running' | 'idle' | 'error';
  lastRunTime: string;
  nextRunTime: string;
  errorMessage?: string;
  className?: string;
}

export const StatsCard = ({
  title,
  description,
  icon,
  statLabel,
  statValue,
  status,
  lastRunTime,
  nextRunTime,
  errorMessage,
  className,
}: StatsCardProps) => {
  // Status indicator styles and content
  const getStatusContent = () => {
    switch (status) {
      case 'scheduled':
        return (
          <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-200">
            Scheduled
          </Badge>
        );
      case 'running':
        return (
          <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-200 gap-1">
            <Loader2 className="h-3 w-3 animate-spin" />
            Running
          </Badge>
        );
      case 'idle':
        return (
          <Badge className="bg-slate-100 text-slate-700 hover:bg-slate-200">
            Idle
          </Badge>
        );
      case 'error':
        return (
          <Badge className="bg-red-100 text-red-700 hover:bg-red-200">
            Error
          </Badge>
        );
      default:
        return null;
    }
  };

  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <div className="flex items-center space-x-2">
          <div className="p-1">{icon}</div>
          <div>
            <CardTitle className="text-md font-medium">{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
        </div>
        {getStatusContent()}
      </CardHeader>
      <CardContent>
        <div className="mt-1">
          <div className="text-sm text-muted-foreground">{statLabel}</div>
          <div className="text-3xl font-bold">{statValue.toLocaleString()}</div>
        </div>

        {status === 'error' && errorMessage && (
          <div className="mt-3 flex items-start space-x-2 text-sm text-red-700 bg-red-50 p-2 rounded">
            <AlertCircle className="h-4 w-4 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex flex-col items-start text-xs text-muted-foreground pt-0">
        <p>Last run: {lastRunTime}</p>
        <p>Next scheduled: {nextRunTime}</p>
      </CardFooter>
    </Card>
  );
};

export default StatsCard; 