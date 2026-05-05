const request = require('supertest');

const app = require('../src/app');
const { resetStore, store } = require('../src/data/store');
const auditService = require('../src/services/auditService');
const { resetRateLimiter } = require('../src/middleware/rateLimiter');
const reservationService = require('../src/services/reservationService');

function validReservation(overrides = {}) {
  return {
    studentId: '12345678',
    roomId: 'R101',
    startTime: '2026-05-05T10:00:00.000Z',
    endTime: '2026-05-05T11:00:00.000Z',
    ...overrides
  };
}

beforeEach(() => {
  resetStore();
  resetRateLimiter();
  auditService.setAvailable(true);
});

test('health check returns ok', async () => {
  const response = await request(app).get('/health');
  expect(response.status).toBe(200);
  expect(response.body.status).toBe('ok');
});

test('rejects reservation when end time is before start time', async () => {
  const response = await request(app)
    .post('/api/reservations')
    .send(validReservation({
      startTime: '2026-05-05T11:00:00.000Z',
      endTime: '2026-05-05T10:00:00.000Z'
    }));

  expect(response.status).toBe(400);
  expect(response.body.error).toBe('VALIDATION_ERROR');
  expect(store.reservations).toHaveLength(0);
});

test('rejects invalid student ID', async () => {
  const response = await request(app)
    .post('/api/reservations')
    .send(validReservation({ studentId: 'ABC' }));

  expect(response.status).toBe(400);
  expect(response.body.details).toContain('Student ID must be exactly 8 numeric digits.');
});

test('rejects unsafe room input', async () => {
  const response = await request(app)
    .post('/api/reservations')
    .send(validReservation({ roomId: 'R101; DROP TABLE reservations;' }));

  expect(response.status).toBe(400);
  expect(response.body.error).toBe('VALIDATION_ERROR');
});

test('creates a valid reservation', async () => {
  const response = await request(app)
    .post('/api/reservations')
    .send(validReservation());

  expect(response.status).toBe(201);
  expect(response.body.success).toBe(true);
  expect(response.body.reservation.status).toBe('ACTIVE');
  expect(store.auditLogs).toHaveLength(1);
});

test('prevents double booking for the same room and overlapping time', async () => {
  const first = await request(app)
    .post('/api/reservations')
    .send(validReservation());

  const second = await request(app)
    .post('/api/reservations')
    .send(validReservation({
      studentId: '87654321'
    }));

  expect(first.status).toBe(201);
  expect(second.status).toBe(409);
  expect(second.body.error).toBe('TIME_SLOT_CONFLICT');
  expect(store.reservations).toHaveLength(1);
});

test('allows non-overlapping reservation in same room', async () => {
  const first = await request(app)
    .post('/api/reservations')
    .send(validReservation());

  const second = await request(app)
    .post('/api/reservations')
    .send(validReservation({
      studentId: '87654321',
      startTime: '2026-05-05T11:00:00.000Z',
      endTime: '2026-05-05T12:00:00.000Z'
    }));

  expect(first.status).toBe(201);
  expect(second.status).toBe(201);
  expect(store.reservations).toHaveLength(2);
});

test('denies staff override for non-staff user', async () => {
  const createResponse = await request(app)
    .post('/api/reservations')
    .send(validReservation());

  const reservationId = createResponse.body.reservation.id;

  const overrideResponse = await request(app)
    .post(`/api/staff/override/${reservationId}`)
    .set('x-user-id', '12345678')
    .set('x-role', 'student')
    .send({ reason: 'Unauthorized attempt' });

  expect(overrideResponse.status).toBe(403);
  expect(overrideResponse.body.error).toBe('PERMISSION_DENIED');
});

test('allows staff override for staff user', async () => {
  const createResponse = await request(app)
    .post('/api/reservations')
    .send(validReservation());

  const reservationId = createResponse.body.reservation.id;

  const overrideResponse = await request(app)
    .post(`/api/staff/override/${reservationId}`)
    .set('x-user-id', 'staff01')
    .set('x-role', 'staff')
    .send({ reason: 'Maintenance issue' });

  expect(overrideResponse.status).toBe(200);
  expect(overrideResponse.body.reservation.status).toBe('OVERRIDDEN');
});

test('queues audit event when audit store is unavailable', async () => {
  auditService.setAvailable(false);

  const response = await request(app)
    .post('/api/reservations')
    .send(validReservation());

  expect(response.status).toBe(201);
  expect(store.auditLogs).toHaveLength(0);
  expect(store.pendingAuditQueue).toHaveLength(1);
});

test('does not mark no-show at 14 minutes and 59 seconds', () => {
  const result = reservationService.createReservation(validReservation({
    startTime: '2026-05-05T10:00:00.000Z',
    endTime: '2026-05-05T11:00:00.000Z'
  }));

  const marked = reservationService.markNoShows(new Date('2026-05-05T10:14:59.000Z'));
  const reservation = reservationService.getReservation(result.reservation.id);

  expect(marked).toBe(0);
  expect(reservation.status).toBe('ACTIVE');
});

test('marks no-show at exact threshold or later', () => {
  const result = reservationService.createReservation(validReservation({
    startTime: '2026-05-05T10:00:00.000Z',
    endTime: '2026-05-05T11:00:00.000Z'
  }));

  const marked = reservationService.markNoShows(new Date('2026-05-05T10:15:00.000Z'));
  const reservation = reservationService.getReservation(result.reservation.id);

  expect(marked).toBe(1);
  expect(reservation.status).toBe('NO_SHOW');
});

test('blocks repeated requests with rate limiting', async () => {
  let finalResponse;

  for (let i = 0; i < 45; i += 1) {
    finalResponse = await request(app)
      .get('/api/rooms');
  }

  expect(finalResponse.status).toBe(429);
  expect(finalResponse.body.error).toBe('RATE_LIMITED');
});
