import React, { useEffect } from 'react';

export default function IndexPage() {
  useEffect(() => {
    // Redirect from root to /home immediately
    window.location.replace('/home');
  }, []);

  // Return nothing while redirecting
  return null;
}