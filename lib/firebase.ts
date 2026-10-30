import { getApp, getApps, initializeApp } from "firebase/app";
import { connectFirestoreEmulator, getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDFKhX7RF8PC9Xq4yjrBD6A3bc_vfzHE-Y",
  authDomain: "collaborative-todo-app-b4f0b.firebaseapp.com",
  projectId: "collaborative-todo-app-b4f0b",
  storageBucket: "collaborative-todo-app-b4f0b.firebasestorage.app",
  messagingSenderId: "31797880828",
  appId: "1:31797880828:web:23c9c3493d6583f06bf479",
  measurementId: "G-L0ZEMF2HPF",
};

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

export const db = getFirestore(app);

// Optional local development against the Firebase Emulator Suite.
const emulatorHost = process.env.NEXT_PUBLIC_FIREBASE_EMULATOR_HOST;
if (emulatorHost) {
  const [host, port] = emulatorHost.split(":");
  connectFirestoreEmulator(db, host || "127.0.0.1", Number(port) || 8080);
}
