/**
 * Global Event Bus (C&C Protocol)
 * Decouples the procedural generators from the UI and Camera systems.
 */
class EventBus {
  constructor() {
    this.listeners = {};
  }

  subscribe(event, callback) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
  }

  publish(event, data) {
    if (!this.listeners[event]) return;
    this.listeners[event].forEach(callback => callback(data));
  }
}

window.CodeVyuhBus = new EventBus();
