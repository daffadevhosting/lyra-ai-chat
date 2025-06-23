# L Y Я A AI Chat Commerce 🧠🛍️

L Y Я A adalah asisten AI modern berbasis web yang dirancang untuk membantu pengguna dalam bentuk percakapan bergaya Telegram. Tak cuma ngobrol, L Y Я A juga bisa **menawarkan produk toko online secara cerdas**, tampilkan **bubble produk interaktif**, dan **bekerja layaknya CS pintar yang gak capek-capek jualan**. Tinggal tanya, "L Y Я A, punya produk apa?" L Y Я A bakal ngasih katalog.

---

### 🖼️ Screenshot

|            - L Y Я A -            |
|--------------------------------|
|![](./src/assets/lyra-ai.png)|

[![Vercel](https://img.shields.io/badge/Live%20Demo-Vercel-black?logo=vercel)](https://lyra-ai-nine.vercel.app)

# 📖 Panduan Cepat Pengguna L Y Я A

L Y Я A adalah chatbot toko online pintar yang siap bantu kamu cari produk dengan gaya ngobrol santai. Yuk, simak cara pakainya:

---

## 🤖 Cara Bertanya

### 📦 Lihat Semua Produk

> **Tanya:** "Punya produk apa aja?", "Katalognya dong"

> **Hasil:** L Y Я A akan kirim daftar semua produk yang tersedia.

### 🔥 Lihat Produk Terlaris

> **Tanya:** "Apa produk terlaris?", "Yang paling banyak dibeli apa?"

> **Hasil:** L Y Я A akan menampilkan produk dengan penjualan terbanyak.

### 🌟 Lihat Produk dengan Rating Tertinggi

> **Tanya:** "Produk paling enak?", "Yang ratingnya paling tinggi apa?"

> **Hasil:** L Y Я A akan tampilkan produk dengan bintang tertinggi.

### 🔍 Cari Produk Spesifik

> **Tanya:** "Ada keripik singkong?", "Punya bubur mang oleh ga?"

> **Hasil:** L Y Я A akan mencocokkan nama/kata kunci dengan katalog produk.

### 🙋 Tanya Hal Lain

> **Tanya:** "Cara jadi reseller gimana?", "buka keranjang belanjaku", "Bisa kirim ke luar kota?"

> **Hasil:** L Y Я A akan jawab secara umum atau kasih saran.

---

## ⚠️ Batasan Fitur

* Tanpa login: Maksimal 10 chat/hari.
* Login User: 50 chat/hari.
* Ingin akses penuh? Hubungi admin!

---

## 📦 Tips Tambahan

* Klik produk di sidebar untuk tanya langsung ke L Y Я A.
* Pakai kata kunci umum seperti "keripik", "sambal", "kopi" untuk hasil terbaik.
* L Y Я A bakal makin pintar seiring waktu, jadi terus coba aja ya 😉

---

Selamat berbelanja bareng L Y Я A! 💜

> Dibuat oleh nDang & Daffa, manusia nyeleneh dari Tasik.
> Sorry... karena ini open source `code script di src/` acak-acakan. silahkan rapihkan dan kembangkan sesuai selera.
> Untuk yang modulasi rapih + Jarvis terintegrasi IoT di private 😅


## ✨ Fitur Utama

- 🧠 Chat AI (terhubung ke Groq GPT API)
- 💬 UI gaya Telegram dengan bubble reply yang real
- 🛍️ Tampilkan produk otomatis berdasarkan keyword
- 🔐 Login sistem + batasan akses
- 🚫 Limitasi guest user (10 chat gratis)
- 💬 Notifikasi Order via telegram api
- 🛒 Checkout terintegrasi Xendit
- 🧠 Intent detection responsif
- 🎙️ Voice note interaktif
- 📦 Manajemen produk & keranjang smart
- 🗂️ Multi-mode gaya bicara
- 🚀 Rencana ke IoT. **(SOON)**

---

## 🏗️ Teknologi yang Digunakan

- ⚡️ Vite
- 🎨 Tailwind CSS
- 🔥 Firebase (Auth & nanti Firestore)
- 🌐 Groq API (GPT backend)
- 🧩 Modular JS (tanpa framework berat)
- 🦾 Lucide Icons

---

## 📦 Struktur Folder

```pgsql
src/
├── pages/
│ └── ChatTelegram.js # Halaman utama chat
├── modules/
│ ├── authHandler.js # Login Firebase
│ ├── limitModal.js # Modal batas chat
│ ├── intentHandler.js # Deteksi kata niat belanja
│ └── chatRenderer.js # Bubble generator & reply
└── assets/
└── keripik.jpg # Gambar produk dummy
```

---

## 🚀 Setup Lokal

1. Clone repo dan jalankan:
```bash
   git clone https://github.com/daffadevhosting/lyra-ai-chat.git
   cd lyra-ai-chat
   npm install
   npm run dev
```
2. Tambahkan konfigurasi Firebase di `authHandler.js`

## 📌 Roadmap Selanjutnya

 - Simpan chat ke Firestore

 - Voice recognition (mic)

 - Text-to-speech (suara L Y Я A cewek) **(Done)**

 - Produk dari database **(Done)**

 - Checkout produk langsung via AI **(Done)**

 - Sistem payment via XENDit **(Done)**

## 🔌 Koneksi Dunia Nyata
 - IoT hooks (webhook ke ESP8266 misal)
 - Integrasi voice + action (misal: “nyalain lampu dapur, nyalain mesin mobil / motor”)

 ## 🧠 Gimana caranya "Nyalain Mobil"?
1. ### Sediakan microcontroller WiFi-ready:
* ✅ ESP32 atau ESP8266 (harga murah, kuat)
* Hubungkan ke modul relay atau sistem push-start (tergantung mobil)

2. ### Cloud Webhook Endpoint:
* Buat Worker/Cloud Function (misal: `/api/nyalain-mobil`)
* Terima `command` via fetch dari LYRA, lalu kirim ke ESP

3. ### ESP32 Listening Command:
* ESP32 polling Firebase Realtime Database atau WebSocket
* Begitu ada `command: "start_engine"` => trigger relay 1 detik

**LYRA Script:**

```lyra.config.js
if (/nyalain mobil|panasin mesin/i.test(text)) {
  respondWithVoice({
    sender: 'lyra',
    voiceOnly: false,
    speakOnly: true,
    voice: '🚗 Oke, aku sedang menyalakan mobil dan memanaskan mesinnya...'
  });
  
  fetch('https://iot.lyra.workers.dev/autonomus', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'start_engine', token: 'secret123' })
  });
}
```
4. ### Tambahan Aman:

- 🔐 Token khusus
- 🌡️ Sensor suhu + timer (mobil ga dinyalain lebih dari 10 menit)
- 📱 Notifikasi WA: "Mobil sudah menyala pukul 06.32, suhu mesin 25°C"


|         - L Y Я A di hp -         |
|--------------------------------|
|![](./src/assets/lyra-mob.png)|

[L Y Я A AI-shop](https://lyra-ai-nine.vercel.app) Deployed via vercel

“L Y Я A bukan sekadar AI, dia CS toko online yang ngerti bahasa manusia dan bisa closing jualan.” – Kita 😎

