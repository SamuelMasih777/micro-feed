"use client"

import { useState } from 'react';
import { Post, CreatePostData, UpdatePostData } from '@/types/post';
import { usePosts } from './use-posts';
import { supabase } from '@/lib/db';

export function useMutatePost() {
  const [isMutating, setIsMutating] = useState(false);
  const { mutate } = usePosts();

  // Create a new post
  const createPost = async (data: CreatePostData): Promise<Post> => {
    setIsMutating(true);
    try {
      // Get current session for authorization
      const { data: { session } } = await supabase.auth.getSession();
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }
      
      const response = await fetch('/api/posts', {
        method: 'POST',
        headers,
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create post');
      }

      const post = await response.json();

      // Refresh posts list
      mutate();
      return post;
    } finally {
      setIsMutating(false);
    }
  };

  // Update an existing post
  const updatePost = async (id: string, data: UpdatePostData): Promise<Post> => {
    setIsMutating(true);
    try {
      // Get current session for authorization
      const { data: { session } } = await supabase.auth.getSession();
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }
      
      const response = await fetch(`/api/posts/${id}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update post');
      }
      const post = await response.json();
      mutate();
      return post;
    } finally {
      setIsMutating(false);
    }
  };

  // Delete a post
  const deletePost = async (id: string): Promise<void> => {
    setIsMutating(true);
    try {      
      
      // Get current session for authorization
      const { data: { session } } = await supabase.auth.getSession();
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }
      
      const response = await fetch(`/api/posts/${id}`, {
        method: 'DELETE',
        headers,
      });
            
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete post');
      }
      mutate();      
      // Force a re-fetch by calling the API directly as a fallback      
      const refreshResponse = await fetch('/api/posts?filter=all&limit=10', {
        headers: { 'Authorization': `Bearer ${session?.access_token}` }
      });
    } finally {
      setIsMutating(false);
    }
  };

  return {
    createPost,
    updatePost,
    deletePost,
    isMutating,
  };
}
