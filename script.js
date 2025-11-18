
/* -------------------------
   Data model (localStorage)
   -------------------------
   data = {
     Admin: { username: password, ... },
     HOD: { hodUser: { password, branch, batch }, ... },
     Faculty: { facUser: { password, name }, ... },
     Student: { stuUser: { password, name }, ... },
     Subjects: { facUser: [ { subject, code }, ... ], ... },
     StudentsPerSubject: { subjCode: { stuUser: true, ... }, ... },
     Attendance: { subjCode: { 'YYYY-MM-DD': { stuUser: true/false, ... }, ... }, ... }
   }
*/

function getData(){ return JSON.parse(localStorage.getItem('data')); }
function setData(d){ localStorage.setItem('data', JSON.stringify(d)); }

/* Initialize demo data only if no data exists yet */
if(!localStorage.getItem('data')){
  const defaultData = {
    Admin: { "admin": "admin" },
    HOD: {
      "hod1": { password: "hodpass", branch: "CSE", batch: "2023" }
    },
    Faculty: {
      "fac1": { password: "facpass", name: "Alice" }
    },
    Student: {
      "stu1": { password: "stupass", name: "Bob" }
    },
    Subjects: {
      "fac1": [ { subject: "Mathematics", code: "MATH101" } ]
    },
    StudentsPerSubject: {
      "MATH101": { "stu1": true }
    },
    Attendance: {
      "MATH101": {
        "2025-09-08": { "stu1": true },
        "2025-09-09": { "stu1": true },
        "2025-09-10": { "stu1": false }
      }
    }
  };
  setData(defaultData);
}

/* UI helpers */
function showSection(id){
  document.querySelectorAll('section').forEach(s => s.classList.add('hidden'));
  document.getElementById(id).classList.remove('hidden');
  document.getElementById('loginMsg').textContent = '';
}

function updateUserInfo() {
  if (currentUser) {
    document.getElementById('userInfo').classList.remove('hidden');
    document.getElementById('currentUserRole').textContent = currentUser.role;
    document.getElementById('currentUserName').textContent = currentUser.user;
  } else {
    document.getElementById('userInfo').classList.add('hidden');
  }
}

/* login */
let currentUser = null;
function login(){
  const role = document.getElementById('role').value;
  const u = document.getElementById('username').value.trim();
  const p = document.getElementById('password').value.trim();
  const d = getData();

  // Admin: simple username->password mapping
  if(role === 'Admin'){
    if(d.Admin && d.Admin[u] && d.Admin[u] === p){
      currentUser = { role:'Admin', user: u };
      updateUserInfo();
      loadAdminDashboard();
      showSection('adminDashboard');
      return;
    } else {
      document.getElementById('loginMsg').innerHTML = "<span class='error'>Invalid Admin credentials</span>";
      return;
    }
  }

  // Other roles stored as objects with .password
  if(d[role] && d[role][u] && d[role][u].password === p){
    currentUser = { role: role, user: u };
    updateUserInfo();
    if(role === 'HOD'){ loadHODDashboard(); showSection('hodDashboard'); return; }
    if(role === 'Faculty'){ loadFacultyDashboard(); showSection('facultyDashboard'); return; }
    if(role === 'Student'){ loadStudentDashboard(); showSection('studentDashboard'); return; }
  } else {
    document.getElementById('loginMsg').innerHTML = "<span class='error'>Invalid credentials</span>";
  }
}

