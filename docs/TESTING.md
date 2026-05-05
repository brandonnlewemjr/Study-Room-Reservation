# Testing and Validation Report

## Testing Strategy

### Unit Testing
Unit tests validate individual functions such as input validation, conflict checking, and no-show timing.

### Integration Testing
Integration tests verify that API endpoints, services, and the in-memory data store work together correctly.

### System Testing
System tests simulate complete workflows such as creating a reservation, preventing a conflict, checking in, and overriding a reservation.

### Acceptance Testing
Acceptance testing confirms that the implemented system satisfies the project requirements for students, staff, and administrators.

## Test Coverage Examples
- Reject reservation when end time is before start time.
- Reject invalid student ID.
- Reject unsafe room input.
- Create a valid reservation.
- Prevent double booking.
- Deny staff override for student accounts.
- Allow staff override for staff accounts.
- Queue audit event when audit store is unavailable.
- Avoid no-show penalty at 14:59.
- Mark no-show at 15:00.
- Block repeated requests with rate limiting.

## How to Run Tests
```bash
npm test
```
