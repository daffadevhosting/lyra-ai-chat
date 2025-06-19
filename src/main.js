// src/main.js
import './style.css';
import ChatTelegram from './pages/ChatTelegram';
import AdminLogin, { initAdminLoginPage } from './pages/AdminLogin';
import AdminPanel, { initAdminPanel } from './pages/AdminPanel';

const app = document.querySelector('#app');

const showUnderConstruction = () => {
  app.innerHTML = `
    <div style="height:100vh;display:flex;justify-content:center;align-items:center;flex-direction:column;background:#111;color:#fff;text-align:center;padding:2rem;">
      <h1 style="font-size:2rem;">🚧 Website Sedang Dalam Perbaikan</h1>
      <p style="margin-top:1rem;max-width:400px;">Kami sedang menyempurnakan sistem atau ada konfigurasi Firebase yang perlu diperbaiki. Silakan kembali beberapa saat lagi 🙏</p>
    </div>
  `;
};

const renderChatIfLoggedIn = async () => {
  try {
    const { getAuth, onAuthStateChanged } = await import('firebase/auth');
    const auth = getAuth();

    onAuthStateChanged(auth, (user) => {
      if (user) {
        const name = user.displayName?.split(' ')[0] ?? user.email?.split('@')[0] ?? 'User';
        app.innerHTML = ChatTelegram(name);
        setTimeout(() => {
          const event = new CustomEvent('user-login', { detail: { name } });
          window.dispatchEvent(event);
        }, 50);
      } else {
        app.innerHTML = ChatTelegram();
      }
    });
  } catch (err) {
    if (
      err?.code === 'FirebaseError' ||
      err?.message?.includes('auth/invalid-api-key')
    ) {
      showUnderConstruction();
    } else {
      console.error('[Firebase Error]', err);
    }
  }
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
    try {
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
    } catch (err) {
      if (
        err?.code === 'auth/invalid-api-key' ||
        err?.message?.includes('invalid-api-key')
      ) {
        showUnderConstruction();
      } else {
        console.error('[Firebase Error - Admin]', err);
      }
    }
  },
};

// 🚦 Jalankan route
const path = window.location.pathname;
const render = routes[path] || routes['/'];
render();
