import { getFirestore, collection, getDoc, getDocs, doc, updateDoc, increment, setDoc } from 'firebase/firestore';
import { getAuth } from "firebase/auth";
import { detectIntentAndRespond, detectCategoryIntent, generateCategoryResponse, generatePersonaResponse, generateTone } from '../modules/intentHandler.js';
import {
  appendMessage,
  showTypingBubble,
  removeTypingBubble,
  showTypingHeader,
  hideTypingHeader,
  showVoiceNoteHeader,
  hideVoiceNoteHeader } from '../modules/chatRenderer.js';
import { safeRenderHTML, attachProductModalTriggers } from '../modules//htmlRenderer.js';
import { initAuth, getCurrentUID, onLoginStateChanged, login } from '../modules/authHandler.js';
import { showLimitModal, hideLimitModal } from '../modules/limitModal.js';
import { cartManager} from '../modules/CartManager.js';
import { startCheckout, handleCheckoutInput } from '../modules/checkoutHandler.js';
import { logout } from '../modules/authHandler.js';

const MODES = ['jualan', 'friendly', 'formal', 'genz'];
let modeLYRA = localStorage.getItem('modeLYRA') || 'jualan';
let modeIndex = MODES.indexOf(modeLYRA);

let PRODUCT_LIST = [];
let chatCount = 0;
const LIMIT = 10;
const groqKey = import.meta.env.VITE_GROQ_API_KEY;
const db = getFirestore();
const auth = getAuth();


function getGreetingByTime(mode = 'default') {
  const now = new Date();
  const hour = now.getHours();
  if (hour >= 4 && hour < 11) return '🌞 Selamat pagi';
  if (hour >= 11 && hour < 15) return '☀️ Selamat siang';
  if (hour >= 15 && hour < 18) return '🌇 Selamat sore';
  if (hour >= 18 && hour < 4) return '🌙 Selamat malam';
  const time = hour < 11 ? 'pagi' : hour < 15 ? 'siang' : hour < 18 ? 'sore' : 'malam';

  const greetings = {
    jualan: [
      `Selamat ${time}! Siap belanja hemat bareng LYRA? 🛒`,
      `Halo! Mau cari promo apa hari ini? ✨`,
      `Waktunya belanja cerdas bareng aku~`
    ],
    formal: [
      `Selamat ${time}. Ada yang bisa saya bantu?`,
      `Hai, terima kasih telah berkunjung. Saya siap membantu.`,
      `Salam hormat. LYRA di sini untuk membantu Anda.`
    ],
    genz: [
      `Yoo selamat ${time} gengs 😎`,
      `Halo bestie~ Mau beli apa hari ini? 💅`,
      `Ayo gaskeun belanja! Jangan banyak mikir 💸`
    ],
    default: [
      `Selamat ${time}! 👋`,
      `Hai, ada yang bisa aku bantu hari ini? 😊`,
      `Halo! Mau cari apa nih?`
    ]
  };

  const selected = greetings[mode] || greetings.default;
  return selected[Math.floor(Math.random() * selected.length)];
}

