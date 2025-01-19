import { ErrorBoundary } from '@/components/ErrorBoundary';
import { ChatInterface } from '@/components/chat/ChatInterface';

const Index = () => {
  return (
    <ErrorBoundary>
      <div className="flex-1 flex flex-col">
        <ChatInterface />
      </div>
    </ErrorBoundary>
  );
};

export default Index; 