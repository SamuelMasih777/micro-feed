// Shared types for the micro feed application

export interface Profile {
  id: string;
  username: string;
  created_at: string;
}

export interface Post {
  id: string;
  author_id: string;
  content: string;
  created_at: string;
  updated_at: string;
  author?: Profile;
  likes_count?: number;
  is_liked?: boolean;
}

export interface Like {
  post_id: string;
  user_id: string;
  created_at: string;
}

export interface PaginatedPosts {
  posts: Post[];
  next_cursor?: string;
  has_more: boolean;
}

export interface CreatePostData {
  content: string;
}

export interface UpdatePostData {
  content: string;
}

export interface SearchParams {
  query?: string;
  cursor?: string;
  filter?: 'all' | 'mine';
}