/* ------------------------ ADMIN DASHBOARD ------------------------ */
function loadAdminDashboard(){
  const container = document.getElementById('adminDashboard');
  container.innerHTML = `
    <div class="card fade-in">
      <h2><i class="fas fa-user-shield"></i> Admin Dashboard</h2>
      <p class="muted">Manage HOD accounts and system settings</p>
      
      <h3 class="section-title"><i class="fas fa-plus-circle"></i> Add New HOD</h3>
      <div class="row">
        <div class="col">
          <label><i class="fas fa-user"></i> HOD Username</label>
          <input id="hodName" placeholder="hod username (eg. hod2)">
        </div>
        <div class="col">
          <label><i class="fas fa-key"></i> HOD Password</label>
          <input id="hodPass" placeholder="password">
        </div>
      </div>
      <div class="row">
        <div class="col">
          <label><i class="fas fa-code-branch"></i> Branch</label>
          <input id="hodBranch" placeholder="CSE">
        </div>
        <div class="col">
          <label><i class="fas fa-calendar-alt"></i> Batch</label>
          <input id="hodBatch" placeholder="2023">
        </div>
      </div>
      <button class="btn btn-primary" onclick="addHOD()">
        <i class="fas fa-user-plus"></i> Add HOD
      </button>
    </div>
    
    <div class="card">
      <h3><i class="fas fa-list"></i> HOD Accounts</h3>
      <div id="hodList"></div>
    </div>
    
    <div class="text-center">
      <button class="btn btn-danger" onclick="logout()">
        <i class="fas fa-sign-out-alt"></i> Logout
      </button>
    </div>
  `;
  loadHODs();
}

function addHOD(){
  const u = document.getElementById('hodName').value.trim();
  const p = document.getElementById('hodPass').value.trim();
  const branch = document.getElementById('hodBranch').value.trim();
  const batch = document.getElementById('hodBatch').value.trim();
  if(!u || !p || !branch || !batch){ alert('Fill all HOD details'); return; }
  const d = getData();
  d.HOD = d.HOD || {};
  if(d.HOD[u]){ alert('HOD username already exists'); return; }
  d.HOD[u] = { password: p, branch, batch };
  setData(d);
  document.getElementById('hodName').value = '';
  document.getElementById('hodPass').value = '';
  document.getElementById('hodBranch').value = '';
  document.getElementById('hodBatch').value = '';
  loadHODs();
}

function removeHOD(user){
  if(!confirm('Remove HOD ' + user + '?')) return;
  const d = getData();
  if(d.HOD && d.HOD[user]) delete d.HOD[user];
  setData(d);
  loadHODs();
}

function loadHODs(){
  const d = getData();
  const list = document.getElementById('hodList');
  let html = '<div  class="overflowx" ><table><tr><th>Username</th><th>Password</th><th>Branch</th><th>Batch</th><th>Action</th></tr></div>';
  for(const h in (d.HOD||{})){
    const hod = d.HOD[h];
    html += `<tr>
      <td><i class="fas fa-user"></i> ${h}</td>
      <td>${hod.password}</td>
      <td>${hod.branch}</td>
      <td>${hod.batch}</td>
      <td><button class="btn btn-danger btn-sm" onclick="removeHOD('${h}')"><i class="fas fa-trash"></i> Remove</button></td>
    </tr>`;
  }
  html += '</table>';
  list.innerHTML = html;
}

/* ------------------------ HOD DASHBOARD ------------------------ */
function loadHODDashboard(){
  const container = document.getElementById('hodDashboard');
  container.innerHTML = `
    <div class="card fade-in">
      <h2><i class="fas fa-user-tie"></i> HOD Dashboard</h2>
      <p class="muted">Manage faculty accounts and subjects</p>
      
      <h3 class="section-title"><i class="fas fa-plus-circle"></i> Add Faculty & Subject</h3>
      <div class="form-group">
        <label><i class="fas fa-book"></i> Subject Name</label>
        <input id="subjectName" placeholder="e.g. Data Structures">
      </div>
      
      <div class="row">
        <div class="col">
          <label><i class="fas fa-hashtag"></i> Subject Code</label>
          <input id="subjectCode" placeholder="e.g. DS101">
        </div>
        <div class="col">
          <label><i class="fas fa-chalkboard-teacher"></i> Faculty Username</label>
          <input id="facultyUser" placeholder="e.g. fac2">
        </div>
      </div>
      
      <div class="form-group">
        <label><i class="fas fa-user"></i> Faculty Full Name</label>
        <input id="facultyFullName" placeholder="e.g. John Doe">
      </div>
      
      <div class="form-group">
        <label><i class="fas fa-key"></i> Faculty Password</label>
        <input id="facultyPass" placeholder="password">
      </div>
      
      <button class="btn btn-primary" onclick="addFaculty()">
        <i class="fas fa-user-plus"></i> Add Faculty & Subject
      </button>
    </div>
    
    <div class="card">
      <h3><i class="fas fa-list"></i> Faculties & Subjects</h3>
      <div id="facultyList"></div>
    </div>
    
    <div class="text-center">
      <button class="btn btn-danger" onclick="logout()">
        <i class="fas fa-sign-out-alt"></i> Logout
      </button>
    </div>
  `;
  loadFaculties();
}

