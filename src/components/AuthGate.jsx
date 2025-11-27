import React from 'react';
import { Navigate, Outlet } from "react-router-dom";
import { isPreview, mockUser } from "./preview";

export default function AuthGate() {
  // In preview mode, always allow access
  if (isPreview) {
    // Provide mock user so downstream hooks don't crash
    window.__USER__ = mockUser;
    return <Outlet />;
  }

  // In production, you'd check real session token here
  // For now, allow access to avoid being locked out
  const authed = true; 

  if (!authed) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}