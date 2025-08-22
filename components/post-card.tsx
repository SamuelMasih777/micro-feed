"use client"

import { useState } from 'react';
import { Heart, MessageSquare, Edit, Trash2, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Post } from '@/types/post';
import { useLike } from '@/hooks/use-like';
import { useMutatePost } from '@/hooks/use-mutate-post';
import { formatRelativeTime, cn } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';

interface PostCardProps {
  post: Post;
}

export function PostCard({ post }: PostCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(post.content);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const { user } = useAuth();
  const { toggleLike, isLiked, likesCount } = useLike(post.id, post.is_liked || false, post.likes_count || 0);
  const { updatePost, deletePost, isMutating } = useMutatePost();

  const isOwnPost = user?.id === post.author_id;
  const canEdit = isOwnPost && !isMutating;

  const handleEdit = async () => {
    if (!editContent.trim() || editContent === post.content) {
      setIsEditing(false);
      return;
    }

    try {
      await updatePost(post.id, { content: editContent.trim() });
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update post:', error);
    }
  };

  const handleDelete = async () => {
    try {
      await deletePost(post.id);
      setShowDeleteModal(false); // close modal after delete
    } catch (error) {
      console.error('Failed to delete post:', error);
    }
  };
  

  const handleCancelEdit = () => {
    setEditContent(post.content);
    setIsEditing(false);
  };

  return (
    <Card className="mb-4 hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-sm font-medium">
              {post.author?.username?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div>
              <p className="font-medium text-sm">
                {post.author?.username || 'Unknown User'}
              </p>
              <p className="text-xs text-muted-foreground">
                {formatRelativeTime(post.created_at)}
                {post.updated_at !== post.created_at && ' (edited)'}
              </p>
            </div>
          </div>
          {isOwnPost && (
            <div className="flex items-center space-x-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsEditing(true)}
                disabled={!canEdit}
                className="h-8 w-8"
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowDeleteModal(true)}
                disabled={isMutating}
                className="h-8 w-8 text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="pb-3">
        {isEditing ? (
          <div className="space-y-3">
            <Textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="min-h-[80px] resize-none"
              maxLength={280}
            />
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCancelEdit}
                disabled={isMutating}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleEdit}
                disabled={!editContent.trim() || editContent === post.content || isMutating}
              >
                Save
              </Button>
            </div>
          </div>
        ) : (
          <p className="text-sm leading-relaxed whitespace-pre-wrap">
            {post.content}
          </p>
        )}
      </CardContent>

      <CardFooter className="pt-0">
        <div className="flex items-center space-x-4 w-full">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleLike}
            disabled={isMutating}
            className={cn(
              "flex items-center space-x-2",
              isLiked && "text-red-500 hover:text-red-600"
            )}
          >
            <Heart className={cn("h-4 w-4", isLiked && "fill-current")} />
            <span>{likesCount}</span>
          </Button>
          
          <div className="flex items-center space-x-2 text-muted-foreground">
            <MessageSquare className="h-4 w-4" />
            <span className="text-sm">0</span>
          </div>
        </div>
      </CardFooter>
      {showDeleteModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/50">
          <div className="bg-background rounded-lg p-6 w-80">
            <p className="text-sm mb-4">Are you sure you want to delete this post?</p>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDeleteModal(false)}
              >
                No
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={handleDelete}
                disabled={isMutating}
              >
                Yes
              </Button>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