function addFaculty(){
  const subj = document.getElementById('subjectName').value.trim();
  const code = document.getElementById('subjectCode').value.trim();
  const user = document.getElementById('facultyUser').value.trim();
  const fname = document.getElementById('facultyFullName').value.trim();
  const pass = document.getElementById('facultyPass').value.trim();
  if(!subj || !code || !user || !fname || !pass){ alert('Fill all fields'); return; }

  const d = getData();
  d.Faculty = d.Faculty || {};
  d.Subjects = d.Subjects || {};

  // Check for unique subject code across all faculties
  let codeExists = false;
  for(const f in d.Subjects){
    if(d.Subjects[f] && d.Subjects[f].some(s => s.code === code)){
      codeExists = true;
      break;
    }
  }
  if(codeExists){ alert('Subject code already in use'); return; }

  // create/update faculty
  if(d.Faculty[user]){
    if(d.Faculty[user].name !== fname || d.Faculty[user].password !== pass){
      alert('Faculty username exists. Name and password must match existing.');
      return;
    }
  } else {
    d.Faculty[user] = { password: pass, name: fname };
  }

  // push subject to faculty's subject list
  if(!d.Subjects[user]) d.Subjects[user] = [];
  // avoid duplicate subject code for same faculty
  const exists = d.Subjects[user].some(s => s.code === code);
  if(exists){ alert('Subject code already assigned to this faculty'); return; }
  d.Subjects[user].push({ subject: subj, code: code });
  setData(d);
  
  // Clear form
  document.getElementById('subjectName').value = '';
  document.getElementById('subjectCode').value = '';
  document.getElementById('facultyUser').value = '';
  document.getElementById('facultyFullName').value = '';
  document.getElementById('facultyPass').value = '';
  
  loadFaculties();
}

function removeFaculty(user){
  if(!confirm('Remove faculty ' + user + ' and their subjects?')) return;
  const d = getData();
  if(d.Faculty && d.Faculty[user]) delete d.Faculty[user];
  if(d.Subjects && d.Subjects[user]) delete d.Subjects[user];
  setData(d);
  loadFaculties();
}

function loadFaculties(){
  const d = getData();
  const list = document.getElementById('facultyList');
  let html = '<div class="overflowx"><table><tr><th>Faculty Username</th><th>Faculty Name</th><th>Password</th><th>Subjects (name - code)</th><th>Action</th></tr></div>';
  for(const f in (d.Faculty||{})){
    const fac = d.Faculty[f];
    const subs = d.Subjects && d.Subjects[f] ? d.Subjects[f] : [];
    const subList = subs.map(s => `${s.subject} (${s.code})`).join(', ');
    html += `<tr>
      <td><i class="fas fa-user"></i> ${f}</td>
      <td>${fac.name}</td>
      <td>${fac.password}</td>
      <td>${subList}</td>
      <td><button class="btn btn-danger btn-sm" onclick="removeFaculty('${f}')"><i class="fas fa-trash"></i> Remove</button></td>
    </tr>`;
  }
  html += '</table>';
  list.innerHTML = html;
}

