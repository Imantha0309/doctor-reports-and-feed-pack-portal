function showError(id,msg){const el=document.getElementById(id);if(!el)return;el.textContent=msg;el.style.display='block';}
function clearErrors(){document.querySelectorAll('.error-msg').forEach(el=>{el.style.display='none';el.textContent='';});}
function showToast(msg,type=''){const t=document.getElementById('toast');t.textContent=msg;t.className='toast '+type;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),3500);}
function escHtml(s){return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}
function fmtDate(s){return new Date(s).toLocaleDateString(undefined,{year:'numeric',month:'short',day:'numeric'});}
function closeModal(id){document.getElementById(id).classList.remove('open');}

document.querySelectorAll('.modal-overlay').forEach(el=>{
    el.addEventListener('click',e=>{if(e.target===el)el.classList.remove('open');});
});

function switchAuthTab(tab,btn){
    document.querySelectorAll('.auth-tab').forEach(t=>t.classList.remove('active'));
    document.querySelectorAll('.auth-form').forEach(f=>f.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById(tab+'-form').classList.add('active');
    clearErrors();
}

async function doLogin(){
    clearErrors();
    const fd=new FormData();
    fd.append('action','login');
    fd.append('username',document.getElementById('login-username').value.trim());
    fd.append('password',document.getElementById('login-password').value);
    try{
        const r=await(await fetch('php/auth.php',{method:'POST',body:fd})).json();
        if(r.success) routeByRole(r.role,r.name);
        else showError('login-error',r.message);
    }catch(e){showError('login-error','Connection error.');}
}

async function doRegister(){
    clearErrors();
    const fd=new FormData();
    fd.append('action','register');
    fd.append('full_name',document.getElementById('reg-fullname').value.trim());
    fd.append('username',document.getElementById('reg-username').value.trim());
    fd.append('email',document.getElementById('reg-email').value.trim());
    fd.append('password',document.getElementById('reg-password').value);
    try{
        const r=await(await fetch('php/auth.php',{method:'POST',body:fd})).json();
        if(r.success) routeByRole(r.role,r.name);
        else showError('register-error',r.message);
    }catch(e){showError('register-error','Connection error.');}
}

async function doRegisterDoctor(){
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
    try{
        const r=await(await fetch('php/auth.php',{method:'POST',body:fd})).json();
        if(r.success) routeByRole(r.role,r.name);
        else showError('doctor-error',r.message);
    }catch(e){showError('doctor-error','Connection error.');}
}

async function doLogout(){
    const fd=new FormData();fd.append('action','logout');
    await fetch('php/auth.php',{method:'POST',body:fd});
    document.getElementById('admin-screen').style.display='none';
    document.getElementById('patient-screen').style.display='none';
    document.getElementById('auth-screen').style.display='flex';
}

function routeByRole(role,name){
    document.getElementById('auth-screen').style.display='none';
    if(role==='admin'||role==='doctor'){
        document.getElementById('admin-name').textContent=name||role;
        document.getElementById('admin-screen').style.display='block';
        if(role==='doctor') document.getElementById('users-nav-item').style.display='none';
        initAdmin(role);
    } else {
        document.getElementById('patient-name').textContent=name||'User';
        document.getElementById('patient-screen').style.display='block';
        initPatient();
    }
}

// Auto-login check
(async()=>{
    try{
        const r=await(await fetch('php/api.php?action=me')).json();
        if(r.success) routeByRole(r.data.role,r.data.full_name||r.data.username);
    }catch(e){}
})();

document.addEventListener('keydown',e=>{
    if(e.key!=='Enter'||document.getElementById('auth-screen').style.display==='none') return;
    document.getElementById('login-form').classList.contains('active')?doLogin():doRegister();
});
