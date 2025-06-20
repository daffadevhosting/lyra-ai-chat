import midtransClient from 'midtrans-client';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { user, cart } = JSON.parse(req.body);

    // Total harga dari cart
    const total = cart.reduce((sum, item) => sum + (item.price * (item.qty || 1)), 0);

    // Inisialisasi Snap
    const snap = new midtransClient.Snap({
      isProduction: false, // ganti true kalau sudah live
      serverKey: process.env.VITE_MIDTRANS_SERVER_KEY,
      clientKey: process.env.VITE_MIDTRANS_CLIENT_KEY,
    });

    // Buat parameter transaksi
    const parameter = {
      transaction_details: {
        order_id: `order-${Date.now()}`,
        gross_amount: total,
      },
      customer_details: {
      first_name: user.nama || 'Lyra',
      phone: user['no_wa'] || '',
      email: `${user.nama?.replace(/\s+/g, '').toLowerCase()}@lyra.chat`,
      shipping_address: {
            address: user.alamat || '',
        }
      },
      item_details: cart.map(item => ({
        id: item.slug,
        price: item.price,
        quantity: item.qty || 1,
        name: item.name.slice(0, 50),
      }))
    };

    // Request Snap Token
    const snapResponse = await snap.createTransaction(parameter);
    return res.status(200).json({ snapToken: snapResponse.token });
  } catch (err) {
    console.error('Midtrans Error:', err.message || err);
    return res.status(500).json({ error: 'Failed to create transaction' });
  }
}
