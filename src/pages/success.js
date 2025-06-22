import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { initializeApp } from 'firebase/app';
import { getAuth, onAuthStateChanged } from 'firebase/auth';

// ✅ Setup Firebase
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// 🔁 Tunggu status login
onAuthStateChanged(auth, (user) => {
  const uid = user?.uid || 'guest';
  localStorage.setItem('uid', uid);
  successPage(uid);
});

export async function successPage(uid) {
  try {
    const params = new URLSearchParams(window.location.search);
    const orderId = params.get('order_id');

    if (!orderId) {
      throw new Error('Order ID tidak ditemukan di URL.');
    }

    const docRef = doc(db, "users", uid, "orders", orderId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      throw new Error(`Data tidak ditemukan untuk ID: ${orderId}`);
    }

    const data = docSnap.data();
    const box = document.getElementById('successBox');
    if (!box) throw new Error('Element #successBox tidak ditemukan');

    const items = Object.values(data.cart).map((item) =>
      `<li>${item.qty || 1}x ${item.name}</li>`
    ).join('');

    box.innerHTML = `
      <div class="text-center">
        <img src="https://lottie.host/5b6828f6-c994-47ef-86f1-68cc16d2edac/1F0AiHyJzp.json" class="w-24 h-24 mx-auto mb-4" />
        <h1 class="text-2xl font-bold text-green-400 mb-2">Pembayaran Sukses! 🎉</h1>
        <p class="text-gray-300 mb-4">Terima kasih sudah belanja di LYRA.</p>
      </div>

      <div class="bg-gray-800 rounded-lg p-4 space-y-2 mb-4 text-sm">
        <p><strong>📛 Nama:</strong> ${data.user.nama}</p>
        <p><strong>📱 No. WA:</strong> ${data.user.no_wa}</p>
        <p><strong>🏠 Alamat:</strong> ${data.user.alamat}</p>
        <p><strong>🛒 Item:</strong></p>
        <ul class="list-disc list-inside text-gray-300 ml-2">${items}</ul>
        <p><strong>💰 Total:</strong> Rp ${data.total?.toLocaleString('id-ID') || '—'}</p>
        <p class="text-yellow-400 text-xs mt-2">*Belum termasuk ongkir</p>
      </div>

      <div class="flex gap-3 justify-between">
        <a href="/" class="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded w-full text-center">🏠 Belanja Lagi</a>
        <a href="https://wa.me/6281234567890" target="_blank" class="bg-green-600 hover:bg-green-700 px-4 py-2 rounded w-full text-center">💬 Chat Admin</a>
      </div>
    `;
  } catch (error) {
    console.error('[🔥 ERROR FIREBASE]', error);
    const box = document.getElementById('successBox');
    if (box) box.innerHTML = `<p class="text-red-400 text-sm">${error.message}</p>`;
  }
}
