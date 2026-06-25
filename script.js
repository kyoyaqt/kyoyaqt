import {
    HandLandmarker,
    FilesetResolver
} from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest";

const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const logElement = document.getElementById("log");

// ======================
// DAFTAR GAMBAR
// Tambahkan path gambar Anda di sini
// ======================
const images = [
    "aset/gambar.png",
    "aset/gambar2.png",
    "aset/gambar3.png",
    "aset/gambar4.png",
    "aset/gambar5.png",
];

const handImage = new Image();
handImage.src = images[0];

let detector;
let previousHandCount = -1;
let currentScale = 1;
let currentImageIndex = 0;
let wasHandClosed = false;

// dipakai untuk deteksi ganti gambar saat tangan mengepal lalu membuka

// ======================
// LOG
// ======================
function addLog(message) {
    const time = new Date().toLocaleTimeString();
    logElement.textContent =
        `[${time}] ${message}\n` +
        logElement.textContent;

    const lines = logElement.textContent.split("\n");
    if (lines.length > 20) {
        logElement.textContent = lines.slice(0, 20).join("\n");
    }
}

// ======================
// KAMERA
// ======================
async function setupCamera() {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    video.srcObject = stream;

    return new Promise(resolve => {
        video.onloadedmetadata = () => {
            video.play();
            resolve(video);
        };
    });
}

// ======================
// MEDIAPIPE
// ======================
async function createDetector() {
    const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
    );

    detector = await HandLandmarker.createFromOptions(vision, {
        baseOptions: {
            modelAssetPath:
                "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task"
        },
        runningMode: "VIDEO",
        numHands: 2
    });
}

// ======================
// GAMBAR LANDMARK
// ======================
function drawHand(hand) {
    const connections = [
        [0,1],[1,2],[2,3],[3,4],
        [0,5],[5,6],[6,7],[7,8],
        [5,9],[9,10],[10,11],[11,12],
        [9,13],[13,14],[14,15],[15,16],
        [13,17],[17,18],[18,19],[19,20],
        [0,17]
    ];

    ctx.strokeStyle = "#00ff00";
    ctx.lineWidth = 3;

    connections.forEach(([start, end]) => {
        const p1 = hand[start];
        const p2 = hand[end];
        ctx.beginPath();
        ctx.moveTo(p1.x * canvas.width, p1.y * canvas.height);
        ctx.lineTo(p2.x * canvas.width, p2.y * canvas.height);
        ctx.stroke();
    });

    hand.forEach((point, index) => {
        const x = point.x * canvas.width;
        const y = point.y * canvas.height;
        ctx.beginPath();
        ctx.arc(x, y, 6, 0, Math.PI * 2);
        ctx.fillStyle = "#00ff00";
        ctx.fill();
        ctx.fillStyle = "#ffffff";
        ctx.font = "12px Arial";
        ctx.fillText(index, x + 8, y - 8);
    });
}

// ======================
// DETEKSI TELAPAK TERBUKA
// ======================
function isHandOpen(hand) {
    const tips = [8, 12, 16, 20];
    const pips = [6, 10, 14, 18];

    let openFingers = 0;

    for (let i = 0; i < 4; i++) {
        if (hand[tips[i]].y < hand[pips[i]].y) {
            openFingers++;
        }
    }

    // Cek jempol
    if (Math.abs(hand[4].x - hand[3].x) > 0.03) {
        openFingers++;
    }

    return openFingers >= 4;
}

// ======================
// DETEKSI TELAPAK TERTUTUP (KEPALAN)
// ======================
function isHandClosed(hand) {
    const tips = [8, 12, 16, 20];
    const pips = [6, 10, 14, 18];

    let closedFingers = 0;

    for (let i = 0; i < 4; i++) {
        if (hand[tips[i]].y > hand[pips[i]].y) {
            closedFingers++;
        }
    }

    return closedFingers >= 4;
}

// ======================
// GANTI GAMBAR
// ======================
function nextImage() {
    if (images.length === 0) return;

    currentImageIndex++;
    if (currentImageIndex >= images.length) {
        currentImageIndex = 0;
    }

    handImage.src = images[currentImageIndex];
    addLog(`Gambar berubah ke ${currentImageIndex + 1}`);
}

