
export function renderSingleProductCardHTML(product) {
  return `
    <div class="bg-[#2c2e3e] text-white rounded-lg p-4 shadow-md w-full max-w-xs">
      <img src="${product.img}" alt="${product.name}" class="w-full h-32 object-cover rounded-md mb-2" />
      <div class="font-bold text-base mb-1">${product.name}</div>
      <div class="text-yellow-400 text-sm mb-2">Rp ${product.price.toLocaleString('id-ID')}</div>
      <p class="text-xs text-gray-300 mb-3">${product.description?.slice(0, 80)}...</p>
      <button 
        class="add-to-cart-btn bg-blue-600 hover:bg-blue-700 text-white w-full py-1 rounded text-sm" 
        data-slug="${product.slug}">
        + Keranjang
      </button>
    </div>
  `;
}
