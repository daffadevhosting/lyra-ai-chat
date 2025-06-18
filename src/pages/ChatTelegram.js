import { detectIntent } from '../modules/intentHandler.js';
import { appendMessage,
  showTypingBubble,
  removeTypingBubble } from '../modules/chatRenderer.js';
import { initAuth, getCurrentUID, onLoginStateChanged, login } from '../modules/authHandler.js';
import { showLimitModal, hideLimitModal } from '../modules/limitModal.js';

export default function ChatTelegram() {
  setTimeout(() => {
    const sendBtn = document.getElementById('sendBtn');
    const input = document.getElementById('chatInput');
    const loginBtn = document.getElementById('loginBtn');
    const modalLoginBtn = document.getElementById('modalLoginBtn');
    const sidebarBtn = document.getElementById('sidebarBtn');
    const sidebar = document.getElementById('sidebar');
    const sidebarOverlay = document.getElementById('sidebarOverlay');

    initAuth();
    onLoginStateChanged((user) => {
      if (user) {
        loginBtn.textContent = `Halo, ${user.displayName.split(' ')[0]}`;
        loginBtn.disabled = true;
        hideLimitModal();
      }
    });

    sendBtn?.addEventListener('click', () => {
      const text = input.value.trim();
      if (!text) return;

      appendMessage({ sender: 'user', text });
      input.value = '';

      const uid = getCurrentUID();
      const isGuest = !uid;

      if (isGuest && chatCount >= LIMIT) return showLimitModal();
      if (isGuest) chatCount++;

      if (detectIntent(text)) {
        const produk = {
          name: 'Keripik Lada Hitam',
          price: 'Rp200.000',
          img: 'https://down-id.img.susercontent.com/file/sg-11134201-22110-j5mix2jpi9jv21',
          slug: 'keripik-lada-hitam',
        };

        appendMessage({
          sender: 'lyra',
          text: 'Wah, kamu nyebut keripik?! Nih yang lagi jadi primadona minggu ini 😋',
          replyTo: text,
          product: produk,
        });
      } else {
        handleRequest(text);
      }
    });

    loginBtn?.addEventListener('click', login);
    modalLoginBtn?.addEventListener('click', login);

    // Sidebar toggle logic for mobile
    sidebarBtn?.addEventListener('click', () => {
      sidebar.classList.remove('-translate-x-full');
      sidebarOverlay.classList.remove('hidden');
    });
    sidebarOverlay?.addEventListener('click', () => {
      sidebar.classList.add('-translate-x-full');
      sidebarOverlay.classList.add('hidden');
    });
  }, 50);

  return `
    <div class="flex h-screen bg-[#1d1f2b] text-white font-sans relative overflow-hidden">
      <!-- Sidebar overlay for mobile -->
      <div id="sidebarOverlay" class="fixed inset-0 bg-black/50 z-30 hidden md:hidden"></div>
      <!-- Sidebar -->
      <div id="sidebar" class="fixed z-40 top-0 left-0 h-full w-4/5 max-w-xs bg-[#2c2e3e] p-4 border-r border-gray-700 transform -translate-x-full transition-transform duration-200 md:static md:translate-x-0 md:w-1/3 md:max-w-xs md:z-0">
        <h2 class="text-xl font-bold mb-4">🛍️ Produk</h2>
        <div class="space-y-2">
          ${renderProductItem("Keripik Lada Hitam", "Rp200.000")}
          ${renderProductItem("Sambal Kering Gurih", "Rp15.000")}
        </div>
      </div>
      <!-- Main content -->
      <div class="flex-1 flex flex-col">
        <div class="p-4 border-b border-gray-700 bg-[#262838] flex justify-between items-center">
          <div class="flex items-center gap-2">
            <!-- Sidebar open button for mobile -->
            <button id="sidebarBtn" class="md:hidden mr-2 focus:outline-none">
              <svg class="w-7 h-7 text-purple-400" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h16"/></svg>
            </button>
            <img src="/assets/lyra-avatar.png" class="w-8 h-8 rounded-full border border-purple-600" />
            <div>
              <div class="font-semibold">LYRA</div>
              <div id="typingStatus" class="text-xs text-gray-400 hidden">sedang mengetik...</div>
            </div>
          </div>
          <button id="loginBtn" class="flex items-center gap-2 text-sm bg-purple-700 px-3 py-1 rounded">
            <svg class="w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 3h4a2 2 0 012 2v4m-6 6H9m6 0V9m0 6l3 3m-3-3l-3 3" />
            </svg>
            Login
          </button>
        </div>

        <div id="chatBox" class="flex-1 overflow-y-auto p-4 space-y-3 flex flex-col min-h-0 scrollbar-none">
          <!-- Chat bubbles inserted here -->
        </div>

        <div class="p-4 border-t border-gray-700 flex items-center gap-2 bg-[#2a2c3b]">
          <input
            id="chatInput"
            placeholder="Ketik sesuatu..."
            class="flex-1 bg-[#1d1f2b] text-white p-2 rounded-full focus:outline-none border border-gray-600"
          />
          <button id="sendBtn" class="flex items-center gap-2 bg-purple-600 px-4 py-2 rounded-full">
            <svg class="w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 12l16-6m0 0l-6 16m6-16L4 12" />
            </svg>
            Kirim
          </button>
        </div>
      </div>

      <div id="loginModal" class="fixed inset-0 bg-black/70 hidden z-50 flex justify-center items-center">
        <div class="bg-[#2a2c3b] text-white p-6 rounded-xl w-[90%] max-w-md text-center shadow-lg border border-purple-500">
          <h3 class="text-lg font-bold mb-2">Maaf, kamu sudah mencapai batas chat gratis.</h3>
          <p class="mb-4">Yuk login untuk akses lebih lanjut!</p>
          <button id="modalLoginBtn" class="bg-purple-600 px-4 py-2 rounded-full">Login dengan Google</button>
        </div>
      </div>
    </div>
  `;
}

function renderProductItem(name, price) {
  return `
    <div class="bg-[#383a4d] p-3 rounded-lg hover:bg-[#4a4d64] cursor-pointer transition">
      <div class="font-semibold">${name}</div>
      <div class="text-sm text-gray-300">${price}</div>
    </div>
  `;
}

let chatCount = 0;
const LIMIT = 3;

function showTypingHeader() {
  const el = document.getElementById('typingStatus');
  if (el) el.classList.remove('hidden');
}

function hideTypingHeader() {
  const el = document.getElementById('typingStatus');
  if (el) el.classList.add('hidden');
}

async function handleRequest(prompt) {
  showTypingBubble();
  showTypingHeader();

  try {
    const res = await fetch('https://grey-api.cbp629tmm2.workers.dev/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, uid: getCurrentUID() }),
    });

    const data = await res.json();
    const chatBox = document.getElementById('chatBox');
    chatBox.lastChild?.remove();

    if (res.status === 429 || data.limitReached) {
      showLimitModal();
      return;
    }

  removeTypingBubble();
  hideTypingHeader();
    appendMessage({ sender: 'lyra', text: data.reply, replyTo: prompt });
  } catch (err) {
    console.error('❌ Gagal minta balasan:', err);
    const chatBox = document.getElementById('chatBox');
    chatBox.lastChild?.remove();
    appendMessage({ sender: 'lyra', text: '😵 LYRA lagi error. Coba lagi nanti ya.' });
  }
}
