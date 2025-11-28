import * as THREE from "https://unpkg.com/three@0.161.0/build/three.module.js";

const PARTICLE_COUNT = 12000;
const container = document.getElementById("scene-container");
const colorPicker = document.getElementById("colorPicker");
const shapeSelect = document.getElementById("shapeSelect");
const gestureStatus = document.getElementById("gestureStatus");
const fullscreenBtn = document.getElementById("fullscreenBtn");
const videoElement = document.getElementById("input-video");

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x000000, 0);
container.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x010104, 0.002);

const camera = new THREE.PerspectiveCamera(
  55,
  window.innerWidth / window.innerHeight,
  0.1,
  2000
);
camera.position.set(0, 0, 260);

const geometry = new THREE.BufferGeometry();
const positions = new Float32Array(PARTICLE_COUNT * 3);
const randomDistribution = new Float32Array(PARTICLE_COUNT * 3);
const noiseSeeds = new Float32Array(PARTICLE_COUNT);

for (let i = 0; i < PARTICLE_COUNT; i++) {
  const idx = i * 3;
  const spread = 200;
  positions[idx] = (Math.random() - 0.5) * spread;
  positions[idx + 1] = (Math.random() - 0.5) * spread;
  positions[idx + 2] = (Math.random() - 0.5) * spread;

  randomDistribution[idx] = (Math.random() - 0.5) * spread;
  randomDistribution[idx + 1] = (Math.random() - 0.5) * spread;
  randomDistribution[idx + 2] = (Math.random() - 0.5) * spread;

  noiseSeeds[i] = Math.random() * Math.PI * 2;
}

geometry.setAttribute(
  "position",
  new THREE.BufferAttribute(positions, 3)
);

const spriteTexture = createCircleTexture();
const material = new THREE.PointsMaterial({
  color: new THREE.Color(colorPicker.value),
  size: 1.9,
  sizeAttenuation: true,
  map: spriteTexture,
  transparent: true,
  opacity: 0.95,
  depthWrite: false,
  blending: THREE.AdditiveBlending,
});

const particles = new THREE.Points(geometry, material);
scene.add(particles);

const lights = new THREE.Group();
scene.add(lights);

const ambient = new THREE.AmbientLight(0xffffff, 0.3);
lights.add(ambient);

const accentLight = new THREE.PointLight(0xff55dd, 2.4, 600);
accentLight.position.set(120, 60, 120);
lights.add(accentLight);

const rimLight = new THREE.PointLight(0x5fd1ff, 1.2, 500);
rimLight.position.set(-140, -40, -60);
lights.add(rimLight);

let currentShapeData = new Float32Array(PARTICLE_COUNT * 3);
let spread = 1;
let spreadTarget = 1;
let diffusion = 0.15;
let diffusionTarget = 0.15;
let pointer = { x: 0, y: 0 };
let handOffsetX = 0;
let handOffsetXTarget = 0;

shapeSelect.addEventListener("change", (event) => {
  setShape(event.target.value);
});

colorPicker.addEventListener("input", (event) => {
  const value = event.target.value;
  material.color.set(value);
  document.documentElement.style.setProperty("--accent", value);
});

fullscreenBtn.addEventListener("click", () => {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen().catch(() => {});
  } else {
    document.exitFullscreen();
  }
});

window.addEventListener("resize", () => {
  const { innerWidth, innerHeight } = window;
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});

window.addEventListener("pointermove", (event) => {
  const ratioX = (event.clientX / window.innerWidth - 0.5) * 2;
  const ratioY = (event.clientY / window.innerHeight - 0.5) * 2;
  pointer = { x: ratioX, y: ratioY };
});

function animate(time) {
  requestAnimationFrame(animate);
  const elapsed = time * 0.0006;

  spread += (spreadTarget - spread) * 0.08;
  diffusion += (diffusionTarget - diffusion) * 0.08;

  camera.position.x += (pointer.x * 40 - camera.position.x) * 0.03;
  camera.position.y += (-pointer.y * 30 - camera.position.y) * 0.03;
  camera.lookAt(0, 0, 0);

  handOffsetX += (handOffsetXTarget - handOffsetX) * 0.1;
  particles.position.x += (handOffsetX - particles.position.x) * 0.08;

  const posAttr = geometry.attributes.position;
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const idx = i * 3;
    const baseX = currentShapeData[idx] || randomDistribution[idx];
    const baseY = currentShapeData[idx + 1] || randomDistribution[idx + 1];
    const baseZ = currentShapeData[idx + 2] || randomDistribution[idx + 2];

    const wobble = diffusion * 6;
    const offset = noiseSeeds[i];
    const nx = Math.sin(elapsed + offset) * wobble;
    const ny = Math.cos(elapsed * 1.2 + offset * 1.1) * wobble;
    const nz = Math.sin(elapsed * 0.7 + offset * 0.8) * wobble;

    const targetX = baseX * spread + nx;
    const targetY = baseY * spread + ny;
    const targetZ = baseZ * spread + nz;

    positions[idx] += (targetX - positions[idx]) * 0.08;
    positions[idx + 1] += (targetY - positions[idx + 1]) * 0.08;
    positions[idx + 2] += (targetZ - positions[idx + 2]) * 0.08;
  }

  posAttr.needsUpdate = true;
  particles.rotation.y += 0.0006;
  particles.rotation.x += 0.00025;

  renderer.render(scene, camera);
}

