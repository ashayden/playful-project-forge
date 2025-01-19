import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/services/loggingService";
import { useToast } from "@/hooks/use-toast";
import { LoginForm } from "@/components/login-form";

const Auth = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const checkSession = async () => {
      try {
        logger.debug("Checking initial session...");
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          logger.error("Session error:", error);
          toast({
            variant: "destructive",
            title: "Authentication Error",
            description: "Failed to check your session. Please try again.",
          });
          return;
        }
        
        if (session) {
          logger.debug("Found existing session, redirecting to home");
          navigate("/");
        }
      } catch (error) {
        logger.error("Unexpected error checking session:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "An unexpected error occurred. Please try again.",
        });
      }
    };

    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      logger.debug("Auth state changed:", event);
      
      if (event === "SIGNED_IN" && session) {
        logger.debug("User signed in, redirecting to home");
        navigate("/");
      }
      
      if (event === "SIGNED_OUT") {
        logger.debug("User signed out, staying on auth page");
        navigate("/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate, toast]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
      <div className="w-full max-w-[400px] space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="text-4xl font-bold tracking-tight text-foreground">Chat Assistant</h1>
          <p className="text-muted-foreground">React + TypeScript, LangChain, Supabase</p>
        </div>
        <div className="bg-card border-border border rounded-lg p-6 shadow-lg">
          <LoginForm />
        </div>
      </div>
    </div>
  );
};

export default Auth;