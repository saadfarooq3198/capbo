import React from 'react';
import { idbSetBlob } from '@/components/public/idbAssets';

export default function BrandingFilePublisher({ branding }) {
  // Helper to extract File/Blob from common shapes:
  const takeFile = (v) => {
    // Already a File/Blob?
    if (v instanceof Blob) return v;
    if (!v || typeof v !== 'object') return null;
    // Shapes like: { file: File }, { file: { blob } }, { light: { file: File } }
    if (v.file instanceof Blob) return v.file;
    if (v.file && v.file.blob instanceof Blob) return v.file.blob;
    if (v.blob instanceof Blob) return v.blob;
    return null;
  };

  async function publish() {
    try {
      const logoFile =
        takeFile(branding?.logo?.light) ||
        takeFile(branding?.logo) ||
        takeFile(branding?.logo?.file) ||
        null;

      const favFile =
        takeFile(branding?.favicon) ||
        takeFile(branding?.favicon?.file) ||
        null;

      // Save what we have; skip missing
      if (logoFile) await idbSetBlob('cabpoe_public_logo', logoFile);
      if (favFile)  await idbSetBlob('cabpoe_public_favicon', favFile);

      // Notify public pages (optional)
      window.dispatchEvent(new CustomEvent('public-assets-updated'));

      console.log('[Branding] Published assets to IndexedDB');
      alert('Published. Refresh Home/About to see the logo & favicon.');
    } catch (e) {
      console.error('Publish failed', e);
      alert('Publish failed. Ensure the logo/favicon are selected as files in Branding.');
    }
  }

  return (
    <div className="mt-6 p-4 border rounded-lg bg-green-50">
      <h4 className="font-medium mb-2">Public Assets (Files)</h4>
      <button type="button"
        className="rounded-md border border-green-600/30 bg-white px-3 py-1.5 text-sm font-semibold text-green-700 hover:bg-green-100"
        onClick={publish}>
        Publish Public Assets (Files)
      </button>
      <p className="mt-2 text-xs text-green-900/80">
        Saves the currently selected Logo & Favicon files into your browser (IndexedDB). Public pages will load them directly.
      </p>
    </div>
  );
}