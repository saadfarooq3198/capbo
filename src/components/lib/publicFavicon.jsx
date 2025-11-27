import { getBlobURL } from '@/components/public/idbAssets';

export async function applyPublicFaviconFromIDB() {
  if (!document?.head || typeof window === 'undefined') return;
  
  try {
    const url = await getBlobURL('cabpoe_public_favicon');
    if (!url) return;

    // Remove existing icons
    document.head.querySelectorAll('link[rel="icon"], link[rel="apple-touch-icon"]').forEach(n => n.remove());

    const add = (rel, attrs) => {
      const l = document.createElement('link'); 
      l.rel = rel;
      Object.entries(attrs).forEach(([k, v]) => l.setAttribute(k, String(v)));
      document.head.appendChild(l);
    };

    // Use PNG blob for both standard and apple-touch
    add('icon', { type: 'image/png', href: url });
    add('icon', { type: 'image/png', sizes: '32x32', href: url });
    add('icon', { type: 'image/png', sizes: '16x16', href: url });
    add('apple-touch-icon', { sizes: '180x180', href: url });
  } catch (e) {
    console.warn('Failed to apply favicon from IndexedDB:', e);
  }
}

// Legacy function for compatibility
export function applyBrandingFavicon() {
  // Call the new IndexedDB version
  return applyPublicFaviconFromIDB();
}