import { useEffect } from 'react';

/**
 * On the main domain, /admin/* redirects to admin.skillanything.ai
 */
export default function AdminRedirect() {
  useEffect(() => {
    const hostname = window.location.hostname;
    
    // In production, redirect to the admin subdomain
    if (hostname.includes('skillanything.ai') && !hostname.startsWith('admin.')) {
      window.location.href = 'https://admin.skillanything.ai/';
      return;
    }
    
    // In preview/localhost, show a message
    // (the admin UI is accessible via ?admin=true or /admin path detection)
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6 text-center">
      <div>
        <h1 className="text-xl font-bold mb-2">Admin Panel</h1>
        <p className="text-muted-foreground mb-4">
          Redirecting to admin.skillanything.ai...
        </p>
        <a 
          href="https://admin.skillanything.ai/" 
          className="text-primary underline"
        >
          Go to Admin Panel
        </a>
      </div>
    </div>
  );
}
