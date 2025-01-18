import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Auth as SupabaseAuth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { supabase } from "@/integrations/supabase/client";

const Auth = () => {
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.error("Session error:", error.message);
        return;
      }
      if (session) {
        navigate("/");
      }
    });

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
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#1E1E1E]">
      <div className="w-full max-w-[400px] px-4">
        <h1 className="text-4xl font-bold text-center mb-2 text-zinc-100">Chat Assistant Test v001</h1>
        <p className="text-zinc-400 text-center mb-8">Built with React + TypeScript, using LangChain for AI processing and Supabase for real-time data and auth.</p>
        <div className="bg-zinc-900 border-zinc-800 border rounded-lg p-4 shadow-lg">
          <SupabaseAuth 
            supabaseClient={supabase}
            appearance={{
              theme: ThemeSupa,
              variables: {
                default: {
                  colors: {
                    brand: '#7c3aed',
                    brandAccent: '#6d28d9',
                    brandButtonText: 'white',
                    defaultButtonBackground: '#27272a',
                    defaultButtonBackgroundHover: '#3f3f46',
                    inputBackground: '#18181b',
                    inputBorder: '#27272a',
                    inputBorderHover: '#3f3f46',
                    inputBorderFocus: '#6d28d9',
                    inputText: 'white',
                    dividerBackground: '#27272a',
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
                  borderRadius: '6px',
                  padding: '10px 15px',
                  fontSize: '14px',
                  fontWeight: '500',
                },
                input: {
                  borderRadius: '6px',
                  padding: '10px 15px',
                  fontSize: '14px',
                },
                label: {
                  fontSize: '14px',
                  marginBottom: '4px',
                  color: '#a1a1aa',
                },
                message: {
                  fontSize: '14px',
                  marginBottom: '12px',
                },
                anchor: {
                  color: '#7c3aed',
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