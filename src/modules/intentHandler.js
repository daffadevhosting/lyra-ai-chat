// src/modules/intentHandler.js
import { getFirestore, collection, getDocs } from 'firebase/firestore';

let PRODUCT_LIST = [];

export async function fetchProductList() {
  if (PRODUCT_LIST.length) return PRODUCT_LIST;
  const db = getFirestore();
  const snap = await getDocs(collection(db, 'products'));
  PRODUCT_LIST = snap.docs.map(doc => doc.data());
  return PRODUCT_LIST;
}

export function detectIntentAndRespond(text) {
  const msg = text.toLowerCase();

  if (/produk apa|punya apa|katalog|jual apa/i.test(msg)) {
    return { intent: 'all', label: '📦 Ini beberapa produk dari toko aku:' };
  }

  if (/rekomendasi|apa yang paling laku|best seller/i.test(msg)) {
    return { intent: 'best', label: '🔥 Ini produk paling laris minggu ini!' };
  }

  if (/paling enak|favorit|terenak|terbaik/i.test(msg)) {
    return { intent: 'rating', label: '😋 Ini produk favorit pelanggan kami!' };
  }

  if (/siapa.*buat|dibuat.*siapa|developer|tinggal.*mana/i.test(msg)) {
    return {
      intent: 'creator',
      label: 'Aku dibuat sama nDang, developer dari Tasik. Cek source code-ku di sini ya 👉 https://github.com/daffadevhosting/lyra-ai-chat'
    };
  }

  const matched = PRODUCT_LIST.find(p =>
    msg.includes(p.name.toLowerCase()) ||
    (p.keywords && p.keywords.some(k => msg.includes(k)))
  );

  if (matched) {
    return { intent: 'match', label: `Wah, kamu nyebut ${matched.name}?! Nih yang lagi hits!`, product: matched };
  }

  return { intent: null };
}
