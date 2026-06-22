document.addEventListener('DOMContentLoaded', () => {
  const engine = new WorldEngine('world-container');
  window.worldEngineInstance = engine;
  engine.init();
});
