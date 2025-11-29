// --- 全局变量 ---
let scene, camera, renderer, particles, geometry;
let currentPositions, targetPositions; 
const particleCount = 20000; 
let currentShape = 'heart';

// 交互状态变量
let handFactor = 0;         // 0(张开) ~ 1(握拳)
let smoothedHandFactor = 0; // 平滑后的值
let handX = 0.5, handY = 0.5; // 手的屏幕坐标 (0~1)
let isHandDetected = false;   // 是否检测到手

// --- 1. Three.js 初始化 ---
function initThree() {
    scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x050505, 0.002);

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 30;

    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio > 2 ? 2 : window.devicePixelRatio); // 限制像素比以提升性能
    document.body.appendChild(renderer.domElement);

    createParticles();
    window.addEventListener('resize', onWindowResize, false);
}

// --- 2. 粒子系统核心 ---
function createParticles() {
    geometry = new THREE.BufferGeometry();
    const renderPositions = new Float32Array(particleCount * 3); 
    currentPositions = new Float32Array(particleCount * 3);      
    targetPositions = new Float32Array(particleCount * 3);       

    for (let i = 0; i < particleCount * 3; i++) {
        const val = (Math.random() - 0.5) * 100;
        currentPositions[i] = val;
        targetPositions[i] = val;
        renderPositions[i] = val;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(renderPositions, 3));

    const material = new THREE.PointsMaterial({
        size: 0.25, // 稍微加大粒子
        color: 0x00ffaa,
        transparent: true,
        opacity: 0.8,
        blending: THREE.AdditiveBlending,
        sizeAttenuation: true
    });

    particles = new THREE.Points(geometry, material);
    scene.add(particles);

    calculateTargets('heart');
}

// --- 3. 形状计算逻辑 ---
function calculateTargets(shape) {
    currentShape = shape;
    for (let i = 0; i < particleCount; i++) {
        const i3 = i * 3;
        let x, y, z;

        if (shape === 'heart') {
            const t = Math.random() * Math.PI * 2;
            x = 16 * Math.pow(Math.sin(t), 3);
            y = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
            z = (Math.random() - 0.5) * 5; 
            x *= 0.5; y *= 0.5;
        } 
        else if (shape === 'sphere') {
            const r = 10;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);
            x = r * Math.sin(phi) * Math.cos(theta);
            y = r * Math.sin(phi) * Math.sin(theta);
            z = r * Math.cos(phi);
            if (i > particleCount * 0.7) {
                const ringR = 14 + Math.random() * 6;
                const ringTheta = Math.random() * Math.PI * 2;
                x = ringR * Math.cos(ringTheta);
                z = ringR * Math.sin(ringTheta);
                y = (Math.random() - 0.5) * 0.5; 
                const tilt = Math.PI / 6;
                const tempY = y * Math.cos(tilt) - z * Math.sin(tilt);
                const tempZ = y * Math.sin(tilt) + z * Math.cos(tilt);
                y = tempY; z = tempZ;
            }
        }
        else if (shape === 'flower') {
            const theta = i * 2.39996; 
            const r = 0.3 * Math.sqrt(i);
            x = r * Math.cos(theta);
            y = r * Math.sin(theta);
            z = (Math.random() - 0.5) * 2 - (r * 0.2); 
            x *= 0.8; y *= 0.8;
        }
        else if (shape === 'torus') {
            const u = Math.random() * Math.PI * 2;
            const p = 2, q = 3;
            const r = 5 + 2 * Math.cos(q * u);
            x = r * Math.cos(p * u);
            y = r * Math.sin(p * u);
            z = 2 * Math.sin(q * u);
            x += (Math.random()-0.5); y += (Math.random()-0.5); z += (Math.random()-0.5);
        }
        else if (shape === 'fireworks') {
            x = (Math.random() - 0.5) * 60;
            y = (Math.random() - 0.5) * 60;
            z = (Math.random() - 0.5) * 60;
        }

        targetPositions[i3] = x;
        targetPositions[i3 + 1] = y;
        targetPositions[i3 + 2] = z;
    }
}