/* ------------------------ FACULTY DASHBOARD ------------------------ */
function loadFacultyDashboard(){
  const d = getData();
  const subjects = (d.Subjects && d.Subjects[currentUser.user]) ? d.Subjects[currentUser.user] : [];

  // build subject options
  let subjectOptions = '';
  if(subjects.length){
    subjectOptions = subjects.map(s => `<option value="${s.code}">${s.subject} (${s.code})</option>`).join('');
  } else {
    subjectOptions = '<option value="">-- no subjects assigned --</option>';
  }

  const container = document.getElementById('facultyDashboard');
  container.innerHTML = `
    <div class="card fade-in">
      <h2><i class="fas fa-chalkboard-teacher"></i> Faculty Dashboard</h2>
      <p class="muted marg">Manage students and attendance for your subjects</p>
      
      <div class="tabs">
        <div class="tab active" onclick="switchTab('students')">
          <i class="fas fa-users"></i> Manage Students
        </div>
        <div class="tab" onclick="switchTab('attendance')">
          <i class="fas fa-clipboard-check"></i> Mark Attendance
        </div>
        <div class="tab" onclick="switchTab('records')">
          <i class="fas fa-chart-bar"></i> View Records
        </div>
      </div>
      
      <div id="students-tab" class="tab-content active">
        <h3 class="section-title"><i class="fas fa-book"></i> Your Subjects</h3>
        <select id="facultySubject" onchange="loadStudents()">${subjectOptions}</select>
        
        <h3 class="section-title"><i class="fas fa-user-plus"></i> Add Student to Selected Subject</h3>
        <div class="row">
          <div class="col">
            <label><i class="fas fa-user"></i> Student Username</label>
            <input id="studentUser" placeholder="e.g. stu2">
          </div>
          <div class="col">
            <label><i class="fas fa-id-card"></i> Student Full Name</label>
            <input id="studentFullName" placeholder="e.g. Ramesh">
          </div>
        </div>
        <div class="form-group">
          <label><i class="fas fa-key"></i> Student Password</label>
          <input id="studentPass" placeholder="password">
        </div>
        
        <div class="row">
          <div class="col"><button class="btn btn-primary" onclick="addStudent()"><i class="fas fa-user-plus"></i> Add Student</button></div>
          <div class="col"><button class="btn btn-danger" onclick="removeStudentByInput()"><i class="fas fa-user-minus"></i> Remove Student (by username)</button></div>
        </div>
        
        <div id="studentList"></div>
      </div>
      
      <div id="attendance-tab" class="tab-content">
        <h3 class="section-title"><i class="fas fa-clipboard-check"></i> Mark Attendance (selected subject)</h3>
        <div class="row">
          <div class="col">
            <label><i class="fas fa-book"></i> Subject</label>
            <select id="attendanceSubject" onchange="loadAttendanceForDate()">${subjectOptions}</select>
          </div>
          <div class="col">
            <label><i class="fas fa-calendar-alt"></i> Date</label>
            <input id="attendanceDate" type="date">
          </div>
        </div>
        <button class="btn btn-primary" onclick="loadAttendanceForDate()">
          <i class="fas fa-sync-alt"></i> Load/Start Attendance for Date
        </button>
        <div id="attendanceMarkTable"></div>
        <button id="saveAttendanceBtn" class="btn btn-primary hidden" onclick="saveAttendance()">
          <i class="fas fa-save"></i> Save Attendance
        </button>
      </div>
      
      <div id="records-tab" class="tab-content">
        <div id="attendanceList"></div>
      </div>
    </div>
    
    <div class="text-center">
      <button class="btn btn-danger" onclick="logout()">
        <i class="fas fa-sign-out-alt"></i> Logout
      </button>
    </div>
  `;
  
  if(subjects.length){
    document.getElementById('attendanceDate').value = new Date().toISOString().slice(0,10);
    document.getElementById('attendanceSubject').value = subjects[0].code;
  }
  loadStudents();
}

