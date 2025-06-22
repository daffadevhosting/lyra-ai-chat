import { getFirestore, collection, addDoc, serverTimestamp, doc, setDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { initializeApp } from 'firebase/app';
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
localStorage.setItem('uid', uid); // disimpan

let checkoutStep = 0;
let checkoutData = {};

function respondWithTyping({ text, product = null, replyTo = null, html = null }) {
  showTypingBubble();
  showTypingHeader();
  setTimeout(() => {
    appendMessage({ sender: 'lyra', text, product, replyTo, html });
    removeTypingBubble();
    hideTypingHeader();
  }, 1000 + Math.random() * 400);
}

export function startCheckout(cart) {
  if (!cart || cart.length === 0) {
    respondWithTyping({ text: 'Keranjang kamu masih kosong nih 😅 Tambah dulu yuk!' });
    return;
  }

  respondWithTyping({
    text: 'Sebelum checkout, aku butuh beberapa info ya. Siapa nama kamu?'
  });

  checkoutStep = 1;
  checkoutData = {};
}

export async function handleCheckoutInput(text, cartItems) {
  if (checkoutStep === 0) return false;

  if (checkoutStep === 1) {
    checkoutData.nama = text;
    respondWithTyping({ text: `Sip, nama kamu ${text}. Sekarang, nomor WA aktif kamu dong?` });
    checkoutStep = 2;
    return true;
  }

  if (checkoutStep === 2) {
    checkoutData.no_wa = text;
    respondWithTyping({ text: `Oke, sekarang alamat lengkap kamu ya?` });
    checkoutStep = 3;
    return true;
  }

  if (checkoutStep === 3) {
    checkoutData.alamat = text;
    respondWithTyping({ text: `Kurir yang kamu mau? (JNE, J&T, Sicepat, dll)` });
    checkoutStep = 4;
    return true;
  }

  if (checkoutStep === 4) {
    checkoutData.kurir = text;
    respondWithTyping({ text: `Catatan tambahan sebelum checkout? Kalau nggak ada, ketik "-".` });
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

    if (/lanjut/i.test(text)) {
      respondWithTyping({ text: 'Siap! mohon tunggu, Aku proses ke Xendit dulu ya...' });

      try {
        await fetch('https://flat-river-1322.cbp629tmm2.workers.dev/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ checkout: checkoutData, cart: cartItems })
        });

        const res = await fetch('https://weathered-pond-49ef.cbp629tmm2.workers.dev/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user: checkoutData, cart: cartItems })
        });


        if (!res.ok) {
          console.error('Xendit request failed:', res.status);
          respondWithTyping({ text: 'Ups! Gagal kirim ke Xendit 😓' });
          return true;
        }

        const json = await res.json();

        if (json.invoice_url) {
        setTimeout(() => {
          // 🔔 Getar dan bunyi
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
                <strong>Total:</strong> Rp ${totalHarga.toLocaleString('id-ID')}<br>
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
          
        }, 800 + Math.random() * 400);// Setelah kirim ke Xendit dan dapet json.invoice_url
          // ⏺ Simpan ke Firestore
        
        const uid = localStorage.getItem('uid') || 'guest';
        const orderId = `order_${Date.now()}`;
        const orderRef = doc(db, "users", uid, "orders", orderId);
        await setDoc(orderRef, {
          user: checkoutData,
          cart: cartItems,
          order_id: orderId,
          status: 'waiting',
          createdAt: new Date()
        });
        } else {
        respondWithTyping({ sender: 'lyra', text: 'Xendit tidak memberikan tautan pembayaran 😥. Coba lagi ya.' });
        }
          setTimeout(() => {
          respondWithTyping({
            sender: 'lyra',
            text: 'Checkout berhasil! 🎉 Terima kasih sudah belanja. Silakan klik tombol bayar di atas untuk kita proses pengiriman secepatnya 🚚✨'
          });
        }, 1200); // biar keliatan natural
        // Reset checkout state
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
