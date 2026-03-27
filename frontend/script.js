import { FaceLandmarker, FilesetResolver } from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/vision_bundle.js";

const video = document.getElementById("video");
const canvasCtx = document.getElementById("output_canvas").getContext("2d");
const timerBar = document.getElementById("timer_bar");
const alarm = document.getElementById("alarm");
const bgm = document.getElementById("bgm");

let faceLandmarker;
let lastVideoTime = -1;
let closedStartTime = null;
let isCaptured = false;

let isBGMOn = false;
let bgmType = "default";

const EAR_THRESHOLD = 0.18;
const LIMIT_MS = 7000;


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
    startCamera();

  } catch (e) {
    console.error(e);
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
  });
}


init();