function switchTab(tabName) {
  // Hide all tab contents
  document.querySelectorAll('.tab-content').forEach(tab => {
    tab.classList.remove('active');
  });
  
  // Show selected tab content
  document.getElementById(`${tabName}-tab`).classList.add('active');
  
  // Update active tab
  document.querySelectorAll('.tab').forEach(tab => {
    tab.classList.remove('active');
  });
  event.target.classList.add('active');
  
  // Load data if needed
  if (tabName === 'records') {
    loadAttendanceList();
  }
}

function addStudent(){
  const subjCodeEl = document.getElementById('facultySubject');
  if(!subjCodeEl) { alert('No subject selected'); return; }
  const subjCode = subjCodeEl.value;
  if(!subjCode){ alert('Select a subject first'); return; }
  const user = document.getElementById('studentUser').value.trim();
  const name = document.getElementById('studentFullName').value.trim();
  const pass = document.getElementById('studentPass').value.trim();
  if(!user || !name || !pass){ alert('Fill student username, name and password'); return; }

  const d = getData();
  d.StudentsPerSubject = d.StudentsPerSubject || {};
  d.Student = d.Student || {};

  if(!d.StudentsPerSubject[subjCode]) d.StudentsPerSubject[subjCode] = {};
  if(d.StudentsPerSubject[subjCode][user]){ alert('Student already added to this subject'); return; }

  const isNew = !d.Student[user];
  if(!isNew){
    if(d.Student[user].name !== name || d.Student[user].password !== pass){
      alert('Student username exists. Entered name/password must match existing.');
      return;
    }
  }

  d.StudentsPerSubject[subjCode][user] = true;
  if(isNew){
    d.Student[user] = { name: name, password: pass };
  }

  setData(d);
  
  // Clear form
  document.getElementById('studentUser').value = '';
  document.getElementById('studentFullName').value = '';
  document.getElementById('studentPass').value = '';
  
  loadStudents();
}

function removeStudentByInput(){
  const subjCodeEl = document.getElementById('facultySubject');
  if(!subjCodeEl) { alert('No subject selected'); return; }
  const subjCode = subjCodeEl.value;
  const user = document.getElementById('studentUser').value.trim();
  if(!user){ alert('Enter student username to remove'); return; }
  removeStudentFromSubject(user, subjCode);
}

function removeStudentFromSubject(user, subjCode){
  if(!confirm(`Remove student ${user} from subject ${subjCode}?`)) return;
  const d = getData();
  if(d.StudentsPerSubject && d.StudentsPerSubject[subjCode] && d.StudentsPerSubject[subjCode][user]){
    delete d.StudentsPerSubject[subjCode][user];
  }
  // Note: do not remove from past attendance dates
  // Note: do not remove global d.Student (keeps login available if student has other subject)
  setData(d);
  loadStudents();
}

function loadStudents(){
  const d = getData();
  const subjCodeEl = document.getElementById('facultySubject');
  if(!subjCodeEl){ return; }
  const subjCode = subjCodeEl.value;
  const subjObj = findSubjectByCode(subjCode) || { subject:'-', code: subjCode || '-' };
  const students = (d.StudentsPerSubject && d.StudentsPerSubject[subjCode]) ? d.StudentsPerSubject[subjCode] : {};

  // student table
  let html = `<h3 class="section-title"><i class="fas fa-users"></i> Students in ${subjObj.subject} (${subjObj.code})</h3>`;
  html += '<div class="overflowx" ><table><tr><th>Username</th><th>Name</th><th>Password</th><th>Action</th></tr></div>';
  for(const u in students){
    const stu = d.Student[u];
    if(!stu) continue;
    html += `<tr>
      <td><i class="fas fa-user"></i> ${u}</td>
      <td>${stu.name}</td>
      <td>${stu.password}</td>
      <td><button class="btn btn-danger btn-sm" onclick="removeStudentFromSubject('${u}','${subjCode}')"><i class="fas fa-trash"></i> Remove</button></td>
    </tr>`;
  }
  html += '</table>';
  document.getElementById('studentList').innerHTML = html;

  // Clear attendance mark table
  document.getElementById('attendanceMarkTable').innerHTML = '';
  document.getElementById('saveAttendanceBtn').classList.add('hidden');
}

