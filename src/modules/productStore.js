// src/modules/productStore.js

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, getDocs } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBYyqPWnDD8QLFka3QQ5tbhTsovxX4XePs",
  authDomain: "lyra-ai-olshop.firebaseapp.com",
  projectId: "lyra-ai-olshop",
  appId: "1:660548874119:web:e4655c72cac3012afead22"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export async function addProduct(data) {
  try {
    await addDoc(collection(db, 'products'), data);
    console.log('✅ Produk berhasil ditambahkan');
  } catch (err) {
    console.error('❌ Gagal menambahkan produk:', err);
  }
}

export async function fetchProducts() {
  const querySnapshot = await getDocs(collection(db, 'products'));
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}
