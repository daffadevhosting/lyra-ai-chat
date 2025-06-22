import { initializeApp, getApps } from 'firebase/app';
import { getAuth, onAuthStateChanged } from 'firebase/auth';

// Config dari env
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const auth = getAuth(app);

onAuthStateChanged(auth, (user) => {
  const uid = user?.uid || 'guest';
  localStorage.setItem('uid', uid);
  successPage(uid);
});

// Hilangkan semua logic Firestore, hanya tampilkan halaman sukses statis
export function successPage() {
  const appDiv = document.getElementById('app');
  if (appDiv) appDiv.innerHTML = `
  <div class="max-w-md w-full bg-[#2c2e3e] rounded-xl p-6 shadow-lg border border-purple-700 text-white text-sm mx-auto mt-16">
    <div class="text-center">
      <img src="/logo.png" class="w-24 h-24 mx-auto mb-4" alt="Success" />
      <h1 class="text-2xl font-bold text-green-400 mb-2">Pembayaran Sukses! 🎉</h1>
      <p class="text-gray-300 mb-4">Terima kasih sudah belanja di LYRA.</p>
    </div>
    <img src="/logo.png" alt="LYRA Logo" class="w-16 h-16 rounded-full border border-purple-500 mb-4 mx-auto" />
    <div class="bg-gray-800 rounded-lg p-4 space-y-2 mb-4">
      <p><strong>📛 Nama:</strong> <span id="buyerName">-</span></p>
      <p><strong>📱 No. WA:</strong> <span id="buyerPhone">-</span></p>
      <p><strong>🏠 Alamat:</strong> <span id="buyerAddress">-</span></p>
      <p><strong>🛒 Item:</strong></p>
      <ul id="itemList"><li>-</li></ul>
      <p><strong>💰 Total:</strong> <span id="orderTotal">-</span></p>
      <p class="text-yellow-400 text-xs mt-2">*Belum termasuk ongkir. Dibayar saat barang sampai.</p>
    </div>
    <div class="flex gap-3 justify-between">
      <a href="/" class="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded w-full text-center">🏠 Kembali Belanja</a>
      <a href="https://wa.me/62" target="_blank" class="bg-green-600 hover:bg-green-700 px-4 py-2 rounded w-full text-center">💬 Chat Admin</a>
    </div>
  </div>
  `;
}
