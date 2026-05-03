const PG=10;
let _reports=[],_rF=[],_rP=1,_rEid=null;
let _feedbacks=[],_fF=[],_fP=1,_fEid=null;
let _users=[],_uF=[],_uP=1,_uEid=null;
let _currentRole='';

async function initAdmin(role){
    _currentRole=role;
    if(role==='doctor'||role==='admin'){
        document.getElementById('new-report-btn').style.display='inline-block';
        loadPatientOptions();
    }
    adminPage('dashboard',document.querySelector('.sidebar-item'));
    loadStats();
}

function adminPage(name,el){
    document.querySelectorAll('.admin-content .page').forEach(p=>p.classList.remove('active'));
    document.querySelectorAll('.sidebar-item').forEach(s=>s.classList.remove('active'));
    document.getElementById('admin-'+name).classList.add('active');
    if(el) el.classList.add('active');
    if(name==='reports'   &&_reports.length===0)   loadAdminReports();
    if(name==='feedbacks' &&_feedbacks.length===0)  loadAdminFeedbacks();
    if(name==='users'     &&_users.length===0)      loadAdminUsers();
}

// ── Stats ─────────────────────────────────────────────────────────────────────
async function loadStats(){
    try{
        const r=await(await fetch('php/api.php?action=stats')).json();
        if(!r.success) return;
        const d=r.data;
        document.getElementById('s-users').textContent=d.total_users;
        document.getElementById('s-doctors').textContent=d.total_doctors;
        document.getElementById('s-reports').textContent=d.total_reports;
        document.getElementById('s-feedbacks').textContent=d.total_feedbacks;
        drawDonut(d.user_breakdown); drawLine(d.reports_trend);
    }catch(e){console.error(e);}
}

function drawDonut(data){
    const canvas=document.getElementById('chart-users'),ctx=canvas.getContext('2d');
    ctx.clearRect(0,0,canvas.width,canvas.height);
    const colors=['#667eea','#f093fb','#fa709a','#5b6ef5'];
    const total=data.reduce((s,d)=>s+parseInt(d.count),0);
    if(!total) return;
    let angle=-Math.PI/2;
    const cx=180,cy=130,r=90,ri=45;
    data.forEach((item,i)=>{
        const slice=(parseInt(item.count)/total)*2*Math.PI;
        ctx.beginPath();ctx.moveTo(cx,cy);ctx.arc(cx,cy,r,angle,angle+slice);ctx.closePath();
        ctx.fillStyle=colors[i%colors.length];ctx.fill();angle+=slice;
    });
    ctx.beginPath();ctx.arc(cx,cy,ri,0,2*Math.PI);ctx.fillStyle='#fff';ctx.fill();
    let ly=240;
    data.forEach((item,i)=>{
        ctx.fillStyle=colors[i%colors.length];ctx.fillRect(20,ly,14,14);
        ctx.fillStyle='#2c3e50';ctx.font='13px sans-serif';
        ctx.fillText(item.role+': '+item.count,40,ly+12);ly+=22;
    });
}

function drawLine(data){
    const canvas=document.getElementById('chart-reports'),ctx=canvas.getContext('2d');
    ctx.clearRect(0,0,canvas.width,canvas.height);
    if(!data||!data.length){ctx.fillStyle='#7f8c8d';ctx.font='14px sans-serif';ctx.fillText('No data for last 30 days',60,140);return;}
    const pad=40,w=canvas.width-pad*2,h=canvas.height-pad*2;
    const max=Math.max(...data.map(d=>parseInt(d.count)),1);
    ctx.strokeStyle='#e1e8ed';ctx.lineWidth=1;
    ctx.beginPath();ctx.moveTo(pad,pad);ctx.lineTo(pad,canvas.height-pad);ctx.lineTo(canvas.width-pad,canvas.height-pad);ctx.stroke();
    ctx.strokeStyle='#667eea';ctx.lineWidth=2.5;ctx.beginPath();
    data.forEach((pt,i)=>{
        const x=data.length>1?pad+(i/(data.length-1))*w:pad+w/2;
        const y=canvas.height-pad-(parseInt(pt.count)/max)*h;
        i===0?ctx.moveTo(x,y):ctx.lineTo(x,y);
    });
    ctx.stroke();
    data.forEach((pt,i)=>{
        const x=data.length>1?pad+(i/(data.length-1))*w:pad+w/2;
        const y=canvas.height-pad-(parseInt(pt.count)/max)*h;
        ctx.beginPath();ctx.arc(x,y,4,0,2*Math.PI);ctx.fillStyle='#667eea';ctx.fill();
    });
}

