import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth-context";
import { Github, Mail } from "lucide-react";

export default function AuthPage() {
  const { signInWithGithub, signInWithGoogle } = useAuth();

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
        <div className="flex flex-col space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">
            Welcome back
          </h1>
          <p className="text-sm text-muted-foreground">
            Sign in to continue to the chat
          </p>
        </div>
        <div className="grid gap-4">
          <Button variant="outline" onClick={signInWithGithub}>
            <Github className="mr-2 h-4 w-4" />
            Continue with GitHub
          </Button>
          <Button variant="outline" onClick={signInWithGoogle}>
            <Mail className="mr-2 h-4 w-4" />
            Continue with Google
          </Button>
        </div>
      </div>
    </div>
  );
} 