import { NextRequest, NextResponse } from 'next/server';
import { createRouteSupabaseClient } from '@/lib/db-server';
import { postIdSchema } from '@/lib/validators';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    
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
    const authHeader = request.headers.get('authorization');    
    let user = null;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);      
      const { data: { user: tokenUser }, error: tokenError } = await supabase.auth.getUser(token);
      if (tokenUser && !tokenError) {
        user = tokenUser;
        console.log("User authenticated from Bearer token:", user.id);
      } else {
        console.log("Bearer token authentication failed:", tokenError);
      }
    }
    
    // If no user from token, try session
    if (!user) {      
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session || !session.user) {        
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      user = session.user;      
    }
    
    // Validate post ID
    const validatedId = postIdSchema.parse({ id: params.id });    

    // Check if post exists
    const { data: post, error: postError } = await supabase
      .from('posts')
      .select('id')
      .eq('id', validatedId.id)
      .single();

    if (postError || !post) {
      console.log("Post not found or error:", postError);
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }    

    // Check if user already liked this post    
    const { data: existingLike } = await supabaseAdmin
      .from('likes')
      .select('*')
      .eq('post_id', validatedId.id)
      .eq('user_id', user.id)
      .single();

    if (existingLike) {      
      return NextResponse.json({ error: 'Post already liked' }, { status: 400 });
    }    

    // Add the like    
    const { error: likeError } = await supabaseAdmin
      .from('likes')
      .insert({
        post_id: validatedId.id,
        user_id: user.id
      });

    if (likeError) {
      console.error('Like error:', likeError);
      return NextResponse.json({ error: 'Failed to like post' }, { status: 500 });
    }
    
    return NextResponse.json({ message: 'Post liked successfully' });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    
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
    const authHeader = request.headers.get('authorization');    
    let user = null;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);      
      const { data: { user: tokenUser }, error: tokenError } = await supabase.auth.getUser(token);
      if (tokenUser && !tokenError) {
        user = tokenUser;
        console.log("User authenticated from Bearer token:", user.id);
      } else {
        console.log("Bearer token authentication failed:", tokenError);
      }
    }
    
    // If no user from token, try session
    if (!user) {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session || !session.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      user = session.user;      
    }
        
    
    // Validate post ID
    const validatedId = postIdSchema.parse({ id: params.id });    

    // Remove the like
    const { error: unlikeError } = await supabaseAdmin
      .from('likes')
      .delete()
      .eq('post_id', validatedId.id)
      .eq('user_id', user.id);

    if (unlikeError) {
      console.error('Unlike error:', unlikeError);
      return NextResponse.json({ error: 'Failed to unlike post' }, { status: 500 });
    }    
    return NextResponse.json({ message: 'Post unliked successfully' });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
