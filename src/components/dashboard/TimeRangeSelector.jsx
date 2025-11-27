import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Clock } from 'lucide-react';

export default function TimeRangeSelector({ value, onChange, disabled = false }) {
  return (
    <div className="flex items-center gap-2">
      <Clock className="h-4 w-4 text-gray-500" />
      <Select value={value} onValueChange={onChange} disabled={disabled}>
        <SelectTrigger className="w-20 h-8 text-sm">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="24h">24h</SelectItem>
          <SelectItem value="7d">7d</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}