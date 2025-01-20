'use client';

import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/auth-context';

export function AuthPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) {
      navigate('/chat');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold">Loading...</h2>
          <p className="text-sm text-muted-foreground">Please wait</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen items-center justify-center">
      <div className="w-full max-w-md space-y-8 px-4">
        <div className="text-center">
          <h1 className="text-4xl font-bold">Welcome</h1>
          <p className="mt-2 text-lg text-muted-foreground">Sign in to continue</p>
        </div>
        
        <div className="mt-8 space-y-4">
          <button
            onClick={() => window.location.href = `${import.meta.env.VITE_SUPABASE_URL}/auth/v1/authorize?provider=github`}
            className="w-full rounded-lg bg-primary px-4 py-2 text-white hover:bg-primary/90"
          >
            Continue with GitHub
          </button>
        </div>
      </div>
    </div>
  );
} 