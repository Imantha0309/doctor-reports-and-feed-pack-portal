const PAGE_SIZE = 10;
let allReports = [], filtered = [], currentPage = 1, editingId = null;
let currentUser = null;

// ── Bootstrap ────────────────────────────────────────────────────────────────

async function init() {
    await loadCurrentUser();
    await loadReports();
}

async function loadCurrentUser() {
    try {
        const res = await fetch('php/api.php?action=me');
        const result = await res.json();
        if (result.success) {
            currentUser = result.data;
            // Show "New Report" button for doctors and admins
            if (currentUser.role === 'doctor' || currentUser.role === 'admin') {
                document.getElementById('new-report-btn').style.display = 'inline-block';
                loadPatients();
            }
        }
    } catch (e) { console.error('Could not load user info', e); }
}

async function loadPatients() {
    try {
        const res = await fetch('php/api.php?action=patients');
        const result = await res.json();
        if (result.success) {
            const sel = document.getElementById('create-patient');
            result.data.forEach(p => {
                const opt = document.createElement('option');
                opt.value = p.id;
                opt.textContent = p.full_name || p.username;
                sel.appendChild(opt);
            });
        }
    } catch (e) { console.error('Could not load patients', e); }
}

// ── Load & filter ─────────────────────────────────────────────────────────────

async function loadReports() {
    try {
        const res = await fetch('php/api.php?action=reports');
        const result = await res.json();
        if (result.success) { allReports = result.data; applyFilters(); }
    } catch (e) { console.error('Error loading reports:', e); }
}

function applyFilters() {
    const search = document.getElementById('search-input').value.toLowerCase();
    const status = document.getElementById('status-filter').value;
    const sort   = document.getElementById('sort-select').value;

    filtered = allReports.filter(r => {
        const matchSearch = !search ||
            r.title.toLowerCase().includes(search) ||
            (r.patient_name || '').toLowerCase().includes(search) ||
            (r.specialization || '').toLowerCase().includes(search);
        return matchSearch && (!status || r.status === status);
    });

    filtered.sort((a, b) => {
        if (sort === 'oldest') return new Date(a.created_at) - new Date(b.created_at);
        if (sort === 'title')  return a.title.localeCompare(b.title);
        return new Date(b.created_at) - new Date(a.created_at);
    });

    currentPage = 1;
    renderTable();
}

// ── Render ────────────────────────────────────────────────────────────────────

function renderTable() {
    const tbody = document.getElementById('reports-table');
    const start = (currentPage - 1) * PAGE_SIZE;
    const page  = filtered.slice(start, start + PAGE_SIZE);

    if (filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:2rem;">No reports found</td></tr>';
        document.getElementById('pagination').innerHTML = '';
        return;
    }

    tbody.innerHTML = page.map(r => `
        <tr onclick="openModal(${r.id})">
            <td>#${r.id}</td>
            <td>${r.patient_name || 'N/A'}</td>
            <td>${r.title}</td>
            <td>${r.specialization || 'Unassigned'}</td>
            <td><span class="badge ${r.status}">${r.status}</span></td>
            <td>${new Date(r.created_at).toLocaleDateString()}</td>
        </tr>
    `).join('');

    renderPagination(filtered.length);
}

function renderPagination(total) {
    const totalPages = Math.ceil(total / PAGE_SIZE);
    const el = document.getElementById('pagination');
    if (totalPages <= 1) { el.innerHTML = ''; return; }

    let html = `<button class="page-btn" onclick="goPage(${currentPage-1})" ${currentPage===1?'disabled':''}>Prev</button>`;
    for (let i = 1; i <= totalPages; i++) {
        if (i === 1 || i === totalPages || Math.abs(i - currentPage) <= 1) {
            html += `<button class="page-btn ${i===currentPage?'active':''}" onclick="goPage(${i})">${i}</button>`;
        } else if (Math.abs(i - currentPage) === 2) {
            html += `<span class="page-info">...</span>`;
        }
    }
    html += `<button class="page-btn" onclick="goPage(${currentPage+1})" ${currentPage===totalPages?'disabled':''}>Next</button>`;
    html += `<span class="page-info">${total} total</span>`;
    el.innerHTML = html;
}

function goPage(p) {
    const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
    if (p < 1 || p > totalPages) return;
    currentPage = p;
    renderTable();
}

// ── View / edit modal ─────────────────────────────────────────────────────────

