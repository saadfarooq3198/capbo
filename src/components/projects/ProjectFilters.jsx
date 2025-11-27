
import React from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Filter, ArrowUpDown } from 'lucide-react';

const statusOptions = ["all", "active", "paused", "draft", "archived"];
const domainOptions = ["all", "supply_chain", "bpo_support", "it_ops", "marketing", "finance", "custom"];
const sortOptions = [
  { value: "last_run_at-desc", label: "Last Activity" },
  { value: "name-asc", label: "Name (A-Z)" },
  { value: "avg_stability_24h-desc", label: "Avg. Stability" },
  { value: "updated_date-desc", label: "Last Updated" },
];

export default function ProjectFilters({ filters, setFilters }) {
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="bg-white p-4 rounded-xl shadow-sm mb-6 flex flex-wrap items-center gap-4">
      {/* Search */}
      <div className="relative flex-grow min-w-[250px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input 
          placeholder="Search projects..." 
          className="pl-10"
          value={filters.search}
          onChange={(e) => handleFilterChange('search', e.target.value)}
        />
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-500"/>
            <Select value={filters.status} onValueChange={(v) => handleFilterChange('status', v)}>
                <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                    {statusOptions.map(s => (
                        <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
        <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-500"/>
            <Select value={filters.domain} onValueChange={(v) => handleFilterChange('domain', v)}>
                <SelectTrigger className="w-[170px]">
                    <SelectValue placeholder="Domain" />
                </SelectTrigger>
                <SelectContent>
                     {domainOptions.map(d => (
                        <SelectItem key={d} value={d} className="capitalize">{d.replace('_', ' ')}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
      </div>
      
      {/* Sort */}
      <div className="flex items-center gap-2 ml-auto">
        <ArrowUpDown className="h-4 w-4 text-gray-500"/>
        <Select value={filters.sort} onValueChange={(v) => handleFilterChange('sort', v)}>
            <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
                 {sortOptions.map(s => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                ))}
            </SelectContent>
        </Select>
      </div>
    </div>
  );
}
