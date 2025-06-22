// src/main.js
import './style.css';
import ChatTelegram from './pages/ChatTelegram';
import AdminLogin, { initAdminLoginPage } from './pages/AdminLogin';
import AdminPanel, { initAdminPanel } from './pages/AdminPanel';

const app = document.querySelector('#app');

const showUnderConstruction = () => {
  app.innerHTML = `
      <div class="bg-gray-900 text-white font-sans h-screen flex flex-col items-center justify-center text-center px-6">
        <h1 class="text-4xl font-bold text-yellow-400 mb-3">🚧 Sedang Dibangun!</h1>
        <p class="mb-6 text-gray-300">Fitur ini belum siap tayang, tapi L Y Я A dan tim lagi ngebut ngerjainnya! 💪</p>
        <a href="/" class="bg-yellow-500 px-4 py-2 rounded text-black hover:bg-yellow-600 transition">Balik ke Beranda</a>
      </div>
      <footer class="absolute bottom-0 w-full text-center text-gray-500 text-sm p-4">
        <p>&copy; 2023 L Y Я A. All rights reserved.</p>
      </footer>
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
  '/success': () => {
    import('./pages/success.js').then(module => {
      const { successPage } = module;
      app.innerHTML = '';
      successPage();
    }).catch(err => {
      console.error('[Error loading success page]', err);
      app.innerHTML = `<div class="bg-gray-900 text-red-500 font-sans h-screen flex flex-col items-center justify-center text-center px-6">🤖 AI response: Terjadi kesalahan saat memuat halaman sukses.</div>`;
    });
  },
  '/404': () => {
    app.innerHTML = `
      <div class="text-center text-white p-10">
        <h1 class="text-4xl font-bold">404 - Halaman Tidak Ditemukan</h1>
        <p class="mt-4">Maaf, halaman yang Anda cari tidak ditemukan.</p>
        <a href="/" class="text-blue-400 hover:underline mt-4 inline-block">Kembali ke Beranda</a>
      </div>
    `;
  },
  '/under-construction': showUnderConstruction,
  '*': () => {
    app.innerHTML = `
      <div class="text-center px-6">
        <h1 class="text-6xl font-bold text-purple-400 mb-4">404</h1>
        <p class="text-lg mb-6">Yah, halaman yang kamu cari gak ada 😢</p>
        <a href="/" class="bg-purple-600 px-4 py-2 rounded text-white hover:bg-purple-700 transition">Kembali ke Beranda</a>
      </div>
    `;
  }
};

// 🚦 Jalankan route
const path = window.location.pathname;
const render = routes[path] || routes['/'];
render();
