# Requirements Document

## Finalized Software Requirements

### Functional Requirements
1. Students shall be able to create room reservations.
2. Students shall be able to cancel their own reservations.
3. Students shall be able to check in to active reservations.
4. The system shall display available study rooms.
5. The system shall validate student ID, room ID, start time, and end time.
6. The system shall prevent overlapping reservations for the same room.
7. The system shall mark late reservations as no-shows after the allowed threshold.
8. Staff users shall be able to override reservations.
9. Staff users shall be able to view audit logs.
10. The system shall record reservation create, cancel, check-in, override, and no-show events.

### Non-Functional Requirements
1. The system shall reject malformed or unsafe input.
2. The system shall provide reliable reservation outcomes under concurrent or repeated requests.
3. The system shall restrict staff-only functions using role-based access control.
4. The system shall provide clear failure messages.
5. The system shall preserve audit events by queueing them if audit logging is unavailable.
6. The system shall apply rate limiting to reduce abuse.
7. The system shall use server-side time for no-show decisions.

## Validation Report
The requirements were validated for completeness and feasibility by mapping each major stakeholder need to an implementable feature. Students need reliable reservations, staff need controlled override tools, and administrators need accountability through audit logs. The requirements are feasible with a standard web architecture using Node.js, Express, automated tests, and version control.
