"use client";
import { useState, useEffect } from 'react';

export default function Tooltip() {
  const [tooltipData, setTooltipData] = useState(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleShow = (e) => {
      setTooltipData(e.detail);
      setIsVisible(true);
    };
    const handleHide = () => setIsVisible(false);

    window.addEventListener('showTooltip', handleShow);
    window.addEventListener('hideTooltip', handleHide);

    return () => {
      window.removeEventListener('showTooltip', handleShow);
      window.removeEventListener('hideTooltip', handleHide);
    };
  }, []);

  const region = tooltipData?.region || {};
  const x = tooltipData?.x || 0;
  const y = tooltipData?.y || 0;

  return (
    <div 
      id="tooltip" 
      className={isVisible ? "" : "hidden"}
      style={{ left: `${x}px`, top: `${y}px` }}
    >
      <h3 id="tooltip-title" style={{ color: region.locked ? '#90a4ae' : '#fff' }}>
        {region.name || "Region Name"}
      </h3>
      
      {region.locked ? (
        <>
          <div id="tooltip-progress" style={{ color: '#ff5252' }}>Locked</div>
          <div style={{ fontSize: '0.85rem', color: '#9e9e9e', margin: '8px 0', textTransform: 'none', letterSpacing: 'normal', fontWeight: 'normal' }}>
            {region.unlockCondition || `Complete previous stage to unlock`}
          </div>
        </>
      ) : (
        <div id="tooltip-progress">Progress: {region.progress || 0}%</div>
      )}
      
      <div className="tooltip-hint">CLICK TO ENTER</div>
    </div>
  );
}
