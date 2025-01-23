import Link from 'next/link';
import { Button } from "@/components/ui/button";

export const metadata = {
  title: 'Welcome | Chat App',
  description: 'Get started with our modern chat application',
};

export default function Page() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="flex flex-col items-center gap-6 text-center">
        <h1 className="text-4xl font-bold tracking-tight">Welcome to Chat App</h1>
        <p className="text-lg text-muted-foreground">
          Start a conversation with our AI assistant
        </p>
        <Link href="/chat" className="mt-4">
          <Button size="lg">Get Started</Button>
        </Link>
      </div>
    </main>
  );
} 