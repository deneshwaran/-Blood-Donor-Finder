/* ============================================================
   BLOOD DONOR FINDER — MAIN JAVASCRIPT
   ============================================================ */

// ============ BLOOD COMPATIBILITY MAP ============
// Maps donor blood group to the recipient groups it can donate to
const compatibilityMap = {
  'O-': ['O-','O+','A-','A+','B-','B+','AB-','AB+'], // Universal donor
  'O+': ['O+','A+','B+','AB+'],
  'A-': ['A-','A+','AB-','AB+'],
  'A+': ['A+','AB+'],
  'B-': ['B-','B+','AB-','AB+'],
  'B+': ['B+','AB+'],
  'AB-': ['AB-','AB+'],
  'AB+': ['AB+'] // Universal recipient (can only receive from AB+)
};

const BLOOD_GROUPS = ['A+','A-','B+','B-','AB+','AB-','O+','O-'];

// ============ SAMPLE DATA (loaded on first run) ============
const sampleDonors = [
  { id: 1, name: 'Arun Kumar', age: 28, gender: 'Male', bloodGroup: 'O+',
    phone: '9876543210', email: 'arun@example.com', city: 'Vellore', area: 'Gandhinagar',
    lastDonation: '2026-03-15', availability: 'Available' },
  { id: 2, name: 'Priya S', age: 24, gender: 'Female', bloodGroup: 'A+',
    phone: '9876543211', email: 'priya@example.com', city: 'Chennai', area: 'Adyar',
    lastDonation: '2026-05-20', availability: 'Available' },
  { id: 3, name: 'Karthik R', age: 30, gender: 'Male', bloodGroup: 'B+',
    phone: '9876543212', email: 'karthik@example.com', city: 'Ranipet', area: 'Walajah',
    lastDonation: '2026-02-10', availability: 'Available' },
  { id: 4, name: 'Divya M', age: 26, gender: 'Female', bloodGroup: 'O-',
    phone: '9876543213', email: 'divya@example.com', city: 'Vellore', area: 'Katpadi',
    lastDonation: '2025-12-01', availability: 'Not Available' },
  { id: 5, name: 'Rahul K', age: 32, gender: 'Male', bloodGroup: 'AB+',
    phone: '9876543214', email: 'rahul@example.com', city: 'Chennai', area: 'T Nagar',
    lastDonation: '2026-06-18', availability: 'Available' },
  { id: 6, name: 'Anitha P', age: 27, gender: 'Female', bloodGroup: 'B-',
    phone: '9876543215', email: 'anitha@example.com', city: 'Ranipet', area: 'Sholinghur',
    lastDonation: '2026-04-05', availability: 'Available' }
];

// ============ INITIALIZE DATA ============
function initializeData() {
  if (!localStorage.getItem('donors')) {
    localStorage.setItem('donors', JSON.stringify(sampleDonors));
  }
  if (!localStorage.getItem('requests')) {
    localStorage.setItem('requests', JSON.stringify([]));
  }
}

function getDonors() {
  return JSON.parse(localStorage.getItem('donors') || '[]');
}

function getRequests() {
  return JSON.parse(localStorage.getItem('requests') || '[]');
}

function saveDonors(donors) {
  localStorage.setItem('donors', JSON.stringify(donors));
}

function saveRequests(requests) {
  localStorage.setItem('requests', JSON.stringify(requests));
}

// ============ NAVIGATION ============
function navigateTo(sectionId) {
  showSection(sectionId);
}

