import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

export default function ViewAsBanner() {
  const [viewAsRole, setViewAsRole] = useState(null);

  useEffect(() => {
    const updateViewAsRole = () => {
      const role = sessionStorage.getItem('cabpoe.viewAsRole');
      setViewAsRole(role && role !== 'admin' ? role : null);
    };

    // Initial load
    updateViewAsRole();

    // Listen for changes
    const handleStorageChange = () => updateViewAsRole();
    const handleViewAsChange = () => updateViewAsRole();
    
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('cabpoe:viewAsRoleChanged', handleViewAsChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('cabpoe:viewAsRoleChanged', handleViewAsChange);
    };
  }, []);

  const handleExit = () => {
    sessionStorage.removeItem('cabpoe.viewAsRole');
    window.dispatchEvent(new CustomEvent('cabpoe:viewAsRoleChanged'));
  };

  if (!viewAsRole) return null;

  return (
    <div className="fixed top-0 left-0 right-0 bg-amber-500 text-white px-4 py-2 text-sm font-medium z-[2147483647] flex items-center justify-center gap-2">
      <span>
        Viewing as: <strong className="capitalize">{viewAsRole}</strong>
      </span>
      <Button 
        variant="ghost" 
        size="sm" 
        onClick={handleExit}
        className="text-white hover:bg-amber-600 h-6 px-2"
      >
        <X className="h-3 w-3 mr-1" />
        Exit
      </Button>
    </div>
  );
}