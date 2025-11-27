const STORAGE_KEY = 'cabpoe_branding_v2'; // New key for the new structure

const defaultBranding = {
  logo: { light: { file: null }, dark: { file: null } },
  favicon: { file: null, variants: {} },
  theme: { primary: '#0d47a1', secondary: '#1565c0', background: '#ffffff', surface: '#f8fafc', text: '#0f172a', accent: '#f59e0b', darkMode: false, fontFamily: 'System' },
  social: { facebook: '', instagram: '', linkedin: '', twitter: '', youtube: '' },
  seoGlobal: { title: 'CABPOE Pilot Console', description: '', keywords: '', canonical: '', index: true, follow: true, og: { image: null }, twitter: { card: 'summary' } },
  seoPages: { home: {}, about: {}, policy: {}, terms: {}, contact: {} },
  publicPages: {
    home: { h1: 'Welcome to the Console', h2: 'Advanced Decision Intelligence', paragraphs: [''], heroImage: { file: null } },
    about: { h1: 'About Us', paragraphs: [''] },
    policy: { h1: 'Privacy Policy', paragraphs: [''] },
    terms: { h1: 'Terms of Service', paragraphs: [''] },
    contact: { h1: 'Contact Us', paragraphs: [''] }
  }
};

// Simple deep merge for nested objects
function deepMerge(target, source) {
    const output = { ...target };
    if (target && typeof target === 'object' && source && typeof source === 'object') {
        Object.keys(source).forEach(key => {
            if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
                output[key] = deepMerge(target[key] || {}, source[key]);
            } else {
                output[key] = source[key];
            }
        });
    }
    return output;
}

export function getBrandingConfig() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    const parsed = stored ? JSON.parse(stored) : {};
    // Merge with defaults to ensure all keys exist
    const merged = deepMerge(defaultBranding, parsed);
    // Strip legacy social keys
    delete merged.social?.website;
    delete merged.social?.email;
    delete merged.social?.github;
    return merged;
  } catch {
    return defaultBranding;
  }
}

function normalizeSocialLink(key, value) {
    if (!value) return '';
    const handle = value.split('/').pop().replace('@', '');
    switch(key) {
        case 'facebook': return value.includes('facebook.com') ? value : `https://facebook.com/${handle}`;
        case 'instagram': return value.includes('instagram.com') ? value : `https://instagram.com/${handle}`;
        case 'linkedin': return value.includes('linkedin.com') ? value : `https://www.linkedin.com/company/${handle}`;
        case 'twitter': return value.includes('twitter.com') ? value : `https://twitter.com/${handle}`;
        case 'youtube': return value.includes('youtube.com') ? value : `https://youtube.com/@${handle}`;
        default: return value;
    }
}

function normalizeKeywords(keywords) {
    if (!keywords) return '';
    return [...new Set(keywords.split(',').map(k => k.trim()).filter(Boolean))]
        .slice(0, 20)
        .join(', ')
        .substring(0, 200);
}

export function setBrandingConfig(config) {
  try {
    const normalizedConfig = { ...config };
    // Normalize social links
    if (normalizedConfig.social) {
        Object.keys(normalizedConfig.social).forEach(key => {
            normalizedConfig.social[key] = normalizeSocialLink(key, normalizedConfig.social[key]);
        });
    }
    // Normalize SEO keywords
    if (normalizedConfig.seoGlobal) {
        normalizedConfig.seoGlobal.keywords = normalizeKeywords(normalizedConfig.seoGlobal.keywords);
    }
    if (normalizedConfig.seoPages) {
        Object.keys(normalizedConfig.seoPages).forEach(page => {
            if (normalizedConfig.seoPages[page]?.keywords) {
                normalizedConfig.seoPages[page].keywords = normalizeKeywords(normalizedConfig.seoPages[page].keywords);
            }
        });
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(normalizedConfig));
    return true;
  } catch {
    return false;
  }
}

export async function uploadBrandingFile(file, type = 'general') {
  return new Promise((resolve, reject) => {
    if (!file) return reject(new Error('No file provided'));

    const maxSizes = {
      logo: 2 * 1024 * 1024, // 2MB
      favicon: 512 * 1024,   // 512KB
      ogImage: 2 * 1024 * 1024, // 2MB
      heroImage: 4 * 1024 * 1024, // 4MB
    };

    const allowedTypes = {
      logo: ['image/png', 'image/svg+xml', 'image/jpeg'],
      favicon: ['image/x-icon', 'image/png', 'image/svg+xml'],
      ogImage: ['image/png', 'image/jpeg'],
      heroImage: ['image/png', 'image/jpeg', 'image/webp'],
    };

    const typeKey = type.startsWith('logo') ? 'logo' : type;

    if (file.size > (maxSizes[typeKey] || Infinity)) {
      return reject(new Error(`File too large. Max size: ${Math.round(maxSizes[typeKey] / 1024)}KB`));
    }
    if (!allowedTypes[typeKey]?.includes(file.type)) {
      return reject(new Error(`Invalid file type for ${typeKey}.`));
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => resolve({ file: e.target.result, mime: file.type, width: img.width, height: img.height });
      img.onerror = () => resolve({ file: e.target.result, mime: file.type, width: null, height: null }); // For SVGs
      img.src = e.target.result;
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

export function generateFaviconVariants(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const sizes = [16, 32, 48, 180, 192, 512];
      const variants = {};
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      let completed = 0;

      sizes.forEach(size => {
        canvas.width = size;
        canvas.height = size;
        ctx.clearRect(0, 0, size, size);
        ctx.drawImage(img, 0, 0, size, size);
        variants[size] = canvas.toDataURL('image/png');
        completed++;
        if (completed === sizes.length) resolve(variants);
      });
    };
    img.onerror = () => reject(new Error('Failed to load image for variant generation'));
    img.src = URL.createObjectURL(file);
  });
}