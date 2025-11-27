import { useEffect, useState } from 'react';

export default function useBranding() {
  const initial = (typeof window !== 'undefined')
    ? (window.__CABPOE_BRANDING__ || window.Branding || {})
    : {};
  const [branding, setBranding] = useState(initial);

  useEffect(() => {
    let i = 0, tries = 50; // ~5s
    const id = setInterval(() => {
      const b = (window.__CABPOE_BRANDING__ || window.Branding || {});
      if (b && Object.keys(b).length) { setBranding(b); clearInterval(id); }
      if (++i >= tries) clearInterval(id);
    }, 100);
    return () => clearInterval(id);
  }, []);

  return branding || {};
}