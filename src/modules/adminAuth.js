// src/modules/adminAuth.js

import { initializeApp, getApps } from 'firebase/app';
import {
  getAuth,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut
} from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyBYyqPWnDD8QLFka3QQ5tbhTsovxX4XePs",
  authDomain: "lyra-ai-olshop.firebaseapp.com",
  projectId: "lyra-ai-olshop",
  appId: "1:660548874119:web:e4655c72cac3012afead22"
};

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
const auth = getAuth(app);
let authInitialized = false;

export function initAuth() {
  if (authInitialized) return;
  // optional: bisa tambahkan logic listener di sini jika perlu
  authInitialized = true;
}

export async function loginWithEmail(email, password) {
  try {
    await signInWithEmailAndPassword(auth, email, password);
    return { success: true };
  } catch (error) {
    return { success: false, message: error.message };
  }
}

export function onLoginStateChanged(callback) {
  onAuthStateChanged(auth, (user) => {
    callback(user);
  });
  // Panggil callback langsung jika user sudah login
  if (typeof auth.currentUser !== 'undefined') {
    callback(auth.currentUser);
  }
}

export function logoutAdmin() {
  return signOut(auth);
}

export function getCurrentUser() {
  return auth.currentUser;
}
