"use client"

import { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { usePosts } from '@/hooks/use-posts';
import { X } from 'lucide-react';

interface SearchBarProps {
  placeholder?: string;
  setSearchQuery: (query: string) => void;
}

export function SearchBar({ placeholder = "Search posts...", setSearchQuery}: SearchBarProps) {
  const [query, setQuery] = useState('');  
  
  useEffect(() => {
    const timer = setTimeout(() => {      
      setSearchQuery(query);
    }, 300);

    return () => clearTimeout(timer);
  }, [query, setSearchQuery]);

  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        type="text"
        placeholder={placeholder}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') setSearchQuery(query);
        }}
        className="pl-10 pr-10"
      />
      {query && (
        <button
          onClick={() => setQuery('')}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-destructive"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
