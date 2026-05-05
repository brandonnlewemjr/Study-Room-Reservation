const { store } = require('../data/store');
const auditService = require('./auditService');
const { validateReservationRequest } = require('./validationService');

function createReservation(requestBody) {
  const errors = validateReservationRequest(requestBody);

  if (errors.length > 0) {
    return {
      success: false,
      statusCode: 400,
      error: 'VALIDATION_ERROR',
      details: errors
    };
  }

  const start = new Date(requestBody.startTime);
  const end = new Date(requestBody.endTime);

  const conflict = store.reservations.find((reservation) => {
    const reservationStart = new Date(reservation.startTime);
    const reservationEnd = new Date(reservation.endTime);

    const sameRoom = reservation.roomId === requestBody.roomId;
    const activeStatus = ['ACTIVE', 'CHECKED_IN'].includes(reservation.status);
    const overlaps = start < reservationEnd && end > reservationStart;

    return sameRoom && activeStatus && overlaps;
  });

  if (conflict) {
    auditService.record({
      action: 'RESERVATION_CONFLICT',
      actorId: requestBody.studentId,
      role: 'student',
      reservationId: conflict.id,
      details: `Conflict for room ${requestBody.roomId}`
    });

    return {
      success: false,
      statusCode: 409,
      error: 'TIME_SLOT_CONFLICT',
      message: 'This room is already reserved during that time.'
    };
  }

  const reservation = {
    id: `RES-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    studentId: requestBody.studentId,
    roomId: requestBody.roomId,
    startTime: start.toISOString(),
    endTime: end.toISOString(),
    status: 'ACTIVE',
    createdAt: new Date().toISOString()
  };

  store.reservations.push(reservation);

  auditService.record({
    action: 'RESERVATION_CREATED',
    actorId: requestBody.studentId,
    role: 'student',
    reservationId: reservation.id,
    details: `Reserved room ${reservation.roomId}`
  });

  return {
    success: true,
    statusCode: 201,
    reservation
  };
}

function listReservations() {
  return store.reservations;
}

function getReservation(id) {
  return store.reservations.find((reservation) => reservation.id === id);
}

function cancelReservation(id, user) {
  const reservation = getReservation(id);

  if (!reservation) {
    return {
      success: false,
      statusCode: 404,
      error: 'NOT_FOUND',
      message: 'Reservation not found.'
    };
  }

  const isOwner = reservation.studentId === user.id;
  const isStaff = user.role === 'staff' || user.role === 'admin';

  if (!isOwner && !isStaff) {
    auditService.record({
      action: 'CANCEL_DENIED',
      actorId: user.id,
      role: user.role,
      reservationId: id,
      details: 'Unauthorized cancellation attempt'
    });

    return {
      success: false,
      statusCode: 403,
      error: 'PERMISSION_DENIED',
      message: 'You are not allowed to cancel this reservation.'
    };
  }

  reservation.status = 'CANCELLED';
  reservation.cancelledAt = new Date().toISOString();

  auditService.record({
    action: 'RESERVATION_CANCELLED',
    actorId: user.id,
    role: user.role,
    reservationId: id,
    details: 'Reservation cancelled'
  });

  return {
    success: true,
    statusCode: 200,
    reservation
  };
}

function checkInReservation(id, user) {
  const reservation = getReservation(id);

  if (!reservation) {
    return {
      success: false,
      statusCode: 404,
      error: 'NOT_FOUND',
      message: 'Reservation not found.'
    };
  }

  if (reservation.studentId !== user.id) {
    return {
      success: false,
      statusCode: 403,
      error: 'PERMISSION_DENIED',
      message: 'Only the reservation owner can check in.'
    };
  }

  if (reservation.status !== 'ACTIVE') {
    return {
      success: false,
      statusCode: 400,
      error: 'INVALID_STATUS',
      message: 'Only active reservations can be checked in.'
    };
  }

  reservation.status = 'CHECKED_IN';
  reservation.checkedInAt = new Date().toISOString();

  auditService.record({
    action: 'RESERVATION_CHECKED_IN',
    actorId: user.id,
    role: user.role,
    reservationId: id,
    details: 'Student checked in'
  });

  return {
    success: true,
    statusCode: 200,
    reservation
  };
}

function staffOverride(id, reason, user) {
  if (!['staff', 'admin'].includes(user.role)) {
    auditService.record({
      action: 'STAFF_OVERRIDE_DENIED',
      actorId: user.id,
      role: user.role,
      reservationId: id,
      details: 'Non-staff override attempt'
    });

    return {
      success: false,
      statusCode: 403,
      error: 'PERMISSION_DENIED',
      message: 'Only staff may override reservations.'
    };
  }

  const reservation = getReservation(id);

  if (!reservation) {
    return {
      success: false,
      statusCode: 404,
      error: 'NOT_FOUND',
      message: 'Reservation not found.'
    };
  }

  reservation.status = 'OVERRIDDEN';
  reservation.overrideReason = reason || 'No reason provided';
  reservation.overriddenAt = new Date().toISOString();

  auditService.record({
    action: 'STAFF_OVERRIDE',
    actorId: user.id,
    role: user.role,
    reservationId: id,
    details: reservation.overrideReason
  });

  return {
    success: true,
    statusCode: 200,
    reservation
  };
}

function markNoShows(currentTime = new Date()) {
  const thresholdMinutes = 15;
  let count = 0;

  store.reservations.forEach((reservation) => {
    if (reservation.status !== 'ACTIVE') {
      return;
    }

    const start = new Date(reservation.startTime);
    const lateByMinutes = (currentTime - start) / (1000 * 60);

    if (lateByMinutes >= thresholdMinutes) {
      reservation.status = 'NO_SHOW';
      reservation.noShowMarkedAt = currentTime.toISOString();
      count += 1;

      auditService.record({
        action: 'NO_SHOW_MARKED',
        actorId: 'system',
        role: 'system',
        reservationId: reservation.id,
        details: `Marked no-show after ${thresholdMinutes} minutes`
      });
    }
  });

  return count;
}

module.exports = {
  createReservation,
  listReservations,
  getReservation,
  cancelReservation,
  checkInReservation,
  staffOverride,
  markNoShows
};