function loadAttendanceForDate(){
  const subjCodeEl = document.getElementById('attendanceSubject');
  const dateEl = document.getElementById('attendanceDate');
  if(!subjCodeEl || !dateEl) { alert('Select subject and date'); return; }
  const subjCode = subjCodeEl.value;
  const date = dateEl.value;
  if(!subjCode || !date) { alert('Select subject and date'); return; }

  const d = getData();
  const students = d.StudentsPerSubject?.[subjCode] || {};
  const att = d.Attendance?.[subjCode]?.[date] || {};

  let html = `<h4 class="section-title"><i class="fas fa-calendar-alt"></i> Attendance for ${date}</h4>`;
  html += '<table><tr><th>Student</th><th>Present</th></tr>';
  for(const u in students){
    const stu = d.Student[u];
    if(!stu) continue;
    const checked = att[u] === true ? 'checked' : '';
    html += `<tr><td><i class="fas fa-user-graduate"></i> ${stu.name} (${u})</td><td><input type="checkbox" id="att_${u}" ${checked}></td></tr>`;
  }
  html += '</table>';
  document.getElementById('attendanceMarkTable').innerHTML = html;
  document.getElementById('saveAttendanceBtn').classList.remove('hidden');
}

function saveAttendance(){
  const subjCodeEl = document.getElementById('attendanceSubject');
  const dateEl = document.getElementById('attendanceDate');
  if(!subjCodeEl || !dateEl) { alert('Select subject and date'); return; }
  const subjCode = subjCodeEl.value;
  const date = dateEl.value;
  if(!subjCode || !date) { alert('Select subject and date'); return; }

  const d = getData();
  const students = d.StudentsPerSubject?.[subjCode] || {};
  d.Attendance = d.Attendance || {};
  d.Attendance[subjCode] = d.Attendance[subjCode] || {};
  d.Attendance[subjCode][date] = {};
  for(const u in students){
    const checkbox = document.getElementById(`att_${u}`);
    if(checkbox){
      d.Attendance[subjCode][date][u] = checkbox.checked;
    }
  }
  setData(d);
  loadAttendanceList();
  loadAttendanceForDate(); // Refresh the table to show saved state
  alert('Attendance saved for ' + date);
}

function loadAttendanceList(){
  const d = getData();
  const subjCodeEl = document.getElementById('facultySubject');
  if(!subjCodeEl) return;
  const subjCode = subjCodeEl.value;
  const att = d.Attendance?.[subjCode] || {};
  const dates = Object.keys(att);
  const students = d.StudentsPerSubject?.[subjCode] || {};
  let html = '<h3 class="section-title"><i class="fas fa-chart-bar"></i> Cumulative Attendance Records</h3>';
  html += '<div class="overflowx" ><table><tr><th>Student</th><th>Present</th><th>Total</th><th>%</th><th>Progress</th></tr></div>';
  for(const u in students){
    const stu = d.Student[u];
    if(!stu) continue;
    let present = 0, total = 0;
    for(const date of dates){
      if(u in att[date]){
        total++;
        if(att[date][u]) present++;
      }
    }
    const per = total ? ((present/total)*100).toFixed(1) : '0.0';
    const statusClass = per >= 75 ? 'status-present' : per >= 50 ? 'status-pending' : 'status-absent';
    const progressWidth = total ? (present/total)*100 : 0;
    html += `
      <tr>
        <td><i class="fas fa-user-graduate"></i> ${stu.name} (${u})</td>
        <td>${present}</td>
        <td>${total}</td>
        <td><span class="${statusClass}">${per}%</span></td>
        <td>
          <div class="progress-bar">
            <div class="progress-fill" style="width: ${progressWidth}%"></div>
          </div>
        </td>
      </tr>`;
  }
  html += '</table>';
  document.getElementById('attendanceList').innerHTML = html;
}

