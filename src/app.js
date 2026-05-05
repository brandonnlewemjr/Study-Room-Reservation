const path = require('path');
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');

const { store } = require('./data/store');
const auditService = require('./services/auditService');
const reservationService = require('./services/reservationService');
const { attachUser, requireStaff } = require('./middleware/auth');
const { rateLimiter } = require('./middleware/rateLimiter');


const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));
app.use(attachUser);
app.use(rateLimiter({ windowMs: 60 * 1000, maxRequests: 40 }));
app.use(express.static(path.join(__dirname, '..', 'public')));

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'Study Room Reservation Lite'
  });
});

app.get('/api/rooms', (req, res) => {
  res.json({
    success: true,
    rooms: store.rooms
  });
});

app.get('/api/reservations', (req, res) => {
  res.json({
    success: true,
    reservations: reservationService.listReservations()
  });
});

app.post('/api/reservations', (req, res) => {
  const result = reservationService.createReservation(req.body);
  res.status(result.statusCode).json(result);
});

app.delete('/api/reservations/:id', (req, res) => {
  const result = reservationService.cancelReservation(req.params.id, req.user);
  res.status(result.statusCode).json(result);
});

app.post('/api/reservations/:id/check-in', (req, res) => {
  const result = reservationService.checkInReservation(req.params.id, req.user);
  res.status(result.statusCode).json(result);
});

app.post('/api/staff/override/:id', (req, res) => {
  const result = reservationService.staffOverride(req.params.id, req.body.reason, req.user);
  res.status(result.statusCode).json(result);
});

app.post('/api/system/no-shows', requireStaff, (req, res) => {
  const count = reservationService.markNoShows(new Date());
  res.json({
    success: true,
    markedNoShows: count
  });
});

app.get('/api/audit', requireStaff, (req, res) => {
  res.json({
    success: true,
    logs: store.auditLogs,
    pendingQueue: store.pendingAuditQueue
  });
});

app.post('/api/audit/simulate-down', requireStaff, (req, res) => {
  auditService.setAvailable(false);
  res.json({
    success: true,
    message: 'Audit store marked unavailable.'
  });
});

app.post('/api/audit/simulate-up', requireStaff, (req, res) => {
  auditService.setAvailable(true);
  const flushed = auditService.flushQueue();

  res.json({
    success: true,
    flushed
  });
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'ROUTE_NOT_FOUND',
    message: 'The requested endpoint does not exist.'
  });
});

module.exports = app;
