import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc } from 'firebase/firestore';

// Config dari env
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const appDiv = document.getElementById('app');

  const orderCard = document.querySelector('.bg-gray-800');
  const spinner = document.getElementById('loadingSpinner');
  const errorModal = document.getElementById('errorModal');
  const errorMessage = document.getElementById('errorMessage');

  orderCard.style.display = 'none';

const urlParams = new URLSearchParams(window.location.search);
const orderId = urlParams.get('order_id');

if (!orderId) {
    showError("Order ID tidak ditemukan di URL.");
  appDiv.innerHTML = `<p class="text-red-400">Order ID tidak ditemukan.</p>`;
} else {
  loadData(orderId);
}

async function loadData(orderId) {
  try {
    const docRef = doc(db, 'checkouts', orderId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
        showError("Order tidak ditemukan di database.");
      appDiv.innerHTML = `<p class="text-red-400">Data tidak ditemukan untuk ID: ${orderId}</p>`;
      return;
    }

    const { user, cart } = docSnap.data();

    const cartItems = Object.values(cart || {}).map((item) =>
      `<li>${item.qty || 1}x ${item.name}</li>`
    ).join('');

    const total = Object.values(cart || {}).reduce((sum, item) => {
      return sum + (parseInt(item.price || 0) * (item.qty || 1));
    }, 0);

    appDiv.innerHTML = `
  <div class="max-w-md w-full bg-[#2c2e3e] rounded-xl p-6 shadow-lg border border-purple-700 text-white text-sm">
    <div class="text-center">
      <img src="/logo.png" class="w-24 h-24 mx-auto mb-4" alt="Success" />
      <h1 class="text-2xl font-bold text-green-400 mb-2">Pembayaran Sukses! 🎉</h1>
      <p class="text-gray-300 mb-4">Terima kasih sudah belanja di LYRA.</p>
    </div>
  <img src="/logo.png" alt="LYRA Logo" class="w-16 h-16 rounded-full border border-purple-500 mb-4" />
    <div class="bg-gray-800 rounded-lg p-4 space-y-2 mb-4">
      <p><strong>📛 Nama:</strong> <span id="buyerName">${user.nama}</span></p>
      <p><strong>📱 No. WA:</strong> <span id="buyerPhone">${user.no_wa}</span></p>
      <p><strong>🏠 Alamat:</strong> <span id="buyerAddress">${user.alamat}</span></p>
      <p><strong>🛒 Item:</strong></p>
      <ul id="itemList">${cartItems}</ul>
      <p><strong>💰 Total:</strong> <span id="orderTotal">Rp ${total.toLocaleString('id-ID')}</span></p>
      <p class="text-yellow-400 text-xs mt-2">*Belum termasuk ongkir. Dibayar saat barang sampai.</p>
    </div>

    <div class="flex gap-3 justify-between">
      <a href="/" class="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded w-full text-center">🏠 Kembali Belanja</a>
      <a href="https://wa.me/62${user.no_wa.replace(/^0/, '')}" target="_blank" class="bg-green-600 hover:bg-green-700 px-4 py-2 rounded w-full text-center">💬 Chat Admin</a>
    </div>
  </div>
<!-- Modal Error -->
<div id="errorModal" class="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 hidden items-center justify-center">
  <div class="bg-[#2c2e3e] text-white rounded-lg max-w-sm w-full p-6 text-center shadow-lg border border-red-500">
    <h2 class="text-xl font-bold mb-2 text-red-400">Oops! 😥</h2>
    <p id="errorMessage" class="text-sm text-gray-300">Order tidak ditemukan.</p>
    <button onclick="location.href='/'" class="mt-4 bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-full">
      Kembali ke Beranda
    </button>
  </div>
</div>

<!-- Loading Spinner -->
<div id="loadingSpinner" class="fixed inset-0 bg-black/70 z-40 flex items-center justify-center">
  <div class="animate-spin rounded-full h-14 w-14 border-t-4 border-purple-500 border-opacity-50"></div>
</div>
    `;

  function showError(msg) {
    spinner.remove();
    errorModal.classList.remove('hidden');
    errorMessage.textContent = msg;
  }
  } catch (err) {
    console.error('[🔥 ERROR FIREBASE]', err);
    appDiv.innerHTML = `<p class="text-red-500">Terjadi kesalahan saat memuat data.</p>`;
  }
}
