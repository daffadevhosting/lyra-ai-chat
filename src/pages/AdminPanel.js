// src/pages/AdminPanel.js
import { logoutAdmin } from '../modules/adminAuth.js';
import { addProduct, fetchProducts } from '../modules/productStore';
import { addIntent, fetchAllIntents, deleteIntent } from '../modules/intentHandler.admin.js';

export default function AdminPanel() {
  return `
    <div class="min-h-screen bg-[#1d1f2b] text-white p-4 md:p-8 font-sans">
      <div class="flex justify-between items-center mb-8">
        <h1 class="text-2xl font-bold">🛠️ Admin Panel - Tambah Produk</h1>
        <button id="logoutBtn" class="bg-red-600 hover:bg-red-700 transition p-2 rounded font-semibold">Logout</button>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        <!-- Form Input -->
        <form id="productForm" class="space-y-4 bg-[#23243a] p-6 rounded-xl border border-gray-700 shadow max-w-xl w-full mx-auto md:mx-0">
          <div class="text-lg font-semibold mb-2">Tambah Produk</div>
          <input type="text" id="name" placeholder="Nama Produk" required class="w-full p-2 rounded bg-gray-800 border border-gray-600 focus:outline-none" />
          <input type="text" id="price" placeholder="Harga (cth: Rp15.000)" required class="w-full p-2 rounded bg-gray-800 border border-gray-600 focus:outline-none" />
          <input type="text" id="img" placeholder="Link Gambar (URL)" required class="w-full p-2 rounded bg-gray-800 border border-gray-600 focus:outline-none" />
          <textarea type="text" id="description" placeholder="Deskripsi Produk" required class="w-full p-2 rounded bg-gray-800 border border-gray-600 focus:outline-none" rows="4"></textarea>
          <input type="text" id="slug" placeholder="Slug (cth: keripik-lada-hitam)" required class="w-full p-2 rounded bg-gray-800 border border-gray-600 focus:outline-none" />
          <input type="number" id="rating" step="0.1" max="5" min="0" placeholder="Rating (0-5)" class="w-full p-2 rounded bg-gray-800 border border-gray-600 focus:outline-none" />
          <input type="number" id="sold" placeholder="Total Terjual" class="w-full p-2 rounded bg-gray-800 border border-gray-600 focus:outline-none" />
          <input type="text" id="keywords" placeholder="Keyword (pisahkan dengan koma)" class="w-full p-2 rounded bg-gray-800 border border-gray-600 focus:outline-none" />
          <button type="submit" class="w-full bg-purple-600 hover:bg-purple-700 transition p-2 rounded font-semibold">Tambah Produk</button>
        </form>
        <!-- Product List -->
        <div class="w-full">
          <h2 class="text-xl font-semibold mb-4">📋 Daftar Produk</h2>
          <div id="productList" class="grid grid-cols-2 gap-4"></div>
        </div>
    <!-- Tambah Intent -->
        <div class="mt-8 p-4 bg-[#2c2e3e] rounded-lg border border-gray-700">
          <h2 class="text-lg font-bold mb-2 text-purple-400">🧠 Tambah Intent LYRA</h2>
          <input id="intentTrigger" type="text" placeholder="Trigger (misal: siapa kamu)" class="w-full p-2 mb-2 rounded bg-gray-800 border border-gray-600 text-white">
          <textarea id="intentResponse" placeholder="Respon LYRA" class="w-full p-2 mb-2 rounded bg-gray-800 border border-gray-600 text-white"></textarea>
          <select id="intentMode" class="w-full p-2 mb-2 rounded bg-gray-800 border border-gray-600 text-white">
            <option value="default">Default</option>
            <option value="jualan">Jualan</option>
            <option value="genz">Gen Z</option>
            <option value="formal">Formal</option>
          </select>
          <button id="addIntentBtn" class="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded">+ Tambah Intent</button>
        </div>
        <!-- List Intent -->
        <div id="intentList" class="mt-4 text-sm text-white space-y-2"></div>
        <form id="addIntentForm">
          <input type="text" name="keywords" placeholder="Kata kunci, pisah koma" required />
          <textarea name="response" placeholder="Respon Lyra" required></textarea>
          <select name="mode">
            <option value="default">Default</option>
            <option value="jualan">Jualan</option>
            <option value="genz">Gen-Z</option>
          </select>
          <button type="submit">Tambah Intent</button>
        </form>

      </div>
    </div>
  `;
}

