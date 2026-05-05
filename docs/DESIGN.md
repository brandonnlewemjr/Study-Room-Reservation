# Design Document

## Architecture
The system uses a layered architecture:

1. API Layer
   - Receives HTTP requests
   - Sends JSON responses
   - Handles endpoint routing

2. Middleware Layer
   - Adds user identity from request headers
   - Enforces role-based access control
   - Applies rate limiting

3. Service Layer
   - Validates reservation requests
   - Creates and cancels reservations
   - Handles check-ins
   - Handles staff overrides
   - Marks no-shows

4. Data Layer
   - Stores rooms, reservations, audit logs, and pending audit events
   - Uses an in-memory store for this demo

## UML Diagrams to Include

### Use Case Diagram
Actors:
- Student
- Staff
- Admin

Use cases:
- View rooms
- Create reservation
- Cancel reservation
- Check in
- Override reservation
- View audit logs
- Mark no-shows

### Class Diagram
Classes:
- User
- Room
- Reservation
- AuditLog
- ReservationService
- AuditService
- ValidationService

### Sequence Diagram: Create Reservation
1. Student submits reservation request.
2. API receives request.
3. ValidationService validates input.
4. ReservationService checks for room/time conflict.
5. Reservation is saved.
6. AuditService records event.
7. API returns confirmation.

### Activity Diagram: Reservation Flow
Start → Enter reservation details → Validate input → Check room availability → Create reservation or reject → Record audit event → Display result.
