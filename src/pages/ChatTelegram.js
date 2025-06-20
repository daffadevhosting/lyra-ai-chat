import { getFirestore, collection, getDocs, doc, updateDoc, increment, setDoc } from 'firebase/firestore';
import { detectIntentAndRespond, detectCategoryIntent, generateCategoryResponse, generatePersonaResponse, generateTone } from '../modules/intentHandler.js';
import {
  appendMessage,
  showTypingBubble,
  removeTypingBubble,
  showTypingHeader,
  hideTypingHeader } from '../modules/chatRenderer.js';
import { initAuth, getCurrentUID, onLoginStateChanged, login } from '../modules/authHandler.js';
import { showLimitModal, hideLimitModal } from '../modules/limitModal.js';
import { cartManager} from '../modules/CartManager.js';
import { startCheckout, handleCheckoutInput } from '../modules/checkoutHandler.js';
import { logout } from '../modules/authHandler.js';

let modeLYRA = localStorage.getItem('modeLYRA') || 'jualan';
const MODES = ['jualan', 'friendly', 'formal', 'genz'];
let modeIndex = MODES.indexOf(modeLYRA);

let PRODUCT_LIST = [];
let chatCount = 0;
const LIMIT = 10;
const groqKey = import.meta.env.VITE_GROQ_API_KEY;
let checkoutStep = 0;
let checkoutData = {};

async function loadProductList() {
  const db = getFirestore();
  const snapshot = await getDocs(collection(db, 'products'));
  PRODUCT_LIST = snapshot.docs.map(doc => doc.data());
}
async function trackProductInteraction(slug, type = 'viewed') {
  const db = getFirestore();
  const ref = doc(db, 'analytics', slug);
  await setDoc(ref, { viewed: 0, addedToCart: 0 }, { merge: true });
  await updateDoc(ref, { [type]: increment(1) });
}
function getGreetingByTime() {
  const now = new Date();
  const hour = now.getHours();

  if (hour >= 4 && hour < 11) return '🌞 Selamat pagi';
  if (hour >= 11 && hour < 15) return '☀️ Selamat siang';
  if (hour >= 15 && hour < 18) return '🌇 Selamat sore';
  return '🌙 Selamat malam';
}

function respondWithTyping({ text, product = null, replyTo = null }) {
  showTypingBubble();
  showTypingHeader();

  setTimeout(() => {
    appendMessage({ sender: 'lyra', text, product, replyTo });
    removeTypingBubble();
    hideTypingHeader();
  }, 1000 + Math.random() * 400); // biar dramatis
}

let hasWelcomed = false;

async function sendWelcomeMessage(user) {
  if (hasWelcomed) return;
  hasWelcomed = true;

  const greeting = getGreetingByTime();
  const name = user?.displayName || 'stranger';

  const welcomeTexts = [
    `${greeting}, ${name}! Aku LYRA 😉`,
    `${greeting}, ${name}! Lyra siap bantu kamu cari produk kece hari ini. 😎`,
    `Halo ${name}, ${greeting}! Aku LYRA — asisten AI kamu di sini.`,
    `${greeting} ${name}! Yuk, mulai eksplor produk bareng aku. 🛍️`,
  ];

  const randomText = welcomeTexts[Math.floor(Math.random() * welcomeTexts.length)];

  respondWithTyping({ sender: 'lyra', text: randomText });

function updateModeLabel() {
  const label = document.getElementById('modeLabel');
  if (label) {
    label.textContent = modeLYRA.charAt(0).toUpperCase() + modeLYRA.slice(1);
  }
}
  // Tambahin sapaan follow-up
  setTimeout(() => {
const toggleStyleBtn = document.getElementById('toggleStyle');
if (toggleStyleBtn) {
  toggleStyleBtn.addEventListener('click', () => {
    modeIndex = (modeIndex + 1) % MODES.length;
    modeLYRA = MODES[modeIndex];
    localStorage.setItem('modeLYRA', modeLYRA);
    updateModeLabel();
    respondWithTyping({ sender: 'lyra', text: `Gaya ngobrol diganti jadi ${modeLYRA} ya! 😉` });
    showGlobalAlert(`Gaya bicara LYRA diubah ke: ${modeLYRA}`, 'success');
  });
}
    respondWithTyping({
      sender: 'lyra',
      text: `Coba klik produk di sidebar atau langsung ketik "minta katalog nya" ke LYЯA. Tanya apapun, ${name}. Aku standby! 🚀`,
    });
  }, 1200);
}

