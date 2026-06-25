// Isi config Firebase kamu di sini dari Firebase Console.
// Jika config belum diisi, aplikasi akan tetap berjalan dengan fallback localStorage.
window.FIREBASE_CONFIG = window.FIREBASE_CONFIG || {
    apiKey: "ISI_API_KEY",
    authDomain: "ISI_AUTH_DOMAIN",
    projectId: "ISI_PROJECT_ID",
    storageBucket: "ISI_STORAGE_BUCKET",
    messagingSenderId: "ISI_MESSAGING_SENDER_ID",
    appId: "ISI_APP_ID",
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