// ── Reports CRUD ──────────────────────────────────────────────────────────────
async function loadAdminReports(){
    try{const r=await(await fetch('php/api.php?action=reports')).json();if(r.success){_reports=r.data;filterReports();}}catch(e){console.error(e);}
}

function filterReports(){
    const q=document.getElementById('rpt-search').value.toLowerCase();
    const st=document.getElementById('rpt-status').value;
    const so=document.getElementById('rpt-sort').value;
    _rF=_reports.filter(r=>(!q||r.title.toLowerCase().includes(q)||(r.patient_name||'').toLowerCase().includes(q))&&(!st||r.status===st));
    _rF.sort((a,b)=>so==='oldest'?new Date(a.created_at)-new Date(b.created_at):so==='title'?a.title.localeCompare(b.title):new Date(b.created_at)-new Date(a.created_at));
    _rP=1;renderReports();
}

function renderReports(){
    const tbody=document.getElementById('rpt-tbody');
    const page=_rF.slice((_rP-1)*PG,_rP*PG);
    if(!_rF.length){tbody.innerHTML='<tr><td colspan="7" style="text-align:center;padding:2rem;">No reports found</td></tr>';document.getElementById('rpt-pages').innerHTML='';return;}
    tbody.innerHTML=page.map(r=>`
        <tr>
            <td>#${r.id}</td>
            <td>${escHtml(r.patient_name||'N/A')}</td>
            <td>${escHtml(r.title)}</td>
            <td>${escHtml(r.doctor_name||r.specialization||'Unassigned')}</td>
            <td><span class="badge ${r.status}">${r.status}</span></td>
            <td>${fmtDate(r.created_at)}</td>
            <td class="action-btns">
                <button class="act-btn edit" onclick="openEditReport(${r.id})">&#9998; Edit</button>
                <button class="act-btn del" onclick="confirmDelete('report',${r.id})">&#128465; Delete</button>
            </td>
        </tr>`).join('');
    renderPager('rpt-pages',_rF.length,_rP,'rptGoPage');
}

function rptGoPage(p){const t=Math.ceil(_rF.length/PG);if(p<1||p>t)return;_rP=p;renderReports();}

// Create
function openCreateReport(){
    _rEid=null;
    document.getElementById('rpt-modal-title').textContent='New Medical Report';
    document.getElementById('rpt-save-btn').textContent='Create Report';
    ['cr-title','cr-description','cr-diagnosis'].forEach(id=>document.getElementById(id).value='');
    document.getElementById('cr-patient').value='';
    document.getElementById('cr-status').value='pending';
    document.getElementById('modal-create-report').classList.add('open');
}

// Edit
function openEditReport(id){
    const r=_reports.find(x=>x.id===id);if(!r)return;
    _rEid=id;
    document.getElementById('rpt-modal-title').textContent='Edit Report';
    document.getElementById('rpt-save-btn').textContent='Save Changes';
    document.getElementById('cr-title').value=r.title||'';
    document.getElementById('cr-description').value=r.description||'';
    document.getElementById('cr-diagnosis').value=r.diagnosis||'';
    document.getElementById('cr-status').value=r.status||'pending';
    // set patient
    const sel=document.getElementById('cr-patient');
    sel.value=r.patient_id||'';
    document.getElementById('modal-create-report').classList.add('open');
}

