import React from 'react';

export default function HealthUI() {
  return (
    <div style={{ padding: 16, fontFamily: 'ui-sans-serif', color: 'black', background: 'white' }}>
      <h1>UI OK</h1>
      <div>Time: {new Date().toLocaleString()}</div>
      <div>Path: {window.location.pathname + window.location.search}</div>
    </div>
  );
}