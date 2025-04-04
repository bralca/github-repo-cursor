'use client';

import React from 'react';
import { Timeframe } from '@/types/common';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface TimeframeSelectorProps {
  selectedTimeframe: Timeframe;
  onChange: (timeframe: Timeframe) => void;
}

export function TimeframeSelector({ selectedTimeframe, onChange }: TimeframeSelectorProps) {
  return (
    <div className="flex items-center">
      <span className="text-sm text-gray-500 mr-2">Timeframe:</span>
      <Select
        value={selectedTimeframe}
        onValueChange={(value) => onChange(value as Timeframe)}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Select timeframe" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="30days">Last 30 days</SelectItem>
          <SelectItem value="90days">Last 90 days</SelectItem>
          <SelectItem value="6months">Last 6 months</SelectItem>
          <SelectItem value="1year">Last year</SelectItem>
          <SelectItem value="all">All time</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
} 