async function saveReport(){
    const title=document.getElementById('cr-title').value.trim();
    if(!title){showToast('Title is required','error');return;}
    const fd=new FormData();
    fd.append('title',       title);
    fd.append('description', document.getElementById('cr-description').value.trim());
    fd.append('diagnosis',   document.getElementById('cr-diagnosis').value.trim());
    fd.append('patient_id',  document.getElementById('cr-patient').value);
    fd.append('status',      document.getElementById('cr-status').value);
    if(_rEid){
        fd.append('id',_rEid);
        const r=await(await fetch('php/api.php?action=update_report',{method:'POST',body:fd})).json();
        if(r.success){closeModal('modal-create-report');showToast('Report updated','success');_reports=[];loadAdminReports();}
        else showToast(r.message||'Failed','error');
    } else {
        const r=await(await fetch('php/api.php?action=create_report',{method:'POST',body:fd})).json();
        if(r.success){closeModal('modal-create-report');showToast('Report created','success');_reports=[];loadAdminReports();}
        else showToast(r.message||'Failed','error');
    }
}

async function loadPatientOptions(){
    try{
        const r=await(await fetch('php/api.php?action=patients')).json();
        if(r.success){
            const sel=document.getElementById('cr-patient');
            // clear existing dynamic options
            while(sel.options.length>1) sel.remove(1);
            r.data.forEach(p=>{const o=document.createElement('option');o.value=p.id;o.textContent=p.full_name||p.username;sel.appendChild(o);});
        }
    }catch(e){}
}

// ── Feedbacks CRUD ────────────────────────────────────────────────────────────
async function loadAdminFeedbacks(){
    try{const r=await(await fetch('php/api.php?action=feedbacks')).json();if(r.success){_feedbacks=r.data;filterFeedbacks();}}catch(e){console.error(e);}
}

function filterFeedbacks(){
    const q=document.getElementById('fb-search').value.toLowerCase();
    const st=document.getElementById('fb-status-filter').value;
    const so=document.getElementById('fb-sort').value;
    _fF=_feedbacks.filter(f=>(!q||(f.user_name||'').toLowerCase().includes(q)||(f.subject||'').toLowerCase().includes(q)||(f.doctor_name||'').toLowerCase().includes(q))&&(!st||f.status===st));
    _fF.sort((a,b)=>so==='oldest'?new Date(a.created_at)-new Date(b.created_at):so==='rating_high'?(b.rating||0)-(a.rating||0):so==='rating_low'?(a.rating||0)-(b.rating||0):new Date(b.created_at)-new Date(a.created_at));
    _fP=1;renderFeedbacks();
}

function renderFeedbacks(){
    const tbody=document.getElementById('fb-tbody');
    const page=_fF.slice((_fP-1)*PG,_fP*PG);
    if(!_fF.length){tbody.innerHTML='<tr><td colspan="8" style="text-align:center;padding:2rem;">No feedbacks found</td></tr>';document.getElementById('fb-pages').innerHTML='';return;}
    tbody.innerHTML=page.map(f=>`
        <tr>
            <td>#${f.id}</td>
            <td>${escHtml(f.user_name||'Anonymous')}</td>
            <td>${f.doctor_name?'Dr. '+escHtml(f.doctor_name):'—'}</td>
            <td>${escHtml(f.subject||'N/A')}</td>
            <td>${'⭐'.repeat(f.rating||0)}</td>
            <td><span class="badge ${f.status}">${f.status}</span></td>
            <td>${fmtDate(f.created_at)}</td>
            <td class="action-btns">
                <button class="act-btn edit" onclick="openEditFeedback(${f.id})">&#9998; Edit</button>
                <button class="act-btn del" onclick="confirmDelete('feedback',${f.id})">&#128465; Delete</button>
            </td>
        </tr>`).join('');
    renderPager('fb-pages',_fF.length,_fP,'fbGoPage');
}

function fbGoPage(p){const t=Math.ceil(_fF.length/PG);if(p<1||p>t)return;_fP=p;renderFeedbacks();}

