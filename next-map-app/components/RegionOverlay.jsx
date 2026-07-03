"use client";
import { useState, useEffect } from 'react';

export default function RegionOverlay() {
  const [region, setRegion] = useState(null);

  useEffect(() => {
    const handleShow = (e) => setRegion(e.detail.region);
    const handleHide = () => setRegion(null);

    window.addEventListener('showRegionView', handleShow);
    window.addEventListener('hideRegionView', handleHide);

    return () => {
      window.removeEventListener('showRegionView', handleShow);
      window.removeEventListener('hideRegionView', handleHide);
    };
  }, []);

  if (!region) return null; // We can just unmount it completely when hidden in React!

  return (
    <div id="region-view">
      <div className="region-view-content">
        <h1 id="region-view-title">{region.name}</h1>
        <div id="region-view-progress">Progress: {region.progress || 0}%</div>
        <div className="region-task-placeholder">
          <h3>Available Tasks</h3>
          <ul>
            {region.tasks && region.tasks.length > 0 ? (
              region.tasks.map((task, i) => <li key={i}>{task}</li>)
            ) : (
              <li>No active tasks in this region.</li>
            )}
          </ul>
        </div>
        <div className="region-actions">
          <button id="btn-enter-region" className="primary-btn">Enter Region</button>
          <button id="btn-complete-stage" className="primary-btn" onClick={() => window.completeCurrentStage && window.completeCurrentStage()} style={{ backgroundColor: '#ff8f00' }}>
            Complete Stage (Test)
          </button>
          <button id="btn-back-world" className="secondary-btn" onClick={() => window.closeRegionModal && window.closeRegionModal()}>Back to World</button>
        </div>
      </div>
    </div>
  );
}
