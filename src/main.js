// src/main.js
import './style.css';
import ChatTelegram from './pages/ChatTelegram';
import AdminLogin, { initAdminLoginPage } from './pages/AdminLogin';
import AdminPanel, { initAdminPanel } from './pages/AdminPanel';
import { onLoginStateChanged } from './modules/adminAuth';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { getApp } from 'firebase/app';

const db = getFirestore(getApp());
const app = document.querySelector('#app');
const route = window.location.pathname;

let isProcessing = false;

onLoginStateChanged(async (user) => {
  if (isProcessing) return;
  isProcessing = true;

  if (route === '/admin') {
    if (user) {
      const docRef = doc(db, 'users', user.uid);
      const snap = await getDoc(docRef);
      if (snap.exists() && snap.data().isAdmin === true) {
        app.innerHTML = AdminPanel();
        requestAnimationFrame(initAdminPanel);
      } else {
        window.location.href = '/';
      }
    } else {
      window.location.href = '/login';
    }
  } else if (route === '/login') {
    if (user) {
      const docRef = doc(db, 'users', user.uid);
      const snap = await getDoc(docRef);
      if (snap.exists() && snap.data().isAdmin === true) {
        window.location.href = '/admin';
      } else {
        window.location.href = '/';
      }
    } else {
      app.innerHTML = AdminLogin();
      requestAnimationFrame(initAdminLoginPage);
    }
  } else {
    app.innerHTML = ChatTelegram();
  }

  isProcessing = false;
});
