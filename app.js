<!DOCTYPE html>
<html lang="zh-TW">
<head>
  <meta charset="UTF-8">
  <title>行政出席矩陣與名單管理總表</title>
  <link rel="stylesheet" href="style.css">
  <style>
    .container { max-width: 95%; width: 100%; margin: 20px auto; }
    .table-wrapper { overflow-x: auto; margin-top: 20px; }
    table { width: 100%; border-collapse: collapse; min-width: 600px; }
    th, td { border: 1px solid #ddd; padding: 10px; text-align: center; font-size: 14px; }
    th { background-color: #007bff; color: white; white-space: nowrap; }
    .status-ok { color: green; font-weight: bold; }
    .status-no { color: #dc3545; background-color: #fff0f0; }
    .photo-thumb { width: 45px; height: 35px; object-fit: cover; border-radius: 4px; cursor: pointer; display: block; margin: 4px auto 0; }
    
    .management-card {
      background: #f8f9fa;
      border: 1px solid #e9ecef;
      padding: 15px;
      border-radius: 8px;
      margin-bottom: 25px;
      text-align: left;
    }
    .form-inline { display: flex; gap: 10px; margin-bottom: 15px; }
    .form-inline input { padding: 8px; border-radius: 4px; border: 1px solid #ccc; }
    .student-tag {
      display: inline-flex;
      align-items: center;
      background: #e9ecef;
      padding: 5px 10px;
      border-radius: 20px;
      margin: 4px;
      font-size: 14px;
    }
    .student-tag button {
      background: #dc3545;
      color: white;
      border: none;
      border-radius: 50%;
      width: 18px;
      height: 18px;
      line-height: 16px;
      margin-left: 8px;
      cursor: pointer;
      padding: 0;
      font-size: 12px;
    }
    #loginSection { max-width: 400px; margin: 40px auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px; background: #fff; }
  </style>
</head>
<body>
  <div class="container">
    <!-- 登入區塊 -->
    <div id="loginSection">
      <h2>行政管理員登入</h2>
      <input type="email" id="loginEmail" placeholder="電子郵件" style="width:100%; padding:10px; margin-bottom:10px; box-sizing:border-box;">
      <input type="password" id="loginPassword" placeholder="密碼" style="width:100%; padding:10px; margin-bottom:10px; box-sizing:border-box;">
      <button id="emailLoginBtn">Email 登入</button>
      <button id="googleLoginBtn" style="background-color: #db4437; margin-top: 10px;">使用 Google 帳號登入</button>
      <p id="loginError" style="color:red; margin-top:10px;"></p>
    </div>

    <!-- 後台內容區塊 (預設預覽隱藏) -->
    <div id="adminContent" style="display: none;">
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <h2>行政總台管理與出席表</h2>
        <button id="logoutBtn" style="width: auto; padding: 8px 16px; background-color: #6c757d;">登出</button>
      </div>

      <div class="management-card">
        <h3 style="margin-top:0;">📋 班級學生名單編輯</h3>
        <div class="form-inline">
          <input type="text" id="newStudentId" placeholder="座號 (如: 01)" style="width: 100px;">
          <input type="text" id="newStudentName" placeholder="學生姓名" style="width: 150px;">
          <button id="addStudentBtn" style="width: auto; margin:0; padding: 8px 16px;">新增學生</button>
        </div>
        <div id="studentListTags">名單載入中...</div>
      </div>

      <h3>📊 出席紀錄總表</h3>
      <div class="table-wrapper">
        <table>
          <thead>
            <tr id="tableHeader">
              <th>座號</th>
              <th>姓名</th>
            </tr>
          </thead>
          <tbody id="tableBody"></tbody>
        </table>
      </div>

      <a href="index.html" style="margin-top:20px; display:inline-block;">← 返回學生點名頁</a>
    </div>
  </div>

  <script type="module">
    import { auth, db } from "./firebase-config.js";
    import { 
      onAuthStateChanged, 
      signInWithEmailAndPassword, 
      GoogleAuthProvider, 
      signInWithPopup, 
      signOut 
    } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-auth.js";
    import { 
      collection, 
      onSnapshot, 
      doc, 
      setDoc, 
      deleteDoc 
    } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-firestore.js";

    let currentStudents = [];
    let currentRecords = [];

    document.addEventListener('DOMContentLoaded', () => {
      onAuthStateChanged(auth, (user) => {
        const loginSection = document.getElementById('loginSection');
        const adminContent = document.getElementById('adminContent');

        if (user) {
          if (loginSection) loginSection.style.display = 'none';
          if (adminContent) adminContent.style.display = 'block';
          initRealtimeListeners();
        } else {
          if (loginSection) loginSection.style.display = 'block';
          if (adminContent) adminContent.style.display = 'none';
        }
      });

      const emailLoginBtn = document.getElementById('emailLoginBtn');
      if (emailLoginBtn) {
        emailLoginBtn.onclick = () => {
          const email = document.getElementById('loginEmail').value;
          const pass = document.getElementById('loginPassword').value;
          signInWithEmailAndPassword(auth, email, pass).catch(err => {
            const errEl = document.getElementById('loginError');
            if (errEl) errEl.innerText = "登入失敗：" + err.message;
          });
        };
      }

      const googleLoginBtn = document.getElementById('googleLoginBtn');
      if (googleLoginBtn) {
        googleLoginBtn.onclick = () => {
          const provider = new GoogleAuthProvider();
          signInWithPopup(auth, provider).catch(err => {
            const errEl = document.getElementById('loginError');
            if (errEl) errEl.innerText = "Google 登入失敗：" + err.message;
          });
        };
      }

      const logoutBtn = document.getElementById('logoutBtn');
      if (logoutBtn) {
        logoutBtn.onclick = () => signOut(auth);
      }

      const addStudentBtn = document.getElementById('addStudentBtn');
      if (addStudentBtn) {
        addStudentBtn.onclick = async () => {
          const id = document.getElementById('newStudentId').value.trim();
          const name = document.getElementById('newStudentName').value.trim();
          if (!id || !name) {
            alert("請填寫座號與姓名！");
            return;
          }
          await setDoc(doc(db, "students", id), { id, name });
          document.getElementById('newStudentId').value = '';
          document.getElementById('newStudentName').value = '';
        };
      }
    });

    function initRealtimeListeners() {
      onSnapshot(collection(db, "students"), (snapshot) => {
        currentStudents = [];
        const container = document.getElementById('studentListTags');
        if (!container) return;
        container.innerHTML = '';

        snapshot.forEach(docSnap => currentStudents.push(docSnap.data()));
        currentStudents.sort((a, b) => a.id.localeCompare(b.id));

        currentStudents.forEach(s => {
          const tag = document.createElement('span');
          tag.className = 'student-tag';
          tag.innerHTML = `${s.id} ${s.name} `;

          const delBtn = document.createElement('button');
          delBtn.textContent = '×';
          delBtn.onclick = () => deleteStudent(s.id);

          tag.appendChild(delBtn);
          container.appendChild(tag);
        });

        renderMatrixTable();
      });

      onSnapshot(collection(db, "attendance"), (snapshot) => {
        currentRecords = [];
        snapshot.forEach(docSnap => currentRecords.push(docSnap.data()));
        renderMatrixTable();
      });
    }

    async function deleteStudent(id) {
      if (confirm(`確定要刪除座號 ${id} 的學生嗎？`)) {
        await deleteDoc(doc(db, "students", id));
      }
    }

    function renderMatrixTable() {
      const tableHeader = document.getElementById('tableHeader');
      const tableBody = document.getElementById('tableBody');
      if (!tableHeader || !tableBody) return;

      tableHeader.innerHTML = '<th>座號</th><th>姓名</th>';
      tableBody.innerHTML = '';

      const uniqueDates = [...new Set(currentRecords.map(r => r.date))].sort();
      if (uniqueDates.length === 0) {
        uniqueDates.push(new Date().toISOString().split('T')[0]);
      }

      uniqueDates.forEach(date => {
        const th = document.createElement('th');
        th.textContent = date;
        tableHeader.appendChild(th);
      });

      currentStudents.forEach(student => {
        const tr = document.createElement('tr');
        let rowHTML = `<td>${student.id}</td><td><b>${student.name}</b></td>`;

        uniqueDates.forEach(date => {
          const record = currentRecords.find(r => r.id === student.id && r.date === date);
          if (record) {
            rowHTML += `
              <td class="status-ok">
                ✅ ${record.time}
                <a href="${record.photo}" target="_blank">
                  <img src="${record.photo}" class="photo-thumb" title="點擊檢視照片">
                </a>
              </td>
            `;
          } else {
            rowHTML += `<td class="status-no">缺席</td>`;
          }
        });

        tr.innerHTML = rowHTML;
        tableBody.appendChild(tr);
      });
    }
  </script>
</body>
</html>
