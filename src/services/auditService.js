const { store } = require('../data/store');

class AuditService {
  constructor() {
    this.available = true;
  }

  setAvailable(value) {
    this.available = Boolean(value);
  }

  record(event) {
    const auditEvent = {
      id: `AUD-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      timestamp: new Date().toISOString(),
      ...event
    };

    if (!this.available) {
      store.pendingAuditQueue.push(auditEvent);
      return {
        saved: false,
        queued: true,
        event: auditEvent
      };
    }

    store.auditLogs.push(auditEvent);
    return {
      saved: true,
      queued: false,
      event: auditEvent
    };
  }

  flushQueue() {
    if (!this.available) {
      return 0;
    }

    const queued = [...store.pendingAuditQueue];
    store.pendingAuditQueue = [];
    store.auditLogs.push(...queued);
    return queued.length;
  }
}

module.exports = new AuditService();
