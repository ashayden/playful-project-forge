import { AuthProvider } from '@/contexts/auth-context';
import { ChatProvider } from '@/contexts/ChatContext';
import { ErrorBoundary } from '@/components/error-boundary/ErrorBoundary';
import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Chat App',
  description: 'A modern chat application',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body>
        <ErrorBoundary>
          <AuthProvider>
            <ChatProvider>
              {children}
            </ChatProvider>
          </AuthProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
} 