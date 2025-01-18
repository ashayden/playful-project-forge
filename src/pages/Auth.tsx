import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Auth as SupabaseAuth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

const Auth = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is already authenticated
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.error("Session error:", error.message);
        return;
      }
      if (session) {
        navigate("/");
      }
    });

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" && session) {
        navigate("/");
      }
      
      if (event === "SIGNED_OUT") {
        navigate("/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-background to-background/80 p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="space-y-4 text-center">
          <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent sm:text-5xl">
            Playful Project Forge
          </h1>
          <p className="mx-auto max-w-[600px] text-muted-foreground text-lg/relaxed">
            Your AI-powered development companion
          </p>
        </div>
        <Card className="border-2 shadow-lg backdrop-blur-sm bg-card/95">
          <CardHeader className="space-y-2">
            <CardTitle className="text-2xl text-center font-semibold">Welcome Back</CardTitle>
            <CardDescription className="text-center text-base text-muted-foreground">
              Sign in to continue your development journey
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SupabaseAuth 
              supabaseClient={supabase}
              appearance={{ 
                theme: ThemeSupa,
                variables: {
                  default: {
                    colors: {
                      brand: 'rgb(var(--primary))',
                      brandAccent: 'rgb(var(--primary))',
                      inputBackground: 'rgb(var(--muted))',
                      inputText: 'rgb(var(--foreground))',
                      inputBorder: 'rgb(var(--border))',
                      inputBorderFocus: 'rgb(var(--ring))',
                      inputBorderHover: 'rgb(var(--border))',
                      defaultButtonBackground: 'rgb(var(--muted))',
                      defaultButtonBackgroundHover: 'rgb(var(--muted-foreground))',
                      defaultButtonBorder: 'rgb(var(--border))',
                      defaultButtonText: 'rgb(var(--foreground))',
                    },
                    borderWidths: {
                      buttonBorderWidth: '1px',
                      inputBorderWidth: '1px',
                    },
                    radii: {
                      borderRadiusButton: '0.75rem',
                      buttonBorderRadius: '0.75rem',
                      inputBorderRadius: '0.75rem',
                    },
                  }
                },
                style: {
                  button: {
                    padding: '1rem 1.5rem',
                    fontWeight: '500',
                    border: '1px solid rgb(var(--border))',
                    transition: 'all 150ms',
                    backgroundColor: 'rgb(var(--muted))',
                    color: 'rgb(var(--foreground))',
                  },
                  anchor: {
                    color: 'rgb(var(--primary))',
                    fontWeight: '500',
                    textDecoration: 'none',
                    opacity: '1',
                    transition: 'opacity 150ms',
                  },
                  container: {
                    gap: '1.25rem',
                  },
                  message: {
                    color: 'rgb(var(--destructive))',
                    marginBottom: '0.75rem',
                    fontSize: '0.875rem',
                  },
                  label: {
                    color: 'rgb(var(--muted-foreground))',
                    marginBottom: '0.375rem',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                  },
                  input: {
                    backgroundColor: 'rgb(var(--muted))',
                    borderColor: 'rgb(var(--border))',
                    color: 'rgb(var(--foreground))',
                    transition: 'all 150ms',
                    outline: 'none',
                  },
                }
              }}
              providers={[]}
              redirectTo={window.location.origin}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Auth;