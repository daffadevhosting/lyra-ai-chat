// detect-intent-api.js (untuk Cloudflare Worker / backend ringan)

export default {
  async fetch(request) {
    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    try {
      const { message } = await request.json();
      if (!message || typeof message !== 'string') {
        return new Response('Invalid input', { status: 400 });
      }

      const systemPrompt = `Anda adalah Lyra, asisten toko online. Klasifikasikan pesan berikut menjadi intent:
- all
- best
- rating
- match
- fallback

Kembalikan JSON dengan format:
{
  "intent": "...",
  "label": "...",
  "product": { ... } // jika ada
}
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
        headers: { 'Content-Type': 'application/json' },
        status: 200
      });

    } catch (err) {
      return new Response('Internal error: ' + err.message, { status: 500 });
    }
  }
};
