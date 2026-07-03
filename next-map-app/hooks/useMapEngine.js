"use client";

import { useEffect, useRef, useState } from 'react';
import WorldEngine from '@/engine/world/WorldEngine';
// We also import utils to make sure SeededRandom initializes globally first
import '@/engine/world/utils';

export function useMapEngine(containerId) {
  const engineRef = useRef(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // 1. Verify container exists
    const container = document.getElementById(containerId);
    if (!container) return;

    // 2. Prevent duplicate initialization (React 18 Strict Mode protection)
    if (engineRef.current) return;

    try {
      console.log("Initializing Procedural Engine...");
      
      // 3. Create the engine exactly as your old app.js did
      const engine = new WorldEngine(containerId);
      
      // Bind to window for backward compatibility (so old UI buttons still work temporarily)
      window.worldEngineInstance = engine; 
      
      // Start the map generation!
      engine.init();

      // 4. Save to Ref and update State
      engineRef.current = engine;
      setIsReady(true);
      
    } catch (error) {
      console.error("Failed to boot Map Engine:", error);
    }

    // Cleanup when component unmounts
    return () => {
      // Future cleanup logic if needed
    };
  }, [containerId]);

  return { engine: engineRef.current, isReady };
}
