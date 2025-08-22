"use client"

import { useState, useCallback } from 'react';
import { usePosts } from './use-posts';
import { supabase } from '@/lib/db';

export function useLike(postId: string, initialIsLiked: boolean, initialLikesCount: number) {
  const [isLiked, setIsLiked] = useState(initialIsLiked);
  const [likesCount, setLikesCount] = useState(initialLikesCount);
  const [isMutating, setIsMutating] = useState(false);
  const { mutate } = usePosts();


  const toggleLike = useCallback(async () => {
    if (isMutating) return;
    const newIsLiked = !isLiked;
    const newLikesCount = newIsLiked ? likesCount + 1 : likesCount - 1;
    setIsLiked(newIsLiked);
    setLikesCount(newLikesCount);
    setIsMutating(true);
    try {
      // Get current session for authorization
      const { data: { session } } = await supabase.auth.getSession();
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }
      
      const method = newIsLiked ? 'POST' : 'DELETE';
      const response = await fetch(`/api/posts/${postId}/like`, { 
        method,
        headers
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to toggle like');
      }
      mutate();
    } catch (error) {
      setIsLiked(!newIsLiked);
      setLikesCount(!newIsLiked ? likesCount + 1 : likesCount - 1);
      console.error('Failed to toggle like:', error);
    } finally {
      setIsMutating(false);
    }
  }, [postId, isLiked, likesCount, isMutating, mutate]);

  return {
    isLiked,
    likesCount,
    toggleLike,
    isMutating,
  };
}
