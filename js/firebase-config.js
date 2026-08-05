// ==================== FIREBASE CONFIG ====================
// Shared Firebase initialization for Ghoroa marketplace

const firebaseConfig = {
  apiKey: "AIzaSyAZJvawBP5EngCVgT2RXO3EqADhDj3Rdik",
  authDomain: "ghoroa-3cb2e.firebaseapp.com",
  projectId: "ghoroa-3cb2e",
  storageBucket: "ghoroa-3cb2e.firebasestorage.app",
  messagingSenderId: "118457030823",
  appId: "1:118457030823:web:924c79021d5db3d1652382",
  measurementId: "G-7YHRRFZC18"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Firebase services (safe init - won't crash if SDK not loaded)
const db = firebase.firestore();
let auth = null;
let storage = null;
try { auth = firebase.auth(); } catch(e) {}
try { storage = firebase.storage(); } catch(e) {}

// Admin email
const ADMIN_EMAIL = "dr.johir@gmail.com";
