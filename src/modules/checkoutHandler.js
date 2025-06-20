import { 
  appendMessage,
  showTypingBubble,
  removeTypingBubble,
  showTypingHeader,
  hideTypingHeader 
} from './chatRenderer.js';

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
      respondWithTyping({ text: 'Siap! Aku lagi proses ke Midtrans ya...' });

      try {
        await fetch('https://flat-river-1322.cbp629tmm2.workers.dev/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ checkout: checkoutData, cart: cartItems })
        });

        const res = await fetch('http://localhost:3000/api/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user: checkoutData, cart: cartItems })
        });

        if (!res.ok) {
          console.error('Midtrans request failed:', res.status);
          respondWithTyping({ text: 'Ups! Gagal kirim ke Midtrans 😓' });
          return true;
        }

        const json = await res.json();

        if (!json.snapToken) {
          respondWithTyping({ text: 'Midtrans tidak memberikan token 😥. Coba lagi ya.' });
          return true;
        }

        respondWithTyping({
          html: `<a href="#" onclick="snap.pay('${json.snapToken}')" class="text-blue-400 underline">Klik di sini untuk bayar via Midtrans</a>`
        });

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