// ======================
// HITUNG TITIK TENGAH TELAPAK
// ======================
function getPalmCenter(hand) {
    const palmPoints = [0, 1, 5, 9, 13, 17];
    let x = 0, y = 0;

    palmPoints.forEach(i => {
        x += hand[i].x;
        y += hand[i].y;
    });

    return {
        x: x / palmPoints.length,
        y: y / palmPoints.length
    };
}

// ======================
// TAMPILKAN GAMBAR DI ATAS SATU TANGAN
// ======================
function drawImageOnHand(hand) {
    const palmPoints = [0, 1, 5, 9, 13, 17];

    let centerX = 0, centerY = 0;
    palmPoints.forEach(i => {
        centerX += hand[i].x;
        centerY += hand[i].y;
    });
    centerX /= palmPoints.length;
    centerY /= palmPoints.length;

    const x = centerX * canvas.width;
    const y = centerY * canvas.height;

    const palmWidth = Math.hypot(
        (hand[5].x - hand[17].x) * canvas.width,
        (hand[5].y - hand[17].y) * canvas.height
    );

    const imageSize = palmWidth * 2;

    ctx.save();
    ctx.translate(x, y);
    ctx.scale(-1, 1); // Membatalkan mirror dari canvas
    ctx.drawImage(handImage, -imageSize / 2, -imageSize / 2, imageSize, imageSize);
    ctx.restore();
}

// ======================
// TAMPILKAN GAMBAR DI ANTARA DUA TANGAN
// ======================
function drawImageBetweenHands(hand1, hand2) {
    const p1 = getPalmCenter(hand1);
    const p2 = getPalmCenter(hand2);

    const x1 = p1.x * canvas.width;
    const y1 = p1.y * canvas.height;
    const x2 = p2.x * canvas.width;
    const y2 = p2.y * canvas.height;

    const distance = Math.hypot(x2 - x1, y2 - y1);

    // Smooth scaling berdasarkan jarak dua telapak
    const targetScale = Math.max(0.5, Math.min(distance / 250, 4));
    currentScale = currentScale * 0.85 + targetScale * 0.15;

    const centerX = (x1 + x2) / 2;
    const centerY = (y1 + y2) / 2;
    const imageSize = 200 * currentScale;

    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.scale(-1, 1); // Jika canvas mirror
    ctx.drawImage(handImage, -imageSize / 2, -imageSize / 2, imageSize, imageSize);
    ctx.restore();
}

// ======================
// DETEKSI FRAME
// ======================
async function detect() {
    // Pastikan video siap sebelum deteksi
    if (video.readyState < 2) {
        requestAnimationFrame(detect);
        return;
    }

    const results = detector.detectForVideo(video, performance.now());

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const handCount = results.landmarks?.length || 0;

    if (handCount !== previousHandCount) {
        if (handCount > 0) {
            addLog(`${handCount} tangan terdeteksi`);
        } else {
            addLog("Tidak ada tangan terdeteksi");
        }
        previousHandCount = handCount;
    }

    const openedHands = [];
    let hasClosedHand = false;

    results.landmarks.forEach((hand) => {
        drawHand(hand);

        if (isHandOpen(hand)) {
            openedHands.push(hand);
        }

        if (isHandClosed(hand)) {
            hasClosedHand = true;
        }
    });

    // Ganti gambar saat tangan mengepal (closed) lalu membuka kembali
    if (hasClosedHand) {
        wasHandClosed = true;
    } else if (wasHandClosed && openedHands.length > 0) {
        wasHandClosed = false;
        nextImage();
    }

    if (openedHands.length === 1) {
        drawImageOnHand(openedHands[0]);
    } else if (openedHands.length >= 2) {
        drawImageBetweenHands(openedHands[0], openedHands[1]);
    }

    requestAnimationFrame(detect);
}

// ======================
// START
// ======================
async function start() {
    addLog("Memulai kamera...");
    await setupCamera();

    // Set ukuran canvas setelah video siap
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    addLog("Memuat model AI...");
    await createDetector();

    addLog("Deteksi tangan aktif");
    detect();
}

start();