function openEditFeedback(id){
    const f=_feedbacks.find(x=>x.id===id);if(!f)return;
    _fEid=id;
    document.getElementById('modal-feedback-body').innerHTML=`
        <div class="detail-row">
            <div class="detail-field"><label>User</label><p>${escHtml(f.user_name||'Anonymous')}</p></div>
            <div class="detail-field"><label>Rating</label><p>${'⭐'.repeat(f.rating||0)} (${f.rating||0}/5)</p></div>
        </div>
        <div class="detail-row">
            <div class="detail-field"><label>Doctor</label><p>${f.doctor_name?'Dr. '+escHtml(f.doctor_name):'Not specified'}</p></div>
            <div class="detail-field"><label>Date</label><p>${fmtDate(f.created_at)}</p></div>
        </div>
        <div class="detail-row"><div class="detail-field"><label>Subject</label><p>${escHtml(f.subject||'N/A')}</p></div></div>
        <div class="detail-row"><div class="detail-field"><label>Message</label><p>${escHtml(f.message)}</p></div></div>
        <div class="detail-row"><div class="detail-field"><label>Status</label>
            <select id="fb-status-sel">
                <option value="new"      ${f.status==='new'?'selected':''}>New</option>
                <option value="reviewed" ${f.status==='reviewed'?'selected':''}>Reviewed</option>
                <option value="resolved" ${f.status==='resolved'?'selected':''}>Resolved</option>
            </select>
        </div></div>`;
    document.getElementById('modal-feedback').classList.add('open');
}

async function saveFeedbackStatus(){
    const st=document.getElementById('fb-status-sel').value;
    const fd=new FormData();fd.append('id',_fEid);fd.append('status',st);
    try{
        const r=await(await fetch('php/api.php?action=update_feedback',{method:'POST',body:fd})).json();
        if(r.success){const fb=_feedbacks.find(x=>x.id===_fEid);if(fb)fb.status=st;filterFeedbacks();closeModal('modal-feedback');showToast('Status updated','success');}
        else showToast(r.message||'Failed','error');
    }catch(e){showToast('Error','error');}
}

// ── Users CRUD ────────────────────────────────────────────────────────────────
async function loadAdminUsers(){
    try{const r=await(await fetch('php/api.php?action=users')).json();if(r.success){_users=r.data;filterUsers();}}catch(e){console.error(e);}
}

function filterUsers(){
    const q=document.getElementById('usr-search').value.toLowerCase();
    const rl=document.getElementById('usr-role').value;
    const so=document.getElementById('usr-sort').value;
    _uF=_users.filter(u=>(!q||u.username.toLowerCase().includes(q)||(u.full_name||'').toLowerCase().includes(q)||u.email.toLowerCase().includes(q))&&(!rl||u.role===rl));
    _uF.sort((a,b)=>so==='oldest'?new Date(a.created_at)-new Date(b.created_at):so==='name'?(a.full_name||a.username).localeCompare(b.full_name||b.username):new Date(b.created_at)-new Date(a.created_at));
    _uP=1;renderUsers();
}

function renderUsers(){
    const tbody=document.getElementById('usr-tbody');
    const page=_uF.slice((_uP-1)*PG,_uP*PG);
    if(!_uF.length){tbody.innerHTML='<tr><td colspan="7" style="text-align:center;padding:2rem;">No users found</td></tr>';document.getElementById('usr-pages').innerHTML='';return;}
    tbody.innerHTML=page.map(u=>`
        <tr>
            <td>#${u.id}</td>
            <td>${escHtml(u.username)}</td>
            <td>${escHtml(u.full_name||'N/A')}</td>
            <td>${escHtml(u.email)}</td>
            <td><span class="badge ${u.role}">${u.role}</span></td>
            <td>${fmtDate(u.created_at)}</td>
            <td class="action-btns">
                <button class="act-btn edit" onclick="openEditUser(${u.id})">&#9998; Edit</button>
                <button class="act-btn del" onclick="confirmDelete('user',${u.id})">&#128465; Delete</button>
            </td>
        </tr>`).join('');
    renderPager('usr-pages',_uF.length,_uP,'usrGoPage');
}

function usrGoPage(p){const t=Math.ceil(_uF.length/PG);if(p<1||p>t)return;_uP=p;renderUsers();}

function openCreateUser(){
    _uEid=null;
    document.getElementById('usr-modal-title').textContent='New User';
    document.getElementById('usr-save-btn').textContent='Create User';
    ['usr-fullname','usr-username','usr-email','usr-password','usr-spec','usr-license','usr-phone'].forEach(id=>document.getElementById(id).value='');
    document.getElementById('usr-role-sel').value='user';
    toggleDoctorFields('user');
    document.getElementById('modal-user-form').classList.add('open');
}