function updateModeLabel() {
  const label = document.getElementById('modeLabel');
  if (label) {
    label.textContent = modeLYRA.charAt(0).toUpperCase() + modeLYRA.slice(1);
  }
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

function autoResize() {
  this.style.height = 'auto';
  this.style.height = this.scrollHeight + 'px';
}

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
  const responses = [];
  if (product.tags?.includes('gratis-ongkir')) {
    responses.push(`Khusus hari ini, ${product.name} bebas ongkir loh! 😍`);
  }
  const templates = [
    `kamu pengen ${product.name} ini, ini salah satu andalan, harganya ${priceFormatted} aja.`,
    `Kamu pasti suka ${product.name}, dan kabar baiknya: cuma ${priceFormatted}!`,
    `Harga ${product.name}? ${priceFormatted}. Worth it banget untuk rasanya!`,
    `Mau yang bikin anget? ${product.name} jawabannya. Harga: ${priceFormatted}.`,
  ];
  return (responses.length > 0 ? responses[0] : templates[Math.floor(Math.random() * templates.length)]);
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

function openProductModal(product) {
  document.getElementById('modal-image').src = product.img || '/default.jpg';
  document.getElementById('modal-title').textContent = product.name;
  document.getElementById('modal-description').textContent = product.description || 'Deskripsi tidak tersedia';
  document.getElementById('modal-rating').textContent = product.rating;
  document.getElementById('modal-sold').textContent = product.sold;
  document.getElementById('modal-price').textContent = `Rp ${product.price.toLocaleString()}`;
  document.getElementById('buy-button').dataset.slug = product.slug;
  const modal = document.getElementById('product-modal');
  const modalContent = document.getElementById('modal-content');
  modal.classList.remove('hide');
  setTimeout(() => {
    modalContent.classList.remove('opacity-0', 'scale-95');
    modalContent.classList.add('opacity-100', 'scale-100');
  }, 10);
}

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

function respondWithTyping({ 
  sender = 'lyra', 
  text = '', 
  html = null, 
  product = null, 
  replyTo = null, 
  voiceOnly = false, 
  voice = '', 
  speakOnly = false 
}) {
  if (speakOnly && voice) {
    const utter = new SpeechSynthesisUtterance(voice);
    utter.lang = 'id-ID';
    speechSynthesis.speak(utter);
    return;
  }

  showTypingBubble();
  showTypingHeader(voiceOnly ? 'voice' : 'mengetik');

  setTimeout(() => {
    if (voiceOnly && voice) {
  showVoiceNoteHeader();
      appendMessage({
        sender,
        voiceOnly: true,
        voice
      });
    hideVoiceNoteHeader();
      const utter = new SpeechSynthesisUtterance(voice);
      utter.lang = 'id-ID';
      speechSynthesis.speak(utter);
    } else {
      appendMessage({ sender, text, product, replyTo, html, voiceOnly, speakOnly, voice });
    }

    removeTypingBubble();
    hideTypingHeader();
  }, 1000 + Math.random() * 400);
}

async function loadProductList() {
  const db = getFirestore();
  const snapshot = await getDocs(collection(db, 'products'));
  PRODUCT_LIST = snapshot.docs.map(doc => doc.data());
}

function generateProfileCard(user) {
  const foto = user.foto || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(user.nama);
  const nama = user.nama || 'Pengguna';
  const email = user.email || '-';
  const wa = user.no_wa || '-';
  const bergabung = new Date(user.bergabung).toLocaleDateString('id-ID');
  const totalOrder = user.total_order || 0;
  const lastOrder = user.last_order ? new Date(user.last_order).toLocaleDateString('id-ID') : '-';

  return `
    <div class="bg-[#2e2e3e] border border-purple-500 p-4 rounded-xl w-full max-w-xs text-white shadow-md">
      <div class="flex items-center gap-3">
        <img src="${foto}" class="w-12 h-12 rounded-full border border-white" />
        <div>
          <h4 class="font-semibold">${nama}</h4>
          <p class="text-sm text-gray-300">${email}</p>
        </div>
      </div>
      <div class="mt-3 text-sm leading-relaxed">
        📱 WA: ${wa}<br />
        🧾 Total Order: ${totalOrder}<br />
        🕓 Terakhir Order: ${lastOrder}<br />
        📅 Bergabung: ${bergabung}
      </div>
    </div>
  `;
}

let hasWelcomed = false;

async function sendWelcomeMessage(user) {
  if (hasWelcomed) return;
  hasWelcomed = true;
  const greeting = getGreetingByTime(modeLYRA);
  const name = user?.displayName || 'teman';
  const welcomeTexts = [
    `${greeting}, ${name}! Aku LYRA 😉`,
    `${greeting}, ${name}! Lyra siap bantu kamu cari produk kece hari ini. 😎`,
    `Halo ${name}, ${greeting}! Aku LYRA — asisten AI kamu di sini.`,
    `${greeting} ${name}! Yuk, mulai eksplor produk bareng aku. 🛍️`,
  ];
  const randomText = welcomeTexts[Math.floor(Math.random() * welcomeTexts.length)];
  respondWithTyping({ sender: 'lyra',  voiceOnly: true,  speakOnly: false, voice: `${randomText}` });
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
      text: `Coba klik produk di sidebar atau langsung ketik "minta katalog nya" ke LYЯA. Tanya apapun, ${name}. Aku standby! 🚀 Mau lihat profile kamu, ketik aja "akun saya" 😉`,
    });
  }, 1200);
}

