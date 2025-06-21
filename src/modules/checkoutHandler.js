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
      respondWithTyping({ text: 'Siap! Aku lagi proses ke Xendit ya...' });

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
        const totalHarga = Object.values(cartItems).reduce((sum, item) => sum + (item.price * item.qty), 0);
        const itemList = Object.values(cartItems).map((item, i) => {
        return `${i + 1}. ${item.name} x${item.qty} - Rp ${item.price * item.qty}`;
        }).join('<br>');

        respondWithTyping({
        sender: 'lyra',
        html: `
            <div class="text-sm leading-relaxed">
            <strong>🧾 Pesanan kamu:</strong><br>
            ${itemList}<br><br>
            <strong>💰 Total: Rp ${totalHarga.toLocaleString('id-ID')}</strong><br><br>
            <a href="${json.invoice_url}" target="_blank" class=" mt-2 text-white px-4 py-2 hover:bg-blue-700 transition">
                <h1>👉 Klik di sini untuk bayar via Xendit</h1>
            </a>
            </div>
        `
        });
        } else {
        respondWithTyping({ sender: 'lyra', text: 'Xendit tidak memberikan tautan pembayaran 😥. Coba lagi ya.' });
        }


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
