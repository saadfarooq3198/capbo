
import React, { useState } from 'react';
import { X, Upload, AlertTriangle } from 'lucide-react';

export default function PublicQuickAssetsModal({ onClose, onLogoUpdate }) {
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);

  const compressImage = (file, maxWidth = 800, quality = 0.8) => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        // Calculate new dimensions
        let { width, height } = img;
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
        
        canvas.width = width;
        canvas.height = height;
        
        // Draw and compress
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl);
      };
      
      img.src = URL.createObjectURL(file);
    });
  };

  const getStorageSize = () => {
    let total = 0;
    // Use a more robust loop for localStorage
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
            const value = localStorage.getItem(key);
            // Ensure the value is a string before accessing its length
            if (typeof value === 'string') {
                total += value.length;
            }
        }
    }
    return total;
  };

  const handleFileUpload = async (file, type) => {
    if (!file) return;
    
    setError('');
    setUploading(true);

    try {
      // Validate file size (limit to 2MB before compression)
      if (file.size > 2 * 1024 * 1024) {
        setError('File too large. Please use an image smaller than 2MB.');
        setUploading(false);
        return;
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Please select an image file.');
        setUploading(false);
        return;
      }

      let dataUrl;
      
      if (type === 'favicon') {
        // For favicon, use smaller compression
        dataUrl = await compressImage(file, 64, 0.9);
      } else {
        // For logo, use moderate compression
        dataUrl = await compressImage(file, 400, 0.85);
      }

      // Check if compressed image is still too large for localStorage
      const estimatedSize = dataUrl.length + getStorageSize();
      const maxLocalStorageSize = 5 * 1024 * 1024; // 5MB estimate
      
      if (estimatedSize > maxLocalStorageSize) {
        setError('Image too large even after compression. Please use a smaller image.');
        setUploading(false);
        return;
      }

      const storageKey = type === 'logo' ? 'cabpoe_public_logo' : 'cabpoe_public_favicon';
      
      try {
        localStorage.setItem(storageKey, dataUrl);
      } catch (storageError) {
        if (storageError.name === 'QuotaExceededError') {
          setError('Storage quota exceeded. Please clear some browser data or use a smaller image.');
          setUploading(false);
          return;
        } else {
          throw storageError;
        }
      }
      
      if (type === 'logo' && onLogoUpdate) {
        onLogoUpdate(dataUrl);
      } else if (type === 'favicon') {
        // Remove existing favicon links
        const existingFavicons = document.querySelectorAll('link[rel="icon"]');
        existingFavicons.forEach(link => link.remove());
        
        // Add new favicon
        const link = document.createElement('link');
        link.rel = 'icon';
        link.href = dataUrl;
        document.head.appendChild(link);
      }
      
      setError('');
      
    } catch (error) {
      console.error('File upload error:', error);
      setError('Failed to process image. Please try a different file.');
    }
    
    setUploading(false);
  };

  const handleDrop = (e, type) => {
    e.preventDefault();
    setDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileUpload(files[0], type);
    }
  };

  const handleFileInput = (e, type) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      handleFileUpload(files[0], type);
    }
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const clearAssets = () => {
    try {
      localStorage.removeItem('cabpoe_public_logo');
      localStorage.removeItem('cabpoe_public_favicon');
      
      // Remove favicon from page
      const existingFavicons = document.querySelectorAll('link[rel="icon"]');
      existingFavicons.forEach(link => link.remove());
      
      // Clear logo from header
      if (onLogoUpdate) {
        onLogoUpdate(null);
      }
      
      setError('Assets cleared successfully.');
    } catch (error) {
      setError('Failed to clear assets.');
    }
  };

  return (
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50" 
      onClick={handleOverlayClick}
    >
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Quick Assets Upload</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <div className="space-y-4">
          {/* Logo Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Logo Upload (will be compressed to ~400px width)
            </label>
            <div
              className={`relative border-2 border-dashed rounded-lg p-4 text-center ${
                dragOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
              } ${uploading ? 'opacity-50 pointer-events-none' : ''}`}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => handleDrop(e, 'logo')}
            >
              <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-600">
                {uploading ? 'Processing...' : 'Drop logo here or click to select'}
              </p>
              <p className="text-xs text-gray-500 mt-1">Max 2MB, will be compressed</p>
              {!uploading && (
                <input
                  type="file"
                  accept="image/*"
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  onChange={(e) => handleFileInput(e, 'logo')}
                />
              )}
            </div>
          </div>

          {/* Favicon Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Favicon Upload (will be compressed to 64x64px)
            </label>
            <div
              className={`relative border-2 border-dashed rounded-lg p-4 text-center ${
                dragOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
              } ${uploading ? 'opacity-50 pointer-events-none' : ''}`}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => handleDrop(e, 'favicon')}
            >
              <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-600">
                {uploading ? 'Processing...' : 'Drop favicon here or click to select'}
              </p>
              <p className="text-xs text-gray-500 mt-1">Max 2MB, will be compressed</p>
              {!uploading && (
                <input
                  type="file"
                  accept="image/*,.ico"
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  onChange={(e) => handleFileInput(e, 'favicon')}
                />
              )}
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-between">
          <button
            onClick={clearAssets}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors text-sm"
            disabled={uploading}
          >
            Clear Assets
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
            disabled={uploading}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
