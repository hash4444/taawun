/**
 * Hook and utilities for detecting admin subdomain access.
 * Admin interface is strictly isolated to admin.skillanything.ai
 */

const ADMIN_HOSTNAMES = [
  'admin.skillanything.ai',
];

/**
 * Check if the current hostname indicates admin domain access
 */
export function isAdminDomain(): boolean {
  const hostname = window.location.hostname;
  const search = window.location.search;
  const pathname = window.location.pathname;
  
  // Debug logging for production troubleshooting
  console.log('[isAdminDomain] hostname:', hostname, 'pathname:', pathname);
  
  // Production: exact match for admin.skillanything.ai
  if (ADMIN_HOSTNAMES.includes(hostname)) {
    console.log('[isAdminDomain] Matched admin hostname');
    return true;
  }
  
  // Lovable preview: check for admin=true query param OR /admin path on preview domains
  if (hostname.includes('lovable.app') || hostname.includes('lovableproject.com')) {
    // Check query param
    if (search.includes('admin=true')) {
      console.log('[isAdminDomain] Matched admin=true query param');
      return true;
    }
    // Check if path starts with /admin
    if (pathname.startsWith('/admin')) {
      console.log('[isAdminDomain] Matched /admin path on preview');
      return true;
    }
  }
  
  // Localhost: check for admin=true query param
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    if (search.includes('admin=true') || pathname.startsWith('/admin')) {
      console.log('[isAdminDomain] Matched localhost admin');
      return true;
    }
  }
  
  console.log('[isAdminDomain] No admin domain match');
  return false;
}

/**
 * Get the admin subdomain URL for redirects
 */
export function getAdminUrl(path: string = '/'): string {
  // In production, redirect to admin.skillanything.ai
  if (window.location.hostname.includes('skillanything.ai') && 
      !window.location.hostname.startsWith('admin.')) {
    return `https://admin.skillanything.ai${path}`;
  }
  // In preview/development, stay on same host with admin prefix
  return `/admin${path}`;
}

export function useAdminDomain() {
  return {
    isAdminDomain: isAdminDomain(),
    getAdminUrl,
  };
}
