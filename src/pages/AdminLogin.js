// src/pages/AdminLogin.js

import { loginAdminWithEmail, initCDNAdminAuth } from '../modules/cdnAdminAuth.js';

export default function AdminLogin() {
  return `
    <div class="min-h-screen flex items-center justify-center bg-[#1d1f2b] text-white font-sans">
      <form id="adminLoginForm" class="bg-[#2a2c3b] p-6 rounded-lg space-y-4 w-full max-w-sm border border-purple-500">
        <h2 class="text-xl font-bold">🔐 Admin Login</h2>
        <input type="email" id="admin-email" placeholder="Email" required class="w-full p-2 rounded bg-gray-800 border border-gray-600" />
        <input type="password" id="admin-password" placeholder="Password" required class="w-full p-2 rounded bg-gray-800 border border-gray-600" />
        <button type="submit" class="w-full bg-purple-600 p-2 rounded" id="loginBtn">Login</button>
        <div id="loginError" class="text-red-400 text-sm hidden"></div>
        <div id="loginSuccess" class="text-green-400 text-sm hidden">Login berhasil! Mengalihkan...</div>
      </form>
    </div>
  `;
}

export function initAdminLoginPage() {
  initCDNAdminAuth(); // cek & redirect kalau udah login admin

  const form = document.getElementById("adminLoginForm");
  const error = document.getElementById("loginError");
  const success = document.getElementById("loginSuccess");

  form?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("admin-email").value;
    const password = document.getElementById("admin-password").value;

    error.classList.add("hidden");
    success.classList.add("hidden");

    try {
      await loginAdminWithEmail(email, password);
      success.classList.remove("hidden");
    } catch (err) {
      error.textContent = err.message || "Login gagal. Coba lagi.";
      error.classList.remove("hidden");
    }
  });
}