// --- 4. 动画循环 (高灵敏度版) ---
function animate() {
    requestAnimationFrame(animate);

    const renderPositions = particles.geometry.attributes.position.array;
    
    // 1. 手势值平滑处理：从 0.1 提升到 0.25，响应更快
    smoothedHandFactor += (handFactor - smoothedHandFactor) * 0.25;

    // 2. 旋转控制：根据手在屏幕的位置旋转模型 (更有掌控感)
    if (isHandDetected) {
        // 目标旋转角度
        const targetRotX = (handY - 0.5) * 1.5; // 上下移动手
        const targetRotY = (handX - 0.5) * 1.5; // 左右移动手
        
        particles.rotation.x += (targetRotX - particles.rotation.x) * 0.1;
        particles.rotation.y += (targetRotY - particles.rotation.y) * 0.1;
    } else {
        // 无手时自动慢速旋转
        particles.rotation.y += 0.002;
        particles.rotation.x += 0.001;
    }

    // 3. 扩散力度计算
    // handFactor=1(握拳) -> explosion=0 (紧密)
    // handFactor=0(张开) -> explosion=5 (大幅扩散)
    const explosion = (1 - smoothedHandFactor) * 5.0; 

    const time = Date.now() * 0.001;

    for (let i = 0; i < particleCount; i++) {
        const i3 = i * 3;

        // 逻辑位置更新 (飞向目标形状)
        currentPositions[i3]     += (targetPositions[i3] - currentPositions[i3]) * 0.06;
        currentPositions[i3 + 1] += (targetPositions[i3 + 1] - currentPositions[i3 + 1]) * 0.06;
        currentPositions[i3 + 2] += (targetPositions[i3 + 2] - currentPositions[i3 + 2]) * 0.06;

        // 渲染位置更新 (加入呼吸和手势扩散)
        const x = currentPositions[i3];
        const y = currentPositions[i3 + 1];
        const z = currentPositions[i3 + 2];

        // 呼吸噪点
        const noise = Math.sin(time * 2 + i * 0.1) * 0.15; 
        
        // 关键逻辑：扩散是基于原点的向外推挤
        renderPositions[i3]     = x * (1 + explosion) + noise;
        renderPositions[i3 + 1] = y * (1 + explosion) + noise;
        renderPositions[i3 + 2] = z * (1 + explosion) + noise;
    }

    particles.geometry.attributes.position.needsUpdate = true;
    renderer.render(scene, camera);
}

// --- 5. MediaPipe Hands 集成 (高性能/新手势版) ---
function initMediaPipe() {
    const videoElement = document.getElementById('input_video');
    
    const hands = new Hands({locateFile: (file) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
    }});

    // 关键优化：modelComplexity 设为 0 (Lite模型)，速度最快，延迟最低
    hands.setOptions({
        maxNumHands: 1,
        modelComplexity: 0, 
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5
    });

    hands.onResults(onHandsResults);

    const cameraUtils = new Camera(videoElement, {
        onFrame: async () => {
            await hands.send({image: videoElement});
        },
        width: 640,
        height: 480
    });

    cameraUtils.start()
        .then(() => {
            document.getElementById('loader').style.display = 'none';
            document.getElementById('status').innerText = '● 系统就绪 | 请握拳或张开手掌';
            document.getElementById('status').classList.add('ready');
        })
        .catch(err => {
            console.error(err);
        });
}

function onHandsResults(results) {
    const statusDiv = document.getElementById('gesture-val');
    
    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
        isHandDetected = true;
        const landmarks = results.multiHandLandmarks[0];
        
        // 1. 获取手的位置 (使用中指根部点9作为中心)
        handX = 1 - landmarks[9].x; // 镜像翻转
        handY = landmarks[9].y;

        // 2. 新的手势逻辑：计算手掌开合程度
        // 计算"中指指尖(12)"到"手腕(0)"的距离
        const wrist = landmarks[0];
        const middleTip = landmarks[12];
        const middleBase = landmarks[9]; // 中指根部

        // 计算参考长度 (手掌大小)：手腕到中指根部的距离
        // 这用于归一化，使得不管离摄像头远近，手势判断都准确
        const palmSize = Math.sqrt(
            Math.pow(wrist.x - middleBase.x, 2) +
            Math.pow(wrist.y - middleBase.y, 2)
        );

        // 计算活动长度：手腕到指尖
        const activeLength = Math.sqrt(
            Math.pow(wrist.x - middleTip.x, 2) +
            Math.pow(wrist.y - middleTip.y, 2)
        );

        // 比率：如果手指伸直，这个比率通常 > 1.8；如果握拳，通常 < 1.0
        const ratio = activeLength / palmSize;

        // 映射到 0~1 (握拳~张开)
        // 握拳(ratio约0.8) -> factor=1
        // 张开(ratio约2.2) -> factor=0
        
        let val = (2.2 - ratio) / (2.2 - 0.9);
        
        // 钳制范围
        if (val < 0) val = 0; // 完全张开
        if (val > 1) val = 1; // 完全握拳

        handFactor = val;

        if (handFactor > 0.6) statusDiv.innerText = "状态: ✊ 握拳 (聚拢)";
        else statusDiv.innerText = "状态: 🖐️ 张开 (扩散)";
        
    } else {
        isHandDetected = false;
        // 无手时，缓慢恢复到半开状态
        handFactor = 0.2; 
        statusDiv.innerText = "未检测到手部";
    }
}

// --- 交互辅助函数 ---
function morphTo(shape) {
    calculateTargets(shape);
    document.querySelectorAll('.shape-grid button').forEach(b => b.classList.remove('active'));
    if(event && event.target) {
        event.target.classList.add('active');
    }
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function toggleFullScreen() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen();
    } else {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        }
    }
}

// 颜色选择器
const colorPicker = document.getElementById('colorPicker');
if(colorPicker) {
    colorPicker.addEventListener('input', (e) => {
        if(particles) particles.material.color.set(e.target.value);
    });
}

// --- 启动 ---
document.addEventListener("DOMContentLoaded", () => {
    initThree();
    animate();
    initMediaPipe();
});