export function initAdminPanel() {
  const form = document.getElementById('productForm');
  const list = document.getElementById('productList');
  const logoutBtn = document.getElementById('logoutBtn');

  if (!form || !list) {
    console.warn('[WARNING] Admin panel DOM belum siap');
    return;
  }

  logoutBtn?.addEventListener('click', async () => {
    await logoutAdmin();
    window.location.href = '/';
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = {
      name: form.name.value,
      price: form.price.value,
      img: form.img.value,
      description: form.description.value,
      slug: form.slug.value,
      rating: parseFloat(form.rating.value || 0),
      sold: parseInt(form.sold.value || 0),
      keywords: form.keywords.value.split(',').map(k => k.trim()).filter(Boolean),
    };
    if (!data.name || !data.price || !data.img || !data.description || !data.slug) {
      alert('Semua kolom wajib diisi, bre!');
      return;
    }
    await addProduct(data);
    form.reset();
    renderProducts();
  });

  async function renderProducts() {
    const products = await fetchProducts();
    list.innerHTML = products.map(p => `
      <div class="border w-fit border-gray-600 p-3 rounded-lg" style="max-width: 197px;">
        <div class="font-bold text-lg">${p.name}</div>
        <img src="${p.img}" alt="${p.name}" class="h-32 object-cover mt-2 rounded" style='width: -webkit-fill-available;' />
        <div class="text-sm text-gray-300">${p.price} - Terjual: ${p.sold} - ⭐ ${p.rating}</div>
        <div class="text-xs text-gray-400">Deskripsi: ${p.description}</div>
        <div class="text-xs text-gray-400">Slug: ${p.slug}</div>
        <div class="text-xs text-gray-400">Keyword: ${p.keywords?.join(', ')}</div>
      </div>
    `).join('');
  }

  renderProducts();

document.getElementById('addIntentBtn').onclick = async () => {
  const trigger = document.getElementById('intentTrigger').value.trim();
  const response = document.getElementById('intentResponse').value.trim();
  const mode = document.getElementById('intentMode').value;

  if (!trigger || !response) return alert('Isi trigger & response dulu');

  await addIntent(trigger, response, mode);
  alert('Intent ditambahkan!');
  loadIntentList(); // refresh list
};

async function loadIntentList() {
  const list = document.getElementById('intentList');
  list.innerHTML = '';
  const intents = await fetchAllIntents();
  intents.forEach(({ id, trigger, response, mode }) => {
    const div = document.createElement('div');
    div.className = 'bg-gray-800 p-2 rounded border border-gray-600 flex justify-between items-center';
    div.innerHTML = `
      <div>
        <strong>${trigger}</strong> → <span class="text-green-400">${mode}</span><br>
        <span class="text-gray-300">${response}</span>
      </div>
      <button onclick="deleteIntent('${id}').then(loadIntentList)" class="text-red-400">🗑️</button>
    `;
    list.appendChild(div);
  });
}

// Load saat halaman siap
loadIntentList();


document.getElementById('addIntentForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const form = e.target;
  const keywords = form.keywords.value.split(',').map(k => k.trim().toLowerCase());
  const response = form.response.value;
  const mode = form.mode.value;

  await addDoc(collection(db, "intents"), {
    keywords,
    response,
    mode,
    html: false
  });

  alert('Intent ditambahkan!');
});
}