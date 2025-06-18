// src/modules/authHandler.js

import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyBYyqPWnDD8QLFka3QQ5tbhTsovxX4XePs",
  authDomain: "lyra-ai-olshop.firebaseapp.com",
  projectId: "lyra-ai-olshop",
  appId: "1:660548874119:web:e4655c72cac3012afead22"
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
