// src/modules/authHandler.js
import { getFirestore, doc, setDoc, getDoc } from "firebase/firestore";
import { getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged } from 'firebase/auth';
import { initializeApp } from 'firebase/app';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
};

let auth;
let currentUser = null;
let authInitialized = false;

export function initAuth() {
  if (authInitialized) return;
  const app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  onAuthStateChanged(auth, (user) => {
    currentUser = user;
    if (typeof window._onLoginStateChanged === 'function') {
      window._onLoginStateChanged(user);
    }
  });
  authInitialized = true;
}

export function login() {
  const provider = new GoogleAuthProvider();
  signInWithPopup(auth, provider).catch((err) => {
    console.error('Login error:', err);
  });
}

export function logout() {
  if (!auth) return;
  return auth.signOut().then(() => {
    console.log('✅ Logout sukses');
  }).catch(err => {
    console.error('❌ Logout gagal:', err);
  });
}

export function getCurrentUID() {
  return currentUser?.uid ?? null;
}

export function onLoginStateChanged(callback) {
  window._onLoginStateChanged = callback;
  if (typeof currentUser !== 'undefined') {
    callback(currentUser);
  }
}
async function saveUserIfNew(user) {
  const db = getFirestore();
  const userRef = doc(db, 'users', user.uid);
  const snap = await getDoc(userRef);

  if (!snap.exists()) {
    await setDoc(userRef, {
      uid: user.uid,
      nama: user.displayName || 'Pengguna Baru',
      email: user.email || '-',
      totalOrder: 0,
      level: 'Member',
      createdAt: new Date()
    });
    console.log('✅ User baru disimpan ke Firestore');
  }
}