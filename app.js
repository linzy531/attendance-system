// app.js
import { db } from "./firebase-config.js";
import { collection, getDocs, doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-firestore.js";

const video = document.getElementById('webcam');
const studentSelect = document.getElementById('studentSelect');
const agreeCheckbox = document.getElementById('agreeCheckbox');
const captureBtn = document.getElementById('captureBtn');

const openModalBtn = document.getElementById('openModalBtn');
const termsModal = document.getElementById('termsModal');
const confirmAgreeBtn = document.getElementById('confirmAgreeBtn');

let todayDateStr = "";
let studentList = [];
let isSystemOpen = true;

window.onload = async () => {
  const now = new Date();
  todayDateStr = now.toISOString().split('T')[0];
  const dateDisplay = document.getElementById('todayDateDisplay');
  if (dateDisplay) dateDisplay.innerText = `點名日期：${todayDateStr}`;

  // 1. 彈窗閱讀控制
  if (openModalBtn && termsModal && confirmAgreeBtn) {
    openModalBtn.onclick = () => {
      termsModal.style.display = 'flex';
    };

    confirmAgreeBtn.onclick = () => {
      termsModal.style.display = 'none';
      agreeCheckbox.checked = true;
      if (isSystemOpen) {
        captureBtn.disabled = false;
        captureBtn.style.opacity = "1";
        captureBtn.style.cursor = "pointer";
      }
    };
  }

  // 2. 檢查點名開放狀態 (全防護容錯)
  await checkSystemOpen();

  // 3. 載入團員名單
  try {
    const querySnapshot = await getDocs(collection(db, "students"));
    studentSelect.innerHTML = '';
    studentList = [];

    if (querySnapshot.empty) {
      studentSelect.innerHTML = '<option value="">目前尚無團員名單</option>';
    } else {
      querySnapshot.forEach(docSnap => {
        const student = docSnap.data();
        studentList.push(student);
      });
      studentList.sort((a, b) => a.id.localeCompare(b.id));

      studentList.forEach(student => {
        const opt = document.createElement('option');
        opt.value = student.id;
        opt.textContent = `${student.id} - ${student.name}`;
        studentSelect.appendChild(opt);
      });
    }
  } catch (err) {
    console.warn("無法存取團員名單（可由後台新增名單）：", err);
    studentSelect.innerHTML = '<option value="">名單載入中或未開放權限</option>';
  }

  startCamera();
};

async function checkSystemOpen() {
  try {
    const settingsRef = doc(db, "settings", "attendance");
    const docSnap = await getDoc(settingsRef);
    if (docSnap.exists()) {
      isSystemOpen = docSnap.data().isOpen;
    }
  } catch (e) {
    console.warn("無法取得開關設定，預設開放點名：", e);
    isSystemOpen = true;
  }

  const statusMsg = document.getElementById('statusMsg');
  if (!isSystemOpen) {
    captureBtn.disabled = true;
    captureBtn.style.opacity = "0.5";
    captureBtn.style.cursor = "not-allowed";
    if (statusMsg) {
      statusMsg.innerText = "目前非點名時間，系統已由行政後台關閉。";
      statusMsg.style.color = "#dc3545";
    }
  }
}

async function startCamera() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    video.srcObject = stream;
  } catch (err) {
    alert("無法存取攝影機，請確認已允許瀏覽器使用鏡頭權限。");
  }
}

window.takePhoto = async function() {
  if (!isSystemOpen) {
    alert("目前非點名時間，無法提交點名！");
    return;
  }

  if (!agreeCheckbox.checked) {
    alert("請先點擊連結閱讀並同意個資與安全聲明！");
    return;
  }

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

  const photoData = canvas.toDataURL('image/jpeg', 0.6);
  const selectedStudent = studentList.find(s => s.id === studentSelect.value);

  const record = {
    id: selectedStudent.id,
    name: selectedStudent.name,
    date: todayDateStr,
    time: now.toLocaleTimeString(),
    photo: photoData
  };

  try {
    const docId = `${record.date}_${record.id}`;
    await setDoc(doc(db, "attendance", docId), record);
    const statusMsg = document.getElementById('statusMsg');
    statusMsg.innerText = `${selectedStudent.name} 今日（${todayDateStr}）點名成功！`;
    statusMsg.style.color = "green";
  } catch (err) {
    console.error("提交點名失敗：", err);
    alert("提交失敗，請檢查網路連線或資料庫權限。");
  }
};
