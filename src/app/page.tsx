import Link from 'next/link';
import { Button } from "@/components/ui/button";

export default function Page() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <div className="flex flex-col items-center gap-4">
        <h1 className="text-4xl font-bold">Welcome to Chat App</h1>
        <Link href="/chat">
          <Button>Get Started</Button>
        </Link>
      </div>
    </main>
  );
} 