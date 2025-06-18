// src/main.js
import './style.css';
import ChatTelegram from './pages/ChatTelegram';
import AdminLogin, { initAdminLoginPage } from './pages/AdminLogin';
import AdminPanel, { initAdminPanel } from './pages/AdminPanel';

const app = document.querySelector('#app');

const renderChatIfLoggedIn = async () => {
  const { getAuth, onAuthStateChanged } = await import('firebase/auth');
  const auth = getAuth();

  onAuthStateChanged(auth, (user) => {
    if (user) {
      const name = user.displayName?.split(' ')[0] ?? user.email?.split('@')[0] ?? 'User';
      app.innerHTML = ChatTelegram(name);
      setTimeout(() => {
        const event = new CustomEvent('user-login', { detail: { name } });
        window.dispatchEvent(event);
      }, 50); // Kirim nama ke ChatTelegram
    } else {
      app.innerHTML = ChatTelegram();
    }
  });
};

const routes = {
  '/': () => {
    renderChatIfLoggedIn();
  },
  '/login': () => {
    app.innerHTML = AdminLogin();
    requestAnimationFrame(initAdminLoginPage);
  },
  '/admin': async () => {
    const { getAuth, onAuthStateChanged } = await import('firebase/auth');
    const { getFirestore, doc, getDoc } = await import('firebase/firestore');

    const auth = getAuth();
    const db = getFirestore();

    app.innerHTML = `<div class="text-white p-10 text-center">🔐 Mengecek akses admin...</div>`;

    onAuthStateChanged(auth, async (user) => {
      if (!user) {
        window.location.href = '/login';
        return;
      }

      const userRef = doc(db, 'users', user.uid);
      const snap = await getDoc(userRef);

      if (!snap.exists() || snap.data().isAdmin !== true) {
        window.location.href = '/';
        return;
      }

      app.innerHTML = AdminPanel();
      requestAnimationFrame(initAdminPanel);
    });
  },
};

// 🚦 Jalankan route
const path = window.location.pathname;
const render = routes[path] || routes['/'];
render();
