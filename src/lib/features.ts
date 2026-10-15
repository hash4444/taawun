/** Deferred modules are preserved for development, excluded from the initial marketplace. */
export const features = {
  legacyModules: import.meta.env.VITE_ENABLE_LEGACY_MODULES === 'true',
};
