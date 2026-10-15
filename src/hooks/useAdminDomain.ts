/** Admin routing is UI separation; trusted roles and RLS remain the authorization boundary. */
export function isAdminDomain(): boolean {
  const configured = import.meta.env.VITE_ADMIN_HOSTNAME?.toLowerCase();
  return !!configured && window.location.hostname.toLowerCase() === configured;
}

export function getAdminUrl(path = '/'): string {
  const safePath = path.startsWith('/') && !path.startsWith('//') ? path : '/';
  const configured = import.meta.env.VITE_ADMIN_HOSTNAME;
  if (configured && /^[a-z0-9.-]+$/i.test(configured) && window.location.hostname !== configured) {
    return `https://${configured}${safePath}`;
  }
  return safePath === '/' ? '/admin' : `/admin${safePath}`;
}

export function useAdminDomain() { return { isAdminDomain: isAdminDomain(), getAdminUrl }; }