function renderProductGridInChat(products) {
  const html = `
    <div class=\"w-full max-w-3xl md:max-w-4xl grid grid-cols-2 md:grid-cols-3 gap-3 mx-auto animate-fade-in\">
      ${products.map(p => `
        <div class="bg-gray-700 border border-cyan-400 rounded-lg p-2 text-white text-xs flex flex-col gap-1">
          <img src="${p.img}" alt="${p.name}" class="w-full h-40 md:h-52 object-cover rounded cursor-pointer open-product-image" data-slug="${p.slug}" />
          <div class="font-semibold">${p.name}</div>
          <div class="text-yellow-300">Rp ${p.price.toLocaleString('id-ID')}</div>
          <button class="cursor-pointer mt-1 bg-blue-600 text-white text-xs py-1 rounded add-to-cart-btn" data-slug="${p.slug}">+ Keranjang</button>
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
    document.querySelectorAll('.add-to-cart-btn').forEach(btn => {
      if (btn.dataset.bound) return;
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

async function loadUserProfile() {
  const uid = getCurrentUID(); // pastikan fungsi ini tersedia dan benar
  if (!uid) {
    respondWithTyping({ voiceOnly: true, voice: 'Kamu belum login 😅 yuk login dulu supaya bisa berbelanja.' });
    return;
  }

  try {
    const db = getFirestore();
    const docRef = doc(db, 'users', uid);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      respondWithTyping({ voiceOnly: true, voice: 'Profil belum tersedia 😔' });
      return;
    }

    const data = docSnap.data(); // ✅ gunakan 'data' bukan 'user'

    const html = `
          <div class="relative bg-gradient-to-br from-[#262837] to-[#1d1f2b] border border-purple-700 p-5 rounded-2xl shadow-lg w-full max-w-xs text-white backdrop-blur-sm overflow-hidden">
            <div class="flex items-center gap-3 mb-4">
              <img src="https://api.dicebear.com/7.x/thumbs/svg?seed=android" alt="Avatar" class="w-14 h-14 rounded-full border-2 border-purple-600" />
              <div>
                <div class="font-bold text-lg">${data.nama || 'Tanpa Nama'}</div>
                <div class="text-sm text-gray-300">${data.email || '-'}</div>
              </div>
            </div>

            <div class="space-y-2 text-sm">
              <div class="flex justify-between items-center">
                <span>🛒 Total Order</span>
                <span class="font-semibold text-green-400">${data.totalOrder || 0}</span>
              </div>
              <div class="flex justify-between items-center">
                <span>🏅 Level</span>
                <span class="font-semibold text-yellow-300">${data.level || 'Pengguna'}</span>
              </div>
            </div>

            <div class="absolute -top-2 -right-2 bg-purple-600 px-3 py-1 text-xs rounded-bl-2xl font-semibold tracking-wider">
              PREMIUM
            </div>
          </div>
    `;

    respondWithTyping({ html });

  } catch (err) {
    console.error('loadUserProfile error:', err);
    respondWithTyping({ text: 'Ups! Gagal menampilkan profil 😓' });
  }
}

document.getElementById('openProfileBtn')?.addEventListener('click', () => {
  loadUserProfile();
});

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

    onLoginStateChanged(async (user) => {
      const db = getFirestore();

      if (user && loginBtn) {
        const name = user.displayName?.split(' ')[0] ?? user.email?.split('@')[0] ?? 'User';
        loginBtn.textContent = `Halo, ${name}`;
        loginBtn.disabled = true;
        logoutBtn?.classList.remove('hidden');
        hideLimitModal();

        // ⛳ Cek & Simpan user ke Firestore kalau belum ada
        const userRef = doc(db, 'users', user.uid);
        const snap = await getDoc(userRef);
        if (!snap.exists()) {
          await setDoc(userRef, {
            uid: user.uid,
            nama: user.displayName ?? name,
            email: user.email ?? '-',
            totalOrder: 0,
            level: 'Member',
            createdAt: new Date()
          });
          console.log('✅ User baru dibuat di Firestore');
        }

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

      const lower = text.toLowerCase();
      const isTechQuery = /bisa\s(apa|ngapain)|kendali|iot|smarthome|otomatis|sistem|terhubung/.test(lower);

      if (isTechQuery) {
        setTimeout(() => {
          respondWithTyping({
            sender: 'lyra',
            voice: 'Saya bisa segalanya... Jika kamu punya IoT, kamu tinggal sambungkan saja saya ke sistem IoT kamu, perintahkan saya untuk nyalain mesin mobil, matikan lampu, atau sebaliknya, saya selalu siap, tapi saat ini saya sedang dalam proses pengembangan oleh kedua atasan saya. 🔌🤖',
            voiceOnly: true
          });
        }, 1200);
        return;
      }

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
            respondWithTyping({ sender: 'lyra', text: `Oke, aku hapus ${removed.name} dari keranjang.` });
          } else {
            respondWithTyping({ sender: 'lyra', text: `Item nomor ${index + 1} nggak ditemukan di keranjang.` });
          }
      } else {
          const match = PRODUCT_LIST.find(p => p.name.toLowerCase().includes(keyword));
          if (match) {
            cartManager.removeBySlug(match.slug);
            respondWithTyping({ sender: 'lyra', text: `Item "${match.name}" sudah dihapus dari keranjang.` });
          } else {
            respondWithTyping({ sender: 'lyra', text: `Item "${keyword}" nggak aku temuin di keranjang.` });
          }
        }
        return;
      }
      if (/profil|siapa aku|akun saya|user profile/i.test(text)) {
        respondWithTyping({ sender: 'lyra', text: 'ini, aku tampilkan profil kamu 😊' });
        loadUserProfile();
        return;
      }
      // 💰 Checkout
      const { isEmpty } = cartManager.getCartSummary();
      if (/checkout|bayar/i.test(text)) {
        if (isEmpty) {
          respondWithTyping({
            sender: 'lyra',
            voiceOnly: true,
            voice: `Keranjang nya kosong, nggak bisa checkout dulu. 😅 Silahkan ketik katalog untuk menampilkan semua produk di toko kami.`,
          });
          showGlobalAlert('Keranjang kosong, nggak bisa checkout dulu 😅', 'error');
          return;
        }
        return startCheckout(cartManager.items);
      }

      // 📦 Semua produk
      if (/produk apa|punya apa|katalog|jual apa|semua produk|lihat semua|katalog lengkap|catalog/i.test(text)) {
          setTimeout(() => {
            renderProductGridInChat(PRODUCT_LIST);
          }, 400 + Math.random() * 200);

          showTypingBubble();
          showVoiceNoteHeader();
          setTimeout(() => {
            appendMessage({ sender: 'lyra', voiceOnly: true, voice: 'Ini kak, semua produk yang ada di toko aku, klik tombol tambah keranjang ya untuk berbelanja. dan ketik checkout jika sudah siap untuk membayar.', replyTo: text });
            removeTypingBubble();
            hideVoiceNoteHeader();
          }, 1200 + Math.random() * 600);
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
          handleRequest(text, safeRenderHTML); // fallback ke GPT
        }
      }
    }

    logoutBtn?.addEventListener('click', async () => {
      await logout();
      window.location.href = '/';
    });

