"use client"

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { Composer } from '@/components/composer';
import { Toolbar } from '@/components/toolbar';
import { PostCard } from '@/components/post-card';
import { useAuth } from '@/hooks/use-auth';
import { usePosts } from '@/hooks/use-posts';
import { Heart, Loader2 } from 'lucide-react';

export default function HomePage() {
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [isSigningUp, setIsSigningUp] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [authError, setAuthError] = useState('');

  const { user, loading, signIn, signUp, signOut } = useAuth();
  const { posts, loading: postsLoading, error: postsError, hasMore, loadMore, currentFilter, setFilter, mutate, setSearchQuery } = usePosts();


  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    
    if (authMode === 'signin') {
      setIsSigningIn(true);
      try {
        const { error } = await signIn(email, password);
        if (error) setAuthError(error.message);
      } finally {
        setIsSigningIn(false);
      }
    } else {
      setIsSigningUp(true);
      try {
        const { error } = await signUp(email, password, username);
        if (error) setAuthError(error.message);
      } finally {
        setIsSigningUp(false);
      }
    }
  };

  const handleFilterChange = (filter: 'all' | 'mine') => {
    setFilter(filter);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold">Micro Feed</h1>
            <ThemeToggle />
          </div>
          
          <div className="max-w-md mx-auto">
            <Card>
              <CardHeader>
                <CardTitle>
                  {authMode === 'signin' ? 'Sign In' : 'Sign Up'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAuth} className="space-y-4">
                  {authMode === 'signup' && (
                    <div>
                      <label htmlFor="username" className="block text-sm font-medium mb-2">
                        Username
                      </label>
                      <Input
                        id="username"
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="Enter username"
                        required
                      />
                    </div>
                  )}
                  
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium mb-2">
                      Email
                    </label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter email"
                      required
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="password" className="block text-sm font-medium mb-2">
                      Password
                    </label>
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter password"
                      required
                    />
                  </div>
                  
                  {authError && (
                    <p className="text-sm text-destructive">{authError}</p>
                  )}
                  
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={isSigningIn || isSigningUp}
                  >
                    {isSigningIn || isSigningUp ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {authMode === 'signin' ? 'Signing In...' : 'Signing Up...'}
                      </>
                    ) : (
                      authMode === 'signin' ? 'Sign In' : 'Sign Up'
                    )}
                  </Button>
                </form>
                
                <div className="mt-4 text-center">
                  <Button
                    variant="link"
                    onClick={() => setAuthMode(authMode === 'signin' ? 'signup' : 'signin')}
                    className="text-sm"
                  >
                    {authMode === 'signin' 
                      ? "Don't have an account? Sign Up" 
                      : "Already have an account? Sign In"
                    }
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Micro Feed</h1>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-muted-foreground">
              Welcome, {user.user_metadata?.username || 'User'}!
            </span>
            <Button variant="outline" onClick={signOut}>
              Sign Out
            </Button>
            <ThemeToggle />
          </div>
        </div>

        {/* Post Composer */}
        <Composer onPostCreated={() => mutate()} />

        {/* Toolbar */}
        <Toolbar
          onFilterChange={handleFilterChange}
          currentFilter={currentFilter}
          setSearchQuery={setSearchQuery}
        />

        {/* Posts Feed */}
        <div className="space-y-4">
          {postsLoading && posts.length === 0 ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : postsError ? (
            <Card>
              <CardContent className="pt-6">
                <p className="text-destructive text-center">{postsError}</p>
              </CardContent>
            </Card>
          ) : posts.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-muted-foreground">
                  {currentFilter === 'mine' ? 'You haven\'t posted anything yet.' : 'No posts found.'}
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              {posts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
              
              {hasMore && (
                <div className="text-center py-4">
                  <Button
                    onClick={loadMore}
                    disabled={postsLoading}
                    variant="outline"
                  >
                    {postsLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Loading...
                      </>
                    ) : (
                      'Load More'
                    )}
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
