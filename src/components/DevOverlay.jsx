
import React from 'react';
import { isPreview } from "@/components/preview";

export default function DevOverlay() {
  if (!isPreview) return null;
  
  const style = {
    position: 'fixed',
    bottom: 8,
    right: 8,
    background: '#111',
    color: '#fff',
    padding: '6px 10px',
    borderRadius: 8,
    fontSize: 12,
    opacity: 0.85,
    zIndex: 99999
  };

  return (
    <div style={style}>
      preview mode • path: {window.location.pathname}
    </div>
  );
}