animate(0);

function setShape(type) {
  const generator = shapeGenerators[type];
  if (!generator) return;
  currentShapeData = generator(PARTICLE_COUNT);
}

function generateHeart(count) {
  return fillBuffer(count, () => {
    const t = Math.random() * Math.PI * 2;
    const depth = (Math.random() - 0.5) * 8;
    const x = 16 * Math.pow(Math.sin(t), 3);
    const y =
      13 * Math.cos(t) -
      5 * Math.cos(2 * t) -
      2 * Math.cos(3 * t) -
      Math.cos(4 * t);
    return {
      x: x * 2,
      y: y * 2,
      z: depth * 1.5,
    };
  });
}

function generateFlower(count) {
  return fillBuffer(count, () => {
    const petals = 6;
    const angle = Math.random() * Math.PI * 2;
    const swirl = angle + Math.sin(angle * 2.5) * 0.25;
    const layer = Math.random();

    if (layer < 0.2) {
      const r = Math.pow(Math.random(), 0.6) * 7;
      const theta = angle;
      const budHeight = (1 - r / 7) * 6 + (Math.random() - 0.5) * 1.5;
      return {
        x: Math.cos(theta) * r,
        y: budHeight,
        z: Math.sin(theta) * r,
      };
    }

    if (layer < 0.85) {
      const petalWave = Math.sin(angle * petals) * 0.5 + 0.5;
      const radius = 18 + petalWave * 14 + Math.random() * 4;
      const curl = Math.cos(angle * 0.5) * 5;
      return {
        x: Math.cos(swirl) * radius,
        y: curl + petalWave * 8 + (Math.random() - 0.5) * 3,
        z: Math.sin(swirl) * radius + Math.sin(angle * petals * 0.5) * 4,
      };
    }

    const haloRadius = 32 + Math.random() * 10;
    return {
      x: Math.cos(angle) * haloRadius,
      y: -8 + (Math.random() - 0.5) * 6,
      z: Math.sin(angle) * haloRadius + Math.cos(angle * petals) * 4,
    };
  });
}

function generateSaturn(count) {
  return fillBuffer(count, () => {
    if (Math.random() < 0.65) {
      return randomPointInSphere(26);
    }
    const angle = Math.random() * Math.PI * 2;
    const radius = 42 + Math.sin(angle * 4) * 4;
    const width = (Math.random() - 0.5) * 8;
    return {
      x: Math.cos(angle) * radius,
      y: width,
      z: Math.sin(angle) * radius,
    };
  });
}

function generateBuddha(count) {
  const parts = [
    { center: [0, 34, 0], radius: 10 },
    { center: [0, 16, 0], radius: 16 },
    { center: [0, -6, 0], radius: 20 },
    { center: [-12, -14, 4], radius: 12 },
    { center: [12, -14, -4], radius: 12 },
    { center: [-16, -28, 0], radius: 14 },
    { center: [16, -28, 0], radius: 14 },
    { center: [0, -36, 0], radius: 18 },
  ];
  return fillBuffer(count, () => {
    const part = parts[Math.floor(Math.random() * parts.length)];
    const { x, y, z } = randomPointInSphere(part.radius);
    return {
      x: x + part.center[0],
      y: y + part.center[1],
      z: z + part.center[2],
    };
  });
}

function generateFirework(count) {
  const blasts = 6;
  const centers = Array.from({ length: blasts }, (_, i) => ({
    x: Math.sin((i / blasts) * Math.PI * 2) * 24,
    y: Math.cos((i / blasts) * Math.PI * 2) * 24,
    z: (Math.random() - 0.5) * 20,
  }));
  return fillBuffer(count, () => {
    const origin = centers[Math.floor(Math.random() * centers.length)];
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    const radius = 8 + Math.random() * 48;
    return {
      x: origin.x + Math.sin(phi) * Math.cos(theta) * radius,
      y: origin.y + Math.cos(phi) * radius,
      z: origin.z + Math.sin(phi) * Math.sin(theta) * radius,
    };
  });
}