/* ------------------------ STUDENT DASHBOARD ------------------------ */
function loadStudentDashboard(){
  const d = getData();
  const u = currentUser.user;
  let html = `
    <div class="card fade-in">
      <h2><i class="fas fa-user-graduate"></i> Student Dashboard</h2>
      <p class="muted">View your attendance records across subjects</p>
  `;
  
  const sps = d.StudentsPerSubject || {};
  const enrolled = [];
  for(const code in sps){
    if(u in sps[code]){
      const subj = findSubjectByCode(code);
      const subjName = subj ? subj.subject : code;
      enrolled.push({code, name: subjName});
    }
  }
  
  if (enrolled.length === 0) {
    html += '<p class="muted">You are not enrolled in any subjects yet.</p>';
  } else {
    // Create summary cards
    html += '<div class="dashboard-cards">';
    for(const sub of enrolled){
      const att = d.Attendance?.[sub.code] || {};
      const dates = Object.keys(att).sort();
      let present = 0, total = 0;
      for(const date of dates){
        if(u in att[date]){
          total++;
          if(att[date][u]) present++;
        }
      }
      const per = total ? ((present/total)*100).toFixed(1) : '0.0';
      const statusClass = per >= 75 ? 'status-present' : per >= 50 ? 'status-pending' : 'status-absent';
      
      html += `
        <div class="stat-card">
          <div class="stat-icon"><i class="fas fa-book"></i></div>
          <div class="stat-value ${statusClass}">${per}%</div>
          <div class="stat-label">${sub.name}</div>
          <div class="muted">${present}/${total} classes</div>
          <div class="progress-bar">
            <div class="progress-fill" style="width: ${per}%"></div>
          </div>
        </div>
      `;
    }
    html += '</div>';
    
    // Detailed view
    for(const sub of enrolled){
      html += `<h3 class="section-title"><i class="fas fa-book"></i> ${sub.name} (${sub.code})</h3>`;
      const att = d.Attendance?.[sub.code] || {};
      const dates = Object.keys(att).sort();
      html += '<table><tr><th>Date</th><th>Status</th></tr>';
      let present = 0, total = 0;
      for(const date of dates){
        const status = att[date][u] === true ? 'Present' : att[date][u] === false ? 'Absent' : 'Not Marked';
        const statusClass = att[date][u] === true ? 'status-present' : att[date][u] === false ? 'status-absent' : 'status-pending';
        if(att[date][u] !== undefined){
          total++;
          if(att[date][u]) present++;
        }
        html += `<tr><td><i class="fas fa-calendar-day"></i> ${date}</td><td><span class="${statusClass}"><i class="fas fa-${att[date][u] === true ? 'check-circle' : att[date][u] === false ? 'times-circle' : 'question-circle'}"></i> ${status}</span></td></tr>`;
      }
      const per = total ? ((present/total)*100).toFixed(1) : '0.0';
      html += `<tr><td><b>Total</b></td><td><b>${present}/${total} (${per}%)</b></td></tr>`;
      html += '</table>';
    }
  }
  
  html += '</div>';
  html += '<div class="text-center"><button class="btn btn-danger" onclick="logout()"><i class="fas fa-sign-out-alt"></i> Logout</button></div>';
  document.getElementById('studentDashboard').innerHTML = html;
}

/* ------------------------ Helpers ------------------------ */
function findSubjectByCode(code){
  if(!code) return null;
  const d = getData();
  const subjectsMap = d.Subjects || {};
  for(const fac in subjectsMap){
    const arr = subjectsMap[fac] || [];
    for(const s of arr){
      if(s.code === code) return { subject: s.subject, code: s.code, faculty: fac };
    }
  }
  return null;
}

function logout(){
  currentUser = null;
  updateUserInfo();
  showSection('loginSection');
}

/* end of script */