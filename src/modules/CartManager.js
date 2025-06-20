class CartManager {
  constructor() {
    this.items = [];
    this.listeners = new Set();
  }

  addItem(product) {
    if (!product) return;
    this.items.push(product);
    this.notifyListeners();
  }

  getCartSummary() {
    const cartMap = {};
    this.items.forEach(p => {
      if (!cartMap[p.slug]) {
        cartMap[p.slug] = { ...p, qty: 1 };
      } else {
        cartMap[p.slug].qty += 1;
      }
    });

    const cartList = Object.values(cartMap).map((item, i) => {
      const subtotal = item.qty * item.price;
      return `${i + 1}. ${item.name} x${item.qty} - Rp ${subtotal.toLocaleString('id-ID')}`;
    }).join('\n');

    const total = Object.values(cartMap).reduce((sum, item) => sum + (item.price * item.qty), 0);

    return {
      isEmpty: this.items.length === 0,
      cartList,
      total
    };
  }

  addListener(callback) {
    this.listeners.add(callback);
  }

  removeListener(callback) {
    this.listeners.delete(callback);
  }

  notifyListeners() {
    this.listeners.forEach(callback => callback(this.getCartSummary()));
  }

  clear() {
    this.items = [];
    this.notifyListeners();
  }
}

export const cartManager = new CartManager();
