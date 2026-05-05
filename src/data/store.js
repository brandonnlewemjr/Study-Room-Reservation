const store = {
  rooms: [
    { id: 'R101', name: 'Study Room 101', capacity: 4, available: true },
    { id: 'R102', name: 'Study Room 102', capacity: 6, available: true },
    { id: 'R201', name: 'Study Room 201', capacity: 8, available: true }
  ],
  reservations: [],
  auditLogs: [],
  pendingAuditQueue: []
};

function resetStore() {
  store.reservations = [];
  store.auditLogs = [];
  store.pendingAuditQueue = [];
}

module.exports = {
  store,
  resetStore
};