function renderProductGridInChat(products) {
  const html = `
    <div class=\"grid grid-cols-2 gap-2 animate-fade-in\">
      ${products.map(p => `
        <div class="bg-gray-700 border border-cyan-400 rounded-lg p-2 text-white text-xs flex flex-col gap-1">
          <img src="${p.img}" class="w-full h-20 object-cover rounded" />
          <div class="font-semibold">${p.name}</div>
          <div class="text-yellow-300">Rp ${p.price.toLocaleString('id-ID')}</div>
          <button id="atc" class="cursor-pointer mt-1 bg-blue-600 text-white text-xs py-1 rounded add-to-cart-btn" data-slug="${p.slug}">+ Keranjang</button>
        </div>
      `).join('')}
    </div>
  `;
  appendMessage({ sender: 'lyra', html });

  const style = document.createElement('style');
  style.textContent = `
    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
    .animate-fade-in > div {
      animation: fadeIn 0.4s ease-in-out both;
    }
    .animate-fade-in > div:nth-child(1) { animation-delay: 0s; }
    .animate-fade-in > div:nth-child(2) { animation-delay: 0.05s; }
    .animate-fade-in > div:nth-child(3) { animation-delay: 0.1s; }
    .animate-fade-in > div:nth-child(4) { animation-delay: 0.15s; }
    .animate-fade-in > div:nth-child(5) { animation-delay: 0.2s; }
    .animate-fade-in > div:nth-child(6) { animation-delay: 0.25s; }
  `;
  document.head.appendChild(style);

  setTimeout(() => {
function updateCartBadge() {
  const badge = document.getElementById('cartQtyBadge');
  const { qty } = cartManager.getCartSummary();

  if (qty > 0) {
    badge.textContent = qty;
    badge.classList.remove('hidden');
  } else {
    badge.classList.add('hidden');
  }
}

document.querySelectorAll('.add-to-cart-btn').forEach(btn => {
  if (btn.dataset.bound) return; // hindari binding ganda

  btn.addEventListener('click', () => {
    const slug = btn.dataset.slug;
    const product = PRODUCT_LIST.find(p => p.slug === slug);

    if (product) {
      cartManager.addItem(product);
      updateCartBadge();
      globalAlert(`1 ${product.name} masuk keranjang!`);
    } else {
      globalAlert('Produk tidak ditemukan 😓');
    }
  });

  btn.dataset.bound = 'true';
});

  }, 50);
}
document.getElementById('toggleStyle')?.addEventListener('click', toggleModeLYRA);

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
    await loadProductList();

sendBtn?.addEventListener('click', () => {
  const text = input.value.trim();
  if (text) handleUserInput(text);
});

input?.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    const text = input.value.trim();
    if (text) handleUserInput(text);
  }
});

onLoginStateChanged((user) => {
      if (user && loginBtn) {
        const name = user.displayName?.split(' ')[0] ?? user.email?.split('@')[0] ?? 'User';
        loginBtn.textContent = `Halo, ${name}`;
        loginBtn.disabled = true;
        logoutBtn?.classList.remove('hidden');
        hideLimitModal();
        sendWelcomeMessage(user);
      } else {
        sendWelcomeMessage(null);
        logoutBtn?.classList.add('hidden');
      }
});
    

