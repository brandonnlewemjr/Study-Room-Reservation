# Study Room Reservation Lite

## Overview
Study Room Reservation Lite is a dependable campus reservation system that allows students to reserve study rooms while giving staff controlled access to override and reporting features.

This project was created for a full software development lifecycle assignment. It includes requirements, design documentation, implementation, testing, dependability enhancements, deployment notes, and maintenance guidance.

## Main Features
- Create study room reservations
- Cancel reservations
- View available rooms
- Check in to reservations
- Automatically mark no-shows
- Staff-only reservation override
- Audit logging for important actions
- Role-based access control
- Input validation
- Double-booking prevention
- Basic rate limiting

## Dependability Enhancements
The system includes protections from the dependability enhancement phase:
- Rejects malformed reservation data
- Prevents overlapping reservations
- Uses server-side time for no-show handling
- Restricts staff-only actions with role-based access control
- Records audit events for create, cancel, check-in, no-show, and override actions
- Queues audit events if the audit store becomes unavailable
- Rate-limits repeated requests

## Technology Stack
- Node.js
- Express
- Jest
- Supertest
- In-memory data store for demo purposes

## Setup Instructions
1. Install Node.js.
2. Open a terminal in this project folder.
3. Install dependencies:

```bash
npm install
```

4. Start the server:

```bash
npm start
```

5. The API will run at:

```bash
http://localhost:3000
```

## Run Tests
```bash
npm test
```

To run coverage:

```bash
npm run test:coverage
```

## API Endpoints

### Health Check
```http
GET /health
```

### List Rooms
```http
GET /api/rooms
```

### Create Reservation
```http
POST /api/reservations
Content-Type: application/json

{
  "studentId": "12345678",
  "roomId": "R101",
  "startTime": "2026-05-05T10:00:00.000Z",
  "endTime": "2026-05-05T11:00:00.000Z"
}
```

### Cancel Reservation
```http
DELETE /api/reservations/:id
x-user-id: 12345678
```

### Check In
```http
POST /api/reservations/:id/check-in
x-user-id: 12345678
```

### Staff Override
```http
POST /api/staff/override/:id
x-role: staff
Content-Type: application/json

{
  "reason": "Room unavailable due to maintenance"
}
```

### Audit Logs
```http
GET /api/audit
x-role: staff
```

## Demo Login Headers
This starter project uses simple request headers instead of a full login system.

Student request:
```http
x-user-id: 12345678
x-role: student
```

Staff request:
```http
x-user-id: staff01
x-role: staff
```

## Known Limitations
- This demo uses an in-memory database, so data resets when the server restarts.
- Authentication is simplified with request headers.
- The system is API-only and does not include a full frontend.
- Production deployment would require a persistent database and real authentication.

## Future Improvements
- Add React frontend
- Add persistent database such as PostgreSQL or MongoDB
- Add email or text reminders
- Add calendar integration
- Add admin dashboard
- Add CI/CD workflow on GitHub Actions
