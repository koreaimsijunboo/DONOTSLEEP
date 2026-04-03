import { FaceLandmarker, FilesetResolver } from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/vision_bundle.js";

const video = document.getElementById("video");
const canvasCtx = document.getElementById("output_canvas").getContext("2d");
const timerBar = document.getElementById("timer_bar");
const alarm = document.getElementById("alarm");
const bgm = document.getElementById("bgm");
<<<<<<< HEAD
=======
const loading = document.getElementById("loading");
const earStat = document.getElementById("ear_stat");
const captureList = document.getElementById("capture_list");
const settingsModal = document.getElementById("settings_modal");
const adminModal = document.getElementById("admin_modal");
const adminTag = document.getElementById("admin_tag");
const bulkDelBtn = document.getElementById("bulk_del_btn");
const bgmToggleBtn = document.getElementById("bgm_toggle");
const bgmSelect = document.getElementById("bgm_select");
const customUploadArea = document.getElementById("custom_upload_area");
const bgmFileInput = document.getElementById("bgm_file");
const adminIdInput = document.getElementById("admin_id");
const adminPwInput = document.getElementById("admin_pw");
>>>>>>> 012e5fb (first commit)

let faceLandmarker;
let lastVideoTime = -1;
let closedStartTime = null;
let isCaptured = false;

let isBGMOn = false;
let bgmType = "default";
let isAdmin = false;

const ADMIN_ID = "admin";
const ADMIN_PW = "1234";
let adminCredential = null;

const EAR_THRESHOLD = 0.18;
const LIMIT_MS = 7000;

<<<<<<< HEAD
=======
if (window.localStorage.getItem("tosAccepted") !== "true") {
  window.location.replace("/terms.html");
}

function hideLoading() {
  if (loading) loading.style.display = "none";
}

function showLoadingError(message, error) {
  const detail = error && (error.message || error.name) ? ` (${error.message || error.name})` : "";
  const fullMessage = `${message}${detail}`;

  if (loading) loading.textContent = fullMessage;
  if (earStat) earStat.textContent = fullMessage;
}

function updateAdminUI() {
  if (adminTag) adminTag.style.display = isAdmin ? "block" : "none";
  if (bulkDelBtn) bulkDelBtn.style.display = isAdmin ? "inline-block" : "none";
  document.body.classList.toggle("admin-active", isAdmin);
}

function updateBGMUI() {
  if (bgmToggleBtn) {
    bgmToggleBtn.textContent = isBGMOn ? "ON" : "OFF";
    bgmToggleBtn.classList.toggle("on", isBGMOn);
  }

  if (bgmSelect) bgmSelect.value = bgmType;
  if (customUploadArea) customUploadArea.style.display = bgmType === "custom" ? "flex" : "none";
}

async function loadAdminCredential() {
  try {
    const res = await fetch("assets/manual.txt");
    if (!res.ok) return;

    const txt = await res.text();
    const idMatch = txt.match(/ID\s*:\s*(.+)/i);
    const pwMatch = txt.match(/PW\s*:\s*(.+)/i);

    if (!idMatch || !pwMatch) return;

    adminCredential = {
      id: idMatch[1].trim(),
      pw: pwMatch[1].trim(),
    };
  } catch (e) {
    console.error(e);
  }
}

>>>>>>> 012e5fb (first commit)

// ================= INIT =================
async function init() {
  try {
    const vision = await FilesetResolver.forVisionTasks(
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm"
    );

    faceLandmarker = await FaceLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath:
          "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
        delegate: "GPU",
      },
      runningMode: "VIDEO",
    });

    await loadSettings();
<<<<<<< HEAD
    startCamera();
=======
    await loadAdminCredential();
    updateBGMUI();
    updateAdminUI();
    await loadGallery();
    await startCamera();
    hideLoading();
    predictLoop();
    setInterval(loadGallery, 3000);
>>>>>>> 012e5fb (first commit)

  } catch (e) {
    console.error(e);
  }
}


// ================= GALLERY =================
function formatTime(ts) {
  return new Date(ts * 1000).toLocaleString("ko-KR");
}

async function loadGallery() {
  if (!captureList) return;

  try {
    const res = await fetch("/get-images");
    const images = await res.json();

    if (!Array.isArray(images) || images.length === 0) {
      captureList.innerHTML = `<div class="post-info">아직 저장된 박제 사진이 없습니다.</div>`;
      return;
    }

    captureList.innerHTML = images.map((item) => `
      <div class="post">
        <button class="single-del-btn" onclick="deleteImage('${encodeURIComponent(item.filename)}')">삭제</button>
        <img src="${item.img}" alt="${item.filename}">
        <div class="post-info">${formatTime(item.time)}</div>
      </div>
    `).join("");
  } catch (e) {
    console.error(e);
    captureList.innerHTML = `<div class="post-info">이미지 목록 불러오기 실패</div>`;
  }
}


// ================= CAMERA =================
function startCamera() {
  navigator.mediaDevices.getUserMedia({ video: true })
    .then(stream => {
      video.srcObject = stream;
      video.onloadeddata = () => predictLoop();
    });
}


// ================= SETTINGS (서버) =================
function saveSettings() {
  fetch("/save-settings", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ isBGMOn, bgmType })
  });
}

async function loadSettings() {
  const res = await fetch("/get-settings");
  const s = await res.json();

  isBGMOn = s.isBGMOn || false;
  bgmType = s.bgmType || "default";
}

function openSettings() {
  if (settingsModal) settingsModal.style.display = "block";
}

function closeSettings() {
  if (settingsModal) settingsModal.style.display = "none";
}

function handleAuthClick() {
  if (adminModal) adminModal.style.display = "block";
}

