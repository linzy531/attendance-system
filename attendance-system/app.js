// Firebase 初始化
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

const video = document.getElementById('webcam');
const studentSelect = document.getElementById('studentSelect');
let todayDateStr = "";
let studentList = [];

window.onload = async () => {
  const now = new Date();
  todayDateStr = now.toISOString().split('T')[0];
  document.getElementById('todayDateDisplay').innerText = `點名日期：${todayDateStr}`;

  // 從 Firebase 撈取動態名單並依座號排序
  try {
    const snapshot = await db.collection('students').orderBy('id').get();
    studentSelect.innerHTML = '';
    studentList = [];
    
    if (snapshot.empty) {
      studentSelect.innerHTML = '<option value="">目前尚無學生名單</option>';
    } else {
      snapshot.forEach(doc => {
        const student = doc.data();
        studentList.push(student);
        const opt = document.createElement('option');
        opt.value = student.id;
        opt.textContent = `${student.id} - ${student.name}`;
        studentSelect.appendChild(opt);
      });
    }
  } catch (err) {
    console.error("載入名單失敗：", err);
    studentSelect.innerHTML = '<option value="">名單載入失敗</option>';
  }

  startCamera();
};

async function startCamera() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    video.srcObject = stream;
  } catch (err) {
    alert("無法存取攝影機，請確認已允許瀏覽器使用鏡頭權限。");
  }
}

async function takePhoto() {
  if (!studentSelect.value) {
    alert("請先選擇姓名！");
    return;
  }

  const now = new Date();
  const canvas = document.getElementById('canvas');
  canvas.width = video.videoWidth || 320;
  canvas.height = video.videoHeight || 240;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

  const photoData = canvas.toDataURL('image/jpeg');
  const selectedStudent = studentList.find(s => s.id === studentSelect.value);

  const record = {
    id: selectedStudent.id,
    name: selectedStudent.name,
    date: todayDateStr,
    time: now.toLocaleTimeString(),
    photo: photoData
  };

  // 寫入 Firebase 雲端點名紀錄
  const docId = `${record.date}_${record.id}`;
  await db.collection('attendance').doc(docId).set(record);

  document.getElementById('statusMsg').innerText = `✅ ${selectedStudent.name} 今日（${todayDateStr}）點名成功！`;
  document.getElementById('statusMsg').style.color = "green";
}