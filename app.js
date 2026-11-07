// app.js
import { db } from "./firebase-config.js";
import { collection, getDocs, doc, setDoc } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-firestore.js";

const video = document.getElementById('webcam');
const studentSelect = document.getElementById('studentSelect');
let todayDateStr = "";
let studentList = [];

window.onload = async () => {
  const now = new Date();
  todayDateStr = now.toISOString().split('T')[0];
  const dateDisplay = document.getElementById('todayDateDisplay');
  if (dateDisplay) dateDisplay.innerText = `點名日期：${todayDateStr}`;

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

window.takePhoto = async function() {
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