function openEditUser(id){
    const u=_users.find(x=>x.id===id);if(!u)return;
    _uEid=id;
    document.getElementById('usr-modal-title').textContent='Edit User';
    document.getElementById('usr-save-btn').textContent='Save Changes';
    document.getElementById('usr-fullname').value=u.full_name||'';
    document.getElementById('usr-username').value=u.username||'';
    document.getElementById('usr-email').value=u.email||'';
    document.getElementById('usr-password').value='';
    document.getElementById('usr-role-sel').value=u.role||'user';
    toggleDoctorFields(u.role);
    document.getElementById('modal-user-form').classList.add('open');
}

function toggleDoctorFields(role){
    const show=role==='doctor';
    document.getElementById('doctor-extra-fields').style.display=show?'block':'none';
    document.getElementById('usr-username-row').style.display=_uEid?'none':'block';
}

async function saveUser(){
    const fd=new FormData();
    const role=document.getElementById('usr-role-sel').value;
    fd.append('full_name', document.getElementById('usr-fullname').value.trim());
    fd.append('email',     document.getElementById('usr-email').value.trim());
    fd.append('role',      role);
    const pw=document.getElementById('usr-password').value;
    if(pw) fd.append('password',pw);
    if(role==='doctor'){
        fd.append('specialization', document.getElementById('usr-spec').value.trim());
        fd.append('license',        document.getElementById('usr-license').value.trim());
        fd.append('phone',          document.getElementById('usr-phone').value.trim());
    }
    try{
        let r;
        if(_uEid){
            fd.append('id',_uEid);
            r=await(await fetch('php/api.php?action=update_user',{method:'POST',body:fd})).json();
        } else {
            fd.append('username', document.getElementById('usr-username').value.trim());
            if(!pw){showToast('Password required for new user','error');return;}
            r=await(await fetch('php/api.php?action=create_user',{method:'POST',body:fd})).json();
        }
        if(r.success){closeModal('modal-user-form');showToast(_uEid?'User updated':'User created','success');_users=[];loadAdminUsers();}
        else showToast(r.message||'Failed','error');
    }catch(e){showToast('Error','error');}
}

// ── Delete confirmation ───────────────────────────────────────────────────────
let _delType='',_delId=0;

function confirmDelete(type,id){
    _delType=type; _delId=id;
    const labels={report:'report',feedback:'feedback',user:'user'};
    document.getElementById('confirm-msg').textContent=`Are you sure you want to delete this ${labels[type]}? This cannot be undone.`;
    document.getElementById('modal-confirm').classList.add('open');
}

async function doDelete(){
    const actions={report:'delete_report',feedback:'delete_feedback',user:'delete_user'};
    const fd=new FormData(); fd.append('id',_delId);
    try{
        const r=await(await fetch('php/api.php?action='+actions[_delType],{method:'POST',body:fd})).json();
        closeModal('modal-confirm');
        if(r.success){
            showToast('Deleted successfully','success');
            if(_delType==='report'){_reports=[];loadAdminReports();}
            if(_delType==='feedback'){_feedbacks=[];loadAdminFeedbacks();}
            if(_delType==='user'){_users=[];loadAdminUsers();}
            loadStats();
        } else showToast(r.message||'Delete failed','error');
    }catch(e){showToast('Error','error');}
}

// ── Pager ─────────────────────────────────────────────────────────────────────
function renderPager(elId,total,current,cbName){
    const pages=Math.ceil(total/PG),el=document.getElementById(elId);
    if(pages<=1){el.innerHTML='';return;}
    let html=`<button class="page-btn" onclick="${cbName}(${current-1})" ${current===1?'disabled':''}>Prev</button>`;
    for(let i=1;i<=pages;i++){
        if(i===1||i===pages||Math.abs(i-current)<=1) html+=`<button class="page-btn ${i===current?'active':''}" onclick="${cbName}(${i})">${i}</button>`;
        else if(Math.abs(i-current)===2) html+=`<span class="page-info">…</span>`;
    }
    html+=`<button class="page-btn" onclick="${cbName}(${current+1})" ${current===pages?'disabled':''}>Next</button>`;
    html+=`<span class="page-info">${total} total</span>`;
    el.innerHTML=html;
}
