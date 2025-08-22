import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

// For Server Components
export const createServerSupabaseClient = () => {
  const cookieStore = cookies();
  
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch (error) {
            console.log("setAll error (expected in some cases):", error);
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have multiple Server Components
            // in the same component tree.
          }
        },
      },
    }
  );
};

// For API Routes (Route Handlers) - try different approach
export const createRouteSupabaseClient = () => {  
  
  const cookieStore = cookies();
  // Log all available cookies
  const allCookies = cookieStore.getAll();  
  
  // Look specifically for Supabase auth cookies
  const supabaseCookies = allCookies.filter(c => 
    c.name.includes('supabase') || 
    c.name.includes('sb-') || 
    c.name.includes('auth')
  );
  
  const client = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {          
          const cookies = cookieStore.getAll();          
          return cookies;
        },
        setAll(cookiesToSet) {          
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch (error) {
            console.log("setAll error (expected in some cases):", error);
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have multiple Server Components
            // in the same component tree.
          }
        },
      },
    }
  );  
  return client;
};
