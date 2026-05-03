let _myReports=[], _myFeedbacks=[], _editFbId=null;

async function initPatient(){
    patientPage('my-reports',document.querySelector('.nav-tab'));
    await loadDoctorOptions();
    loadMyReports();
}

function patientPage(name,btn){
    document.querySelectorAll('.patient-content .page').forEach(p=>p.classList.remove('active'));
    document.querySelectorAll('.nav-tab').forEach(t=>t.classList.remove('active'));
    document.getElementById(name).classList.add('active');
    if(btn) btn.classList.add('active');
}

async function loadDoctorOptions(){
    try{
        const r=await(await fetch('php/api.php?action=get_doctors')).json();
        if(r.success){
            ['sfb-doctor','edit-fb-doctor'].forEach(selId=>{
                const sel=document.getElementById(selId);
                if(!sel) return;
                while(sel.options.length>1) sel.remove(1);
                r.data.forEach(d=>{
                    const o=document.createElement('option');
                    o.value=d.id;
                    o.textContent='Dr. '+d.full_name+(d.specialization?' — '+d.specialization:'');
                    sel.appendChild(o);
                });
            });
        }
    }catch(e){console.error(e);}
}

// ── My Reports (read-only) ────────────────────────────────────────────────────
async function loadMyReports(){
    const el=document.getElementById('my-reports-list');
    el.innerHTML='<div class="empty-state"><div class="icon">&#8987;</div><p>Loading...</p></div>';
    try{
        const r=await(await fetch('php/api.php?action=my_reports')).json();
        if(!r.success){el.innerHTML='<div class="empty-state"><div class="icon">&#9888;</div><p>Could not load reports.</p></div>';return;}
        if(!r.data.length){el.innerHTML='<div class="empty-state"><div class="icon">&#128196;</div><p>No medical reports yet. Your doctor will add them here.</p></div>';return;}
        _myReports=r.data;
        el.innerHTML=r.data.map(rpt=>`
            <div class="report-card" onclick="openMyReport(${rpt.id})">
                <div class="report-card-header">
                    <div>
                        <div class="report-card-title">${escHtml(rpt.title)}</div>
                        <div class="report-card-meta">Dr. ${escHtml(rpt.doctor_name||'Unknown')}${rpt.specialization?' &middot; '+escHtml(rpt.specialization):''} &middot; ${fmtDate(rpt.created_at)}</div>
                    </div>
                    <span class="badge ${rpt.status}">${rpt.status}</span>
                </div>
                ${rpt.description?`<p style="font-size:0.875rem;color:#5a6c7d;margin-top:0.5rem;">${escHtml(rpt.description).substring(0,120)}${rpt.description.length>120?'…':''}</p>`:''}
            </div>`).join('');
    }catch(e){el.innerHTML='<div class="empty-state"><div class="icon">&#9888;</div><p>Error loading reports.</p></div>';}
}

function openMyReport(id){
    const r=_myReports.find(x=>x.id===id);if(!r)return;
    document.getElementById('modal-my-report-body').innerHTML=`
        <div class="detail-row"><div class="detail-field"><label>Title</label><p>${escHtml(r.title)}</p></div><div class="detail-field"><label>Status</label><p><span class="badge ${r.status}">${r.status}</span></p></div></div>
        <div class="detail-row"><div class="detail-field"><label>Doctor</label><p>${escHtml(r.doctor_name||'N/A')}</p></div><div class="detail-field"><label>Specialization</label><p>${escHtml(r.specialization||'N/A')}</p></div></div>
        <div class="detail-row"><div class="detail-field"><label>Date</label><p>${fmtDate(r.created_at)}</p></div></div>
        ${r.description?`<div class="detail-row"><div class="detail-field"><label>Description</label><p>${escHtml(r.description)}</p></div></div>`:''}
        ${r.diagnosis?`<div class="detail-row"><div class="detail-field"><label>Diagnosis</label><p>${escHtml(r.diagnosis)}</p></div></div>`:''}`;
    document.getElementById('modal-my-report').classList.add('open');
}

// ── Submit Feedback ───────────────────────────────────────────────────────────
async function doSubmitFeedback(){
    const subject=document.getElementById('sfb-subject').value.trim();
    const message=document.getElementById('sfb-message').value.trim();
    const ratingEl=document.querySelector('input[name="rating"]:checked');
    const rating=ratingEl?ratingEl.value:0;
    const doctorId=document.getElementById('sfb-doctor').value;
    document.getElementById('sfb-error').style.display='none';
    if(!message){showError('sfb-error','Please write a message.');return;}
    if(!rating){showError('sfb-error','Please select a rating.');return;}
    const fd=new FormData();
    fd.append('doctor_id',doctorId);fd.append('subject',subject);
    fd.append('message',message);fd.append('rating',rating);
    try{
        const r=await(await fetch('php/api.php?action=submit_feedback',{method:'POST',body:fd})).json();
        if(r.success){
            document.getElementById('sfb-subject').value='';
            document.getElementById('sfb-message').value='';
            document.getElementById('sfb-doctor').value='';
            if(ratingEl) ratingEl.checked=false;
            showToast('Feedback submitted. Thank you!','success');
        } else showError('sfb-error',r.message||'Submission failed.');
    }catch(e){showError('sfb-error','Connection error.');}
}

