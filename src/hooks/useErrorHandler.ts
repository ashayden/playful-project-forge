import { useToast } from "@/components/ui/use-toast";
import { useCallback } from "react";

interface ErrorWithCode extends Error {
  code?: string;
  status?: number;
}

export function useErrorHandler() {
  const { toast } = useToast();

  const handleError = useCallback((error: ErrorWithCode) => {
    // Handle auth errors
    if (error.code?.startsWith('auth/') || error.code?.includes('authentication')) {
      toast({
        title: "Authentication Error",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    // Handle network errors
    if (error.message.includes('network') || error.message.includes('Network')) {
      toast({
        title: "Network Error",
        description: "Please check your internet connection and try again.",
        variant: "destructive",
      });
      return;
    }

    // Handle API errors
    if (error.status && error.status >= 400) {
      toast({
        title: `Error ${error.status}`,
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      });
      return;
    }

    // Handle unknown errors
    toast({
      title: "Error",
      description: error.message || "An unexpected error occurred",
      variant: "destructive",
    });
  }, [toast]);

  return { handleError };
} 