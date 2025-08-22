import { NextRequest, NextResponse } from 'next/server';
import { createRouteSupabaseClient } from '@/lib/db-server';
import { createPostSchema } from '@/lib/validators';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  try {
    
    // Log cookies and headers
    const cookieHeader = request.headers.get('cookie');
    const authHeader = request.headers.get('authorization');

    const supabase = createRouteSupabaseClient();
    // Try to get user from authorization header first
    let user = null;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);      
      const { data: { user: tokenUser }, error: tokenError } = await supabase.auth.getUser(token);
      if (tokenUser && !tokenError) {
        user = tokenUser;        
      } else {
        console.log("Bearer token authentication failed:", tokenError);
      }
    }
        
    if (!user) {      
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      
      if (!session || !session.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      
      user = session.user;      
    }
    
    if (!user) {      
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query') || '';
    const cursor = searchParams.get('cursor');
    const filter = searchParams.get('filter') as 'all' | 'mine' || 'all';
    const limit = parseInt(searchParams.get('limit') || '10');

    let postsQuery = supabase
      .from('posts')
      .select(`
        *,
        author:profiles!posts_author_id_fkey(username),
        likes:likes(count)
      `)
      .order('created_at', { ascending: false })
      .limit(limit + 1);
    
    if (query.trim()) {      
      postsQuery = postsQuery.ilike('content', `%${query.trim()}%`);
    } else {
      console.log("No search query provided");
    }

    if (filter === 'mine') {
      postsQuery = postsQuery.eq('author_id', user.id);
    }

    if (cursor) {
      postsQuery = postsQuery.lt('created_at', cursor);
    }

    const { data: posts, error } = await postsQuery;

    if (error) {      
      return NextResponse.json({ error: 'Failed to fetch posts' }, { status: 500 });
    }
    
    const hasMore = posts.length > limit;
    const postsToReturn = hasMore ? posts.slice(0, limit) : posts;
    const nextCursor = hasMore ? posts[limit - 1].created_at : null;
    
    const postIds = postsToReturn.map(post => post.id);
    const { data: userLikes } = await supabase
      .from('likes')
      .select('post_id')
      .eq('user_id', user.id)
      .in('post_id', postIds);

    const likedPostIds = new Set(userLikes?.map(like => like.post_id) || []);

    // Transform posts to include like status and proper structure
    const transformedPosts = postsToReturn.map(post => ({
      id: post.id,
      author_id: post.author_id,
      content: post.content,
      created_at: post.created_at,
      updated_at: post.updated_at,
      author: {
        id: post.author_id,
        username: post.author?.username || 'Unknown'
      },
      likes_count: post.likes?.[0]?.count || 0,
      is_liked: likedPostIds.has(post.id)
    }));

    return NextResponse.json({
      posts: transformedPosts,
      has_more: hasMore,
      next_cursor: nextCursor
    });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {

    const cookieHeader = request.headers.get('cookie');
    const authHeader = request.headers.get('authorization');
    
    const supabase = createRouteSupabaseClient();    
    
    // Create service role client for bypassing RLS
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );
    
    // Try to get user from authorization header first
    let user = null;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);      
      const { data: { user: tokenUser }, error: tokenError } = await supabase.auth.getUser(token);
      if (tokenUser && !tokenError) {
        user = tokenUser;        
      } else {
        console.log("Bearer token authentication failed:", tokenError);
      }
    }
    
    // If no user from token, try session
    if (!user) {  
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {    
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      
      if (!session || !session.user) {        
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      
      user = session.user;
      console.log("User authenticated from session:", user.id);
    }
    
    if (!user) {      
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = createPostSchema.parse(body);

    // Check if user profile exists, create if not
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .single();

    if (!profile) {
      const username = user.email?.split('@')[0] || `user_${user.id.slice(0, 8)}`;
      
      const { data: newProfile, error: profileError } = await supabaseAdmin
        .from('profiles')
        .insert({
          id: user.id,
          username: username          
        })
        .select()
        .single();

      if (profileError) {
        console.error('Profile creation error:', profileError);
        console.error('Profile creation details:', { user_id: user.id, username: username });
        
        // Check if it's a username uniqueness error
        if (profileError.code === '23505' && profileError.message.includes('username')) {
          // Try with a different username
          const fallbackUsername = `user_${user.id.slice(0, 8)}_${Date.now()}`;          
          
                     const { data: newProfile2, error: profileError2 } = await supabaseAdmin
             .from('profiles')
             .insert({
               id: user.id,
               username: fallbackUsername
             })
             .select()
             .single();
            
          if (profileError2) {
            console.error('Fallback profile creation also failed:', profileError2);
            return NextResponse.json({ error: 'Failed to create profile' }, { status: 500 });
          }
                    
        } else {
          return NextResponse.json({ error: 'Failed to create profile' }, { status: 500 });
        }
      }
            
    }

    // Create the post using admin client to bypass RLS
    const { data: post, error } = await supabaseAdmin
      .from('posts')
      .insert({
        content: validatedData.content,
        author_id: user.id
      })
      .select(`
        *,
        author:profiles!posts_author_id_fkey(username)
      `)
      .single();

    if (error) {
      console.error('Post creation error:', error);
      return NextResponse.json({ error: 'Failed to create post' }, { status: 500 });
    }

    // Transform the response
    const transformedPost = {
      id: post.id,
      content: post.content,
      created_at: post.created_at,
      updated_at: post.updated_at,
      author: {
        id: post.author_id,
        username: post.author?.username || 'Unknown'
      },
      likes_count: 0,
      is_liked: false
    };

    return NextResponse.json(transformedPost, { status: 201 });

  } catch (error) {
    if (error instanceof Error && error.message.includes('Validation failed')) {
      return NextResponse.json({ error: 'Invalid post data' }, { status: 400 });
    }
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