// ── My Feedbacks (with Edit + Delete) ────────────────────────────────────────
async function loadMyFeedbacks(){
    const el=document.getElementById('my-feedbacks-list');
    el.innerHTML='<div class="empty-state"><div class="icon">&#8987;</div><p>Loading...</p></div>';
    try{
        const r=await(await fetch('php/api.php?action=my_feedbacks')).json();
        if(!r.success||!r.data.length){el.innerHTML='<div class="empty-state"><div class="icon">&#128172;</div><p>You haven\'t submitted any feedback yet.</p></div>';return;}
        _myFeedbacks=r.data;
        el.innerHTML=r.data.map(f=>`
            <div class="feedback-item">
                <div class="feedback-item-header">
                    <span class="feedback-subject">${escHtml(f.subject||'General Feedback')}</span>
                    <span class="badge ${f.status}">${f.status}</span>
                </div>
                <div class="feedback-stars">${'&#9733;'.repeat(f.rating||0)}${'&#9734;'.repeat(5-(f.rating||0))}</div>
                ${f.doctor_name?`<div style="font-size:0.8125rem;color:#5b6ef5;margin:0.25rem 0;">Dr. ${escHtml(f.doctor_name)}${f.specialization?' &middot; '+escHtml(f.specialization):''}</div>`:''}
                <div class="feedback-msg">${escHtml(f.message)}</div>
                <div class="feedback-date">${fmtDate(f.created_at)}</div>
                ${f.status==='new'?`
                <div class="feedback-actions">
                    <button class="act-btn edit" onclick="openEditMyFeedback(${f.id})">&#9998; Edit</button>
                    <button class="act-btn del" onclick="deleteMyFeedback(${f.id})">&#128465; Delete</button>
                </div>`:'<div style="font-size:0.75rem;color:#95a5a6;margin-top:0.5rem;">Under review — editing disabled</div>'}
            </div>`).join('');
    }catch(e){el.innerHTML='<div class="empty-state"><div class="icon">&#9888;</div><p>Error loading feedbacks.</p></div>';}
}

function openEditMyFeedback(id){
    const f=_myFeedbacks.find(x=>x.id===id);if(!f)return;
    _editFbId=id;
    document.getElementById('edit-fb-subject').value=f.subject||'';
    document.getElementById('edit-fb-message').value=f.message||'';
    document.getElementById('edit-fb-doctor').value=f.doctor_id||'';
    // set rating
    document.querySelectorAll('input[name="edit-rating"]').forEach(r=>{r.checked=parseInt(r.value)===f.rating;});
    document.getElementById('modal-edit-feedback').classList.add('open');
}

async function saveMyFeedback(){
    const subject=document.getElementById('edit-fb-subject').value.trim();
    const message=document.getElementById('edit-fb-message').value.trim();
    const ratingEl=document.querySelector('input[name="edit-rating"]:checked');
    const rating=ratingEl?ratingEl.value:0;
    const doctorId=document.getElementById('edit-fb-doctor').value;
    if(!message){showToast('Message is required','error');return;}
    if(!rating){showToast('Please select a rating','error');return;}
    const fd=new FormData();
    fd.append('id',_editFbId);fd.append('subject',subject);
    fd.append('message',message);fd.append('rating',rating);fd.append('doctor_id',doctorId);
    try{
        const r=await(await fetch('php/api.php?action=update_my_feedback',{method:'POST',body:fd})).json();
        if(r.success){closeModal('modal-edit-feedback');showToast('Feedback updated','success');loadMyFeedbacks();}
        else showToast(r.message||'Failed','error');
    }catch(e){showToast('Error','error');}
}

async function deleteMyFeedback(id){
    if(!confirm('Delete this feedback?')) return;
    const fd=new FormData();fd.append('id',id);
    try{
        const r=await(await fetch('php/api.php?action=delete_my_feedback',{method:'POST',body:fd})).json();
        if(r.success){showToast('Feedback deleted','success');loadMyFeedbacks();}
        else showToast(r.message||'Cannot delete','error');
    }catch(e){showToast('Error','error');}
}
