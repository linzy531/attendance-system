// 將你提供的 Firebase 配置資料填入
const firebaseConfig = {
  apiKey: "AIzaSyBW--aEDkVEu2tNSCm-WDCUmdxdOi-zL7w",
  authDomain: "attendance-system-580e6.firebaseapp.com",
  projectId: "attendance-system-580e6",
  storageBucket: "attendance-system-580e6.firebasestorage.app",
  messagingSenderId: "887294839449",
  appId: "1:887294839449:web:03164a056992b52e6a8608"
};

// 初始化 Firebase
firebase.initializeApp(firebaseConfig);

// 匯出功能實例供全域使用
const auth = firebase.auth();
const db = firebase.firestore();
