const { store } = require('../data/store');

const OPEN_HOUR = 8;
const CLOSE_HOUR = 22;
const MAX_RESERVATION_HOURS = 4;

function isValidStudentId(studentId) {
  return typeof studentId === 'string' && /^\d{8}$/.test(studentId);
}

function containsUnsafeText(value) {
  if (typeof value !== 'string') {
    return false;
  }

  const unsafePattern = /(<script|<\/script|select\s+\*|drop\s+table|--|;|insert\s+into|delete\s+from)/i;
  return unsafePattern.test(value);
}

function validateReservationRequest(body) {
  const errors = [];

  if (!body || typeof body !== 'object') {
    return ['Request body is required.'];
  }

  const { studentId, roomId, startTime, endTime } = body;

  if (!isValidStudentId(studentId)) {
    errors.push('Student ID must be exactly 8 numeric digits.');
  }

  if (!roomId || containsUnsafeText(roomId)) {
    errors.push('Room ID is missing or invalid.');
  }

  const roomExists = store.rooms.some((room) => room.id === roomId);
  if (roomId && !roomExists) {
    errors.push('Room ID does not exist.');
  }

  const start = new Date(startTime);
  const end = new Date(endTime);

  if (Number.isNaN(start.getTime())) {
    errors.push('Start time must be a valid date.');
  }

  if (Number.isNaN(end.getTime())) {
    errors.push('End time must be a valid date.');
  }

  if (!Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime())) {
    if (end <= start) {
      errors.push('End time must be after start time.');
    }

    const durationHours = (end - start) / (1000 * 60 * 60);
    if (durationHours > MAX_RESERVATION_HOURS) {
      errors.push(`Reservation cannot exceed ${MAX_RESERVATION_HOURS} hours.`);
    }

    const startHour = start.getUTCHours();
    const endHour = end.getUTCHours();

    if (startHour < OPEN_HOUR || endHour > CLOSE_HOUR) {
      errors.push('Reservation must be within approved operating hours.');
    }
  }

  return errors;
}

module.exports = {
  validateReservationRequest,
  isValidStudentId,
  containsUnsafeText
};
