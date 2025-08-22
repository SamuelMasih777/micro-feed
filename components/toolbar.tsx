"use client"

import { Button } from '@/components/ui/button';
import { SearchBar } from './search-bar';

interface ToolbarProps {
  onFilterChange: (filter: 'all' | 'mine') => void;
  currentFilter: 'all' | 'mine';
  setSearchQuery: (query: string) => void;
}

export function Toolbar({ onFilterChange, currentFilter, setSearchQuery }: ToolbarProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-4 mb-6">
      <div className="flex-1">
        <SearchBar setSearchQuery={setSearchQuery}/>
      </div>
      <div className="flex gap-2">
        <Button
          variant={currentFilter === 'all' ? 'default' : 'outline'}
          onClick={() => onFilterChange('all')}
          size="sm"
        >
          All Posts
        </Button>
        <Button
          variant={currentFilter === 'mine' ? 'default' : 'outline'}
          onClick={() => onFilterChange('mine')}
          size="sm"
        >
          My Posts
        </Button>
      </div>
    </div>
  );
}