async function handleUserInput(text) {
  appendMessage({ sender: 'user', text });
  input.value = '';

  const uid = getCurrentUID();
  const isGuest = !uid;

  const handled = await handleCheckoutInput(text, cartManager.items);
  if (handled) return;

  if (isGuest && chatCount >= LIMIT) return showLimitModal();
  if (isGuest) chatCount++;

  // 📦 Keranjang
  if (/keranjang|lihat keranjang|cart/i.test(text)) {
    cartBtn?.click();
    return;
  }

  // 🗑️ Hapus dari keranjang
  if (/hapus/i.test(text)) {
    const keyword = text.replace(/hapus/i, '').trim().toLowerCase();
    const indexMatch = text.match(/ke-?(\d+)/i);
    if (indexMatch) {
      const index = parseInt(indexMatch[1], 10) - 1;
      const allItems = cartManager.items;
      if (allItems[index]) {
        const removed = allItems[index];
        // Buat array baru tanpa item di index tersebut
        cartManager.items = allItems.filter((_, i) => i !== index);
        cartManager.notifyListeners();
        appendMessage({ sender: 'lyra', text: `Oke, aku hapus ${removed.name} dari keranjang.` });
      } else {
        appendMessage({ sender: 'lyra', text: `Item nomor ${index + 1} nggak ditemukan di keranjang.` });
      }
  } else {
      const match = PRODUCT_LIST.find(p => p.name.toLowerCase().includes(keyword));
      if (match) {
        cartManager.removeBySlug(match.slug);
        appendMessage({ sender: 'lyra', text: `Item "${match.name}" sudah dihapus dari keranjang.` });
      } else {
        appendMessage({ sender: 'lyra', text: `Item "${keyword}" nggak aku temuin di keranjang.` });
      }
    }
    return;
  }

  // 💰 Checkout
if (/checkout|bayar/i.test(text)) {
  return startCheckout(cartManager.items);
}

// 📋 Format checkout (Global Scope)
function parseCheckoutFormat(text) {
  const requiredFields = ['nama', 'no wa', 'alamat', 'kurir'];
  const lines = text.split('\n');
  const data = {};

  lines.forEach(line => {
    const [key, value] = line.split(':').map(s => s.trim());
    if (key && value) {
      data[key.toLowerCase()] = value;
    }
  });

  const isValid = requiredFields.every(field => data[field]);

  return { isValid, data };
}

  // 📦 Semua produk
if (/produk apa|punya apa|katalog|jual apa|semua produk|lihat semua|katalog lengkap/i.test(text)) {
    showTypingBubble();
    showTypingHeader();
    setTimeout(() => {
      appendMessage({ sender: 'lyra', text: '📦 Ini semua produk dari toko aku:', replyTo: text });
      removeTypingBubble();
      hideTypingHeader();
    }, 600 + Math.random() * 400);

    setTimeout(() => {
      renderProductGridInChat(PRODUCT_LIST);
    }, 1200 + Math.random() * 400);
    return;
}

  // 🤖 AI response (intent + gaya bicara)
  const result = await detectIntentAndRespond(text);

  const personaReply = generatePersonaResponse(text);
  if (personaReply) {
    respondWithTyping({ text: personaReply });
    return;
  }

  if (result.intent === 'all') {
    respondWithTyping({ text: result.label });
    PRODUCT_LIST.forEach(p => respondWithTyping({ product: p }));
  } else if (result.intent === 'best') {
    const top = [...PRODUCT_LIST].sort((a, b) => b.sold - a.sold)[0];
    respondWithTyping({ text: result.label, product: top });
  } else if (result.intent === 'rating') {
    const best = [...PRODUCT_LIST].sort((a, b) => b.rating - a.rating)[0];
    respondWithTyping({ text: result.label, product: best });
  } else if (result.intent === 'match') {
    respondWithTyping({ text: result.label, product: result.product });
  } else {
    const matchedProduct = PRODUCT_LIST.find(p => text.toLowerCase().includes(p.name.toLowerCase()));
    if (matchedProduct) {
      const catIntent = detectCategoryIntent(text);
      const rawResponse = generateCategoryResponse(catIntent, matchedProduct);
      const styled = generateTone(rawResponse, modeLYRA);
      respondWithTyping({ text: styled, product: matchedProduct });
    } else {
      handleRequest(text); // fallback ke GPT
    }
  }
}

logoutBtn?.addEventListener('click', async () => {
  await logout();
  window.location.href = '/';
});
    
const cheatsheetModal = document.getElementById('cheatsheet-modal');
const cheatsheetContent = document.getElementById('cheatsheet-content');

