"use client"

import { useState, useEffect, useCallback } from 'react';
import { Post, PaginatedPosts, SearchParams } from '@/types/post';
import { useAuth } from './use-auth';
import { supabase } from '@/lib/db';

export function usePosts() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentFilter, setCurrentFilter] = useState<'all' | 'mine'>('all');
  const { user } = useAuth();

  // Fetch posts with search and pagination
  const fetchPosts = useCallback(async (
    query: string = '',
    cursor: string | null = null,
    filter: 'all' | 'mine' = 'all',
    append: boolean = false
  ) => {
    try {      
      setLoading(true);
      setError(null);
      
      // Get current session for authorization
      const { data: { session } } = await supabase.auth.getSession();
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;        
      } else {
        console.log("No access token available for authorization");
      }
      
      const params = new URLSearchParams();
      if (query.trim()) params.append('query', query.trim());
      if (cursor) params.append('cursor', cursor);
      params.append('filter', filter);
      params.append('limit', '10');
          
      const response = await fetch(`/api/posts?${params.toString()}`, {
        headers
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch posts');
      }
      
      const data = await response.json();
      
      if (append) {        
        setPosts(prev => [...prev, ...data.posts]);
      } else {        
        setPosts(data.posts);
      }
      setHasMore(data.has_more);
      setNextCursor(data.next_cursor);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch posts');
    } finally {
      setLoading(false);
    }
  }, []);

  // Load more posts (pagination)
  const loadMore = useCallback(() => {
    if (!loading && hasMore && nextCursor) {
      fetchPosts(searchQuery, nextCursor, currentFilter, true);
    }
  }, [loading, hasMore, nextCursor, searchQuery, currentFilter, fetchPosts]);

  // Refresh posts
  const mutate = useCallback(() => {    
    fetchPosts(searchQuery, null, currentFilter, false);
  }, [fetchPosts, searchQuery, currentFilter]);

  // Initial load
  useEffect(() => {
    if (user) {
      fetchPosts(searchQuery, null, currentFilter, false);
    }
  }, [user, searchQuery, currentFilter, fetchPosts]);

  // Update search query
  const updateSearchQuery = useCallback((query: string) => {    
    setSearchQuery(query);
    setNextCursor(null);
    setHasMore(true);
  }, []);

  // Update filter
  const updateFilter = useCallback((filter: 'all' | 'mine') => {
    setCurrentFilter(filter);
    setNextCursor(null);
    setHasMore(true);
  }, []);

  return {
    posts,
    loading,
    error,
    hasMore,
    searchQuery,
    currentFilter,
    setSearchQuery: updateSearchQuery,
    setFilter: updateFilter,
    loadMore,
    mutate,
  };
}
