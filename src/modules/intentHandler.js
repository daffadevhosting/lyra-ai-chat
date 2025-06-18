// src/modules/intentHandler.js

export const PRODUCT_LIST = [
  {
    name: "Keripik Lada Hitam",
    price: "Rp200.000",
    img: "/assets/keripik.jpg",
    slug: "keripik-lada-hitam",
    rating: 4.8,
    sold: 120,
    keywords: ["keripik", "lada", "camilan"],
  },
  {
    name: "Sambal Kering Gurih",
    price: "Rp15.000",
    img: "/assets/sambal.jpg",
    slug: "sambal-kering-gurih",
    rating: 4.9,
    sold: 95,
    keywords: ["sambal", "pedas", "gurih"],
  },
  // Tambahkan produk lain di sini
];

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
