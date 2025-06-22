// success.js
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const auth = getAuth();
const db = getFirestore(app);

export async function successPage() {
  // Render tampilan skeleton
  const appContainer = document.getElementById('app') || document.body;
  appContainer.innerHTML = `
    <div class="max-w-md w-full bg-[#2c2e3e] rounded-xl p-6 shadow-lg border border-purple-700 text-white text-sm mx-auto">
      <div class="text-center">
        <img src="/logo.png" class="w-24 h-24 mx-auto mb-4" alt="Success" />
        <h1 class="text-2xl font-bold text-green-400 mb-2">Pembayaran Sukses! 🎉</h1>
        <p class="text-gray-300 mb-4">Terima kasih sudah belanja di LYRA.</p>
      </div>
      <img src="/logo.png" alt="LYRA Logo" class="w-16 h-16 rounded-full border border-purple-500 mb-4" />
      <div class="bg-gray-800 rounded-lg p-4 space-y-2 mb-4" id="orderCard" style="display: none;">
        <p><strong>📛 Nama:</strong> <span id="buyerName">-</span></p>
        <p><strong>📱 No. WA:</strong> <span id="buyerPhone">-</span></p>
        <p><strong>🏠 Alamat:</strong> <span id="buyerAddress">-</span></p>
        <p><strong>🛒 Item:</strong></p>
        <ul id="itemList"></ul>
        <p><strong>💰 Total:</strong> <span id="orderTotal">-</span></p>
        <p class="text-yellow-400 text-xs mt-2">*Belum termasuk ongkir. Dibayar saat barang sampai.</p>
      </div>
      <div class="flex gap-3 justify-between">
        <a href="/" class="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded w-full text-center">🏠 Kembali Belanja</a>
        <a href="https://wa.me/6281234567890" target="_blank" class="bg-green-600 hover:bg-green-700 px-4 py-2 rounded w-full text-center">💬 Chat Admin</a>
      </div>
    </div>
    <div id="errorModal" class="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 hide flex items-center justify-center">
      <div class="bg-[#2c2e3e] text-white rounded-lg max-w-sm w-full p-6 text-center shadow-lg border border-red-500">
        <h2 class="text-xl font-bold mb-2 text-red-400">Oops! 😥</h2>
        <p id="errorMessage" class="text-sm text-gray-300">Order tidak ditemukan.</p>
        <button id="backHomeBtn" class="mt-4 bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-full">Kembali ke Beranda</button>
      </div>
    </div>
    <div id="loadingSpinner" class="fixed inset-0 bg-black/70 z-40 flex items-center justify-center">
      <div class="animate-spin rounded-full h-14 w-14 border-t-4 border-purple-500 border-opacity-50"></div>
    </div>
  `;

  const orderCard = document.getElementById('orderCard');
  const spinner = document.getElementById('loadingSpinner');
  const errorModal = document.getElementById('errorModal');
  const errorMessage = document.getElementById('errorMessage');
  const backHomeBtn = document.getElementById('backHomeBtn');
  if (backHomeBtn) backHomeBtn.onclick = () => window.location.href = '/';

  const uid = localStorage.getItem('user');

  if (!uid) {
    showError('User ID atau Order ID tidak ditemukan.');
    return;
  }

  try {
          const res = await fetch('https://flat-river-1322.cbp629tmm2.workers.dev/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user: checkoutData, cart: cartItems })
          });
  
    const orderRef = doc(db, "users", uid, "orders", orderId);
    const orderSnap = await getDoc(orderRef);

    if (!orderSnap.exists()) {
      showError('Order tidak ditemukan di database.');
      return;
    }

    const data = orderSnap.data();

    document.getElementById('buyerName').textContent = data.user?.nama || '-';
    document.getElementById('buyerPhone').textContent = data.user?.no_wa || '-';
    document.getElementById('buyerAddress').textContent = data.user?.alamat || '-';

    const itemList = document.getElementById('itemList');
    itemList.innerHTML = '';
    let total = 0;

    Object.values(data.cart || {}).forEach(item => {
      const qty = item.qty || 1;
      const name = item.name || 'Produk';
      const price = parseInt(item.price) || 0;
      total += qty * price;
      const li = document.createElement('li');
      li.textContent = `${qty}x ${name}`;
      itemList.appendChild(li);
    });

    document.getElementById('orderTotal').textContent = `Rp ${total.toLocaleString('id-ID')}`;

    spinner.remove();
    orderCard.style.display = 'block';

  } catch (err) {
    console.error('Error loading order:', err);
    showError('Terjadi kesalahan saat memuat data.');
  }

  function showError(msg) {
    spinner.remove();
    errorModal.classList.remove('hide');
    errorMessage.textContent = msg;
  }
}
