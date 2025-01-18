const requiredEnvVars = [
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_ANON_KEY'
];

// Only enforce environment variables in production
if (process.env.NODE_ENV === 'production') {
  const missing = requiredEnvVars.filter(key => !process.env[key]);

  if (missing.length > 0) {
    console.error('Missing required environment variables:', missing.join(', '));
    process.exit(1);
  }
} else {
  // In development, just warn about missing variables
  const missing = requiredEnvVars.filter(key => !process.env[key]);
  if (missing.length > 0) {
    console.warn('Warning: Missing environment variables:', missing.join(', '));
  }
} 