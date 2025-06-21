// detect-intent-api.js (untuk Cloudflare Worker / backend ringan)

export default {
  async fetch(request) {
    if (request.method !== 'POST' && request.method !== 'OPTIONS') {
      return new Response('Method not allowed', { status: 405 });
    }

    // Tambahkan handler untuk preflight CORS
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type'
        }
      });
    }

    try {
      const { message } = await request.json();
      if (!message || typeof message !== 'string') {
        return new Response('Invalid input', { status: 400, headers: { 'Access-Control-Allow-Origin': '*' } });
      }

      // System prompt yang lebih instruktif dan ramah Groq
      const systemPrompt = `Kamu adalah VIRA, asisten AI toko online. Tugasmu adalah mengklasifikasikan pesan user ke dalam salah satu intent berikut:
- all: User ingin melihat semua produk
- best: User ingin produk terlaris atau rekomendasi utama
- rating: User ingin produk dengan rating terbaik
- match: User menyebut nama produk tertentu
- fallback: Tidak cocok dengan intent di atas

Balas hanya dengan JSON valid seperti contoh berikut:
{
  "intent": "all|best|rating|match|fallback",
  "label": "Penjelasan singkat sesuai intent",
  "product": { ... } // jika intent match, sertakan info produk, jika tidak, null
}

Jangan tambahkan penjelasan lain di luar JSON. Jika tidak yakin, gunakan intent 'fallback'.
`;

      const payload = {
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message }
        ]
      };
      const groqKey = import.meta.env.VITE_GROQ_API_KEY;

      const openaiRes = await fetch(`${groqKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await openaiRes.json();
      let result = data.reply;

      if (typeof result === 'string') {
        try {
          result = JSON.parse(result);
        } catch {
          return new Response('Invalid AI response', { status: 502 });
        }
      }

      return new Response(JSON.stringify(result), {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type'
        },
        status: 200
      });

    } catch (err) {
      return new Response('Internal error: ' + err.message, {
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type'
        }
      });
    }
  }
};
