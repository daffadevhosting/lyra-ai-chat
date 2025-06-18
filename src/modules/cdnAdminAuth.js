// src/modules/cdnAdminAuth.js

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getAuth,
  signInWithEmailAndPassword,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import {
  getFirestore,
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBYyqPWnDD8QLFka3QQ5tbhTsovxX4XePs",
  authDomain: "lyra-ai-olshop.firebaseapp.com",
  projectId: "lyra-ai-olshop",
  appId: "1:660548874119:web:e4655c72cac3012afead22"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export function initCDNAdminAuth() {
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists() && userSnap.data().isAdmin === true) {
        window.location.href = "/admin";
      }
    }
  });
}

export async function loginAdminWithEmail(email, password) {
  try {
    const result = await signInWithEmailAndPassword(auth, email, password);
    const user = result.user;
    const userRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists() || userSnap.data().isAdmin !== true) {
      throw new Error("Bukan admin yang sah");
    }
    window.location.href = "/admin";
  } catch (err) {
    throw err;
  }
}