function closeAuth() {
  if (adminModal) adminModal.style.display = "none";
  if (window.grecaptcha?.reset) window.grecaptcha.reset();
}

function verifyAdmin() {
  const id = (adminIdInput?.value || "").trim();
  const pw = (adminPwInput?.value || "").trim();

  if (id === "doom" && pw === "doom") {
    closeAuth();
    window.location.href = "/doom/index.html";
    return;
  }

  const captchaToken = window.grecaptcha?.getResponse ? window.grecaptcha.getResponse() : "";
  if (!captchaToken) {
    alert("reCAPTCHA를 먼저 완료해주세요.");
    return;
  }

  const expectedId = adminCredential?.id || ADMIN_ID;
  const expectedPw = adminCredential?.pw || ADMIN_PW;

  const isMaskedPw = /^\*+$/.test(expectedPw);
  const idOk = id === expectedId;
  const pwOk = isMaskedPw ? pw.length > 0 : pw === expectedPw;

  if (idOk && pwOk) {
    isAdmin = true;
    updateAdminUI();
    closeAuth();
    return;
  }

  alert("ID 또는 PW가 올바르지 않습니다.");
  if (window.grecaptcha?.reset) window.grecaptcha.reset();
}

async function deleteAll() {
  if (!isAdmin) {
    alert("관리자 인증이 필요합니다.");
    return;
  }

  if (!confirm("모든 박제 사진을 삭제할까요?")) return;

  try {
    await fetch("/delete-all", { method: "POST" });
    await loadGallery();
  } catch (e) {
    console.error(e);
    alert("전체삭제 실패");
  }
}

async function deleteImage(encodedFilename) {
  if (!isAdmin) {
    alert("관리자 인증이 필요합니다.");
    return;
  }

  const filename = decodeURIComponent(encodedFilename);
  if (!confirm(`이 사진을 삭제할까요?\n${filename}`)) return;

  try {
    await fetch("/delete-image", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ filename }),
    });
    await loadGallery();
  } catch (e) {
    console.error(e);
    alert("사진 삭제 실패");
  }
}

function toggleBGM() {
  isBGMOn = !isBGMOn;
  updateBGMUI();
  saveSettings();

  if (isBGMOn) {
    bgm.play().catch(() => {});
  } else {
    bgm.pause();
    bgm.currentTime = 0;
  }
}

function changeBGMType() {
  bgmType = bgmSelect?.value || "default";
  updateBGMUI();
  saveSettings();
}

function handleBGMUpload() {
  const file = bgmFileInput?.files?.[0];
  if (!file) return;

  const url = URL.createObjectURL(file);
  bgm.src = url;

  if (isBGMOn) bgm.play().catch(() => {});
}

function enableAudioContext() {
  if (isBGMOn) bgm.play().catch(() => {});
}

async function requestCameraAgain() {
  try {
    await startCamera();
    hideLoading();
  } catch (e) {
    console.error(e);
  }
}


// ================= AI =================
function predictLoop() {

  if (!faceLandmarker) return;

  if (lastVideoTime !== video.currentTime) {

    lastVideoTime = video.currentTime;

    const res = faceLandmarker.detectForVideo(video, performance.now());

    if (res.faceLandmarks && res.faceLandmarks[0]) {

      const ear = calculateEAR(res.faceLandmarks[0]);

      if (ear < EAR_THRESHOLD) {

        if (!closedStartTime) closedStartTime = performance.now();

        const elapsed = performance.now() - closedStartTime;
        timerBar.style.width = `${(elapsed / LIMIT_MS) * 100}%`;

        if (elapsed > LIMIT_MS) {

          if (!isCaptured) {
            saveToGallery();
            isCaptured = true;
          }

          alarm.play();
        }

      } else {

        closedStartTime = null;
        isCaptured = false;
        timerBar.style.width = "0%";

        alarm.pause();
        alarm.currentTime = 0;
      }
    }
  }

  requestAnimationFrame(predictLoop);
}


// ================= EAR =================
function calculateEAR(lm) {
  const getE = (i) => {
    const p = i.map(idx => lm[idx]);

    return (
      (Math.hypot(p[1].x - p[5].x, p[1].y - p[5].y) +
        Math.hypot(p[2].x - p[4].x, p[2].y - p[4].y)) /
      (Math.hypot(p[0].x - p[3].x, p[0].y - p[3].y) * 2)
    );
  };

  return (
    (getE([33,160,158,133,153,144]) +
     getE([362,385,387,263,373,380])) / 2
  );
}


// ================= SAVE IMAGE =================
function saveToGallery() {

  const tmp = document.createElement("canvas");
  tmp.width = 640;
  tmp.height = 480;

  const ctx = tmp.getContext("2d");
  ctx.translate(640, 0);
  ctx.scale(-1, 1);
  ctx.drawImage(video, 0, 0);

  fetch("/save-image", {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({
      image: tmp.toDataURL(),
      filename: `capture_${Date.now()}.png`
    })
  }).then(() => loadGallery()).catch(console.error);
}

window.openSettings = openSettings;
window.closeSettings = closeSettings;
window.handleAuthClick = handleAuthClick;
window.verifyAdmin = verifyAdmin;
window.closeAuth = closeAuth;
window.deleteAll = deleteAll;
window.toggleBGM = toggleBGM;
window.changeBGMType = changeBGMType;
window.handleBGMUpload = handleBGMUpload;
window.requestCameraAgain = requestCameraAgain;
window.enableAudioContext = enableAudioContext;
window.deleteImage = deleteImage;

<<<<<<< HEAD
init();
=======
if (loading) loading.style.display = "flex";
init();
>>>>>>> 012e5fb (first commit)