function openModal(id) {
    const r = allReports.find(x => x.id === id);
    if (!r) return;
    editingId = id;

    // Doctors can only edit their own reports; admins can edit all
    const canEdit = currentUser &&
        (currentUser.role === 'admin' || currentUser.role === 'doctor');

    document.getElementById('save-status-btn').style.display = canEdit ? 'inline-block' : 'none';

    document.getElementById('modal-body').innerHTML = `
        <div class="detail-row">
            <div class="detail-field"><label>Patient</label><p>${r.patient_name || 'N/A'}</p></div>
            <div class="detail-field"><label>Specialization</label><p>${r.specialization || 'Unassigned'}</p></div>
        </div>
        <div class="detail-row">
            <div class="detail-field"><label>Title</label><p>${r.title}</p></div>
            <div class="detail-field"><label>Date</label><p>${new Date(r.created_at).toLocaleString()}</p></div>
        </div>
        ${r.description ? `<div class="detail-row"><div class="detail-field"><label>Description</label><p style="white-space:pre-wrap;">${r.description}</p></div></div>` : ''}
        ${r.diagnosis   ? `<div class="detail-row"><div class="detail-field"><label>Diagnosis</label><p style="white-space:pre-wrap;">${r.diagnosis}</p></div></div>` : ''}
        ${canEdit ? `
        <div class="detail-row">
            <div class="detail-field">
                <label>Status</label>
                <select id="status-select">
                    <option value="pending"   ${r.status==='pending'?'selected':''}>Pending</option>
                    <option value="reviewed"  ${r.status==='reviewed'?'selected':''}>Reviewed</option>
                    <option value="completed" ${r.status==='completed'?'selected':''}>Completed</option>
                </select>
            </div>
        </div>` : `<div class="detail-row"><div class="detail-field"><label>Status</label><p><span class="badge ${r.status}">${r.status}</span></p></div></div>`}
    `;
    document.getElementById('modal-overlay').classList.add('open');
}

async function saveStatus() {
    const status = document.getElementById('status-select').value;
    try {
        const fd = new FormData();
        fd.append('id', editingId);
        fd.append('status', status);
        const res = await fetch('php/api.php?action=update_report', { method: 'POST', body: fd });
        const result = await res.json();
        if (result.success) {
            const rpt = allReports.find(x => x.id === editingId);
            if (rpt) rpt.status = status;
            applyFilters();
            closeModal('modal-overlay');
            showToast('Status updated', 'success');
        } else {
            showToast(result.message || 'Update failed', 'error');
        }
    } catch (e) { showToast('Error saving changes', 'error'); }
}

// ── Create report modal ───────────────────────────────────────────────────────

function openCreateModal() {
    // Clear form
    document.getElementById('create-title').value = '';
    document.getElementById('create-description').value = '';
    document.getElementById('create-diagnosis').value = '';
    document.getElementById('create-patient').value = '';
    document.getElementById('create-overlay').classList.add('open');
}

async function submitReport() {
    const title = document.getElementById('create-title').value.trim();
    if (!title) { showToast('Title is required', 'error'); return; }

    const fd = new FormData();
    fd.append('title',       title);
    fd.append('description', document.getElementById('create-description').value.trim());
    fd.append('diagnosis',   document.getElementById('create-diagnosis').value.trim());
    fd.append('patient_id',  document.getElementById('create-patient').value);

    try {
        const res = await fetch('php/api.php?action=create_report', { method: 'POST', body: fd });
        const result = await res.json();
        if (result.success) {
            closeModal('create-overlay');
            showToast('Report created successfully', 'success');
            await loadReports(); // refresh list
        } else {
            showToast(result.message || 'Failed to create report', 'error');
        }
    } catch (e) { showToast('Error submitting report', 'error'); }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function closeModal(id) {
    document.getElementById(id).classList.remove('open');
    if (id === 'modal-overlay') editingId = null;
}

function showToast(msg, type = '') {
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.className = 'toast ' + type;
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 3000);
}

document.getElementById('search-input').addEventListener('input', applyFilters);
document.getElementById('status-filter').addEventListener('change', applyFilters);
document.getElementById('sort-select').addEventListener('change', applyFilters);

['modal-overlay', 'create-overlay'].forEach(id => {
    document.getElementById(id).addEventListener('click', e => {
        if (e.target === e.currentTarget) closeModal(id);
    });
});

init();
