class CartManager {
  constructor() {
    this.items = {}; // key: slug, value: { product, qty }
    this.listeners = new Set();
  }

  addItem(product) {
    if (!product || !product.slug) return;

    const key = product.slug;
    if (this.items[key]) {
      this.items[key].qty += 1;
    } else {
      this.items[key] = {
        ...product,
        qty: 1,
      };
    }

    this.notifyListeners();
  }

  removeBySlug(slug) {
    if (this.items[slug]) {
      delete this.items[slug];
      this.notifyListeners();
    }
  }

  clear() {
    this.items = {};
    this.notifyListeners();
  }

  getCartSummary() {
    const values = Object.values(this.items);

    const cartList = values.map((item, i) => {
      const subtotal = item.qty * item.price;
      return `${i + 1}. ${item.name} x${item.qty} – Rp ${subtotal.toLocaleString('id-ID')}`;
    }).join('\n');

    const total = values.reduce((sum, item) => sum + (item.price * item.qty), 0);

    return {
      isEmpty: values.length === 0,
      cartList,
      total,
      qty: values.reduce((sum, item) => sum + item.qty, 0),
      items: values,
    };
  }

  addListener(callback) {
    this.listeners.add(callback);
  }

  removeListener(callback) {
    this.listeners.delete(callback);
  }

  notifyListeners() {
    const summary = this.getCartSummary();
    this.listeners.forEach(callback => callback(summary));
  }
}

export const cartManager = new CartManager();
