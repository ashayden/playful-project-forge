'use client';

import * as React from 'react';
import { useAuth } from '@/contexts/auth-context';
import { AppSidebar } from '@/components/app-sidebar';
import { ChatInterface } from '@/components/chat/ChatInterface';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export function App() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
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