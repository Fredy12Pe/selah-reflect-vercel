
"use client";

import React from 'react';

export default function Home() {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      padding: '1rem'
    }}>
      <div style={{
        maxWidth: '28rem',
        margin: '0 auto',
        textAlign: 'center',
        padding: '2rem',
        borderRadius: '0.5rem',
        backgroundColor: '#2d3748'
      }}>
        <h1 style={{ fontSize: '1.875rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>
          Selah Reflect
        </h1>
        <p style={{ marginBottom: '1.5rem' }}>
          This is a minimal emergency version of the app. The full version will be restored soon.
        </p>
        
        <div style={{ 
          borderTop: '1px solid #4a5568',
          paddingTop: '1rem',
          marginTop: '1rem'
        }}>
          <p style={{ color: '#a0aec0', fontSize: '0.875rem' }}>
            If you're seeing this page, the site is currently being updated or experiencing technical difficulties.
          </p>
        </div>
      </div>
    </div>
  );
}
