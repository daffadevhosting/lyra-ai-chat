# LYRA AI Chat Commerce 🧠🛍️

LYRA adalah asisten AI modern berbasis web yang dirancang untuk membantu pengguna dalam bentuk percakapan bergaya Telegram. Tak cuma ngobrol, LYRA juga bisa **menawarkan produk toko online secara cerdas**, tampilkan **bubble produk interaktif**, dan **bekerja layaknya CS pintar yang gak capek-capek jualan**. Tinggal tanya, "Lyra, punya produk apa?" Lyra bakal ngasih katalog.

---

### 🖼️ Screenshot

|            - LYRA -            |
|--------------------------------|
|![](./src/assets/lyra-ai.png)|

[![Vercel](https://img.shields.io/badge/Live%20Demo-Vercel-black?logo=vercel)](https://lyra-ai-nine.vercel.app)

# 📖 Panduan Cepat Pengguna LYRA

LYRA adalah chatbot toko online pintar yang siap bantu kamu cari produk dengan gaya ngobrol santai. Yuk, simak cara pakainya:

---

## 🤖 Cara Bertanya

### 📦 Lihat Semua Produk

> **Tanya:** "Punya produk apa aja?", "Katalognya dong"

> **Hasil:** LYRA akan kirim daftar semua produk yang tersedia.

### 🔥 Lihat Produk Terlaris

> **Tanya:** "Apa produk terlaris?", "Yang paling banyak dibeli apa?"

> **Hasil:** LYRA akan menampilkan produk dengan penjualan terbanyak.

### 🌟 Lihat Produk dengan Rating Tertinggi

> **Tanya:** "Produk paling enak?", "Yang ratingnya paling tinggi apa?"

> **Hasil:** LYRA akan tampilkan produk dengan bintang tertinggi.

### 🔍 Cari Produk Spesifik

> **Tanya:** "Ada keripik singkong?", "Punya bubur mang oleh ga?"

> **Hasil:** LYRA akan mencocokkan nama/kata kunci dengan katalog produk.

### 🙋 Tanya Hal Lain

> **Tanya:** "Cara jadi reseller gimana?", "buka keranjang belanjaku", "Bisa kirim ke luar kota?"

> **Hasil:** LYRA akan jawab secara umum atau kasih saran.

---

## ⚠️ Batasan Fitur

* Tanpa login: Maksimal 10 chat/hari.
* Login Google: 50 chat/hari.
* Ingin akses penuh? Hubungi admin!

---

## 📦 Tips Tambahan

* Klik produk di sidebar untuk tanya langsung ke LYRA.
* Pakai kata kunci umum seperti "keripik", "sambal", "kopi" untuk hasil terbaik.
* LYRA bakal makin pintar seiring waktu, jadi terus coba aja ya 😉

---

Selamat berbelanja bareng LYRA! 💜

> Dibuat oleh nDang & Daffa, manusia nyeleneh dari Tasik.


## ✨ Fitur Utama

- 🧠 Chat AI (terhubung ke Groq GPT API)
- 💬 UI gaya Telegram dengan bubble reply yang real
- 🛍️ Tampilkan produk otomatis berdasarkan keyword
- 🔐 Login Google via Firebase Auth
- 🚫 Limitasi guest user (3 chat gratis)
- 🪪 Modal login muncul otomatis saat kena limit
- 🖼️ Produk tampil dalam bubble dengan gambar + tombol beli
- 🖱️ Tombol kirim & login pakai icon lucide/heroicons
- 🌓 Dark mode elegan

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

 - Produk dari database

 - Voice recognition (mic)

 - Text-to-speech (suara LYRA cewek)

 - Sistem donasi via Xendit

 - Checkout produk langsung via QR code

 ## 💻 Demo

|         - LYRA di hp -         |
|--------------------------------|
|![](./src/assets/lyra-mob.png)|

[LYRA AI-shop](https://lyra-ai-nine.vercel.app) Deployed via vercel

“LYRA bukan sekadar AI, dia CS toko online yang ngerti bahasa manusia dan bisa closing jualan.” – Kita 😎

