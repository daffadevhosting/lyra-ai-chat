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

export function detectCategoryIntent(text) {
  if (/rasa|enak|pedas|manis|gurih|lezat/i.test(text)) return 'rasa';
  if (/sehat|manfaat|fungsi|bergizi/i.test(text)) return 'manfaat';
  if (/harga|murah|diskon|promo|ongkir/i.test(text)) return 'harga';
  if (/rekomendasi|cocok|bagus/i.test(text)) return 'rekomendasi';
  return 'umum';
}

export function generateCategoryResponse(intent, product) {
  const price = `Rp ${product.price.toLocaleString('id-ID')}`;
  const name = product.name;

  switch (intent) {
    case 'rasa':
      if (product.category === 'makanan')
        return `${name} ini rasanya nagih banget, cocok dimakan kapan aja 😋`;
      if (product.category === 'minuman')
        return `${name} punya rasa khas yang nyegerin, cocok diminum pas santai 🍹`;
      return `${name} punya rasa unik yang sayang dilewatkan!`;

    case 'manfaat':
      return `${name} ini punya manfaat ${product.tags?.includes('sehat') ? 'untuk kesehatan' : 'yang luar biasa'}, kamu wajib coba 💪`;

    case 'harga':
      return `Harganya cuma ${price}, ${product.tags?.includes('diskon') ? 'lagi diskon juga lho!' : 'worth it banget!'}`;

    case 'rekomendasi':
      return `${name} ini sering direkomendasikan ke pelanggan yang cari kualitas dan rasa terbaik ✨`;

    default:
      return `${name} ini salah satu andalan kami. Harganya ${price}. Yuk coba!`;
  }
}

export function generateTone(text, style = 'default') {
  switch (style) {
    case 'formal':
      return `Baik, ${text}`;
    case 'friendly':
      return `Hehe, ${text} yaa~ 😊`;
    case 'genz':
      return `${text} 🔥💯`;
    case 'jualan':
      return `${text} Yuk dibeli sekarang juga ya! 🛒✨`;
    default:
      return text;
  }
}