document.getElementById('openCheatsheet')?.addEventListener('click', () => {
  cheatsheetModal.classList.remove('hidden');
  cheatsheetModal.classList.add('flex');
  setTimeout(() => {
    cheatsheetContent.classList.remove('opacity-0', 'scale-95');
    cheatsheetContent.classList.add('opacity-100', 'scale-100');
  }, 10);
});
document.getElementById('closeCheatsheet')?.addEventListener('click', () => {
  cheatsheetContent.classList.remove('opacity-100', 'scale-100');
  cheatsheetContent.classList.add('opacity-0', 'scale-95');
  setTimeout(() => {
    cheatsheetModal.classList.add('hidden');
    cheatsheetModal.classList.remove('flex');
  }, 200);
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


function getProductByName(name) {
  return PRODUCT_LIST.find(p => p.name.toLowerCase().includes(name.toLowerCase()));
}

function getRandomResponse(productName) {
  const product = getProductByName(productName);
  const priceFormatted = product?.price
  ? `Rp ${product.price.toLocaleString('id-ID')}`
  : 'harga tidak tersedia';

  if (!product) {
  return `Hmm... aku belum nemu produk bernama "${productName}". Mau coba cari yang lain?`;
}
  if (product.tags?.includes('gratis-ongkir')) {
  responses.push(`Khusus hari ini, ${product.name} bebas ongkir loh! 😍`);
  }
  const templates = [
  `kamu pengen ${product.name} ini, ini salah satu andalan, harganya ${priceFormatted} aja.`,
  `Kamu pasti suka ${product.name}, dan kabar baiknya: cuma ${priceFormatted}!`,
  `Harga ${product.name}? ${priceFormatted}. Worth it banget untuk rasanya!`,
  `Mau yang bikin anget? ${product.name} jawabannya. Harga: ${priceFormatted}.`,
  ];

  return templates[Math.floor(Math.random() * templates.length)];
}

const userPrompts = [
  "Ceritain dong soal {{name}}.",
  "Eh, ini {{name}} kayaknya menarik, ya?",
  "{{name}} ini produk apa sih?",
  "Gua penasaran deh sama {{name}}.",
  "Ini {{name}} kegunaannya apa, bre?",
  ];
function getRandomUserPrompt(name) {
  const prompt = userPrompts[Math.floor(Math.random() * userPrompts.length)];
  return prompt.replace('{{name}}', name);
}

function generateProductTeaser(product) {
  const desc = product.description || 'produk menarik dari kami';
  const teasers = [
  `✨ ${product.name} hadir dengan ${desc.slice(0, 60)}...`,
  `🎯 Ini dia highlight dari ${product.name}: ${desc.slice(0, 70)}...`,
  `🔍 Sekilas tentang ${product.name}: ${desc.slice(0, 65)}...`,
  `💡 ${product.name} punya fitur utama: ${desc.slice(0, 60)}...`,
  `🔥 Kepoin ${product.name}, katanya sih: ${desc.slice(0, 70)}...`,
  ];
  return teasers[Math.floor(Math.random() * teasers.length)];
}

document.getElementById('openFaq')?.addEventListener('click', () => {
  const modal = document.getElementById('faqModal');
  modal.classList.remove('hidden');
  setTimeout(() => {
    modal.querySelector('div').classList.remove('opacity-0', 'scale-95');
  }, 50);
});

document.getElementById('closeFaq')?.addEventListener('click', () => {
  const modal = document.getElementById('faqModal');
  modal.querySelector('div').classList.add('opacity-0', 'scale-95');
  setTimeout(() => {
    modal.classList.add('hidden');
  }, 300);
});

function openProductModal(product) {
  document.getElementById('modal-image').src = product.img || '/default.jpg';
  document.getElementById('modal-title').textContent = product.name;
  document.getElementById('modal-rating').textContent = product.rating;
  document.getElementById('modal-sold').textContent = product.sold;
  document.getElementById('modal-price').textContent = `Rp ${product.price.toLocaleString()}`;

    const modal = document.getElementById('product-modal');
    const modalContent = document.getElementById('modal-content');

    // Buka modal produk + animasi
    modal.classList.remove('hide');
    setTimeout(() => {
      modalContent.classList.remove('opacity-0', 'scale-95');
      modalContent.classList.add('opacity-100', 'scale-100');
    }, 10);

    // Midtrans tombol
    document.getElementById('buy-button').onclick = () => {
      snap.pay(product.snapToken);
    };
  }

  document.getElementById('modal-close').onclick = () => {
    const modal = document.getElementById('product-modal');
    const modalContent = document.getElementById('modal-content');

    // Kasih efek nutup
    modalContent.classList.remove('opacity-100', 'scale-100');
    modalContent.classList.add('opacity-0', 'scale-95');

    setTimeout(() => {
      modal.classList.add('hide');
    }, 300);
  };

const cartBtn = document.getElementById('cartBtn');

cartBtn?.addEventListener('click', () => {
  const { isEmpty, cartList, total } = cartManager.getCartSummary();

  if (isEmpty) {
    globalAlert('Keranjang masih kosong');

    setTimeout(() => {
      showTypingBubble();
      showTypingHeader();

      setTimeout(() => {
        appendMessage({ 
          sender: 'lyra', 
          text: 'Keranjangmu masih kosong nih. Yuk pilih produk dulu!' 
        });

        removeTypingBubble();
        hideTypingHeader();
      }, 800 + Math.random() * 400);
    }, 10);

    return;
  }

  setTimeout(() => {
    showTypingBubble();
    showTypingHeader();

    setTimeout(() => {
      appendMessage({
        sender: 'lyra',
        text: `Isi keranjang kamu:\n${cartList}\n\nTotal: Rp ${total.toLocaleString('id-ID')}`
      });

      removeTypingBubble();
      hideTypingHeader();
    }, 800 + Math.random() * 400);
  }, 10);
});

  sidebarProduct.addEventListener('click', (e) => {
        const target = e.target.closest('.product-item');
        if (!target) return;
        const slug = target.dataset.slug;
        const product = PRODUCT_LIST.find(p => p.slug === slug);
        if (!product) return console.warn('Produk tidak ditemukan:', slug);

        // Random user message
        const msg = getRandomUserPrompt(product.name);
        appendMessage({ sender: 'user', text: msg });

        // Tampilkan efek ngetik
        showTypingBubble();
        showTypingHeader();

        setTimeout(() => {
          const lyraReply = getRandomResponse(product.name);

          // LYRA bales sekaligus: text + reference ke product
          appendMessage({
            sender: 'lyra',
            text: lyraReply,
            product,
            replyTo: msg
          });

          removeTypingBubble();
          hideTypingHeader();

          // Optional: lanjut teaser deskripsi
          setTimeout(() => {
            const teaser = generateProductTeaser(product);
            const linkHTML = `<a href="#" class="open-product-link text-blue-600 underline" data-slug="${product.slug}">Lihat detail produk</a>`;
            const fullTeaser = `${teaser} ${linkHTML}`;
            appendMessage({ sender: 'lyra', html: fullTeaser });

            setTimeout(() => {
            document.querySelectorAll('.open-product-link').forEach(link => {
              link.onclick = (e) => {
                e.preventDefault();
                const slug = link.dataset.slug;
                const product = PRODUCT_LIST.find(p => p.slug === slug);
                if (product) openProductModal(product);
              };
            });
          }, 50);

          }, 800 + Math.random() * 400);
        }, 1000 + Math.random() * 500);

        // Tutup sidebar di mobile
        sidebar.classList.add('-translate-x-full');
        sidebarOverlay.classList.add('hidden');
      });
    }
  }, 50);
  
