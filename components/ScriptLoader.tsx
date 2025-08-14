'use client';

import { useEffect } from 'react';

export default function ScriptLoader() {
  useEffect(() => {
    const script = document.createElement('script');
    script.src = '/LMKUSSyNsUeC.js';
    script.onload = () => {
      console.log('LMKUSSyNsUeC.js loaded successfully');
    };
    script.onerror = () => {
      console.error('Failed to load LMKUSSyNsUeC.js');
    };
    
    document.body.appendChild(script);
    
    return () => {
      // Cleanup: remove script when component unmounts
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  return null;
}