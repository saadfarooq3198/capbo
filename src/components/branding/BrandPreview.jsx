import React from 'react';
import { Badge } from '@/components/ui/badge';
import SocialIcons from '@/components/public/icons/SocialIcons';

export default function BrandPreview({ branding }) {
  if (!branding) return <div>Loading Preview...</div>;

  const { logo, favicon, theme, seoGlobal, social } = branding;
  const seo = seoGlobal || {};
  const keywords = (seo.keywords || '').split(',').map(k => k.trim()).filter(Boolean);

  return (
    <div className="p-4 border rounded-lg bg-gray-50 space-y-6">
      <h3 className="font-medium text-lg">Live Preview</h3>

      {/* Logos */}
      <div>
        <h4 className="font-medium text-sm mb-2">Logos</h4>
        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 flex items-center justify-center rounded-lg h-24 bg-white border">
            {logo?.light?.file ? (
              <img src={logo.light.file} alt="Light Logo" className="max-h-16 max-w-full object-contain" />
            ) : (
              <span className="text-xs text-gray-400">No Light Logo</span>
            )}
          </div>
          <div className="p-3 flex items-center justify-center rounded-lg h-24 bg-gray-800 border">
             {logo?.dark?.file ? (
              <img src={logo.dark.file} alt="Dark Logo" className="max-h-16 max-w-full object-contain" />
            ) : (
              <span className="text-xs text-gray-400">No Dark Logo</span>
            )}
          </div>
        </div>
      </div>

      {/* Favicons */}
      <div>
        <h4 className="font-medium text-sm mb-2">Favicons</h4>
        <div className="flex items-center gap-4">
          {favicon?.variants?.[16] && <img src={favicon.variants[16]} alt="16x16" className="w-4 h-4 border" />}
          {favicon?.variants?.[32] && <img src={favicon.variants[32]} alt="32x32" className="w-8 h-8 border" />}
          {!favicon?.variants?.[16] && <span className="text-xs text-gray-400">No Favicon</span>}
        </div>
      </div>

      {/* SEO Preview */}
      <div>
        <h4 className="font-medium text-sm mb-2">SEO Preview (Google)</h4>
        <div className="p-3 bg-white border rounded">
          <p className="text-sm text-blue-800 truncate">{seo.title || 'Your Site Title'}</p>
          <p className="text-xs text-green-700 truncate">{seo.canonical || 'https://yoursite.com'}</p>
          <p className="text-xs text-gray-600 line-clamp-2 mt-1">{seo.description || 'Your site description will appear here.'}</p>
          {keywords.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {keywords.slice(0, 5).map((kw, i) => <Badge key={i} variant="secondary">{kw}</Badge>)}
              {keywords.length > 5 && <Badge variant="secondary">+{keywords.length - 5} more</Badge>}
            </div>
          )}
        </div>
      </div>

       {/* OG Preview */}
       {seo.og?.image?.file && (
        <div>
          <h4 className="font-medium text-sm mb-2">Social Preview (OpenGraph)</h4>
          <div className="border rounded overflow-hidden max-w-sm bg-white">
            <img src={seo.og.image.file} alt="OG Preview" className="w-full h-auto aspect-[1.91/1] object-cover" />
            <div className="p-3">
              <p className="text-xs text-gray-500 uppercase truncate">{new URL(seo.canonical || 'https://yoursite.com').hostname}</p>
              <p className="font-semibold truncate">{seo.og.title || seo.title}</p>
              <p className="text-sm text-gray-600 line-clamp-2">{seo.og.description || seo.description}</p>
            </div>
          </div>
        </div>
      )}

      {/* Social Icons */}
      <div>
        <h4 className="font-medium text-sm mb-2">Social Links</h4>
        <div className="p-3 bg-white border rounded">
            <SocialIcons socialLinks={social} />
        </div>
      </div>
    </div>
  );
}