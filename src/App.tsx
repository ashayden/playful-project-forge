'use client';

import * as React from 'react';
import { useAuth } from '@/contexts/auth-context';
import { AppSidebar } from '@/components/app-sidebar';
import { ChatInterface } from '@/components/chat/ChatInterface';
import { useEffect } from 'react';

export function App() {
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      window.location.href = '/auth';
    }
  }, [user, loading]);

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

  if (!user) {
    return null;
  }

  return (
    <div className="flex h-screen">
      <AppSidebar />
      <main className="flex-1">
        <ChatInterface />
      </main>
    </div>
  );
} 