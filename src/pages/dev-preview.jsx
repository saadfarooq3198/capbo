import React from 'react';

export default function DevPreview() {
  return (
    <div style={{ padding: 16, fontFamily: 'sans-serif' }}>
      <div style={{padding:8, background:'#efe', color: '#373', fontFamily: 'monospace'}}>
        Dev Preview Component Mounted
      </div>
      <h1>Dev Preview</h1>
      <p>Dev Preview content loaded successfully</p>
      <ul>
        <li><a href="/health/ui">Health Check</a></li>
        <li><a href="/dashboard">Dashboard</a></li>
        <li><a href="/projects">Projects</a></li>
        <li><a href="/decision-runs">Decision Runs</a></li>
      </ul>
    </div>
  );
}