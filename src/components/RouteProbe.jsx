import React from "react";
import { useLocation, useMatches } from "react-router-dom";

export default function RouteProbe() {
  // Always call hooks unconditionally at the top
  let loc, matches, hookError;
  
  try {
    loc = useLocation(); 
    matches = useMatches();
  } catch (e) {
    hookError = e;
  }
  
  // Early return after hooks are called
  if (!window.__SHOW_PROBE__) return null;
  
  const style = {
    position:"fixed", 
    top:8, 
    right:8, 
    zIndex:99999,
    background: hookError ? "rgba(139,0,0,.9)" : "rgba(17,17,17,.9)", 
    color:"#fff", 
    padding:"8px 10px",
    borderRadius:8, 
    fontSize:12, 
    maxWidth:360,
    pointerEvents: 'none',
  };

  if (hookError) {
    return (
      <div style={style}>
        <div><b>RouteProbe Error:</b> {hookError.message}</div>
        <div><b>URL:</b> {window.location.pathname}</div>
      </div>
    );
  }

  return (
    <div style={style}>
      <div><b>Route:</b> {loc?.pathname || 'unknown'}{loc?.search || ''}</div>
      <div><b>Matches:</b> {matches?.map(m=>m.pathname).join(" → ") || "(none)"}</div>
    </div>
  );
}