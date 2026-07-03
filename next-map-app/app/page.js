"use client"; // This tells Next.js this file runs in the browser, not the server

import Tooltip from '@/components/Tooltip';
import Toast from '@/components/Toast';
import RegionOverlay from '@/components/RegionOverlay';
import { useMapEngine } from '@/hooks/useMapEngine';

export default function WorldMapPage() {
  
  // 1. Boot up the procedural engine safely inside React
  const { isReady } = useMapEngine('world-container');

  return (
    <>
      {/* 1. The Map Container */}
      <div id="world-container">
        {/* SVG will be injected here by the engine, just like before */}
      </div>

      {/* 2. The UI Layer */}
      <div id="ui-layer">
        <Tooltip />
        <Toast />
        <RegionOverlay />
      </div>
    </>
  );
}