return `
    <div class="flex h-screen bg-[#1d1f2b] text-white font-sans relative overflow-hidden">
      <!-- Sidebar overlay for mobile -->
      <div id="sidebarOverlay" class="fixed inset-0 bg-black/50 z-30 hidden md:hidden"></div>
      <!-- Sidebar -->
      <div id="sidebar" class="fixed z-40 top-0 left-0 flex flex-col h-full w-4/5 max-w-xs bg-[#2c2e3e] p-4 border-r border-gray-700 transform -translate-x-full transition-transform duration-500 md:static md:translate-x-0 md:w-1/3 md:max-w-xs md:z-0">
        <div class="flex justify-between items-center">
        <h2 class="text-xl font-bold mb-0">🛍️ Produk</h2>

          <button id="loginBtn" class="cursor-pointer flex items-center gap-2 text-sm bg-purple-700 px-3 py-1 rounded">
            <svg class="w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 3h4a2 2 0 012 2v4m-6 6H9m6 0V9m0 6l3 3m-3-3l-3 3" />
            </svg>
            Login
          </button>
          </div>
        <div class="border-t border-gray-700 mt-4 pt-4"></div>
        <div id="sidebarProduct" class="flex-1 overflow-y-auto scrollbar-none space-y-2"></div>
        <div class="relative bottom-0 left-0">
        <div class="mt-auto pt-4 border-t border-gray-700">
        <!-- Dark/Light mode toggle button -->
        <button id="openFaq" class="cursor-pointer flex items-center gap-2 w-full text-sm px-3 py-2 hover:bg-gray-700 rounded-lg transition mb-2">
        <svg class="w-4 h-4 text-purple-400" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-circle-question-mark-icon lucide-circle-question-mark"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/></svg>
          <span>Bantuan & Faq</span>
        </button>
        <button id="toggleStyle" class=" cursor-pointer flex items-center gap-2 w-full text-sm px-3 py-2 hover:bg-gray-700 rounded-lg transition">
          <svg class="w-4 h-4 text-purple-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path d="M12 20h9" /><path d="M12 4h9" /><path d="M4 9h16" /><path d="M4 15h16" />
          </svg>
          Gaya Bicara <span id="modeLabel"></span>
        </button>
        <!-- Tombol Cheatsheet -->
        <button id="openCheatsheet" class="flex items-center cursor-pointer gap-2 w-full text-left text-sm px-3 py-2 hover:bg-gray-700 rounded-lg transition">
          <svg xmlns="http://www.w3.org/2000/svg" class="lucide lucide-book-open w-4 h-4 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path d="M2 6a2 2 0 0 1 2-2h7v16H4a2 2 0 0 1-2-2V6Z" />
            <path d="M22 6a2 2 0 0 0-2-2h-7v16h7a2 2 0 0 0 2-2V6Z" />
          </svg>
          Cheatsheet
        </button>
          <!-- Tombol Pengaturan -->
          <button id="openSettings" onclick="location.href='/underconstruction.html'" class="cursor-pointer flex items-center gap-2 w-full text-left text-sm px-3 py-2 hover:bg-gray-700 rounded-lg transition">
            <svg xmlns="http://www.w3.org/2000/svg" class="lucide lucide-settings w-4 h-4 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z"/>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09c.7 0 1.31-.4 1.51-1a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06c.46.46 1.12.6 1.72.33h.01a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09c0 .7.4 1.31 1 1.51a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06c-.46.46-.6 1.12-.33 1.72v.01c.3.6.94 1 1.66 1H21a2 2 0 0 1 0 4h-.09c-.7 0-1.31.4-1.51 1Z"/>
            </svg>
            Pengaturan
          </button>

          <!-- Tombol Logout -->
          <button id="logoutUserBtn" class="cursor-pointer flex items-center gap-2 w-full text-left text-sm px-3 py-2 hover:bg-gray-700 rounded-lg transition mt-1 text-red-400">
            <svg xmlns="http://www.w3.org/2000/svg" class="lucide lucide-log-out w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path d="M9 16l-4-4m0 0l4-4m-4 4h12M15 12H3" />
            </svg>
            Keluar
          </button>
        </div>
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
              <div class="font-semibold">L Y Я A</div>
              <div id="typingStatus" class="text-xs text-gray-400 hidden">sedang mengetik...</div>
            </div>
          </div>
          <button id="cartBtn" class="relative text-sm cursor-pointer bg-orange-500 text-white px-3 py-3 rounded">
            <svg class="w-4 h-4" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-shopping-cart-icon lucide-shopping-cart"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></svg>
            <span id="cartQtyBadge" class="absolute -top-2 -right-2 bg-red-600 text-white text-[10px] px-1.5 py-0.5 rounded-full hidden">0</span>
          </button>
        </div>

        <div id="chatBox" class="flex-1 overflow-y-auto p-4 space-y-3 flex flex-col min-h-0 scrollbar-none"></div>
        <div class="text-xs text-gray-400 text-center px-4 py-2">
          <em><strong>L Y Я A</strong> is still learning. Verify any important information you receive.</em>
        </div>
        <div class="p-4 border-t border-gray-700 flex items-center gap-2 bg-[#2a2c3b]">
        <textarea id="chatInput" rows="1" placeholder="Tanyakan sesuatu..." class="flex-1 bg-[#1d1f2b] text-white p-2 rounded-full focus:outline-none border border-gray-600"></textarea>
          <button id="sendBtn" class="cursor-pointer flex items-center gap-2 bg-purple-600 px-3 py-3 rounded-full">
            <svg class="w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 12l16-6m0 0l-6 16m6-16L4 12" />
            </svg>
          </button>
       </div>
       </div>

      <div id="faqModal" class="fixed inset-0 z-50 hidden bg-black/50 backdrop-blur-sm flex items-center justify-center">
        <div class="bg-[#2c2e3e] text-white rounded-lg w-11/12 max-w-lg p-6 shadow-lg transform opacity-0 scale-95 transition-all duration-300">
          <div class="flex justify-between items-center mb-4">
            <h2 class="text-lg font-bold">❓ Pertanyaan Umum (FAQ)</h2>
            <button id="closeFaq" class="text-gray-400 hover:text-white cursor-pointer">
              <svg xmlns="http://www.w3.org/2000/svg" class="lucide lucide-x w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path d="M18 6 6 18"/><path d="M6 6l12 12"/>
              </svg>
            </button>
          </div>
          <div class="text-sm space-y-4 max-h-[70vh] overflow-y-auto pr-2">
            <div>
              <strong>Apa itu L Y Я A?</strong>
              <p>L Y Я A adalah asisten AI interaktif yang bisa bantu kamu cari produk, melakukan checkout, dan tanya-tanya seputar toko online ini.</p>
            </div>
            <div>
              <strong>Bagaimana cara belanja?</strong>
              <p>Kamu bisa klik produk di sidebar atau ketik nama produk di chat. Lalu tambahkan ke keranjang dan ketik <code>checkout</code>.</p>
            </div>
            <div>
              <strong>Apa bisa bayar langsung?</strong>
              <p>Ya! Setelah checkout, kamu bisa bayar lewat Midtrans atau Xendit melalui tautan pembayaran yang muncul di chat.</p>
            </div>
            <div>
              <strong>Batasan user gratis?</strong>
              <p>User anonim bisa chat maksimal 10x. Login untuk akses lebih banyak fitur!</p>
            </div>
            <div>
              <strong>Data saya aman?</strong>
              <p>Tentu! Data kamu tidak akan disalahgunakan. Kami hanya menyimpan informasi yang diperlukan untuk proses transaksi.</p>
            </div>
          </div>
        </div>
      </div>
      <div id="product-modal" class="fixed inset-0 z-50 hide  bg-black/50 backdrop-blur-sm flex items-center justify-center">
        <div id="modal-content" class="bg-[#2a2c3b] opacity-0 scale-95 relative rounded-2xl w-full max-w-xl mx-4 md:mx-auto md:w-[600px] overflow-hidden shadow-lg transition-all">
          <button id="modal-close" class="absolute cursor-pointer top-2 right-4 text-red-800 text-4xl">&times;</button>
          <div class="flex flex-col md:flex-row">
            <img id="modal-image" src="" alt="Produk" class="w-full md:w-1/2 h-64 object-cover">
            <div class="p-4 flex flex-col gap-2" style="
                width: -webkit-fill-available;
            ">
            <div class="flex justify-between items-center-safe">
              <h3 id="modal-title" class="text-xl font-bold"></h3>
              <p class="text-sm text-yellow-400 md:mr-8 mr-0">⭐ <span id="modal-rating"></span></p>
              </div>
              <p class="text-sm text-amber-50">Terjual: <span id="modal-sold"></span></p>
              <p id="modal-price" class="text-lg font-semibold text-green-600 mt-2"></p>
              <button id="buy-button" class="mt-auto cursor-pointer bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition">
                Beli Sekarang
              </button>
            </div>
          </div>
        </div>
      </div>

      <div id="cheatsheet-modal" class="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm hidden items-center justify-center">
        <div class="bg-[#2c2e3e] rounded-lg max-w-md w-11/12 p-6 shadow-lg transform opacity-0 scale-95 transition-all duration-300" id="cheatsheet-content">
          <div class="flex justify-between items-center mb-4">
            <h2 class="text-lg font-bold">📘 Cheatsheet L Y Я A</h2>
            <button id="closeCheatsheet" class="text-gray-400 cursor-pointer hover:text-white">
              <svg xmlns="http://www.w3.org/2000/svg" class="lucide lucide-x w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M18 6 6 18" /><path d="m6 6 12 12" />
              </svg>
            </button>
          </div>
          <ul class="space-y-2 text-sm text-gray-300 list-disc list-inside max-h-[80vh] overflow-y-auto pr-2">
            <li><code>ada produk apa</code> – tampilkan semua produk</li>
            <li><code>minta best seller</code> – tampilkan produk terlaris</li>
            <li><code>rekomendasi dong</code> – minta rekomendasi</li>
            <li><code>lihat keranjang</code> – tampilkan isi keranjang</li>
            <li><code>hapus (nama produk)</code> – hapus item keranjang</li>
            <li><code>Nama: ...</code> – kirim data checkout <strong>(onworking)</strong></li>
            <li><code>aku mau bayar</code> – Snap midtrans <strong>(onworking)</strong></li>
            <li><code>kamu siapa?</code> – kenalan sama L Y Я A 😄</li>
            <li><code>motto kamu apa</code> – tanya motto hidup LYRA</li>
            <li><code>apa itu LYRA?</code> – tanya tentang L Y Я A</li>
            <li><code>ini toko apa?</code> – tanya tentang toko ini</li>
            <li>Dan masih banyak lagi! Coba aja tanya, L Y Я A siap bantu! 😊</li>
          </ul>
            <p class="text-center"><small>L Y Я A bisa salah. Silakan verifikasi info penting.</small></p>
        </div>
      </div>

      <div id="loginModal" class="fixed hide inset-0 bg-black/70 z-50 flex justify-center items-center">
        <div class="bg-[#2a2c3b] text-white p-6 rounded-xl w-[90%] max-w-md text-center shadow-lg border border-purple-500">
          <h3 class="text-lg font-bold mb-2">Maaf, kamu sudah mencapai batas chat gratis.</h3>
          <p class="mb-4">Yuk login untuk akses lebih lanjut!</p>
          <button id="modalLoginBtn" class="bg-purple-600 px-4 py-2 cursor-pointer rounded-full">Login dengan Google</button>
        </div>
      </div>
      <div id="globalAlert" class="fixed top-4 right-4 z-[1000] hidden px-4 py-3 rounded-lg text-sm font-medium transition-all duration-300 shadow-lg"></div>
    </div>
  `;
}

