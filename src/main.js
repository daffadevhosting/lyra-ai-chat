import './style.css';
import ChatTelegram from './pages/ChatTelegram';

document.querySelector('#app').innerHTML = ChatTelegram();

// TUNDA sampai render selesai
setTimeout(() => {
  const sendBtn = document.getElementById('sendBtn');
  const input = document.getElementById('chatInput');
  const loginBtn = document.getElementById('loginBtn');
  const modalLoginBtn = document.getElementById('modalLoginBtn');

  sendBtn?.addEventListener('click', () => {
    const text = input.value.trim();
    if (!text) return;

    // ... lanjut logika kirim chat
  });

  loginBtn?.addEventListener('click', () => {
    import('./modules/authHandler.js').then(mod => mod.login());
  });

  modalLoginBtn?.addEventListener('click', () => {
    import('./modules/authHandler.js').then(mod => mod.login());
  });
}, 50); // delay kecil biar HTML kebentuk
