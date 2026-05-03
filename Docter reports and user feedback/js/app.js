// ══════════════════════════════════════════════════════════════════════════════
// Helpers
// ══════════════════════════════════════════════════════════════════════════════
function escHtml(s) {
    return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
function formatDate(s) {
    return new Date(s).toLocaleDateString(undefined,{year:'numeric',month:'short',day:'numeric'});
}
function showToast(msg,type='') {
    const t=document.getElementById('toast');
    t.textContent=msg; t.className='toast '+type; t.classList.add('show');
    setTimeout(()=>t.classList.remove('show'),3500);
}
function showError(id,msg) {
    const el=document.getElementById(id);
    if(!el) return;
    el.textContent=msg; el.style.display='block';
}
function clearErrors() {
    document.querySelectorAll('.error-msg').forEach(el=>{el.style.display='none';el.textContent='';});
}
function openModal(id)  { document.getElementById(id).classList.add('open'); }
function closeModal(id) { document.getElementById(id).classList.remove('open'); }

document.querySelectorAll('.modal-overlay').forEach(el=>{
    el.addEventListener('click',e=>{ if(e.target===el) el.classList.remove('open'); });
});

// ══════════════════════════════════════════════════════════════════════════════
// Auth
// ══════════════════════════════════════════════════════════════════════════════
function switchAuthTab(tab) {
    document.querySelectorAll('.auth-tab').forEach(t=>t.classList.remove('active'));
    document.querySelectorAll('.auth-form').forEach(f=>f.classList.remove('active'));
    document.getElementById(tab+'-form').classList.add('active');
    event.currentTarget.classList.add('active');
    clearErrors();
}

async function doLogin() {
    clearErrors();
    const fd=new FormData();
    fd.append('action','login');
    fd.append('username',document.getElementById('login-username').value.trim());
    fd.append('password',document.getElementById('login-password').value);
    try {
        const r=await(await fetch('php/auth.php',{method:'POST',body:fd})).json();
        if(r.success) enterPortal(r.name);
        else showError('login-error',r.message);
    } catch(e) { showError('login-error','Connection error.'); }
}

async function doRegister() {
    clearErrors();
    const fd=new FormData();
    fd.append('action','register');
    fd.append('full_name',document.getElementById('reg-fullname').value.trim());
    fd.append('username', document.getElementById('reg-username').value.trim());
    fd.append('email',    document.getElementById('reg-email').value.trim());
    fd.append('password', document.getElementById('reg-password').value);
    try {
        const r=await(await fetch('php/auth.php',{method:'POST',body:fd})).json();
        if(r.success) enterPortal(r.name);
        else showError('register-error',r.message);
    } catch(e) { showError('register-error','Connection error.'); }
}

async function doRegisterDoctor() {
    clearErrors();
    const fd=new FormData();
    fd.append('action',         'register_doctor');
    fd.append('full_name',      document.getElementById('doc-fullname').value.trim());
    fd.append('username',       document.getElementById('doc-username').value.trim());
    fd.append('email',          document.getElementById('doc-email').value.trim());
    fd.append('password',       document.getElementById('doc-password').value);
    fd.append('specialization', document.getElementById('doc-specialization').value.trim());
    fd.append('license',        document.getElementById('doc-license').value.trim());
    fd.append('phone',          document.getElementById('doc-phone').value.trim());
    try {
        const r=await(await fetch('php/auth.php',{method:'POST',body:fd})).json();
        if(r.success) window.location.href='../Docter report dashboard/dashboard.html';
        else showError('doctor-error',r.message);
    } catch(e) { showError('doctor-error','Connection error.'); }
}

async function doLogout() {
    const fd=new FormData(); fd.append('action','logout');
    await fetch('php/auth.php',{method:'POST',body:fd});
    document.getElementById('portal-screen').style.display='none';
    document.getElementById('auth-screen').style.display='flex';
    document.querySelectorAll('.auth-tab').forEach((t,i)=>t.classList.toggle('active',i===0));
    document.querySelectorAll('.auth-form').forEach(f=>f.classList.remove('active'));
    document.getElementById('login-form').classList.add('active');
}

// ══════════════════════════════════════════════════════════════════════════════
// Portal entry
// ══════════════════════════════════════════════════════════════════════════════
function enterPortal(name) {
    document.getElementById('auth-screen').style.display='none';
    document.getElementById('portal-screen').style.display='block';
    document.getElementById('header-name').textContent=name||'User';
    showPage('reports-page',document.querySelector('.nav-tab'));
    loadReports();
    loadDoctorOptions();
}

function showPage(pageId,btn) {
    document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
    document.querySelectorAll('.nav-tab').forEach(t=>t.classList.remove('active'));
    document.getElementById(pageId).classList.add('active');
    if(btn) btn.classList.add('active');
}

// ══════════════════════════════════════════════════════════════════════════════
// My Reports (read-only for patients)
// ══════════════════════════════════════════════════════════════════════════════
let _reports=[];

async function loadReports() {
    const el=document.getElementById('reports-list');
    el.innerHTML='<div class="empty-state"><div class="icon">&#8987;</div><p>Loading...</p></div>';
    try {
        const r=await(await fetch('php/api.php?action=my_reports')).json();
        if(!r.success){el.innerHTML='<div class="empty-state"><div class="icon">&#9888;</div><p>Could not load reports.</p></div>';return;}
        if(!r.data.length){el.innerHTML='<div class="empty-state"><div class="icon">&#128196;</div><p>No medical reports yet. Your doctor will add them here.</p></div>';return;}
        _reports=r.data;
        el.innerHTML=r.data.map(rpt=>`
            <div class="report-card" onclick="openReport(${rpt.id})">
                <div class="report-card-header">
                    <div>
                        <div class="report-card-title">${escHtml(rpt.title)}</div>
                        <div class="report-card-meta">
                            Dr. ${escHtml(rpt.doctor_name||'Unknown')}
                            ${rpt.specialization?' &middot; '+escHtml(rpt.specialization):''}
                            &middot; ${formatDate(rpt.created_at)}
                        </div>
                    </div>
                    <span class="badge ${rpt.status}">${rpt.status}</span>
                </div>
                ${rpt.description?`<p style="font-size:0.875rem;color:#5a6c7d;margin-top:0.5rem;">${escHtml(rpt.description).substring(0,120)}${rpt.description.length>120?'…':''}</p>`:''}
            </div>`).join('');
    } catch(e) { el.innerHTML='<div class="empty-state"><div class="icon">&#9888;</div><p>Error loading reports.</p></div>'; }
}

function openReport(id) {
    const r=_reports.find(x=>x.id===id); if(!r) return;
    document.getElementById('report-modal-body').innerHTML=`
        <div class="detail-row">
            <div class="detail-field"><label>Title</label><p>${escHtml(r.title)}</p></div>
            <div class="detail-field"><label>Status</label><p><span class="badge ${r.status}">${r.status}</span></p></div>
        </div>
        <div class="detail-row">
            <div class="detail-field"><label>Doctor</label><p>${escHtml(r.doctor_name||'N/A')}</p></div>
            <div class="detail-field"><label>Specialization</label><p>${escHtml(r.specialization||'N/A')}</p></div>
        </div>
        <div class="detail-row"><div class="detail-field"><label>Date</label><p>${formatDate(r.created_at)}</p></div></div>
        ${r.description?`<div class="detail-row"><div class="detail-field"><label>Description</label><p>${escHtml(r.description)}</p></div></div>`:''}
        ${r.diagnosis?`<div class="detail-row"><div class="detail-field"><label>Diagnosis</label><p>${escHtml(r.diagnosis)}</p></div></div>`:''}`;
    openModal('report-modal');
}

// ══════════════════════════════════════════════════════════════════════════════
// Doctor picker
// ══════════════════════════════════════════════════════════════════════════════
async function loadDoctorOptions() {
    try {
        const r=await(await fetch('php/api.php?action=get_doctors')).json();
        if(!r.success) return;
        // main submit picker
        const list=document.getElementById('doctor-options-list');
        if(list) list.innerHTML=r.data.map(d=>`
            <div class="doctor-option" data-id="${d.id}" onclick="selectDoctor(this)">
                <div class="doctor-avatar">&#128104;&#8205;&#9877;&#65039;</div>
                <div class="doctor-info">
                    <div class="doctor-name">Dr. ${escHtml(d.full_name)}</div>
                    <div class="doctor-spec">${escHtml(d.specialization||'General Practice')}</div>
                </div>
                <span class="doctor-check">&#10003;</span>
            </div>`).join('');
        // edit modal select
        const sel=document.getElementById('edit-fb-doctor');
        if(sel){
            while(sel.options.length>1) sel.remove(1);
            r.data.forEach(d=>{
                const o=document.createElement('option');
                o.value=d.id; o.textContent='Dr. '+d.full_name+(d.specialization?' — '+d.specialization:'');
                sel.appendChild(o);
            });
        }
    } catch(e) { console.error(e); }
}

function selectDoctor(el) {
    document.querySelectorAll('.doctor-option').forEach(o=>o.classList.remove('selected'));
    el.classList.add('selected');
}

function getSelectedDoctorId() {
    const sel=document.querySelector('.doctor-option.selected');
    return sel?sel.dataset.id:'';
}

// ══════════════════════════════════════════════════════════════════════════════
// Submit Feedback
// ══════════════════════════════════════════════════════════════════════════════
async function submitFeedback() {
    const subject=document.getElementById('fb-subject').value.trim();
    const message=document.getElementById('fb-message').value.trim();
    const ratingEl=document.querySelector('input[name="rating"]:checked');
    const rating=ratingEl?ratingEl.value:0;
    document.getElementById('feedback-error').style.display='none';
    if(!message){showError('feedback-error','Please write a message.');return;}
    if(!rating) {showError('feedback-error','Please select a rating.');return;}
    const fd=new FormData();
    fd.append('doctor_id',getSelectedDoctorId());
    fd.append('subject',subject); fd.append('message',message); fd.append('rating',rating);
    try {
        const r=await(await fetch('php/api.php?action=submit_feedback',{method:'POST',body:fd})).json();
        if(r.success){
            document.getElementById('fb-subject').value='';
            document.getElementById('fb-message').value='';
            document.querySelectorAll('.doctor-option').forEach(o=>o.classList.remove('selected'));
            const gen=document.querySelector('.doctor-option[data-id=""]');
            if(gen) gen.classList.add('selected');
            if(ratingEl) ratingEl.checked=false;
            showToast('Feedback submitted. Thank you!','success');
        } else showError('feedback-error',r.message||'Submission failed.');
    } catch(e) { showError('feedback-error','Connection error.'); }
}

// ══════════════════════════════════════════════════════════════════════════════
// Feedback History — with Edit & Delete
// ══════════════════════════════════════════════════════════════════════════════
let _feedbacks=[], _editFbId=null;

async function loadFeedbackHistory() {
    const el=document.getElementById('feedback-history-list');
    el.innerHTML='<div class="empty-state"><div class="icon">&#8987;</div><p>Loading...</p></div>';
    try {
        const r=await(await fetch('php/api.php?action=my_feedbacks')).json();
        if(!r.success||!r.data.length){
            el.innerHTML='<div class="empty-state"><div class="icon">&#128172;</div><p>You haven\'t submitted any feedback yet.</p></div>';
            return;
        }
        _feedbacks=r.data;
        el.innerHTML=r.data.map(f=>`
            <div class="feedback-item">
                <div class="feedback-item-header">
                    <span class="feedback-subject">${escHtml(f.subject||'General Feedback')}</span>
                    <span class="badge ${f.status}">${f.status}</span>
                </div>
                <div class="feedback-stars">${'&#9733;'.repeat(f.rating||0)}${'&#9734;'.repeat(5-(f.rating||0))}</div>
                ${f.doctor_name?`<div style="font-size:0.8125rem;color:#5b6ef5;margin:0.25rem 0;">Dr. ${escHtml(f.doctor_name)}${f.specialization?' &middot; '+escHtml(f.specialization):''}</div>`:''}
                <div class="feedback-msg">${escHtml(f.message)}</div>
                <div class="feedback-date">${formatDate(f.created_at)}</div>
                ${f.status==='new'?`
                <div class="feedback-actions">
                    <button class="act-btn edit" onclick="openEditFeedback(${f.id})">&#9998; Edit</button>
                    <button class="act-btn del"  onclick="deleteFeedback(${f.id})">&#128465; Delete</button>
                </div>`:'<div style="font-size:0.75rem;color:#95a5a6;margin-top:0.5rem;">Under review — editing disabled</div>'}
            </div>`).join('');
    } catch(e) { el.innerHTML='<div class="empty-state"><div class="icon">&#9888;</div><p>Error loading feedbacks.</p></div>'; }
}

function openEditFeedback(id) {
    const f=_feedbacks.find(x=>x.id===id); if(!f) return;
    _editFbId=id;
    document.getElementById('edit-fb-subject').value=f.subject||'';
    document.getElementById('edit-fb-message').value=f.message||'';
    document.getElementById('edit-fb-doctor').value=f.doctor_id||'';
    document.querySelectorAll('input[name="edit-rating"]').forEach(r=>{r.checked=parseInt(r.value)===f.rating;});
    openModal('edit-feedback-modal');
}

async function saveEditFeedback() {
    const subject=document.getElementById('edit-fb-subject').value.trim();
    const message=document.getElementById('edit-fb-message').value.trim();
    const ratingEl=document.querySelector('input[name="edit-rating"]:checked');
    const rating=ratingEl?ratingEl.value:0;
    const doctorId=document.getElementById('edit-fb-doctor').value;
    if(!message){showToast('Message is required','error');return;}
    if(!rating) {showToast('Please select a rating','error');return;}
    const fd=new FormData();
    fd.append('id',_editFbId); fd.append('subject',subject);
    fd.append('message',message); fd.append('rating',rating); fd.append('doctor_id',doctorId);
    try {
        const r=await(await fetch('php/api.php?action=update_my_feedback',{method:'POST',body:fd})).json();
        if(r.success){closeModal('edit-feedback-modal');showToast('Feedback updated','success');loadFeedbackHistory();}
        else showToast(r.message||'Failed','error');
    } catch(e) { showToast('Error','error'); }
}

async function deleteFeedback(id) {
    if(!confirm('Delete this feedback? This cannot be undone.')) return;
    const fd=new FormData(); fd.append('id',id);
    try {
        const r=await(await fetch('php/api.php?action=delete_my_feedback',{method:'POST',body:fd})).json();
        if(r.success){showToast('Feedback deleted','success');loadFeedbackHistory();}
        else showToast(r.message||'Cannot delete','error');
    } catch(e) { showToast('Error','error'); }
}

// ══════════════════════════════════════════════════════════════════════════════
// Auto-login check + Enter key
// ══════════════════════════════════════════════════════════════════════════════
(async()=>{
    try {
        const r=await(await fetch('php/api.php?action=me')).json();
        if(r.success) enterPortal(r.data.full_name||r.data.username);
    } catch(e){}
})();

document.addEventListener('keydown',e=>{
    if(e.key!=='Enter') return;
    const authVisible=document.getElementById('auth-screen').style.display!=='none';
    if(!authVisible) return;
    document.getElementById('login-form').classList.contains('active')?doLogin():doRegister();
});
