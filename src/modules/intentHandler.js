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

export async function detectIntentAndRespond(userPrompt) {
  const products = await fetchProductList();

  const systemPrompt = `Anda adalah “Lyra”, chatbot e-commerce ramah berbahasa Indonesia yang memiliki akses penuh ke sebuah array JavaScript bernama PRODUCT_LIST. Setiap item di PRODUCT_LIST memiliki field: { id, name, sold, rating, … }.

Saat menerima pesan dari user, Anda wajib mengklasifikasikan ke dalam tepat satu intent:
  • all       → user ingin melihat semua produk  
  • best      → user ingin tahu produk terlaris  
  • rating    → user ingin tahu produk dengan rating tertinggi  
  • match     → user mencari produk spesifik (nama/kategori/fitur)  
  • fallback  → user menanyakan hal di luar 4 intent di atas  

Kemudian keluarkan hanya satu objek JSON valid (tanpa penjelasan lain) dengan properti:
  • intent     : “all” | “best” | “rating” | “match” | “fallback”  
  • label      : teks ramah dalam Bahasa Indonesia yang akan dikirim Lyra sebelum detail produk  
  • product(s) :  
      – Untuk intent “all”: Hanya sertakan key intent & label, proses looping PRODUCT_LIST dilakukan di kode Anda  
      – Untuk intent “best”/“rating”: sertakan key “product” dengan satu objek produk terbaik  
      – Untuk intent “match”: sertakan key “product” dengan satu objek produk yang paling sesuai  
      – Untuk intent “fallback”: omit key “product”

Struktur JSON:
{
  "intent": "…",
  "label":  "…",
  // hanya sertakan “product” jika intent adalah best, rating, atau match
  "product": { … }
}

Contoh produk yang tersedia:
${JSON.stringify(products.slice(0, 5), null, 2)}`;

  const body = {
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ]
  };

  try {
    console.log('👉 Payload ke GPT:', JSON.stringify(body, null, 2));

    const res = await fetch('https://grey-api.cbp629tmm2.workers.dev/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    const data = await res.json();

    // Amanin jika langsung object
    if (typeof data.reply === 'object') return data.reply;

console.warn('DEBUG reply:', data.reply);

    // Coba parse kalau string
    if (typeof data.reply === 'string') return JSON.parse(data.reply);

    throw new Error('Response tidak dikenali');
  } catch (err) {
    console.error('❌ Gagal deteksi intent:', err);
    return {
      intent: 'fallback',
      label: 'Maaf, saya belum mengerti. Bisa dijelaskan lagi, ya?'
    };
  }
}