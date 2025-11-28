# 粒子手势花园（ParticleGarden）

基于 Three.js 与 MediaPipe Hands 打造的实时交互粒子装置。摄像头捕捉双手张合、左右移动，驱动 1.2 万粒子在爱心、花朵、土星、佛像、烟花等造型之间平滑聚散，适合交互艺术或线上活动展示。

## ✨ 核心亮点
- **手势驱动**：MediaPipe Hands 实时识别 21 个手部关键点，既能根据张合度调整粒子扩散/聚拢，也能读取手掌水平位移，让整个粒子群随手左右漂移。
- **高密度粒子**：粒子数量提升到 12K，并辅以自定义发光纹理与多光源，营造更饱满、梦幻的粒子海洋。
- **多模型切换**：内置爱心 / 花朵 / 土星 / 佛像 / 烟花等轮廓，其中花朵模型分为花蕊、花瓣、光晕三层，层次更加立体。
- **现代 UI**：磨砂玻璃面板集成模型选择、颜色选择、全屏按钮与手势状态提示；摄像头画面缩略图嵌入角落，界面简洁现代。

## 🧱 技术栈
- [Three.js](https://threejs.org/)：WebGL 渲染、点云粒子系统、相机/灯光控制。
- [MediaPipe Hands](https://developers.google.com/mediapipe/solutions/vision/hand_landmarker)：浏览器端手势检测。
- 原生 HTML / CSS：无需构建工具，可直接静态托管。

## 🚀 快速开始
1. 克隆或下载项目并进入目录：
   ```bash
   git clone <repo-url>
   cd ParticleGarden
   ```
2. 启动任意静态服务器（需在 HTTPS 或 localhost 才能访问摄像头）：
   ```bash
   # 使用 npm
   npx http-server .

   # 或 Python
   python -m http.server 8080
   ```
3. 浏览器访问 `http://localhost:8080`（或对应端口），允许摄像头权限，即可体验。

> ⚠️ 若未授权摄像头或在非安全上下文，MediaPipe 无法获得视频流，手势功能也会失效。

## 🕹️ 操作指南
- **手势控制**：双手进入画面后，张开=扩散、握紧=聚拢；同时左右移动双手可带动粒子整体偏移，状态会在 UI 底部显示。
- **模型/颜色**：通过面板下拉框在不同粒子造型间切换，使用颜色选择器可实时调整粒子和 UI 强调色。
- **全屏展示**：点击右下角 “⛶” 进入/退出全屏，便于沉浸式呈现或大屏展示。

## 🔧 自定义建议
- 在 `main.js` 的 `shapeGenerators` 中新增采样器，或解析外部 3D 模型生成粒子目标。
- 根据设备性能调整 `PARTICLE_COUNT`、粒子尺寸、噪声参数，平衡流畅度与画质。
- 借助 `calcHandOpenness` / `calcHandHorizontal` 扩展更多手势（如旋转、上下移动）来驱动其他视觉效果。

## 📁 目录结构
```
ParticleGarden/
├─ index.html   # 页面结构与组件
├─ styles.css   # 玻璃风格 UI、响应式布局
└─ main.js      # Three.js 粒子场景与手势逻辑
```

欢迎 fork / 二次创作，若有体验优化或新模型欢迎提交 Issue / PR！
