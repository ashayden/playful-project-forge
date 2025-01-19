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
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
      <div className="w-full max-w-[400px] space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="text-4xl font-bold tracking-tight text-foreground">Chat Assistant</h1>
          <p className="text-muted-foreground">React + TypeScript, LangChain, Supabase</p>
        </div>
        <div className="bg-card border-border border rounded-lg p-6 shadow-lg">
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
                    anchorTextColor: 'hsl(var(--primary))',
                    anchorTextHoverColor: 'hsl(var(--primary))',
                  },
                  space: {
                    inputPadding: '16px',
                    buttonPadding: '16px',
                    spaceSmall: '16px',
                    spaceMedium: '24px',
                    spaceLarge: '32px',
                  },
                  fonts: {
                    bodyFontFamily: `ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif`,
                    buttonFontFamily: `ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif`,
                    inputFontFamily: `ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif`,
                    labelFontFamily: `ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif`,
                  },
                  borderWidths: {
                    buttonBorderWidth: '1px',
                    inputBorderWidth: '1px',
                  },
                  radii: {
                    borderRadiusButton: 'var(--radius)',
                    buttonBorderRadius: 'var(--radius)',
                    inputBorderRadius: 'var(--radius)',
                  },
                },
              },
              style: {
                button: {
                  padding: '16px',
                  fontSize: '14px',
                  fontWeight: '500',
                  height: 'auto',
                  marginTop: '24px',
                  marginBottom: '24px',
                },
                input: {
                  padding: '16px',
                  fontSize: '14px',
                  marginBottom: '16px',
                },
                label: {
                  fontSize: '14px',
                  marginBottom: '8px',
                  color: 'hsl(var(--foreground))',
                  fontWeight: '500',
                },
                message: {
                  fontSize: '14px',
                  padding: '12px',
                  marginBottom: '16px',
                  borderRadius: 'var(--radius)',
                },
                anchor: {
                  color: 'hsl(var(--primary))',
                  fontSize: '14px',
                  textDecoration: 'none',
                  fontWeight: '500',
                  marginTop: '16px',
                  display: 'inline-block',
                },
                container: {
                  gap: '24px',
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