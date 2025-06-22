import { getFirestore, collection, addDoc, serverTimestamp, doc, setDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { initializeApp } from 'firebase/app';
import { initAuth, getCurrentUID, onLoginStateChanged, login } from '../modules/authHandler.js';
import { 
  appendMessage,
  showTypingBubble,
  removeTypingBubble,
  showTypingHeader,
  hideTypingHeader 
} from './chatRenderer.js';


const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const auth = getAuth();
const db = getFirestore(app);

const user = auth.currentUser;
const uid = user?.uid; // fallback guest

let checkoutStep = 0;
let checkoutData = {};

function respondWithTyping({ text, product = null, voiceOnly = false, replyTo = null, html = null }) {
  showTypingBubble();
  showTypingHeader();
  setTimeout(() => {
    appendMessage({ sender: 'lyra', text, product, replyTo, html, voiceOnly });
    removeTypingBubble();
    hideTypingHeader();
  }, 1000 + Math.random() * 400);
}

export function startCheckout(cart) {
  const uid = getCurrentUID(); // ambil UID saat fungsi dipanggil

  if (!uid || uid === 'guest') {
    respondWithTyping({ 
      sender: 'lyra', 
      voiceOnly: true, 
      text: 'Kamu belum login, silakan login dulu kawan 😅' 
    });
    return;
  }

  if (!cart || cart.length === 0) {
    respondWithTyping({ 
      sender: 'lyra', 
      voiceOnly: true, 
      voice: 'Keranjang kamu masih kosong nih 😅 Tambah dulu yuk!' 
    });
    return;
  }
  const user = JSON.parse(localStorage.getItem('user')) || {};
  const nama = user.displayName || 'kamu';
  const mode = localStorage.getItem('modeLYRA') || 'default';

  let greeting = '';

  switch (mode) {
    case 'jualan':
      greeting = `Hai ${nama}, yuk isi data buat aku proses pesanan kamu. Siap? (ya/tidak) 😄`;
      break;
    case 'genz':
      greeting = `Yo ${nama}, gas checkout sekarang yuk. Kamu ready? (ya/tidak) 😏`;
      break;
    case 'formal':
      greeting = `Selamat datang, ${nama}. Apakah Anda siap melanjutkan proses checkout? (ya/tidak)`;
      break;
    default:
      greeting = `Halo ${nama}, kita mulai proses checkout ya? Siap? (ya/tidak)`;
  }

  respondWithTyping({ sender: 'lyra', text: greeting });

  // ⏳ Set mode menunggu konfirmasi
  window.awaitingCheckoutConfirmation = true;

  // Simpan nama kalau sudah ada
  checkoutData = {
    nama: nama !== 'kamu' ? nama : ''
  };
}

export async function handleCheckoutInput(text, cartItems) {
if (window.awaitingCheckoutConfirmation) {
  if (/^(ya|siap|oke|yuk)$/i.test(text.trim())) {
    checkoutStep = checkoutData.nama ? 2 : 1;
    respondWithTyping({ sender: 'lyra', text: `Sip, nama kamu ${checkoutData.nama}. Sekarang, nomor WA aktif kamu dong?` });
    window.awaitingCheckoutConfirmation = false;
    return true;
  } else if (/^(tidak|ga|engga|batal)$/i.test(text.trim())) {
    respondWithTyping({ sender: 'lyra', text: 'Oke deh, kapan-kapan aja ya belanjanya 🙈' });
    checkoutStep = 0;
    checkoutData = {};
    window.awaitingCheckoutConfirmation = false;
    return true;
  } else {
    respondWithTyping({ sender: 'lyra', text: 'Jawabannya "ya" atau "tidak" dulu ya, biar aku tahu harus lanjut atau engga 😊' });
    return true;
  }
}
  if (checkoutStep === 0) return false;

  if (checkoutStep === 1) {
    checkoutData.nama = text;
    respondWithTyping({ sender: 'lyra', text: `Sip, nama kamu ${text}. Sekarang, nomor WA aktif kamu dong?` });
    checkoutStep = 2;
    return true;
  }

  if (checkoutStep === 2) {
    checkoutData.no_wa = text;
    respondWithTyping({ sender: 'lyra', text: `Oke, sekarang alamat lengkap kamu ya?` });
    checkoutStep = 3;
    return true;
  }

  if (checkoutStep === 3) {
    checkoutData.alamat = text;
    respondWithTyping({ sender: 'lyra', text: `Kurir yang kamu mau? (JNE, J&T, Sicepat, dll)` });
    checkoutStep = 4;
    return true;
  }

  if (checkoutStep === 4) {
    checkoutData.kurir = text;
    respondWithTyping({ sender: 'lyra', text: `Catatan tambahan sebelum checkout? Kalau nggak ada, ketik "-".` });
    checkoutStep = 5;
    return true;
  }

  if (checkoutStep === 5) {
    checkoutData.catatan = text;
    respondWithTyping({
      text: `Berikut datanya:\n\n📛 Nama: ${checkoutData.nama}\n📱 WA: ${checkoutData.no_wa}\n🏠 Alamat: ${checkoutData.alamat}\n🚚 Kurir: ${checkoutData.kurir}\n📝 Catatan: ${checkoutData.catatan}\n\nKetik *lanjut* untuk bayar atau *ulang* untuk edit.`
    });
    if (!checkoutData.nama || !checkoutData.no_wa || !checkoutData.alamat || !checkoutData.kurir) {
  respondWithTyping({ text: 'Data checkout belum lengkap, tolong isi dengan benar ya!' });
  return;
  }
    checkoutStep = 6;
    return true;
  }

  if (checkoutStep === 6) {
    if (/ulang/i.test(text)) {
      respondWithTyping({ text: 'Oke, ulang dari awal ya. Nama kamu siapa?' });
      checkoutStep = 1;
      checkoutData = {};
      return true;
    }

// PATCH di bagian "lanjut" checkout step
if (/lanjut/i.test(text)) {
  respondWithTyping({ text: 'Siap! mohon tunggu, Aku proses ke Xendit dulu ya...' });

  try {
    const uid = localStorage.getItem('uid') || 'guest';
    const orderId = `order_${Date.now()}`; // 👉 kita generate orderId dulu

    // Kirim ke Worker/Xendit dengan orderId ini
const res = await fetch('https://weathered-pond-49ef.cbp629tmm2.workers.dev/', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ user: checkoutData, cart: cartItems, order_id: orderId })
});

const resultText = await res.text();
console.log('Respon worker kedua:', resultText);

let json;
try {
  json = JSON.parse(resultText);
} catch (e) {
  console.error('Gagal parsing JSON dari worker:', e);
  respondWithTyping({ text: 'Gagal memproses order: format tidak valid.' });
  return true;
}

if (!json.invoice_url) {
  respondWithTyping({ text: 'Xendit tidak memberikan tautan pembayaran 😥. Coba lagi ya.' });
  return true;
}

console.log("Menyimpan order:", orderId, "uid:", uid);
console.log('Order berhasil disimpan ke Firestore.');
    // ✅ Simpan ke Firestore → konsisten dengan order_id yang kita kirim ke Xendit
    const orderRef = doc(db, "users", uid, "orders", orderId);
    await setDoc(orderRef, {
      user: checkoutData,
      cart: cartItems,
      order_id: orderId,
      status: 'waiting',
      createdAt: new Date()
    });

    // ✅ Simpan juga ke global backup
    const globalRef = doc(db, "checkout", orderId);
    await setDoc(globalRef, {
      userId: uid,
      user: checkoutData,
      cart: cartItems,
      order_id: orderId,
      status: 'waiting',
      createdAt: new Date()
    });

    console.log("Menyimpan order:", orderId, "uid:", uid);
    console.log("Order berhasil disimpan ke Firestore.");

    // ✅ Tampilkan bubble + tombol bayar
    setTimeout(() => {
      if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
      const sound = document.getElementById('notifSound');
      sound?.play().catch(() => {});

      const bubble = document.createElement('div');
      bubble.className = `relative max-w-sm px-4 py-3 rounded-2xl bg-[#2c2e3e] text-white animate-bounce-in-slow shadow-lg`;
      const totalHarga = Object.values(cartItems).reduce((sum, item) => sum + (item.price * item.qty), 0);
      const itemList = Object.values(cartItems).map((item, i) => {
        return `${i + 1}. ${item.name} x${item.qty} - Rp ${item.price * item.qty}`;
      }).join('<br>');

      bubble.innerHTML = `
        <div class="leading-relaxed text-sm">
          <div class="mb-2">
            <strong>🧾 Rincian Pesanan:</strong><br>
            ${itemList}
          </div>
          <div class="mb-2">
            <strong>Total:</strong> Rp ${totalHarga.toLocaleString()}<br>
            <span class="text-yellow-400 italic text-xs">*Belum termasuk ongkir</span>
          </div>
          <a href="${json.invoice_url}" target="_blank"
            class="inline-block mt-2 px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition">
            💳 Lanjut Bayar via Xendit
          </a>
        </div>
      `;

      const wrapper = document.createElement('div');
      wrapper.className = 'flex flex-col self-start mb-2';
      wrapper.appendChild(bubble);
      document.getElementById('chatBox').appendChild(wrapper);

      respondWithTyping({
        sender: 'lyra',
        text: 'Checkout berhasil! 🎉 Silakan klik tombol bayar di atas, dan order kamu langsung aku proses 🚀'
      });
    }, 800);

    checkoutStep = 0;
    checkoutData = {};
    return true;

  } catch (err) {
    console.error('Checkout Error:', err);
    respondWithTyping({ text: 'Waduh! Ada masalah saat proses checkout. Coba lagi sebentar ya 🙏' });
    return true;
  }
}

    respondWithTyping({ text: 'Tolong ketik *lanjut* atau *ulang* ya!' });
    return true;
  }

  return false;
}
