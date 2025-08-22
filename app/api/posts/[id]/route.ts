import { NextRequest, NextResponse } from 'next/server';
import { createRouteSupabaseClient } from '@/lib/db-server';
import { postIdSchema, updatePostSchema } from '@/lib/validators';
import { createClient } from '@supabase/supabase-js';


async function getUserFromRequest(supabase: any, request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  let user = null;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    const { data: { user: tokenUser }, error: tokenError } = await supabase.auth.getUser(token);
    if (tokenUser && !tokenError) {
      user = tokenUser;
    } else {
      console.log("Bearer token failed:", tokenError);
    }
  }

  if (!user) {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (!session || !session.user) {
      console.log("Session auth failed:", sessionError);
      return null;
    }
    user = session.user;
  }

  return user;
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {

  try {
    const supabase = createRouteSupabaseClient();
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const user = await getUserFromRequest(supabase, request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });    

    const validatedId = postIdSchema.parse({ id: params.id });
    const body = await request.json();
    const validatedData = updatePostSchema.parse(body);

    // Check post ownership
    const { data: existingPost, error: fetchError } = await supabase
      .from('posts')
      .select('id, author_id')
      .eq('id', validatedId.id)
      .single();
    
    if (fetchError || !existingPost) return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    if (existingPost.author_id !== user.id) {      
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Update post
    const { data: updatedPost, error: updateError } = await supabaseAdmin
      .from('posts')
      .update({
        content: validatedData.content,
        updated_at: new Date().toISOString()
      })
      .eq('id', validatedId.id)
      .select(`*, author:profiles!posts_author_id_fkey(username)`)
      .single();
    
    if (updateError) return NextResponse.json({ error: 'Failed to update post' }, { status: 500 });

    return NextResponse.json({
      id: updatedPost.id,
      content: updatedPost.content,
      created_at: updatedPost.created_at,
      updated_at: updatedPost.updated_at,
      author: {
        id: updatedPost.author_id,
        username: updatedPost.author?.username || 'Unknown'
      },
      likes_count: 0,
      is_liked: false
    });

  } catch (err) {
    console.error("Unexpected PATCH error:", err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {

  try {
    const supabase = createRouteSupabaseClient();
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const user = await getUserFromRequest(supabase, request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });    

    const validatedId = postIdSchema.parse({ id: params.id });

    // Check post ownership
    const { data: existingPost, error: fetchError } = await supabase
      .from('posts')
      .select('id, author_id')
      .eq('id', validatedId.id)
      .single();
    
    if (fetchError || !existingPost) return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    if (existingPost.author_id !== user.id) {      
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Delete post
    const { error: deleteError } = await supabaseAdmin
      .from('posts')
      .delete()
      .eq('id', validatedId.id);
    
    if (deleteError) return NextResponse.json({ error: 'Failed to delete post' }, { status: 500 });
    
    return NextResponse.json({ message: 'Post deleted successfully' });

  } catch (err) {
    console.error("Unexpected DELETE error:", err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
