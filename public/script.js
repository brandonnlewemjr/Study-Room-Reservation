const form = document.getElementById('form');
const msg = document.getElementById('msg');
const loginBtn = document.getElementById('loginBtn');
const refreshBtn = document.getElementById('refreshBtn');

let currentUser = {
  id: '12345678',
  role: 'student'
};

function updateCurrentUserText() {
  document.getElementById('currentUser').textContent =
    `Logged in as ${currentUser.id} (${currentUser.role})`;

  document.getElementById('studentId').value =
    currentUser.role === 'student' ? currentUser.id : '';
}

function getHeaders() {
  return {
    'Content-Type': 'application/json',
    'x-user-id': currentUser.id,
    'x-role': currentUser.role
  };
}

function showMessage(text, type = 'success') {
  msg.textContent = text;
  msg.style.color = type === 'error' ? '#fecaca' : '#86efac';
}

function formatDate(value) {
  return new Date(value).toLocaleString([], {
    dateStyle: 'medium',
    timeStyle: 'short'
  });
}

function localToIso(value) {
  return new Date(value).toISOString();
}

loginBtn.addEventListener('click', () => {
  const id = document.getElementById('loginId').value.trim();
  const role = document.getElementById('loginRole').value;

  if (!id) {
    alert('Enter a login ID first.');
    return;
  }

  currentUser = { id, role };
  updateCurrentUserText();
});

async function loadRooms() {
  const res = await fetch('/api/rooms');
  const data = await res.json();

  document.getElementById('rooms').innerHTML = data.rooms.map(room => `
    <div class="room-item">
      <div>
        <div class="room-title">${room.name}</div>
        <div class="meta">Room ID: ${room.id} · Capacity: ${room.capacity}</div>
      </div>
      <span class="badge">OPEN</span>
    </div>
  `).join('');
}

async function loadReservations() {
  const res = await fetch('/api/reservations');
  const data = await res.json();

  const container = document.getElementById('reservations');

  if (!data.reservations.length) {
    container.innerHTML = `<div class="empty">No reservations yet.</div>`;
    return;
  }

  container.innerHTML = data.reservations.map(reservation => `
    <div class="reservation-item">
      <div>
        <div class="res-title">${reservation.roomId} · ${reservation.studentId}</div>
        <div class="meta">${formatDate(reservation.startTime)} - ${formatDate(reservation.endTime)}</div>
        <div class="meta">ID: ${reservation.id}</div>
      </div>

      <div>
        <span class="badge ${reservation.status}">${reservation.status}</span>
        ${
          reservation.status === 'ACTIVE'
            ? `<button class="cancel-btn" onclick="cancelReservation('${reservation.id}')">Cancel</button>`
            : ''
        }
      </div>
    </div>
  `).join('');
}

async function cancelReservation(id) {
  const res = await fetch(`/api/reservations/${id}`, {
    method: 'DELETE',
    headers: getHeaders()
  });

  const data = await res.json();

  if (!res.ok) {
    alert(data.message || data.error);
    return;
  }

  await loadReservations();
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const payload = {
    studentId: document.getElementById('studentId').value.trim(),
    roomId: document.getElementById('roomId').value,
    startTime: localToIso(document.getElementById('startTime').value),
    endTime: localToIso(document.getElementById('endTime').value)
  };

  const res = await fetch('/api/reservations', {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(payload)
  });

  const data = await res.json();

  if (!res.ok) {
    const details = data.details ? ` ${data.details.join(' ')}` : '';
    showMessage(`${data.message || data.error}.${details}`, 'error');
    return;
  }

  showMessage('Reservation created successfully.');
  form.reset();
  updateCurrentUserText();
  await loadReservations();
});

refreshBtn.addEventListener('click', loadReservations);

updateCurrentUserText();
loadRooms();
loadReservations();