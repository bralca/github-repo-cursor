import React from 'react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export interface StatsCardProps {
  title: string;
  value: string;
  description: string;
  icon?: React.ReactNode;
  footer?: string;
  color?: 'green' | 'yellow' | 'red' | 'blue' | 'gray';
  statusText?: string;
  className?: string;
  actionButtons?: React.ReactNode;
}

export function StatsCard({
  title,
  value,
  description,
  icon,
  footer,
  color = 'gray',
  statusText,
  className,
  actionButtons,
}: StatsCardProps) {
  // Map color to Tailwind classes
  const getColorClasses = () => {
    switch (color) {
      case 'green':
        return 'bg-green-50 text-green-700 ring-green-600/20';
      case 'yellow':
        return 'bg-yellow-50 text-yellow-700 ring-yellow-600/20';
      case 'red':
        return 'bg-red-50 text-red-700 ring-red-600/20';
      case 'blue':
        return 'bg-blue-50 text-blue-700 ring-blue-600/20';
      case 'gray':
      default:
        return 'bg-gray-50 text-gray-700 ring-gray-600/20';
    }
  };

  return (
    <Card className={cn("overflow-hidden h-full flex flex-col", className)}>
      <CardContent className="p-6 flex-grow flex flex-col">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <h3 className="mt-1 text-2xl font-semibold">{value}</h3>
          </div>
          {icon && (
            <div className="rounded-full bg-muted p-2 flex-shrink-0">
              {icon}
            </div>
          )}
        </div>
        <p className="mt-2 text-sm text-muted-foreground">{description}</p>
        
        <div className="mt-auto">
          {statusText && (
            <div className="mt-4">
              <span className={cn(
                "inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ring-1 ring-inset",
                getColorClasses()
              )}>
                {statusText}
              </span>
            </div>
          )}
          
          {actionButtons && (
            <div className="flex gap-2 mt-4">
              {actionButtons}
            </div>
          )}
        </div>
      </CardContent>
      
      {footer && (
        <CardFooter className="border-t bg-muted/50 px-6 py-3 mt-auto">
          <p className="text-xs text-muted-foreground">{footer}</p>
        </CardFooter>
      )}
    </Card>
  );
} 