import { AuthProvider } from '@/contexts/auth-context';
import { ChatProvider } from '@/contexts/ChatContext';
import { ErrorBoundary } from '@/components/error-boundary/ErrorBoundary';
import './globals.css';

export const metadata = {
  title: 'Chat App',
  description: 'A modern chat application',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
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