function fillBuffer(count, sampler) {
  const data = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const { x, y, z } = sampler(i);
    const idx = i * 3;
    data[idx] = x;
    data[idx + 1] = y;
    data[idx + 2] = z;
  }
  return data;
}

function randomPointInSphere(radius) {
  const u = Math.random();
  const v = Math.random();
  const theta = 2 * Math.PI * u;
  const phi = Math.acos(2 * v - 1);
  const r = Math.cbrt(Math.random()) * radius;
  const sinPhi = Math.sin(phi);
  return {
    x: r * sinPhi * Math.cos(theta),
    y: r * Math.cos(phi),
    z: r * sinPhi * Math.sin(theta),
  };
}

function createCircleTexture() {
  const size = 128;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d");
  const gradient = ctx.createRadialGradient(
    size / 2,
    size / 2,
    0,
    size / 2,
    size / 2,
    size / 2
  );
  gradient.addColorStop(0, "rgba(255,255,255,1)");
  gradient.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  return new THREE.CanvasTexture(canvas);
}

// --- Gesture detection with MediaPipe Hands ---
function initHandTracking() {
  if (!window.Hands || !window.Camera) {
    gestureStatus.textContent = "手势库加载失败，请刷新页面";
    return;
  }

  const hands = new window.Hands({
    locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
  });
  hands.setOptions({
    selfieMode: true,
    maxNumHands: 2,
    modelComplexity: 1,
    minDetectionConfidence: 0.65,
    minTrackingConfidence: 0.6,
  });

  hands.onResults(handleGestureResults);

  const cameraFeed = new window.Camera(videoElement, {
    onFrame: async () => {
      await hands.send({ image: videoElement });
    },
    width: 640,
    height: 480,
  });

  cameraFeed
    .start()
    .then(() => {
      gestureStatus.textContent = "检测双手张合中...";
    })
    .catch((error) => {
      console.error(error);
      gestureStatus.textContent = "无法打开摄像头";
    });
}

function handleGestureResults(results) {
  const handCount = results.multiHandLandmarks?.length || 0;
  if (!handCount) {
    spreadTarget = 0.65;
    diffusionTarget = 0.15;
    handOffsetXTarget = 0;
    gestureStatus.textContent = "请将双手进入画面";
    return;
  }

  let opennessTotal = 0;
  let horizontalTotal = 0;
  for (const hand of results.multiHandLandmarks) {
    opennessTotal += calcHandOpenness(hand);
    horizontalTotal += calcHandHorizontal(hand);
  }
  const averageOpenness = opennessTotal / handCount;
  const horizontalAverage = horizontalTotal / handCount;
  const opennessNormalized = THREE.MathUtils.clamp((averageOpenness - 0.25) / 1.05, 0, 1);
  const spreadCurve = Math.pow(opennessNormalized, 1.1);
  handOffsetXTarget = THREE.MathUtils.clamp(horizontalAverage * 120, -110, 110);
  spreadTarget = THREE.MathUtils.clamp(0.45 + spreadCurve * 3.4, 0.45, 3.8);
  diffusionTarget = THREE.MathUtils.clamp(0.06 + opennessNormalized * 1.35, 0.06, 1.45);

  const mode = opennessNormalized > 0.55 ? "扩散" : "聚拢";
  gestureStatus.textContent = `${handCount === 2 ? "双手" : "单手"}${mode} ×${spreadTarget.toFixed(2)}`;
}

function calcHandOpenness(handLandmarks) {
  const wrist = handLandmarks[0];
  const middle = handLandmarks[9];
  const thumbTip = handLandmarks[4];
  const indexTip = handLandmarks[8];
  const distancePalm = distance3d(wrist, middle);
  const distancePinch = distance3d(thumbTip, indexTip);
  return distancePinch / distancePalm;
}

function calcHandHorizontal(handLandmarks) {
  const palmCenter = handLandmarks[9];
  return (0.5 - palmCenter.x) * 2;
}

function distance3d(a, b) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  const dz = a.z - b.z;
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

initHandTracking();
const shapeGenerators = {
  heart: generateHeart,
  flower: generateFlower,
  saturn: generateSaturn,
  buddha: generateBuddha,
  firework: generateFirework,
};

setShape("heart");