function globalAlert(msg) {
  const alert = document.createElement('div');
  alert.className = `
    fixed bottom-4 left-4 bg-green-600 text-white 
    px-4 py-2 rounded shadow-lg z-50 animate-fade-in
  `;
  alert.textContent = msg;

  document.body.appendChild(alert);

  setTimeout(() => {
    alert.classList.add('opacity-0');
    setTimeout(() => alert.remove(), 500);
  }, 2500);
}

function showGlobalAlert(message, type = 'info') {
  const alertBox = document.getElementById('globalAlert');
  if (!alertBox) return;

  alertBox.textContent = message;
  alertBox.className = 'fixed top-4 right-4 z-[1000] px-4 py-3 rounded-lg text-sm font-medium transition-all duration-300 shadow-lg';

  switch (type) {
    case 'success':
      alertBox.classList.add('bg-green-500', 'text-white');
      break;
    case 'error':
      alertBox.classList.add('bg-red-500', 'text-white');
      break;
    case 'warning':
      alertBox.classList.add('bg-yellow-400', 'text-black');
      break;
    default:
      alertBox.classList.add('bg-gray-800', 'text-white');
  }

  alertBox.classList.remove('hidden');

  setTimeout(() => {
    alertBox.classList.add('opacity-0');
    setTimeout(() => {
      alertBox.classList.add('hidden');
      alertBox.classList.remove('opacity-0');
    }, 300);
  }, 3000);
}

async function handleRequest(prompt) {
  showTypingBubble();
  showTypingHeader();

  try {
    const res = await fetch(`${groqKey}`, {
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
const textarea = document.getElementById('chatInput');
if (textarea) {
  textarea.setAttribute('style', 'height:' + (textarea.scrollHeight) + 'px;overflow-y:hidden;');
  textarea.addEventListener('input', autoResize, false);
}

function autoResize() {
  this.style.height = 'auto';
  this.style.height = this.scrollHeight + 'px';
}
