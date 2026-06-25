// Isi config Firebase kamu di sini dari Firebase Console.
// Jika config belum diisi, aplikasi akan tetap berjalan dengan fallback localStorage.
window.FIREBASE_CONFIG = window.FIREBASE_CONFIG || {
    apiKey: "AIzaSyBRoyT2ogH-9jvhCWEEhd46pa0J98CSUlM",
    authDomain: "kyoya-pro.firebaseapp.com",
    projectId: "kyoya-pro",
    storageBucket: "kyoya-pro.firebasestorage.app",
    messagingSenderId: "964390632463",
    appId: "1:964390632463:web:3a350c36c0ec915c8e777a",
};

window.firebaseApp = null;
window.firebaseDb = null;

function isFirebaseConfigured() {
    const config = window.FIREBASE_CONFIG || {};
    return Object.values(config).every(
        (value) => typeof value === "string" && value && !value.startsWith("ISI_")
    );
}

if (window.firebase && isFirebaseConfigured()) {
    window.firebaseApp = firebase.initializeApp(window.FIREBASE_CONFIG);
    window.firebaseDb = firebase.firestore();
} else if (!isFirebaseConfigured()) {
    console.warn("Firebase config belum diisi. Aplikasi memakai localStorage sebagai fallback.");
} else {
    console.warn("Firebase SDK belum dimuat. Aplikasi memakai localStorage sebagai fallback.");
}