const cartBtn = document.getElementById('cartBtn');
const typingStatus = document.getElementById('typingStatus');


function setLyraStatus(text = '') {
  const statusEl = document.getElementById('lyraClock');
  if (statusEl) {
    const now = new Date();
    const h = now.getHours().toString().padStart(2, '0');
    const m = now.getMinutes().toString().padStart(2, '0');
    statusEl.innerHTML = `<svg class="w-3 h-3" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-clock3-icon lucide-clock-3"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16.5 12"/></svg> ${h}:${m} ${text}`;
    statusEl.classList.remove('hidden');
  }
}
setLyraStatus('sedang aktif memantau...');

cartBtn?.addEventListener('click', () => {
  const { isEmpty, cartList, total } = cartManager.getCartSummary();

  if (isEmpty) {
    globalAlert('Keranjang masih kosong');

    setTimeout(() => {
      showTypingBubble();
      showTypingHeader();
      showVoiceNoteHeader();

      setTimeout(() => {
        appendMessage({ 
          sender: 'lyra',
          voiceOnly: true,
          voice: 'Keranjangmu masih kosong nih. Yuk pilih produk dulu!' 
        });

        removeTypingBubble();
        hideTypingHeader();
        hideVoiceNoteHeader();
      }, 800 + Math.random() * 400);
    }, 10);

    return;
  }

  setTimeout(() => {
    showTypingBubble();
    showTypingHeader();
    showVoiceNoteHeader();

    setTimeout(() => {
      appendMessage({
        sender: 'lyra',
        text: `Isi keranjang kamu:\n${cartList}\n\nTotal: Rp ${total.toLocaleString('id-ID')}`
      });

      removeTypingBubble();
      hideTypingHeader();
      hideVoiceNoteHeader();
    }, 800 + Math.random() * 400);
  }, 10);
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

document.getElementById('openFaq')?.addEventListener('click', () => {
  const modal = document.getElementById('faqModal');
  modal.classList.remove('hide');
  setTimeout(() => {
    modal.querySelector('div').classList.remove('opacity-0', 'scale-95');
  }, 50);
});

document.getElementById('closeFaq')?.addEventListener('click', () => {
  const modal = document.getElementById('faqModal');
  modal.querySelector('div').classList.add('opacity-0', 'scale-95');
  setTimeout(() => {
    modal.classList.add('hide');
  }, 300);
});

document.getElementById('modal-close')?.addEventListener('click', () => {
  const modal = document.getElementById('product-modal');
  modal.querySelector('div').classList.add('opacity-0', 'scale-95');
  setTimeout(() => {
    modal.classList.add('hide');
  }, 300);
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
            <button id="openSettings" onclick="location.href='/under-construction'" class="cursor-pointer flex items-center gap-2 w-full text-left text-sm px-3 py-2 hover:bg-gray-700 rounded-lg transition">
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
                <div class="text-xs text-gray-400 opacity-80"><span id="lyraClock" class="flex justify-items-start items-center-safe">--:--</span> <span id="typingStatus" class="hidden">sedang mengetik...</span></div>
                <div id="voiceNoteStatus" class="text-xs text-gray-400 hidden">sedang mengirim voice note...</div>
              </div>
            </div>
            <button id="cartBtn" class="relative cursor-pointer text-sm bg-transparent text-white px-3 py-3 rounded">
              <svg class="w-5 h-5" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-shopping-cart-icon lucide-shopping-cart"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></svg>
              <span id="cartQtyBadge" class="absolute -top-0 -right-0 bg-red-600 text-white text-[10px] px-1.5 py-0.5 rounded-full hidden">0</span>
            </button>
          </div>

          <div id="chatBox" class="flex-1 overflow-y-auto p-4 space-y-3 flex flex-col min-h-0 scrollbar-none"></div>
          <div class="text-xs text-gray-400 text-center px-4 py-2">
            <em><strong>L Y Я A</strong> is still learning. Verify any important information you receive.</em>
          </div>
          <!-- Profil User Card -->
          <div id="userProfileCard" class="hidden relative bg-gradient-to-br from-[#262837] to-[#1d1f2b] border border-purple-700 p-5 rounded-2xl shadow-lg w-full max-w-xs text-white backdrop-blur-sm overflow-hidden">
            <div class="flex items-center gap-3 mb-4">
              <img src="https://api.dicebear.com/7.x/thumbs/svg?seed=android" alt="Avatar" class="w-14 h-14 rounded-full border-2 border-purple-600" />
              <div>
                <div class="font-bold text-lg">Android Butut</div>
                <div class="text-sm text-gray-300">@androidbutut@gmail.com</div>
              </div>
            </div>

            <div class="space-y-2 text-sm">
              <div class="flex justify-between items-center">
                <span>🛒 Total Order</span>
                <span class="font-semibold text-green-400">0</span>
              </div>
              <div class="flex justify-between items-center">
                <span>🏅 Level</span>
                <span class="font-semibold text-yellow-300">Member</span>
              </div>
            </div>

            <div class="absolute -top-2 -right-2 bg-purple-600 px-3 py-1 text-xs rounded-bl-2xl font-semibold tracking-wider">
              PREMIUM
            </div>
          </div>

          <div class="p-4 border-t border-gray-700 flex items-center gap-2 bg-[#2a2c3b]">
          <input id="chatInput" rows="1" placeholder="Tulis / Tanyakan sesuatu..." class="flex-1 bg-[#1d1f2b] text-white p-2 rounded-full focus:outline-none border border-gray-600"></input>
            <button id="sendBtn" class="cursor-pointer flex items-center gap-2 bg-purple-600 px-3 py-3 rounded-full">
              <svg class="w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 12l16-6m0 0l-6 16m6-16L4 12" />
              </svg>
            </button>
         </div>
         </div>
            <div id="faqModal" class="fixed inset-0 z-50 hide bg-black/50 backdrop-blur-sm flex items-center justify-center">
              <div class="bg-[#2c2e3e] text-white rounded-xl w-11/12 max-w-lg px-6 py-5 shadow-2xl transform opacity-0 scale-95 transition-all duration-300 ease-out">
                <div class="flex justify-between items-center mb-5">
                  <h2 class="text-xl font-semibold tracking-wide">❓ Pertanyaan Umum (FAQ)</h2>
                  <button id="closeFaq" class="cursor-pointer text-gray-400 hover:text-white transition-colors duration-200">
                    <svg xmlns="http://www.w3.org/2000/svg" class="lucide lucide-x w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                      <path d="M18 6 6 18"/><path d="M6 6l12 12"/>
                    </svg>
                  </button>
                </div>
                <div class="text-sm space-y-5 max-h-[65vh] overflow-y-auto pr-3 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-transparent">
                  <div>
                    <strong class="text-blue-400">Apa itu L Y Я A?</strong>
                    <p class="text-gray-300">L Y Я A adalah asisten AI interaktif yang bisa bantu kamu cari produk, melakukan checkout, dan tanya-tanya seputar toko online ini.</p>
                  </div>
                  <div>
                    <strong class="text-blue-400">Bagaimana cara belanja?</strong>
                    <p class="text-gray-300">Kamu bisa klik produk di sidebar atau ketik nama produk di chat. Lalu tambahkan ke keranjang dan ketik <code class="text-yellow-300">checkout</code>.</p>
                  </div>
                  <div>
                    <strong class="text-blue-400">Apa bisa bayar langsung?</strong>
                    <p class="text-gray-300">Ya! Setelah checkout, kamu bisa bayar lewat Midtrans atau Xendit melalui tautan pembayaran yang muncul di chat.</p>
                  </div>
                  <div>
                    <strong class="text-blue-400">Batasan user gratis?</strong>
                    <p class="text-gray-300">User anonim bisa chat maksimal 10x. Login untuk akses lebih banyak fitur!</p>
                  </div>
                  <div>
                    <strong class="text-blue-400">Data saya aman?</strong>
                    <p class="text-gray-300">Tentu! Data kamu tidak akan disalahgunakan. Kami hanya menyimpan informasi yang diperlukan untuk proses transaksi.</p>
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
                <p id="modal-description" class="text-sm text-gray-300 mb-2"></p>
                <p class="text-sm text-amber-50">Terjual: <span id="modal-sold"></span></p>
                <p class="text-lg font-semibold text-green-600 mt-2" id="modal-price"></p>
                <button id="buy-button" onclick="alert('under Maintenance! proses pembelian tersedia di katalog, silahkan ketik - minta katalog dong.')" class="mt-auto cursor-pointer bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition add-to-cart-btn">
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
            <ul class="space-y-3 text-sm text-gray-100 list-inside max-h-[80vh] overflow-y-auto pr-3 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-transparent">
              <li class="flex items-start gap-2">
                <span class="mt-1 text-blue-400">⚙️</span>
                <span><code class="text-yellow-300">Kamu bisa apa</code> – pamer keahlian</span>
              </li>
              <li class="flex items-start gap-2">
                <span class="mt-1 text-blue-400">💬</span>
                <span><code class="text-yellow-300">ada produk apa</code> – tampilkan semua produk</span>
              </li>
              <li class="flex items-start gap-2">
                <span class="mt-1 text-blue-400">🔥</span>
                <span><code class="text-yellow-300">minta best seller</code> – tampilkan produk terlaris</span>
              </li>
              <li class="flex items-start gap-2">
                <span class="mt-1 text-blue-400">✨</span>
                <span><code class="text-yellow-300">rekomendasi dong</code> – minta rekomendasi</span>
              </li>
              <li class="flex items-start gap-2">
                <span class="mt-1 text-blue-400">🛒</span>
                <span><code class="text-yellow-300">lihat keranjang</code> – tampilkan isi keranjang</span>
              </li>
              <li class="flex items-start gap-2">
                <span class="mt-1 text-blue-400">❌</span>
                <span><code class="text-yellow-300">hapus (nama-produk)</code> – hapus item keranjang</span>
              </li>
              <li class="flex items-start gap-2">
                <span class="mt-1 text-green-400">✅</span>
                <span><code class="text-yellow-300">checkout dong</code> – kirim data checkout <strong class="text-green-400">(DONE)</strong></span>
              </li>
              <li class="flex items-start gap-2">
                <span class="mt-1 text-green-400">💳</span>
                <span><code class="text-yellow-300">aku mau bayar</code> – XENDIT <strong class="text-green-400">(DONE)</strong></span>
              </li>
              <li class="flex items-start gap-2">
                <span class="mt-1 text-blue-400">🤖</span>
                <span><code class="text-yellow-300">kamu siapa?</code> – kenalan sama L Y Я A 😄</span>
              </li>
              <li class="flex items-start gap-2">
                <span class="mt-1 text-blue-400">💡</span>
                <span><code class="text-yellow-300">motto kamu apa</code> – tanya motto hidup LYRA</span>
              </li>
              <li class="flex items-start gap-2">
                <span class="mt-1 text-blue-400">📘</span>
                <span><code class="text-yellow-300">apa itu LYRA?</code> – tanya tentang L Y Я A</span>
              </li>
              <li class="flex items-start gap-2">
                <span class="mt-1 text-blue-400">🏪</span>
                <span><code class="text-yellow-300">ini toko apa?</code> – tanya tentang toko ini</span>
              </li>
              <li class="flex items-start gap-2">
                <span class="mt-1 text-purple-400">🌟</span>
                <span>Dan masih banyak lagi! Coba aja tanya, L Y Я A siap bantu!</span>
              </li>
            </ul>
              <p class="text-center mt-4"><small>L Y Я A bisa saja salah. Silakan verifikasi info penting.</small></p>
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
