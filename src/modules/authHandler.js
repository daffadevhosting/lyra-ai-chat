// src/modules/authHandler.js

import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyCLqRflnb2__7D2QyEDsKE4eX42xi7mPTY",
  authDomain: "as-syariahputra.firebaseapp.com",
  projectId: "as-syariahputra",
  appId: "1:623446867158:web:fd4f2d077059589b1d5d77"
};

let auth;
let currentUser = null;

export function initAuth() {
  const app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  onAuthStateChanged(auth, (user) => {
    currentUser = user;
    if (typeof window._onLoginStateChanged === 'function') {
      window._onLoginStateChanged(user);
    }
  });
}

export function login() {
  const provider = new GoogleAuthProvider();
  signInWithPopup(auth, provider).catch((err) => {
    console.error('Login error:', err);
  });
}

export function getCurrentUID() {
  return currentUser?.uid ?? null;
}

export function onLoginStateChanged(callback) {
  window._onLoginStateChanged = callback;
}
