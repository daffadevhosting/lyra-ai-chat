import { getFirestore, collection, getDocs } from 'firebase/firestore';

import { detectIntentAndRespond } from '../modules/intentHandler.js';
import { appendMessage,
  showTypingBubble,
  removeTypingBubble } from '../modules/chatRenderer.js';
import { initAuth, getCurrentUID, onLoginStateChanged, login } from '../modules/authHandler.js';
import { showLimitModal, hideLimitModal } from '../modules/limitModal.js';
import { logout } from '../modules/authHandler.js';

let PRODUCT_LIST = [];

async function loadProductList() {
  const db = getFirestore();
  const snapshot = await getDocs(collection(db, 'products'));
  PRODUCT_LIST = snapshot.docs.map(doc => doc.data());
}

export default function ChatTelegram() {
  setTimeout(async () => {
    const sendBtn = document.getElementById('sendBtn');
    const input = document.getElementById('chatInput');
    const loginBtn = document.getElementById('loginBtn');
    const logoutBtn = document.getElementById('logoutUserBtn');
    const modalLoginBtn = document.getElementById('modalLoginBtn');
    const sidebarBtn = document.getElementById('sidebarBtn');
    const sidebar = document.getElementById('sidebar');
    const sidebarOverlay = document.getElementById('sidebarOverlay');
    const sidebarProduct = document.getElementById('sidebarProduct');

    initAuth();
    const db = getFirestore();
    await loadProductList();

    onLoginStateChanged((user) => {
      if (user && loginBtn) {
        const name = user.displayName?.split(' ')[0] ?? user.email?.split('@')[0] ?? 'User';
        loginBtn.textContent = `Halo, ${name}`;
        loginBtn.disabled = true;
        logoutBtn?.classList.remove('hidden');
        hideLimitModal();
      } else {
        logoutBtn?.classList.add('hidden');
      }
    });

    input?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendBtn?.click();
      }
    });

    sendBtn?.addEventListener('click', async () => {
      const text = input.value.trim();
      if (!text) return;

      appendMessage({ sender: 'user', text });
      input.value = '';

      const uid = getCurrentUID();
      const isGuest = !uid;

      if (isGuest && chatCount >= LIMIT) return showLimitModal();
      if (isGuest) chatCount++;

      // 🔍 Deteksi intent manual dulu
      if (/produk apa|punya apa|katalog|jual apa/i.test(text)) {
        appendMessage({ sender: 'lyra', text: '📦 Ini beberapa produk dari toko aku:' });
        PRODUCT_LIST.forEach(p => appendMessage({ sender: 'lyra', text: `Ada ${p.name}:`, product: p }));
        return; // ⛔ STOP, jangan lanjut ke GPT
      }

      // 🧠 AI-based intent detection
      const result = await detectIntentAndRespond(text);

      if (result.intent === 'all') {
        appendMessage({ sender: 'lyra', text: result.label });
        PRODUCT_LIST.forEach(p => appendMessage({ sender: 'lyra', product: p }));
      } else if (result.intent === 'best') {
        const top = [...PRODUCT_LIST].sort((a, b) => b.sold - a.sold)[0];
        appendMessage({ sender: 'lyra', text: result.label, product: top });
      } else if (result.intent === 'rating') {
        const best = [...PRODUCT_LIST].sort((a, b) => b.rating - a.rating)[0];
        appendMessage({ sender: 'lyra', text: result.label, product: best });
      } else if (result.intent === 'match') {
        appendMessage({ sender: 'lyra', text: result.label, product: result.product });
      } else {
        handleRequest(text); // fallback only
      }
    });

    logoutBtn?.addEventListener('click', async () => {
      await logout();
      window.location.href = '/';
    });

    loginBtn?.addEventListener('click', login);
    modalLoginBtn?.addEventListener('click', login);

    sidebarBtn?.addEventListener('click', () => {
      sidebar.classList.remove('-translate-x-full');
      sidebarOverlay.classList.remove('hidden');
    });
    sidebarOverlay?.addEventListener('click', () => {
      sidebar.classList.add('-translate-x-full');
      sidebarOverlay.classList.add('hidden');
    });

    if (sidebarProduct) {
      const items = PRODUCT_LIST.map(p => `
            <div class="product-item flex items-center gap-3 p-2 rounded-lg hover:bg-gray-700 transition cursor-pointer" data-slug="${p.slug}">
              <img src="${p.img}" alt="${p.name}" class="w-10 h-10 rounded-full object-cover border border-gray-500" />
              <div style="width: -webkit-fill-available;">
                <div class="font-medium flex justify-between items-center gap-2">
                  ${p.name}
                  <span class="text-yellow-400 float-end text-sm">⭐ ${p.rating ?? '0'}</span>
                </div>
                <div class="text-sm text-gray-400">Rp.${p.price}</div>
              </div>
            </div>
      `);
      sidebarProduct.innerHTML = items.join('');

      sidebarProduct.addEventListener('click', (e) => {
        const target = e.target.closest('.product-item');
        if (!target) return;
        const slug = target.dataset.slug;
        const product = PRODUCT_LIST.find(p => p.slug === slug);
        if (!product) return console.warn('Produk tidak ditemukan:', slug);

        const msg = `Ceritain dong soal ${product.name}`;
        appendMessage({ sender: 'user', text: msg });

        showTypingBubble();
        showTypingHeader();

        // Collapse sidebar (mobile)
        sidebar.classList.add('-translate-x-full');
        sidebarOverlay.classList.add('hidden');

        setTimeout(() => {
          removeTypingBubble();
          hideTypingHeader();
          appendMessage({
            sender: 'lyra',
            text: `Wah, ${product.name} ini salah satu favorit nih! 😍`,
            product,
            replyTo: msg
          });
        }, 1200);
      });
    }
  }, 50);

  return `
    <div class="flex h-screen bg-[#1d1f2b] text-white font-sans relative overflow-hidden">
      <!-- Sidebar overlay for mobile -->
      <div id="sidebarOverlay" class="fixed inset-0 bg-black/50 z-30 hidden md:hidden"></div>
      <!-- Sidebar -->
      <div id="sidebar" class="fixed z-40 top-0 left-0 h-full w-4/5 max-w-xs bg-[#2c2e3e] p-4 border-r border-gray-700 transform -translate-x-full transition-transform duration-500 md:static md:translate-x-0 md:w-1/3 md:max-w-xs md:z-0">
        <div class="flex justify-between items-center">
        <h2 class="text-xl font-bold mb-0">🛍️ Produk</h2>
          <button id="logoutUserBtn" class="cursor-pointer text-sm text-red-400 hover:underline">Logout</button>
          </div>
        <div class="border-t border-gray-700 mt-4 pt-4"></div>
        <div id="sidebarProduct" class="space-y-2"></div>
        <div class="relative bottom-0 left-0">
        </div>
      </div>
      <!-- Main content -->
      <div class="flex-1 flex flex-col">
        <div class="p-3 border-b border-gray-700 bg-[#262838] flex justify-between items-center">
          <div class="flex items-center gap-2">
            <!-- Sidebar open button for mobile -->
            <button id="sidebarBtn" class="md:hidden cursor-pointer mr-2 focus:outline-none">
              <svg class="w-7 h-7 text-purple-400" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h16"/></svg>
            </button>
            <img src="./logo.png" class="w-8 h-8 rounded-full border border-purple-600" />
            <div>
              <div class="font-semibold">LYRA</div>
              <div id="typingStatus" class="text-xs text-gray-400 hidden">sedang mengetik...</div>
            </div>
          </div>
          <button id="loginBtn" class="cursor-pointer flex items-center gap-2 text-sm bg-purple-700 px-3 py-1 rounded">
            <svg class="w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 3h4a2 2 0 012 2v4m-6 6H9m6 0V9m0 6l3 3m-3-3l-3 3" />
            </svg>
            Login
          </button>
        </div>

        <div id="chatBox" class="flex-1 overflow-y-auto p-4 space-y-3 flex flex-col min-h-0 scrollbar-none"></div>

        <div class="p-4 border-t border-gray-700 flex items-center gap-2 bg-[#2a2c3b]">
        <textarea id="chatInput" rows="1" placeholder="Tanyakan sesuatu..." class="flex-1 bg-[#1d1f2b] text-white p-2 rounded-full focus:outline-none border border-gray-600"></textarea>
          <button id="sendBtn" class="cursor-pointer flex items-center gap-2 bg-purple-600 px-3 py-3 rounded-full">
            <svg class="w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 12l16-6m0 0l-6 16m6-16L4 12" />
            </svg>
          </button>
        </div>
      </div>

      <div id="loginModal" class="fixed hidden inset-0 bg-black/70 z-50 flex justify-center items-center">
        <div class="bg-[#2a2c3b] text-white p-6 rounded-xl w-[90%] max-w-md text-center shadow-lg border border-purple-500">
          <h3 class="text-lg font-bold mb-2">Maaf, kamu sudah mencapai batas chat gratis.</h3>
          <p class="mb-4">Yuk login untuk akses lebih lanjut!</p>
          <button id="modalLoginBtn" class="bg-purple-600 px-4 py-2 cursor-pointer rounded-full">Login dengan Google</button>
        </div>
      </div>
    </div>
  `;
}

let chatCount = 0;
const LIMIT = 10;

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
