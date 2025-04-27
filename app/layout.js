"use client";

import React from 'react';
import "./globals.css";

export default function RootLayout({ children }) {
  return React.createElement(
    'html',
    { lang: 'en' },
    [
      React.createElement(
        'head',
        { key: 'head' },
        [
          React.createElement('title', { key: 'title' }, 'Selah - Daily Devotions'),
          React.createElement('meta', { key: 'description', name: 'description', content: 'A personal devotional app for daily reflection' }),
          React.createElement('meta', { key: 'viewport', name: 'viewport', content: 'width=device-width, initial-scale=1' }),
          React.createElement('script', { key: 'fix-node-modules', src: '/fix-node-modules.js' }),
          React.createElement('script', { key: 'firebase-fix', src: '/firebase-fix.js' }),
          React.createElement('script', { key: 'firebase-patch', src: '/firebase-patch.js' }),
          React.createElement('script', { key: 'debug', src: '/debug.js' }),
        ]
      ),
      React.createElement(
        'body',
        { key: 'body', className: 'bg-black text-white' },
        children
      )
    ]
  );
}