function showSection(sectionId) {
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  const section = document.getElementById(sectionId);
  if (!section) return;
  section.classList.add('active');

  document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
  const activeLink = document.querySelector(`.nav-link[data-section="${sectionId}"]`);
  if (activeLink) activeLink.classList.add('active');

  // Close mobile menu
  document.getElementById('navLinks').classList.remove('show');

  // Refresh data when switching sections
  if (sectionId === 'home') updateHomeStats();
  if (sectionId === 'find-donor') searchDonors();
  if (sectionId === 'emergency') showEmergencyRequests();
  if (sectionId === 'dashboard') updateDashboard();

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

document.querySelectorAll('.nav-link').forEach(link => {
  link.addEventListener('click', (e) => {
    e.preventDefault();
    showSection(link.getAttribute('href').slice(1));
  });
});

// Mobile menu toggle
document.getElementById('menuToggle').addEventListener('click', () => {
  document.getElementById('navLinks').classList.toggle('show');
});

// ============ DARK MODE ============
const themeToggle = document.getElementById('themeToggle');
themeToggle.addEventListener('click', () => {
  document.body.classList.toggle('dark-mode');
  const isDark = document.body.classList.contains('dark-mode');
  themeToggle.textContent = isDark ? '☀️' : '🌙';
  localStorage.setItem('theme', isDark ? 'dark' : 'light');
});

// Load saved theme
if (localStorage.getItem('theme') === 'dark') {
  document.body.classList.add('dark-mode');
  themeToggle.textContent = '☀️';
}

// ============ TOAST NOTIFICATIONS ============
function showToast(message, type = 'success') {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// ============ HOME PAGE STATS ============
function updateHomeStats() {
  const donors = getDonors();
  const requests = getRequests();
  document.getElementById('totalDonors').textContent = donors.length;
  document.getElementById('totalRequests').textContent = requests.length;
  document.getElementById('successfulConnections').textContent = requests.filter(r => r.fulfilled).length;

  // Emergency banner
  const emergencyRequests = requests.filter(r => r.emergency && !r.fulfilled);
  const banner = document.getElementById('emergencyBanner');
  const preview = document.getElementById('emergencyPreview');
  if (!banner || !preview) return;
  if (emergencyRequests.length > 0) {
    banner.style.display = 'block';
    preview.innerHTML = emergencyRequests.slice(0, 2).map(r =>
      `<p>🚨 ${r.bloodGroup} needed for ${r.patientName} at ${r.hospitalName}, ${r.city}</p>`
    ).join('');
  } else {
    banner.style.display = 'none';
  }
}

// ============ BLOOD COMPATIBILITY CHECKER ============
function checkCompatibility() {
  const donor = document.getElementById('donorBloodGroupCompat').value;
  const recipient = document.getElementById('recipientBloodGroup').value;
  const result = document.getElementById('compatibilityResult');

  if (!donor || !recipient) {
    result.className = 'compatibility-result';
    result.textContent = '⚠️ Please select both blood groups';
    result.style.background = '#fff3cd';
    result.style.color = '#856404';
    return;
  }

  const canDonate = compatibilityMap[donor].includes(recipient);
  if (canDonate) {
    result.className = 'compatibility-result compatible';
    result.innerHTML = `✅ <strong>Compatible!</strong> ${donor} can donate to ${recipient}`;
  } else {
    result.className = 'compatibility-result not-compatible';
    result.innerHTML = `❌ <strong>Not Compatible!</strong> ${donor} cannot donate to ${recipient}`;
  }
}

// ============ DONOR REGISTRATION ============
function registerDonor(event) {
  event.preventDefault();

  const phone = document.getElementById('donorPhone').value;
  const email = document.getElementById('donorEmail').value;
  const age = parseInt(document.getElementById('donorAge').value);

  // Validation
  if (age < 18 || age > 65) {
    showToast('Age must be between 18 and 65', 'error');
    return;
  }
  if (!/^[0-9]{10}$/.test(phone)) {
    showToast('Phone number must be 10 digits', 'error');
    return;
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    showToast('Invalid email address', 'error');
    return;
  }

  const donor = {
    id: Date.now(),
    name: document.getElementById('donorName').value.trim(),
    age: age,
    gender: document.getElementById('donorGender').value,
    bloodGroup: document.getElementById('donorBloodGroup').value,
    phone: phone,
    email: email,
    city: document.getElementById('donorCity').value.trim(),
    area: document.getElementById('donorArea').value.trim(),
    lastDonation: document.getElementById('donorLastDonation').value || 'N/A',
    availability: document.getElementById('donorAvailability').value
  };

  const donors = getDonors();
  donors.push(donor);
  saveDonors(donors);

  showToast('✅ Donor registered successfully!', 'success');
  document.getElementById('donorForm').reset();
}

// ============ BLOOD REQUEST SUBMISSION ============
function submitRequest(event) {
  event.preventDefault();

  const contact = document.getElementById('contactNumber').value;
  if (!/^[0-9]{10}$/.test(contact)) {
    showToast('Contact number must be 10 digits', 'error');
    return;
  }

  const request = {
    id: Date.now(),
    patientName: document.getElementById('patientName').value.trim(),
    bloodGroup: document.getElementById('requestBloodGroup').value,
    hospitalName: document.getElementById('hospitalName').value.trim(),
    city: document.getElementById('requestCity').value.trim(),
    units: document.getElementById('requiredUnits').value,
    contact: contact,
    requiredDate: document.getElementById('requiredDate').value,
    emergency: document.getElementById('isEmergency').checked,
    fulfilled: false,
    createdAt: new Date().toISOString()
  };

  const requests = getRequests();
  requests.push(request);
  saveRequests(requests);

  showToast('✅ Blood request submitted successfully!', 'success');
  document.getElementById('bloodRequestForm').reset();
}

// ============ SEARCH DONORS ============
function searchDonors() {
  const group = document.getElementById('searchBloodGroup').value;
  const city = document.getElementById('searchCity').value.toLowerCase().trim();
  const availability = document.getElementById('searchAvailability').value;
  const name = document.getElementById('searchName').value.toLowerCase().trim();

  const donors = getDonors();
  const filtered = donors.filter(d => {
    return (!group || d.bloodGroup === group) &&
           (!city || d.city.toLowerCase().includes(city)) &&
           (!availability || d.availability === availability) &&
           (!name || d.name.toLowerCase().includes(name));
  });

  renderDonors(filtered);
}

function resetSearch() {
  document.getElementById('searchBloodGroup').value = '';
  document.getElementById('searchCity').value = '';
  document.getElementById('searchAvailability').value = '';
  document.getElementById('searchName').value = '';
  searchDonors();
  showToast('Search reset', 'warning');
}

function renderDonors(donors) {
  const grid = document.getElementById('donorsGrid');
  if (donors.length === 0) {
    grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1;">
      <h3>😔 No donors found</h3>
      <p>Try adjusting your search criteria or <a href="#" onclick="showSection('register');return false;" style="color:var(--primary);">become a donor</a>!</p>
    </div>`;
    return;
  }

  grid.innerHTML = donors.map(d => `
    <div class="donor-card">
      <h3>${d.name}</h3>
      <span class="blood-badge">${d.bloodGroup}</span>
      <span class="availability ${d.availability === 'Available' ? 'available' : 'not-available'}">
        ${d.availability}
      </span>
      <div class="donor-info"><strong>📍 City:</strong> ${d.city}</div>
      <div class="donor-info"><strong>🏘️ Area:</strong> ${d.area}</div>
      <div class="donor-info"><strong>📞 Phone:</strong> ${d.phone}</div>
      <div class="donor-info"><strong>📧 Email:</strong> ${d.email}</div>
      <div class="donor-info"><strong>📅 Last Donation:</strong> ${d.lastDonation}</div>
      <div class="card-actions">
        <a href="tel:${d.phone}" class="btn btn-primary btn-small">📞 Call</a>
        <a href="mailto:${d.email}" class="btn btn-secondary btn-small">✉️ Email</a>
        <button class="btn btn-danger btn-small" onclick="deleteDonor(${d.id})">🗑️ Delete</button>
      </div>
    </div>
  `).join('');
}

function deleteDonor(id) {
  if (!confirm('Are you sure you want to delete this donor?')) return;
  const donors = getDonors().filter(d => d.id !== id);
  saveDonors(donors);
  searchDonors();
  showToast('Donor deleted', 'warning');
}

// ============ EMERGENCY REQUESTS ============
function showEmergencyRequests() {
  const requests = getRequests().filter(r => r.emergency);
  const grid = document.getElementById('emergencyRequests');

  if (requests.length === 0) {
    grid.innerHTML = '<div class="empty-state"><h3>No emergency requests</h3><p>Emergency blood requests will appear here.</p></div>';
    return;
  }

  grid.innerHTML = requests.map(r => `
    <div class="request-card emergency">
      <h3>${r.patientName} <span class="emergency-badge">🚨 EMERGENCY</span>
        ${r.fulfilled ? '<span class="fulfilled-badge">✅ FULFILLED</span>' : ''}
      </h3>
      <span class="blood-badge">${r.bloodGroup}</span>
      <div class="donor-info"><strong>🏥 Hospital:</strong> ${r.hospitalName}</div>
      <div class="donor-info"><strong>📍 City:</strong> ${r.city}</div>
      <div class="donor-info"><strong>💉 Units:</strong> ${r.units}</div>
      <div class="donor-info"><strong>📅 Required By:</strong> ${r.requiredDate}</div>
      <div class="donor-info"><strong>📞 Contact:</strong> ${r.contact}</div>
      <div class="card-actions">
        <a href="tel:${r.contact}" class="btn btn-primary btn-small">📞 Contact</a>
        ${!r.fulfilled ? `<button class="btn btn-success btn-small" onclick="markFulfilled(${r.id})">✅ Mark Fulfilled</button>` : ''}
        <button class="btn btn-danger btn-small" onclick="deleteRequest(${r.id})">🗑️ Delete</button>
      </div>
    </div>
  `).join('');
}

function markFulfilled(id) {
  const requests = getRequests();
  const req = requests.find(r => r.id === id);
  if (req) {
    req.fulfilled = true;
    saveRequests(requests);
    showEmergencyRequests();
    showToast('🎉 Request marked as fulfilled!', 'success');
  }
}

function deleteRequest(id) {
  if (!confirm('Delete this request?')) return;
  const requests = getRequests().filter(r => r.id !== id);
  saveRequests(requests);
  showEmergencyRequests();
  showToast('Request deleted', 'warning');
}

// ============ DASHBOARD ============
function updateDashboard() {
  const donors = getDonors();
  const requests = getRequests();

  document.getElementById('dashTotalDonors').textContent = donors.length;
  document.getElementById('dashAvailableDonors').textContent = donors.filter(d => d.availability === 'Available').length;
  document.getElementById('dashTotalRequests').textContent = requests.length;
  document.getElementById('dashEmergencyRequests').textContent = requests.filter(r => r.emergency).length;
  document.getElementById('dashFulfilledRequests').textContent = requests.filter(r => r.fulfilled).length;

  // Blood group chart
  const chart = document.getElementById('bloodGroupChart');
  const counts = {};
  BLOOD_GROUPS.forEach(g => counts[g] = 0);
  donors.forEach(d => { if (counts[d.bloodGroup] !== undefined) counts[d.bloodGroup]++; });
  const max = Math.max(...Object.values(counts), 1);

  chart.innerHTML = BLOOD_GROUPS.map(g => {
    const width = (counts[g] / max) * 100;
    return `
      <div class="bar-row">
        <div class="bar-label">${g}</div>
        <div class="bar">
          <div class="bar-fill" style="width:${width}%">${counts[g]}</div>
        </div>
      </div>
    `;
  }).join('');

  // All requests
  const allGrid = document.getElementById('allRequestsGrid');
  const empty = document.getElementById('requestsEmpty');
  if (!allGrid || !empty) return;
  if (requests.length === 0) {
    allGrid.innerHTML = '';
    empty.style.display = 'block';
  } else {
    empty.style.display = 'none';
    allGrid.innerHTML = requests.map(r => `
      <div class="request-card ${r.emergency ? 'emergency' : ''}">
        <h3>${r.patientName}
          ${r.emergency ? '<span class="emergency-badge">🚨 EMERGENCY</span>' : ''}
          ${r.fulfilled ? '<span class="fulfilled-badge">✅ FULFILLED</span>' : ''}
        </h3>
        <span class="blood-badge">${r.bloodGroup}</span>
        <div class="donor-info"><strong>🏥 Hospital:</strong> ${r.hospitalName}</div>
        <div class="donor-info"><strong>📍 City:</strong> ${r.city}</div>
        <div class="donor-info"><strong>💉 Units:</strong> ${r.units}</div>
        <div class="donor-info"><strong>📅 Required By:</strong> ${r.requiredDate}</div>
        <div class="donor-info"><strong>📞 Contact:</strong> ${r.contact}</div>
        <div class="card-actions">
          <a href="tel:${r.contact}" class="btn btn-primary btn-small">📞 Contact</a>
          ${!r.fulfilled ? `<button class="btn btn-success btn-small" onclick="markFulfilled(${r.id});updateDashboard();">✅ Mark Fulfilled</button>` : ''}
          <button class="btn btn-secondary btn-small" onclick="printRequest(${r.id})">🖨️ Print</button>
          <button class="btn btn-danger btn-small" onclick="deleteRequestDash(${r.id})">🗑️ Delete</button>
        </div>
      </div>
    `).join('');
  }
}

function deleteRequestDash(id) {
  if (!confirm('Delete this request?')) return;
  const requests = getRequests().filter(r => r.id !== id);
  saveRequests(requests);
  updateDashboard();
  showToast('Request deleted', 'warning');
}

function printRequest(id) {
  const r = getRequests().find(req => req.id === id);
  if (!r) return;
  const printWindow = window.open('', '', 'width=600,height=600');
  printWindow.document.write(`
    <html><head><title>Blood Request - ${r.patientName}</title>
    <style>
      body { font-family: Arial; padding: 20px; }
      h1 { color: #d32f2f; }
      .info { margin: 10px 0; }
    </style></head><body>
    <h1>🩸 Blood Request</h1>
    <div class="info"><strong>Patient:</strong> ${r.patientName}</div>
    <div class="info"><strong>Blood Group:</strong> ${r.bloodGroup}</div>
    <div class="info"><strong>Hospital:</strong> ${r.hospitalName}</div>
    <div class="info"><strong>City:</strong> ${r.city}</div>
    <div class="info"><strong>Units:</strong> ${r.units}</div>
    <div class="info"><strong>Required By:</strong> ${r.requiredDate}</div>
    <div class="info"><strong>Contact:</strong> ${r.contact}</div>
    <div class="info"><strong>Emergency:</strong> ${r.emergency ? 'YES' : 'No'}</div>
    <script>window.print();</script>
    </body></html>
  `);
  printWindow.document.close();
}

// ============ INITIALIZE ON LOAD ============
window.addEventListener('DOMContentLoaded', () => {
  initializeData();
  document.getElementById('donorForm').addEventListener('submit', registerDonor);
  document.getElementById('bloodRequestForm').addEventListener('submit', submitRequest);
  updateHomeStats();
  searchDonors();
});