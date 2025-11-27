import React, { useEffect } from 'react';

// Helper function to create or update a meta tag
const setMetaTag = (name, content, isOg = false) => {
  if (content === undefined || content === null) return;
  
  const attribute = isOg ? 'property' : 'name';
  let element = document.querySelector(`meta[${attribute}="${name}"]`);
  
  if (!element) {
    element = document.createElement('meta');
    element.setAttribute(attribute, name);
    document.head.appendChild(element);
  }
  element.setAttribute('content', content);
};

// Helper function to create or update a link tag
const setLinkTag = (rel, href) => {
  if (!href) return;

  let element = document.querySelector(`link[rel="${rel}"]`);
  if (!element) {
    element = document.createElement('link');
    element.setAttribute('rel', rel);
    document.head.appendChild(element);
  }
  element.setAttribute('href', href);
};

export function SEOHead({ title, description, keywords = [], ogImage, canonical, noindex = false }) {
  useEffect(() => {
    // Set document title
    if (title) {
      document.title = title;
    }

    // Standard meta tags
    setMetaTag('description', description);
    setMetaTag('keywords', keywords.filter(Boolean).join(', '));
    
    // Robots tag for indexing
    if (noindex) {
      setMetaTag('robots', 'noindex,nofollow');
    } else {
      // Clean up robots tag if noindex is false
      const robotsTag = document.querySelector('meta[name="robots"]');
      if (robotsTag) {
        robotsTag.remove();
      }
    }

    // Canonical URL
    setLinkTag('canonical', canonical);

    // Open Graph (for social sharing)
    setMetaTag('og:title', title, true);
    setMetaTag('og:description', description, true);
    setMetaTag('og:image', ogImage, true);

    // Twitter Card
    setMetaTag('twitter:card', 'summary_large_image');
    setMetaTag('twitter:title', title);
    setMetaTag('twitter:description', description);
    setMetaTag('twitter:image', ogImage);

  }, [title, description, keywords, ogImage, canonical, noindex]);

  return null; // This component only manages the document head and renders nothing
}