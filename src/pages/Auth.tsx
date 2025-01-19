import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Auth as SupabaseAuth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/services/loggingService";
import { useToast } from "@/hooks/use-toast";

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
    <div className="min-h-screen flex flex-col items-center justify-center bg-background">
      <div className="w-full max-w-[400px] px-4">
        <h1 className="text-4xl font-bold text-center mb-2 text-foreground">Chat Assistant</h1>
        <p className="text-muted-foreground text-center mb-8">React + TypeScript, LangChain, Supabase</p>
        <div className="bg-card border-border border rounded-lg p-4 shadow-lg">
          <SupabaseAuth 
            supabaseClient={supabase}
            appearance={{
              theme: ThemeSupa,
              variables: {
                default: {
                  colors: {
                    brand: 'hsl(var(--primary))',
                    brandAccent: 'hsl(var(--primary))',
                    brandButtonText: 'hsl(var(--primary-foreground))',
                    defaultButtonBackground: 'hsl(var(--secondary))',
                    defaultButtonBackgroundHover: 'hsl(var(--secondary))',
                    inputBackground: 'hsl(var(--background))',
                    inputBorder: 'hsl(var(--border))',
                    inputBorderHover: 'hsl(var(--border))',
                    inputBorderFocus: 'hsl(var(--ring))',
                    inputText: 'hsl(var(--foreground))',
                    dividerBackground: 'hsl(var(--border))',
                  },
                  fonts: {
                    bodyFontFamily: `ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif`,
                    buttonFontFamily: `ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif`,
                    inputFontFamily: `ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif`,
                    labelFontFamily: `ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif`,
                  },
                },
              },
              style: {
                button: {
                  borderRadius: 'var(--radius)',
                  padding: '10px 15px',
                  fontSize: '14px',
                  fontWeight: '500',
                },
                input: {
                  borderRadius: 'var(--radius)',
                  padding: '10px 15px',
                  fontSize: '14px',
                },
                label: {
                  fontSize: '14px',
                  marginBottom: '4px',
                  color: 'hsl(var(--muted-foreground))',
                },
                message: {
                  fontSize: '14px',
                  marginBottom: '12px',
                },
                anchor: {
                  color: 'hsl(var(--primary))',
                  fontSize: '14px',
                  textDecoration: 'none',
                },
              },
            }}
            theme="dark"
            providers={[]}
            redirectTo={window.location.origin}
          />
        </div>
      </div>
    </div>
  );
};

export default Auth;