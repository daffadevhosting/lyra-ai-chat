// src/modules/authHandler.js

import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged } from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

let auth;
let currentUser = null;
let authInitialized = false;

export function initAuth() {
  if (authInitialized) return;
  const app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  onAuthStateChanged(auth, (user) => {
  if (user) {
  localStorage.setItem('uid', user.uid); // disimpan
    localStorage.setItem('user', JSON.stringify({
      uid: user.uid,
      displayName: user.displayName || '',
      email: user.email || ''
    }));
    currentUser = user;
  }
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
